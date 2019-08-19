/* Copyright (c) Ben Robert Mewburn 
 * Licensed under the MIT Licence.
 */
'use strict';

import * as path from 'path';
import * as semver from 'semver';

import { ExtensionContext, window, commands, workspace, Disposable, languages, IndentAction, env, Uri, ConfigurationTarget } from 'vscode';
import {
	LanguageClient, LanguageClientOptions, ServerOptions,
	TransportKind,
	NotificationType,
	RequestType
} from 'vscode-languageclient';
import { createMiddleware, IntelephenseMiddleware } from './middleware';
import * as fs from 'fs-extra';

const PHP_LANGUAGE_ID = 'php';
const VERSION = '1.1.6';
const INDEXING_STARTED_NOTIFICATION = new NotificationType('indexingStarted');
const INDEXING_ENDED_NOTIFICATION = new NotificationType('indexingEnded');
const CANCEL_INDEXING_REQUEST = new RequestType('cancelIndexing');

let languageClient: LanguageClient;
let extensionContext: ExtensionContext;
let middleware:IntelephenseMiddleware;
let clientDisposable:Disposable;

export async function activate(context: ExtensionContext) {

	languages.setLanguageConfiguration('php', {
		wordPattern: /(-?\d*\.\d\w*)|([^\-\`\~\!\@\#\%\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
		onEnterRules: [
			{
				// e.g. /** | */
				beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
				afterText: /^\s*\*\/$/,
				action: { indentAction: IndentAction.IndentOutdent, appendText: ' * ' }
			},
			{
				// e.g. /** ...|
				beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
				action: { indentAction: IndentAction.None, appendText: ' * ' }
			},
			{
				// e.g.  * ...|
				beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
				action: { indentAction: IndentAction.None, appendText: '* ' }
			},
			{
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

	extensionContext = context;
	let versionMemento = context.workspaceState.get<string>('version');
	let clearCache = false;
	context.workspaceState.update('version', VERSION);

	if (!versionMemento || (semver.lt(versionMemento, VERSION))) {
		try {
			await fs.remove(context.storagePath);
		} catch (e) {
			//ignore
		}

		clearCache = true;
	}

	middleware = createMiddleware(() => {
		return languageClient;
	});

	languageClient = createClient(context, middleware, clearCache);
	
	let indexWorkspaceDisposable = commands.registerCommand('intelephense.index.workspace', indexWorkspace);
	let cancelIndexingDisposable = commands.registerCommand('intelephense.cancel.indexing', cancelIndexing);

	//push disposables
	context.subscriptions.push(
		indexWorkspaceDisposable,
		cancelIndexingDisposable,
		middleware
	);

	clientDisposable = languageClient.start();
}

function createClient(context:ExtensionContext, middleware:IntelephenseMiddleware, clearCache:boolean) {
	let serverModule: string;
	if (process.env.mode === 'debug') {
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
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
	}

	let intelephenseConfig = workspace.getConfiguration('intelephense');
	let runtime = intelephenseConfig.get('runtime') as string | undefined;
	let memory = Math.floor(Number(intelephenseConfig.get('maxMemory')));

	if (runtime) {
		serverOptions.run.runtime = runtime;
		serverOptions.debug.runtime = runtime;
	}

	if (memory && memory > 256) {
		let maxOldSpaceSize = '--max-old-space-size=' + memory.toString();
		serverOptions.run.options = { execArgv: [maxOldSpaceSize] };
		serverOptions.debug.options.execArgv.push(maxOldSpaceSize);
	}

	let initializationOptions = {
		storagePath: context.storagePath,
		clearCache: clearCache,
		globalStoragePath: context.globalStoragePath,
		isVscode: true
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		documentSelector: [
			{ language: PHP_LANGUAGE_ID, scheme: 'file' },
			{ language: PHP_LANGUAGE_ID, scheme: 'untitled' }
		],
		initializationOptions: initializationOptions,
		middleware: middleware
	}

	// Create the language client and start the client.
	languageClient = new LanguageClient('intelephense', 'intelephense', serverOptions, clientOptions);
	languageClient.onReady().then(() => {
		registerNotificationListeners();
		showStartMessage();
	});
	return languageClient;
}

function showStartMessage() {
	const key = workspace.getConfiguration('intelephense').get('licenceKey');
	const getKey = 'Get Key';
	const enterKey = 'Enter Key';
	if(key) {
		return;
	}
	window.showInformationMessage(
		'Thank you for using Intelephense.\nUpgrade now to access premium features.',
		getKey, 
		enterKey
	).then(value => {
		if(value === getKey) {
			env.openExternal(Uri.parse('https://intelephense.com'));
		} else if(value === enterKey) {
			window.showInputBox({prompt: 'Enter Intelephense Licence Key', ignoreFocusOut: true}).then(key => {
				if(key) {
					workspace.getConfiguration('intelephense').update('licenceKey', key, ConfigurationTarget.Global);
				}
			});
		}
	});
}

export function deactivate() {
	if (!languageClient) {
		return undefined;
	}
	return languageClient.stop();
}

function indexWorkspace() {
	if(!languageClient) {
		return;
	}
	languageClient.stop().then(_ => {
		clientDisposable.dispose();
		languageClient = createClient(extensionContext, middleware, true);
		clientDisposable = languageClient.start();
	});
}

function cancelIndexing() {
	languageClient.sendRequest(CANCEL_INDEXING_REQUEST.method);
}

function registerNotificationListeners() {
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
}
