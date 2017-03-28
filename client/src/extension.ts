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

	// Create the language client and start the client.
	let langClient = new LanguageClient('intelephense', 'intelephense', serverOptions, clientOptions);
	let disposable = langClient.start();

	// Push the disposable to the context's subscriptions so that the 
	// client can be deactivated on extension deactivation
	context.subscriptions.push(disposable);

	langClient.onReady().then(() => {

		//discover workspace symbols
		workspace.findFiles('**/*.php').then(
			(uriArray) => {
				discoverWorkspaceSymbols(langClient, uriArray);
			}
		);

	});

}

function discoverWorkspaceSymbols(client: LanguageClient, uriArray: Uri[]) {

	let uri: Uri;
	let fileCount = uriArray.length;
	let discoveredFileCount = 0;
	let discoveredSymbolsCount = 0;
	let start = process.hrtime();

	uriArray = uriArray.reverse();

	let onAlways = () => {
		let uri = uriArray.pop();
		if (uri) {
			discoverFileSymbolsRequest(client, uri, onSuccess, onFailure);
			return;
		}

		let elapsed = process.hrtime(start);
		client.info(
			[
				'Workspace symbol discovery ended',
				`${discoveredFileCount}/${fileCount} files`,
				`${discoveredSymbolsCount} symbols`,
				`${elapsed[0]}.${Math.round(elapsed[1] / 1000000)} seconds`
			].join('. ')
		);
	}

	let onSuccess = (uri: Uri, nSymbols: number) => {
		discoveredSymbolsCount += nSymbols;
		++discoveredFileCount;
		onAlways();
	}

	let onFailure = (uri: Uri) => {
		client.warn(`${uri.fsPath} discover request failed.`);
		onAlways();
	}

	if ((uri = uriArray.pop())) {
		client.info('Workspace symbol discovery started.');
		discoverFileSymbolsRequest(client, uri, onSuccess, onFailure);
	}

}

function discoverFileSymbolsRequest(
	client: LanguageClient,
	uri: Uri,
	onSuccess: (uri: Uri, numberSymbolsDiscovered: number) => void,
	onFailure: (uri: Uri) => void) {

	fs.readFile(uri.fsPath, (err, data) => {
		if (err) {
			client.warn(err.message);
			onFailure(uri);
			return;
		}

		let textDocument: TextDocumentItem = {
			uri: uri.toString(),
			text: data.toString(),
			languageId: phpLanguageId,
			version: 0
		}

		let onRequestSuccess = (n: number) => {
			onSuccess(uri, n);
		}

		let onRequestFailure = (r: any) => {
			onFailure(uri);
		}

		client.sendRequest<number>(
			discoverRequestName,
			{ textDocument: textDocument }
		).then(onRequestSuccess, onRequestFailure);

	});
}

