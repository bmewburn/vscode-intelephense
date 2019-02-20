/* Copyright (c) Ben Robert Mewburn 
 * Licensed under the MIT Licence.
 */
'use strict';

import * as path from 'path';
import * as semver from 'semver';

import {
	workspace, Disposable, ExtensionContext, Uri, TextDocument, languages,
	IndentAction, window, commands, TextEditor, TextEditorEdit, TextEdit,
	Range, Position, CancellationToken, CancellationTokenSource
} from 'vscode';
import {
	LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions,
	TransportKind, TextDocumentItem, DocumentFormattingRequest,
	DocumentRangeFormattingRequest,
	NotificationType,
	RequestType
} from 'vscode-languageclient';
import { createMiddleware } from './middleware';
import * as fs from 'fs-extra';

const PHP_LANGUAGE_ID = 'php';
const VERSION = '1.0.1';
const INDEXING_STARTED_NOTIFICATION = new NotificationType('indexingStarted');
const INDEXING_ENDED_NOTIFICATION = new NotificationType('indexingEnded');
const INDEX_WORKSPACE_REQUEST = new RequestType('indexWorkspace');
const CANCEL_INDEXING_REQUEST = new RequestType('cancelIndexing');

let languageClient: LanguageClient;
let extensionContext: ExtensionContext;

export function activate(context: ExtensionContext) {

	extensionContext = context;
	let versionMemento = context.workspaceState.get<string>('version');
	let clearCache = context.workspaceState.get<boolean>('clearCache');
	context.workspaceState.update('clearCache', undefined);
	context.workspaceState.update('version', VERSION);

	if (!versionMemento || (semver.lt(versionMemento, VERSION))) {
		try {
			fs.removeSync(context.storagePath);
		} catch (e) {
			//ignore
		}
		
		clearCache = true;
	}
	//clearCache = true;
	// The server is implemented in node
	let serverModule:string;
	if(process.env.mode === 'debug') {
		serverModule = context.asAbsolutePath(path.join('node_modules', 'intelephense', 'out', 'server.js'));
	} else {
		serverModule = context.asAbsolutePath(path.join('node_modules', 'intelephense', 'lib', 'intelephense.js'));
	} 
	// The debug options for the server
	let debugOptions = { 
		execArgv: ["--nolazy", "--inspect=6039", "--trace-warnings", "--preserve-symlinks"], 
		detached: true
	};

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions  }
	}

	let middleware = createMiddleware(() => {
		return languageClient;
	});

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		documentSelector: [
			{ language: PHP_LANGUAGE_ID, scheme: 'file' },
			{ language: PHP_LANGUAGE_ID, scheme: 'untitled' }
		],
		synchronize: {
			// Notify the server about file changes to php in the workspace
			fileEvents: workspace.createFileSystemWatcher(workspaceFilesIncludeGlob()),
		},
		initializationOptions: {
			storagePath: context.storagePath,
			clearCache: clearCache
		},
		middleware: middleware
	}

	// Create the language client and start the client.
	languageClient = new LanguageClient('intelephense', 'intelephense', serverOptions, clientOptions);
	let ready = languageClient.onReady();

	ready.then(() => {
		languageClient.info('Intelephense ' + VERSION);
		
		let resolveIndexingPromise: () => void;
		languageClient.onNotification(INDEXING_STARTED_NOTIFICATION.method, () => {
			window.setStatusBarMessage('$(sync~spin) intelephense indexing ...', new Promise((resolve, reject) => {
				resolveIndexingPromise = () => {
					resolve();
				}
			}));
		});

		languageClient.onNotification(INDEXING_ENDED_NOTIFICATION.method, () => {
			if (resolveIndexingPromise) {
				resolveIndexingPromise();
			}
			resolveIndexingPromise = undefined;
		});
	});

	let indexWorkspaceDisposable = commands.registerCommand('intelephense.index.workspace', indexWorkspace);
	let cancelIndexingDisposable = commands.registerCommand('intelephense.cancel.indexing', cancelIndexing);

	//push disposables
	context.subscriptions.push(
		indexWorkspaceDisposable,
		cancelIndexingDisposable,
		middleware
	);

	languageClient.start();
}

export function deactivate() {
	if(!languageClient) {
		return undefined;
	}
	return languageClient.stop();
}

function indexWorkspace() {
	languageClient.sendRequest(INDEX_WORKSPACE_REQUEST.method);
}

function cancelIndexing() {
	languageClient.sendRequest(CANCEL_INDEXING_REQUEST.method);
}

function workspaceFilesIncludeGlob() {
	let settings = workspace.getConfiguration('files').get('associations');
	let associations = Object.keys(settings).filter((x) => {
		return settings[x] === PHP_LANGUAGE_ID;
	});

	associations.push('*.php');
	associations = associations.map((v, i, a) => {
		if (v.indexOf('/') < 0 && v.indexOf('\\') < 0) {
			return '**/' + v;
		} else {
			return v;
		}
	});

	return '{' + Array.from(new Set<string>(associations)).join(',') + '}';
}
