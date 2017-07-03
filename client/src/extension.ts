/* Copyright (c) Ben Robert Mewburn 
 * Licensed under the ISC Licence.
 */
'use strict';

import * as path from 'path';

import {
	workspace, Disposable, ExtensionContext, Uri, TextDocument, languages,
	IndentAction, window, commands, TextEditor, TextEditorEdit, TextEdit,
	Range, Position
} from 'vscode';
import {
	LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions,
	TransportKind, TextDocumentItem, DocumentSelectorFactory, DocumentFormattingRequest,
	DocumentRangeFormattingRequest
} from 'vscode-languageclient';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';

const phpLanguageId = 'php';
const htmlLanguageId = 'html';
const discoverRequestName = 'discover';
const forgetRequestName = 'forget';
const addSymbolsRequestName = 'addSymbols';
const symbolCacheDir = 'symbols';

let maxFileSizeBytes = 10000000;
let discoverMaxOpenFiles = 10;
let languageClient: LanguageClient;
let symbolCache: FileCache;

export function activate(context: ExtensionContext) {

	symbolCache = new FileCache(path.join(context.storagePath, symbolCacheDir));

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

	let documentSelectorFactory:DocumentSelectorFactory = (method) => {
		switch(method) {
			case DocumentFormattingRequest.type.method:
			case DocumentRangeFormattingRequest.type.method:
				return [{language: phpLanguageId, scheme: 'file'}]
			default:
				return [
					{language: phpLanguageId, scheme: 'file'},
					{language: htmlLanguageId, scheme: 'file'}
				];
		}
	}

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		documentSelector: [
			{language: phpLanguageId, scheme: 'file'},
		],
		documentSelectorFactory: documentSelectorFactory,
		synchronize: {
			// Synchronize the setting section 'intelephense' to the server
			configurationSection: 'intelephense',
			// Notify the server about file changes to php in the workspace
			//fileEvents: workspace.createFileSystemWatcher('**/*.php')
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

	let importCommandDisposable = commands.registerTextEditorCommand('intelephense.import', importCommandHandler);
	let clearCacheDisposable = commands.registerCommand('intelephense.clear.cache', clearCacheCommandHandler);

	//push disposables
	context.subscriptions.push(langClientDisposable, fsWatcher, importCommandDisposable, clearCacheDisposable);
	discoverMaxOpenFiles = workspace.getConfiguration("intelephense.workspaceDiscovery").get('maxOpenFiles') as number;
	maxFileSizeBytes = workspace.getConfiguration("intelephense.file").get('maxSize') as number;

	let wordPatternParts = [
		/([$a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff\\]*)/.source,
		/([^\$\-\`\~\!\@\#\%\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/.source
	];

	let htmlWordPatternParts = [
		/([$a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff\\]*)/.source,
		/(-?\d*\.\d\w*)/.source,
		/([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/.source
	];

	languages.setLanguageConfiguration(phpLanguageId, {
		wordPattern: new RegExp(wordPatternParts.join('|'), 'g'),
	});

	languages.setLanguageConfiguration(htmlLanguageId, {
		wordPattern: new RegExp(htmlWordPatternParts.join('|'), 'g')
	});

}

interface ImportSymbolTextEdits {
	edits: TextEdit[],
	aliasRequired: boolean
}

function importCommandHandler(textEditor: TextEditor, edit: TextEditorEdit) {
	let inputPromise = window.showInputBox({ placeHolder: 'Enter an alias (optional)' });
	inputPromise.then((text) => {
		return languageClient.sendRequest<TextEdit[]>(
			'importSymbol',
			{ uri: textEditor.document.uri.toString(), position: textEditor.selection.active, alias: text }
		);
	}).then((edits) => {
		textEditor.edit((eb) => {
			edits.forEach((e) => {
				eb.replace(
					new Range(new Position(e.range.start.line, e.range.start.character), new Position(e.range.end.line, e.range.end.character)),
					e.newText
				);
			});
		});
	});
}

function clearCacheCommandHandler() {
	symbolCache.purge([]).then(()=>{
		commands.executeCommand('workbench.action.reloadWindow');
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

	let indexPromise = symbolCache.init()
		.then(() => {
			return symbolCache.purge(uriArray.map((u) => { return u.toString(); }));
		})
		.then(() => {

			return new Promise<void>((resolve, reject) => {

				let batchIndexFn = () => {

					let uri: Uri;
					while (nActive < discoverMaxOpenFiles && (uri = uriArray.pop())) {
						++nActive;
						indexSymbolsRequest(uri)
							.then(onRequestComplete)
							.catch((err: NodeJS.ErrnoException) => {
								if (err) {
									languageClient.error(err.message);
								}
								onRequestComplete();
							});
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
		'$(search) intelephense indexing complete',
		`$(file-code) ${fileCount}`,
		`$(clock) ${elapsed[0]}.${Math.round(elapsed[1] / 100000000)}`
	].join('   '), 30000);
}

function indexSymbolsRequest(uri: Uri) {

	return fileModTime(uri).then((mTime) => {

		return symbolCache.get(uri.toString(), mTime).then((data) => {
			if (data) {
				return addSymbolsRequest(<SymbolTable>data);
			} else {
				//no cached table
				return readTextDocumentItem(uri)
					.then(discoverRequest)
					.then((symbolTable) => {
						return symbolCache.set(uri.toString(), symbolTable);
					});
			}
		});

	});
}

function fileModTime(uri: Uri) {

	return new Promise<number>((resolve, reject) => {

		fs.stat(uri.fsPath, (err, stats) => {

			if (err) {
				if (err.code === 'ENOENT') {
					resolve(Infinity);
					return;
				} else {
					throw err;
				}
			}

			resolve(stats.mtime.getTime());

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

	if(!doc) {
		return Promise.resolve<SymbolTable>(null);
	}

	return languageClient.sendRequest<SymbolTable>(
		discoverRequestName,
		{ textDocument: doc }
	);
}

function addSymbolsRequest(symbolTable: SymbolTable) {

	if(!symbolTable) {
		return Promise.resolve();
	}

	return languageClient.sendRequest<void>(
		addSymbolsRequestName,
		{ symbolTable: symbolTable }
	);
}

interface SymbolTable {
	uri: string;
	root: PhpSymbol;
}
interface PhpSymbol {

}


export class FileCache {

	private _dir: string;

	constructor(dir: string) {
		this._dir = dir;
	}

	get dir() {
		return this._dir;
	}

	init() {
		return new Promise<void>((resolve, reject) => {

			mkdirp(this._dir, (err) => {
				if (err && err.code !== 'EEXIST') {
					throw err;
				}
				resolve();
			});

		});
	}

	/**
	 * 
	 * @param key 
	 * @param obj  pass undefined to delete
	 */
	set(key: string, obj: any) {

		if (obj === undefined || obj === null) {
			return this._remove(key);
		}

		return new Promise<void>((resolve, reject) => {

			fs.writeFile(this._filePath(key), JSON.stringify(obj), (err) => {

				if (err) {
					throw err;
				}

				resolve();

			});

		});

	}

    /**
     * 
     * @param key 
     * @param time number in ms that cached item needs to be greater than
     */
	get(key: string, time: number): Promise<any> {

		let filePath = this._filePath(key);
		let remove = this._remove;
		return this._modTime(filePath).then((mTime) => {

			if (time > mTime) {
				remove(filePath);
				return Promise.resolve(undefined);

			} else {

				return new Promise<any>((resolve, reject) => {

					fs.readFile(filePath, (err, data) => {
						if (err) {
							if (err.code === 'ENOENT') {
								return resolve(undefined);
							} else {
								return reject(err);
							}
						}
						resolve(JSON.parse(data.toString()));
					});

				});

			}

		});

	}

	purge(exclude: string[]) {

		let keyMap: { [index: string]: boolean } = {};
		for (let n = 0, l = exclude.length; n < l; ++n) {
			keyMap[this._hash(exclude[n])] = true;
		}
		let dir = this._dir;

		return new Promise<void>((resolve, reject) => {

			fs.readdir(this._dir, (err, files) => {
				if (err) {
					throw err;
				}

				let name: string;
				let count = 0;

				if(files.length < 1) {
					resolve();
					return;
				}

				for (let n = 0, l = files.length; n < l; ++n) {
					name = files[n];
					if (keyMap[name]) {
						if (++count === l) {
							resolve();
						}
						continue;
					}

					fs.unlink(path.join(dir, name), (unlinkErr) => {
						if (++count === l) {
							resolve();
						}
					});
				}
			});
		});

	}

	private _filePath(key: string) {
		return path.join(this._dir, this._hash(key));
	}

	private _modTime(filePath: string) {

		return new Promise<number>((resolve, reject) => {

			fs.stat(filePath, (err, stats) => {

				if (err) {
					if (err.code === 'ENOENT') {
						resolve(Infinity);
						return;
					} else {
						throw err;
					}
				}

				resolve(stats.mtime.getTime());

			});

		});

	}

	private _remove(filePath: string) {

		return new Promise<void>((resolve, reject) => {

			fs.unlink(filePath, (err) => {

				if (err && err.code !== 'ENOENT') {
					throw err;
				}

				resolve();

			});

		});

	}


    /**
     * http://stackoverflow.com/a/7616484
     */
	private _hash(key: string) {
		let hash = 0;
		let chr: number;
		for (let i = 0, l = key.length; i < l; ++i) {
			chr = key.charCodeAt(i);
			hash = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}
		return (hash >>> 0).toString(16); //positive int only
	}

}

