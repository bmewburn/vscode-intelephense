/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';

import { workspace, Disposable, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';

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
		documentSelector: ['php'],
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
		workspace.findFiles('**/*.php').then((uriArray) => {
			for (let n = 0, l = uriArray.length; n < l; ++n) {
				
			}
		});

	});

}

