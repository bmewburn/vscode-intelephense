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
			disoverWorkspace(uriArray, context);
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

function disoverWorkspace(uriArray: Uri[], context: ExtensionContext) {

	let fileCount = uriArray.length;
	let remaining = fileCount;
	let discoveredFileCount = 0;
	let start = process.hrtime();
	let nActive = 0;
	uriArray = uriArray.reverse();

	let promise = loadCache(context).then((cache) => {

		return new Promise<void>((resolve, reject) => {

			let batchDiscover = () => {

				let uri: Uri;
				let cachedTable:SymbolTable;
				while (nActive < discoverMaxOpenFiles && (uri = uriArray.pop())) {
					++nActive;
					cacheLookup(uri.toString(), cache)
					.then()
					if () {

					} else {
						discoverRequest(uri, onSuccess, onFailure);
					}

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
				let info = [
					`${discoveredFileCount}/${fileCount} files`,
					`${elapsed[0]}.${Math.round(elapsed[1] / 1000000)} s`
				];

				languageClient.info(
					['Indexing ended', ...info].join(' | ')
				);

				window.setStatusBarMessage([
					'$(check) intelephense indexing complete',
					`$(file-code) ${discoveredFileCount}`,
					`$(clock) ${elapsed[0]}.${Math.round(elapsed[1] / 100000000)}`
				].join('   '), 30000);

				resolve();
			}

			let onSuccess = (nSymbols: number) => {
				++discoveredFileCount;
				onAlways();
			}

			let onFailure = () => {
				onAlways();
			}

			batchDiscover();

		});

	});

	languageClient.info('Indexing started.');
	window.setStatusBarMessage('$(search) intelephense indexing ...', promise);

}

function cacheLookup(uri:string, cache:Cache){

	return new Promise<SymbolTable>((resolve, reject)=>{

		let item = cache[uri];

		if(item === undefined){
			reject();
			return;
		}

		fs.stat(uri, (err, stats)=>{

			if(err){
				languageClient.error(err.message);
				reject();
				return;
			}

			if(stats.mtime.getTime() < item.time){
				resolve(item.data);
			} else {
				delete cache[uri];
				reject();
			}

		});

	});

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
			languageClient.warn(`${uri} exceeds maximum file size.`);
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

const cacheFileName = 'intelephense.cache.json';
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

function loadCache(context: ExtensionContext) {
	let filePath = path.join(context.storagePath, cacheFileName);

	let promise = new Promise<Cache>((resolve, reject) => {

		fs.readFile(filePath, (err, data) => {

			if (err) {
				resolve({});
				return;
			}

			resolve(JSON.parse(data.toString()));

		});

	});

	return promise;

}


function saveCache(context: ExtensionContext, data: Cache) {

	let filePath = path.join(context.storagePath, cacheFileName);

	let promise = new Promise((resolve, reject) => {
		checkCacheDirectoryExists(context)
			.then(() => {

				fs.writeFile(filePath, JSON.stringify(data), (err) => {
					if (err) {
						languageClient.error(err.message);
						reject();
					} else {
						resolve();
					}
				});

			});

	});

	return promise;

}

function checkCacheDirectoryExists(context: ExtensionContext) {

	let dir = context.storagePath;

	return new Promise((resolve, reject) => {

		fs.stat(dir, (err, stats) => {

			if (err) {
				fs.mkdir(dir, (mkdirErr) => {
					if (mkdirErr) {
						languageClient.error(mkdirErr.message);
					} else {
						resolve();
					}
				});
			} else {
				resolve();
			}
		});

	});


}

