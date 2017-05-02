/* Copyright (c) Ben Robert Mewburn 
 * Licensed under the ISC Licence.
 */
'use strict';

import * as path from 'path';

import { workspace, Disposable, ExtensionContext, Uri, TextDocument, languages, IndentAction, window } from 'vscode';
import {
	LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions,
	TransportKind, TextDocumentItem
} from 'vscode-languageclient';
import * as fs from 'fs';

const phpLanguageId = 'php';
const discoverRequestName = 'discover';
const forgetRequestName = 'forget';
const addSymbolsRequestName = 'addSymbols';

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
	let ready = languageClient.onReady();

	if (workspace.rootPath) {
		ready.then(() => {
			let includeGlob = workspaceFilesIncludeGlob();
			return workspace.findFiles(includeGlob);
		}).then((uriArray) => {
			indexWorkspace(uriArray, context);
		});
	}

	//push disposables
	context.subscriptions.push(langClientDisposable, fsWatcher);
	discoverMaxOpenFiles = workspace.getConfiguration("intelephense.workspaceDiscovery").get('maxOpenFiles') as number;
	maxFileSizeBytes = workspace.getConfiguration("intelephense.file").get('maxSize') as number;

	let wordPatternParts = [
		/([$a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff\\]*)/.source,
		/([^\$\-\`\~\!\@\#\%\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/.source
	];

	languages.setLanguageConfiguration('php', {
		wordPattern: new RegExp(wordPatternParts.join('|'), 'g'),
		//https://github.com/Microsoft/vscode/blob/master/extensions/typescript/src/typescriptMain.ts
		onEnterRules: [
			{
				// e.g. /** | */
				beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
				afterText: /^\s*\*\/$/,
				action: { indentAction: IndentAction.IndentOutdent, appendText: ' * ' }
			}, {
				// e.g. /** ...|
				beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
				action: { indentAction: IndentAction.None, appendText: ' * ' }
			}, {
				// e.g.  * ...|
				beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
				action: { indentAction: IndentAction.None, appendText: '* ' }
			}, {
				// e.g.  */|
				beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
				action: { indentAction: IndentAction.None, removeText: 1 }
			},
			{
				// e.g.  *-----*/|
				beforeText: /^(\t|(\ \ ))*\ \*[^/]*\*\/\s*$/,
				action: { indentAction: IndentAction.None, removeText: 1 }
			}
		]
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

function onDidDelete(uri: Uri) {
	forgetRequest(uri);
}

function onDidChange(uri: Uri) {
	readTextDocumentItem(uri).then(discoverRequest);
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

function indexWorkspace(uriArray: Uri[], context: ExtensionContext) {

	let fileCount = uriArray.length;
	let remaining = fileCount;
	let start = process.hrtime();
	let nActive = 0;
	uriArray = uriArray.reverse();

	let indexPromise = loadSymbolCache(context)
		.then((cache) => {

			return new Promise<void>((resolve, reject) => {

				let batchIndexFn = () => {

					let uri: Uri;
					let cachedTable: SymbolTable;
					while (nActive < discoverMaxOpenFiles && (uri = uriArray.pop())) {
						++nActive;
						indexSymbolsRequest(uri, cache)
							.then(onRequestComplete);
					}

				}

				let onRequestComplete = () => {

					--remaining;
					--nActive;

					if (remaining > 0) {
						batchIndexFn();
						return;
					}

					indexingCompleteFeedback(start, fileCount);
					saveCache(context, cache, symbolCacheFileName);
					resolve();
				}

				batchIndexFn();

			});

		});

	languageClient.info('Indexing started.');
	window.setStatusBarMessage('$(search) intelephense indexing ...', indexPromise);

}

function indexingCompleteFeedback(startHrtime: [number, number], fileCount: number) {
	let elapsed = process.hrtime(startHrtime);
	let info = [
		`${fileCount} files`,
		`${elapsed[0]}.${Math.round(elapsed[1] / 1000000)} s`
	];

	languageClient.info(
		['Indexing ended', ...info].join(' | ')
	);

	window.setStatusBarMessage([
		'$(check) intelephense indexing complete',
		`$(file-code) ${fileCount}`,
		`$(clock) ${elapsed[0]}.${Math.round(elapsed[1] / 100000000)}`
	].join('   '), 30000);
}

function indexSymbolsRequest(uri: Uri, symbolCache: Cache) {

	return symbolCacheFind(uri, symbolCache)
		.then((cachedSymbolTable) => {
			if (cachedSymbolTable) {
				return addSymbolsRequest(cachedSymbolTable);
			} else {
				//no cached table
				return readTextDocumentItem(uri)
					.then(discoverRequest)
					.then((symbolTable) => {
						symbolCacheAdd(symbolTable, symbolCache);
					});
			}

		});
}

function symbolCacheAdd(symbolTable: SymbolTable, symbolCache: Cache) {

	symbolCache[symbolTable.uri] = {
		key: symbolTable.uri,
		time: Date.now(),
		data: symbolTable
	};

}

function symbolCacheFind(uri: Uri, symbolCache: Cache) {

	return new Promise<SymbolTable>((resolve, reject) => {

		let uriString = uri.toString();
		let item = symbolCache[uriString];

		if (!item) {
			resolve(undefined);
			return;
		}

		fs.stat(uri.fsPath, (err, stats) => {

			if (err) {
				languageClient.error(err.message);
				resolve(undefined);
				return;
			}

			if (stats.mtime.getTime() < item.time) {
				resolve(item.data);
			} else {
				delete symbolCache[uriString];
				resolve(undefined);
			}

		});

	});

}

function readTextDocumentItem(uri: Uri) {

	return new Promise<TextDocumentItem>((resolve, reject) => {

		fs.readFile(uri.fsPath, (readErr, data) => {

			if (readErr) {
				languageClient.warn(readErr.message);
				resolve(undefined);
				return;
			}

			let doc: TextDocumentItem = {
				uri: uri.toString(),
				text: data.toString(),
				languageId: phpLanguageId,
				version: 0
			}

			if (doc.text.length > maxFileSizeBytes) {
				languageClient.warn(`${uri} exceeds maximum file size.`);
				resolve(undefined);
				return;
			}

			resolve(doc);

		});
	});

}

function discoverRequest(doc: TextDocumentItem) {
	return languageClient.sendRequest<SymbolTable>(
		discoverRequestName,
		{ textDocument: doc }
	);
}

function addSymbolsRequest(symbolTable: SymbolTable) {
	return languageClient.sendRequest<void>(
		addSymbolsRequestName,
		{ symbolTable: symbolTable }
	)
}

const symbolCacheFileName = 'intelephense.symbol.cache.json';
interface SymbolTable {
	uri: string;
	root: PhpSymbol;
}
interface PhpSymbol {

}
interface Cache {
	[index: string]: CacheItem;
}

interface CacheItem {
	key: string;
	time: number;
	data: any;
}

function loadSymbolCache(context: ExtensionContext) {
	let filePath = path.join(context.storagePath, symbolCacheFileName);

	return new Promise<Cache>((resolve, reject) => {

		fs.readFile(filePath, (err, data) => {

			if (err) {
				languageClient.warn(err.message);
				resolve({});
				return;
			}

			resolve(JSON.parse(data.toString()));

		});

	});

}


function saveCache(context: ExtensionContext, data: Cache, fileName: string) {

	let filePath = path.join(context.storagePath, fileName);

	return ensureCacheDirectoryExists(context)
		.then(() => {
			return new Promise((resolve, reject) => {
				fs.writeFile(filePath, JSON.stringify(data), (err) => {
					if (err) {
						languageClient.error(err.message);
					}
					resolve();
				});
			});
		});

}

function ensureCacheDirectoryExists(context: ExtensionContext) {

	let dir = context.storagePath;

	return new Promise((resolve, reject) => {

		fs.mkdir(dir, (err) => {
			if (err) {
				if (err.code !== 'EEXIST') {
					languageClient.error(err.message);
					reject();
				}
			}
			resolve();
		});

	});

}

