/* Copyright (c) Ben Robert Mewburn 
 * Licensed under the MIT Licence.
 */
'use strict';

import * as path from 'path';
import * as semver from 'semver';
import * as https from 'https';
import * as querystring from 'querystring';
import { createHash } from 'crypto';
import * as os from 'os';

import { ExtensionContext, window, commands, workspace, Disposable, languages, IndentAction, env, Uri, ConfigurationTarget, InputBoxOptions } from 'vscode';
import {
	LanguageClient, LanguageClientOptions, ServerOptions,
	TransportKind,
	NotificationType,
    RequestType,
    RevealOutputChannelOn
} from 'vscode-languageclient';
import { createMiddleware, IntelephenseMiddleware } from './middleware';
import * as fs from 'fs-extra';

const PHP_LANGUAGE_ID = 'php';
const VERSION = '1.3.10';
const INDEXING_STARTED_NOTIFICATION = new NotificationType('indexingStarted');
const INDEXING_ENDED_NOTIFICATION = new NotificationType('indexingEnded');
const CANCEL_INDEXING_REQUEST = new RequestType('cancelIndexing');
const INDEX_WORKSPACE_CMD_NAME = 'intelephense.index.workspace';
const CANCEL_INDEXING_CMD_NAME = 'intelephense.cancel.indexing';
const ENTER_KEY_CMD_NAME = 'intelephense.enter.key';
const LICENCE_MEMENTO_KEY = 'intelephense.licence.key';

let languageClient: LanguageClient;
let extensionContext: ExtensionContext;
let middleware:IntelephenseMiddleware;
let clientDisposable:Disposable;

export async function activate(context: ExtensionContext) {

    await moveKeyToGlobalMemento(context);

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

	if (!versionMemento || (semver.neq(versionMemento, VERSION))) {
		try {
			await fs.remove(context.storagePath);
		} catch (e) {
			//ignore
		}

		clearCache = true;
	}

	middleware = createMiddleware();
	languageClient = createClient(context, middleware, clearCache);
	
	let indexWorkspaceCmdDisposable = commands.registerCommand(INDEX_WORKSPACE_CMD_NAME, indexWorkspace);
	let cancelIndexingCmdDisposable = commands.registerCommand(CANCEL_INDEXING_CMD_NAME, cancelIndexing);
	let enterKeyCmdDisposable = commands.registerCommand(ENTER_KEY_CMD_NAME, () => enterLicenceKey(context));

	//push disposables
	context.subscriptions.push(
		indexWorkspaceCmdDisposable,
		cancelIndexingCmdDisposable,
		enterKeyCmdDisposable,
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
        licenceKey: context.globalState.get<string>(LICENCE_MEMENTO_KEY),
		isVscode: true
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		documentSelector: [
			{ language: PHP_LANGUAGE_ID, scheme: 'file' },
			{ language: PHP_LANGUAGE_ID, scheme: 'untitled' }
		],
        initializationOptions: initializationOptions,
        revealOutputChannelOn: RevealOutputChannelOn.Never,
		middleware: middleware
	}

	// Create the language client and start the client.
	languageClient = new LanguageClient('intelephense', 'intelephense', serverOptions, clientOptions);
	languageClient.onReady().then(() => {
		registerNotificationListeners();
		showStartMessage(context);
	});
	return languageClient;
}

function showStartMessage(context: ExtensionContext) {
	const globalVersionMementoKey = 'intelephenseVersion';
	let key = context.globalState.get<string>(LICENCE_MEMENTO_KEY);
	const lastVersion = context.globalState.get<string>(globalVersionMementoKey);
	const open = 'Open';
	const dismiss = 'Dismiss';
	if (key || (lastVersion && !semver.lt(lastVersion, VERSION))) {
		return;
	}
	window.showInformationMessage(
		`Intelephense updated to ${VERSION}.\nAccess other great features at https://intelephense.com.`,
		open, 
		dismiss
	).then(value => {
		if(value === open) {
			env.openExternal(Uri.parse('https://intelephense.com'));
		} else {
			context.globalState.update(globalVersionMementoKey, VERSION);
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

function enterLicenceKey(context:ExtensionContext) {
	
	let currentValue = context.globalState.get<string>(LICENCE_MEMENTO_KEY);
	let options:InputBoxOptions = {
		prompt: 'Intelephense Licence Key',
		ignoreFocusOut: true,
		validateInput: v => {
			v = v.trim();
			if(v && !/^[0-9a-zA-Z]{15}$/.test(v)) {
				return 'A licence key must be a 15 character alphanumeric string.'
			}
			return '';
		}
	}

	if(currentValue) {
		options.value = currentValue;
	}

	window.showInputBox(options).then(async key => {
		if(key !== undefined) {
            await context.globalState.update(LICENCE_MEMENTO_KEY, key);

            if(key) {
                try {
                    await activateKey(context, key);
                    window.showInformationMessage('Your Intelephense licence key has been activated.');
                } catch (e) {
                    console.log(e);
                    window.showErrorMessage('Key could not be activated at this time. Please contact support.');
                }
            }
            
            //restart
            if(languageClient && clientDisposable) {
                await languageClient.stop();
                clientDisposable.dispose();
                languageClient = createClient(extensionContext, middleware, true);
                clientDisposable = languageClient.start();
            }
		}
	});
}

function registerNotificationListeners() {
	let resolveIndexingPromise: () => void;
	languageClient.onNotification(INDEXING_STARTED_NOTIFICATION.method, () => {
		window.setStatusBarMessage('$(sync~spin) intelephense ' + VERSION.toString() + ' indexing ...', new Promise((resolve, reject) => {
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

async function moveKeyToGlobalMemento(context:ExtensionContext)
{
    let section = workspace.getConfiguration('intelephense');
    let keyFromConfig = section ? section.get('licenceKey') : undefined;
    if (!keyFromConfig) {
        return;
    }

    let keyFromMemento = context.globalState.get<string>(LICENCE_MEMENTO_KEY);
    if(keyFromMemento) {
        return;
    }

    await context.globalState.update(LICENCE_MEMENTO_KEY, keyFromConfig);
    await section.update('licenceKey', undefined, ConfigurationTarget.Global);
}

function activateKey(context: ExtensionContext, licenceKey: string): Promise<void> {

    let postData = querystring.stringify({
        machineId: createHash('sha256').update(os.homedir(), 'utf8').digest('hex'),
        licenceKey: licenceKey
    });

    let options: https.RequestOptions = {
        hostname: 'intelephense.com',
        port: 443,
        path: '/activate',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    };

    return new Promise((resolve, reject) => {
        let responseBody: string = '';

        let req = https.request(options, res => {

            res.on('data', chunk => {
                responseBody += chunk.toString();
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    let filepath = path.join(context.globalStoragePath, 'intelephense_licence_key_' + licenceKey);
                    fs.writeFile(filepath, responseBody).then(resolve, reject);
                } else {
                    reject(new Error('Failed to activate key'));
                }
            });

            res.on('error', reject);
        });

        req.write(postData);
        req.on('error', reject);
        req.end();
    });

}
