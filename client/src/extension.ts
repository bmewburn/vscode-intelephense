/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';

import { workspace, Disposable, ExtensionContext, Uri, TextDocument } from 'vscode';
import {
	LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions,
	TransportKind, TextDocumentItem
} from 'vscode-languageclient';
import * as fs from 'fs';

const phpLanguageId = 'php';
const discoverRequestName = 'discover';
const forgetRequestName = 'forget';

let maxFileSizeBytes = 20000000;
let languageClient: LanguageClient;

export function activate(context: ExtensionContext) {

	// The server is implemented in node
	let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
	// The debug options for the server
	let debugOptions = { execArgv: ["--nolazy", "--debug=6039"] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
	}

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		documentSelector: [phpLanguageId],
		synchronize: {
			// Synchronize the setting section 'intelephense' to the server
			configurationSection: 'intelephense',
			// Notify the server about file changes to php in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/*.php')
		}
	}

	let fsWatcher = workspace.createFileSystemWatcher('**/*.php');
	fsWatcher.onDidDelete(onDidDelete);
	fsWatcher.onDidCreate(onDidCreate);
	fsWatcher.onDidChange(onDidChange);

	// Create the language client and start the client.
	languageClient = new LanguageClient('intelephense', 'intelephense', serverOptions, clientOptions);
	let langClientDisposable = languageClient.start();
	languageClient.onReady().then(onClientReady);

	//push disposables
	context.subscriptions.push(langClientDisposable, fsWatcher);

}

function onClientReady() {
	//discover workspace symbols
	workspace.findFiles('**/*.php').then(onWorkspaceFindFiles);
}

function onDidDelete(uri: Uri) {
	forgetRequest(uri);
}

function onDidChange(uri: Uri) {

	fs.stat(uri.fsPath, (statErr, stats) => {

		if (statErr) {
			languageClient.warn(statErr.message);
			return;
		}

		if (stats.isFile()) {
			onWorkspaceFindFiles([uri]);
		} else if (stats.isDirectory()) {
			let include = path.join(workspace.asRelativePath(uri.fsPath), '**/*.php');
			workspace.findFiles(include).then(onWorkspaceFindFiles);
		}

	});

}

function onDidCreate(uri: Uri) {
	onDidChange(uri);
}

function forgetRequest(uri: Uri) {

	let onFailure = () => {
		languageClient.warn(`${uri} forget request failed.`);
	};

	languageClient.sendRequest<void>(
		forgetRequestName,
		{ uri: uri.toString() }
	).then(undefined, onFailure);
}

function onWorkspaceFindFiles(uriArray: Uri[]) {

	let uri: Uri;
	let fileCount = uriArray.length;
	let discoveredFileCount = 0;
	let discoveredSymbolsCount = 0;
	let start = process.hrtime();

	uriArray = uriArray.reverse();

	let onAlways = () => {
		let uri = uriArray.pop();
		if (uri) {
			discoverRequest(uri, onSuccess, onFailure);
			return;
		}

		let elapsed = process.hrtime(start);
		languageClient.info(
			[
				'Workspace symbol discovery ended',
				`${discoveredFileCount}/${fileCount} files`,
				`${discoveredSymbolsCount} symbols`,
				`${elapsed[0]}.${Math.round(elapsed[1] / 1000000)} seconds`
			].join(' | ')
		);
	}

	let onSuccess = (nSymbols: number) => {
		discoveredSymbolsCount += nSymbols;
		++discoveredFileCount;
		onAlways();
	}

	let onFailure = () => {
		onAlways();
	}

	if ((uri = uriArray.pop())) {
		languageClient.info('Workspace symbol discovery started.');
		discoverRequest(uri, onSuccess, onFailure);
	}

}

function discoverRequest(
	uri: Uri,
	onSuccess: (numberSymbolsDiscovered: number) => void,
	onFailure: () => void) {

	fs.stat(uri.fsPath, (statErr, stats) => {

		if (statErr) {
			languageClient.warn(statErr.message);
			onFailure();
			return;
		}

		if (stats.size > maxFileSizeBytes) {
			languageClient.warn(`${uri} larger than max file size. Symbol discovery aborted.`);
			onFailure();
			return;
		}

		fs.readFile(uri.fsPath, (readErr, data) => {

			if (readErr) {
				languageClient.warn(readErr.message);
				onFailure();
				return;
			}

			let textDocument: TextDocumentItem = {
				uri: uri.toString(),
				text: data.toString(),
				languageId: phpLanguageId,
				version: 0
			}

			let onRequestFailure = (r: any) => {
				languageClient.warn(`${uri} discover request failed.`);
				onFailure();
			}

			languageClient.sendRequest<number>(
				discoverRequestName,
				{ textDocument: textDocument }
			).then(onSuccess, onRequestFailure);

		});
	});

}

