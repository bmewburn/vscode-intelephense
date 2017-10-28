/* Copyright (c) Ben Robert Mewburn 
 * Licensed under the ISC Licence.
 */
'use strict';

import * as path from 'path';
import * as fs from 'fs-extra';

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
import { WorkspaceDiscovery } from './workspaceDiscovery';

const phpLanguageId = 'php';
const htmlLanguageId = 'html';
const version = 'v0.8.0';

let maxFileSizeBytes = 10000000;
let languageClient: LanguageClient;
let extensionContext:ExtensionContext;

export function activate(context: ExtensionContext) {

	extensionContext = context;
	let versionMemento = context.workspaceState.get<string>('version');
	let clearCache = context.workspaceState.get<boolean>('clearCache');
	context.workspaceState.update('clearCache', undefined);
	context.workspaceState.update('version', version);
	
	if(!versionMemento) {
		//cleanup old symbol cache when updating to v0.8.0
		fs.remove(path.join(context.storagePath, 'symbols')).catch((err)=>{});
	}

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

	let documentSelectorFactory: DocumentSelectorFactory = (method) => {
		switch (method) {
			case DocumentFormattingRequest.type.method:
			case DocumentRangeFormattingRequest.type.method:
				return [{ language: phpLanguageId, scheme: 'file' }]
			default:
				return [
					{ language: phpLanguageId, scheme: 'file' },
					{ language: htmlLanguageId, scheme: 'file' }
				];
		}
	}

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		documentSelector: [
			{ language: phpLanguageId, scheme: 'file' },
		],
		documentSelectorFactory: documentSelectorFactory,
		synchronize: {
			// Synchronize the setting section 'intelephense' to the server
			configurationSection: 'intelephense',
			// Notify the server about file changes to php in the workspace
			//fileEvents: workspace.createFileSystemWatcher('**/*.php')
		},
		initializationOptions: {
			storagePath:context.storagePath,
			clearCache:clearCache
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

	WorkspaceDiscovery.client = languageClient;
	WorkspaceDiscovery.maxFileSizeBytes = workspace.getConfiguration("intelephense.file").get('maxSize') as number;

	if (workspace.rootPath) {
		ready.then(()=>{
			return workspace.findFiles(workspaceFilesIncludeGlob());
		}).then((uriArray) => {
			indexWorkspace(uriArray, context.workspaceState.get<number>('deactivated'));
		});
	}

	let importCommandDisposable = commands.registerTextEditorCommand('intelephense.import', importCommandHandler);
	let clearCacheDisposable = commands.registerCommand('intelephense.clear.cache', clearCacheCommandHandler);

	//push disposables
	context.subscriptions.push(langClientDisposable, fsWatcher, importCommandDisposable, clearCacheDisposable);

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

export function deactivate() {
	return extensionContext.workspaceState.update('deactivated', Date.now());
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
	return extensionContext.workspaceState.update('clearCache', true).then(()=>{
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
	WorkspaceDiscovery.forget(uri);
}

function onDidChange(uri: Uri) {
	WorkspaceDiscovery.delayedDiscover(uri);
}

function onDidCreate(uri: Uri) {
	onDidChange(uri);
}

function indexWorkspace(uriArray: Uri[], timestamp:number) {

	let indexingStartHrtime = process.hrtime();
	languageClient.info('Indexing started.');
	let completedPromise = WorkspaceDiscovery.checkCacheThenDiscover(uriArray, timestamp).then((count)=>{
		indexingCompleteFeedback(indexingStartHrtime, count);
	});
	window.setStatusBarMessage('$(search) intelephense indexing ...', completedPromise);

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
