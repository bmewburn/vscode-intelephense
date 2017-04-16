/* Copyright (c) Ben Robert Mewburn 
 * Licensed under the ISC Licence.
 */
'use strict';

import * as path from 'path';

import { workspace, Disposable, ExtensionContext, Uri, TextDocument, languages } from 'vscode';
import {
	LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions,
	TransportKind, TextDocumentItem
} from 'vscode-languageclient';
import * as fs from 'fs';

const phpLanguageId = 'php';
const discoverRequestName = 'discover';
const forgetRequestName = 'forget';

let maxFileSizeBytes = 10000000;
let discoverMaxOpenFiles = 10;
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
	discoverMaxOpenFiles = workspace.getConfiguration("intelephense.workspaceDiscovery").get('maxOpenFiles') as number;
	maxFileSizeBytes = workspace.getConfiguration("intelephense.file").get('maxSize') as number;

	let wordPatternParts = [
		/([$a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff\\]*)/.source,
		/([^\$\-\`\~\!\@\#\%\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/.source
	];

	languages.setLanguageConfiguration('php', {
		wordPattern: new RegExp(wordPatternParts.join('|'), 'g')
	});

}

function workspaceFilesIncludeGlob() {
	let settings = workspace.getConfiguration('files').get('associations');
	let associations = Object.keys(settings).filter((x) => {
		return settings[x] === phpLanguageId;
	});

	if (!associations.length) {
		associations.push('*.php');
	}
	return `**/{${associations.join(',')}}`;
}

function onClientReady() {

	let includeGlob = workspaceFilesIncludeGlob();
	if (workspace.rootPath) {
		//discover workspace symbols
		workspace.findFiles(includeGlob).then(onWorkspaceFindFiles);
	}
}

function onDidDelete(uri: Uri) {
	forgetRequest(uri);
}

function onDidChange(uri: Uri) {
	discoverRequest(uri);
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

	let fileCount = uriArray.length;
	let remaining = fileCount;
	let discoveredFileCount = 0;
	let discoveredSymbolsCount = 0;
	let start = process.hrtime();
	let nActive = 0;

	uriArray = uriArray.reverse();

	let batchDiscover = () => {

		let uri: Uri;
		while (nActive < discoverMaxOpenFiles && (uri = uriArray.pop())) {
			++nActive;
			discoverRequest(uri, onSuccess, onFailure);
		}

	}

	let onAlways = () => {

		--remaining;
		--nActive;

		if (remaining > 0) {
			batchDiscover();
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

	languageClient.info('Workspace symbol discovery started.');
	batchDiscover();

}

function discoverRequest(
	uri: Uri,
	onSuccess?: (numberSymbolsDiscovered: number) => void,
	onFailure?: () => void) {

	fs.stat(uri.fsPath, (statErr, stats) => {

		if (statErr) {
			languageClient.warn(statErr.message);
			if (onFailure) {
				onFailure();
			}
			return;
		}

		if (stats.size > maxFileSizeBytes) {
			languageClient.warn(`${uri} larger than max file size. Symbol discovery aborted.`);
			if (onFailure) {
				onFailure();
			}
			return;
		}

		fs.readFile(uri.fsPath, (readErr, data) => {

			if (readErr) {
				languageClient.warn(readErr.message);
				if (onFailure) {
					onFailure();
				}
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
				if (onFailure) {
					onFailure();
				}
			}

			languageClient.sendRequest<number>(
				discoverRequestName,
				{ textDocument: textDocument }
			).then(onSuccess, onRequestFailure);

		});
	});

}

