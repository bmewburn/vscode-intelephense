/* Copyright (c) Ben Mewburn ben@mewburn.id.au
 * Licensed under the MIT Licence.
 */
'use strict';

import {
	IPCMessageReader, IPCMessageWriter,
	createConnection, IConnection, TextDocumentSyncKind,
	TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
	InitializeParams, InitializeResult, TextDocumentPositionParams,
	CompletionItem, CompletionItemKind, RequestType, TextDocumentItem,
	PublishDiagnosticsParams, SignatureHelp
} from 'vscode-languageserver';

import { Intelephense } from 'intelephense';

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let initialisedAt: [number, number];

const languageId = 'php';
const discoverRequestName = 'discover';
const forgetRequestName = 'forget';

let enableDebug = true;

// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities. 
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
	initialisedAt = process.hrtime();
	connection.console.info('Initialising');
	Intelephense.initialise();
	connection.console.info(`Initialised in ${elapsed(initialisedAt)} ms`);
	workspaceRoot = params.rootPath;
	return {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			documentSymbolProvider: true,
			workspaceSymbolProvider: true,
			completionProvider: {
				triggerCharacters: ['$', '>', ':']
			},
			signatureHelpProvider: {
				triggerCharacters: ['(', ',']
			}
		}
	}
});


connection.onDidOpenTextDocument((params) => {
	handleRequest(() => {
		Intelephense.openDocument(params.textDocument);
	}, ['onDidOpenTextDocument', params.textDocument.uri]);
});

connection.onDidChangeTextDocument((params) => {
	handleRequest(() => {
		Intelephense.editDocument(params.textDocument, params.contentChanges);
	}, ['onDidChangeTextDocument', params.textDocument.uri]);
});

connection.onDidCloseTextDocument((params) => {
	handleRequest(() => {
		Intelephense.closeDocument(params.textDocument);
	}, ['onDidCloseTextDocument', params.textDocument.uri]);
});

connection.onDocumentSymbol((params) => {
	let debugInfo = ['onDocumentSymbol', params.textDocument.uri];
	return handleRequest(() => {
		let symbols = Intelephense.documentSymbols(params.textDocument);
		debugInfo.push(`${symbols.length} symbols`);
		return symbols;
	}, debugInfo);
});

connection.onWorkspaceSymbol((params) => {
	let debugInfo = ['onWorkspaceSymbol', params.query];
	return handleRequest(() => {
		let symbols = Intelephense.workspaceSymbols(params.query);
		debugInfo.push(`${symbols.length} symbols`);
		return symbols;
	}, debugInfo);
});

connection.onCompletion((params) => {
	let debugInfo = ['onCompletion', params.textDocument.uri, JSON.stringify(params.position)];
	return handleRequest(() => {
		let completions = Intelephense.provideCompletions(params.textDocument, params.position);
		debugInfo.push(`${completions.items.length} items`);
		return completions;
	}, debugInfo);
});

connection.onSignatureHelp((params) => {
	let debugInfo = ['onSignatureHelp', params.textDocument.uri, JSON.stringify(params.position)];
	return handleRequest(() => {
		let sigHelp = Intelephense.provideSignatureHelp(params.textDocument, params.position);
		debugInfo.push(`${sigHelp ? sigHelp.signatures.length : 0} signatures`);
		return sigHelp;
	}, debugInfo);
});


let diagnosticsStartMap: { [index: string]: [number, number] } = {};
Intelephense.onDiagnosticsStart = (uri: string) => {
	diagnosticsStartMap[uri] = process.hrtime();
}

Intelephense.onDiagnosticsEnd = (uri: string, diagnostics: Diagnostic[]) => {
	let params: PublishDiagnosticsParams = {
		uri: uri,
		diagnostics: diagnostics
	};

	debug([
		'sendDiagnostics', uri, `${elapsed(diagnosticsStartMap[uri]).toFixed(3)} ms`, `${memory().toFixed(1)} MB`
	].join(' | '));
	
	delete diagnosticsStartMap[uri];
	connection.sendDiagnostics(params);
}

let discoverRequest = new RequestType<{ textDocument: TextDocumentItem }, number, void, void>(discoverRequestName);
connection.onRequest(discoverRequest, (params) => {
	let debugInfo = ['onDiscover', params.textDocument.uri];
	return handleRequest(() => {
		let nDiscovered = Intelephense.discover(params.textDocument);
		debugInfo.push(`${nDiscovered} symbols`);
		return nDiscovered;
	}, debugInfo);
});

let forgetRequest = new RequestType<{ uri: string }, number, void, void>(forgetRequestName);
connection.onRequest(forgetRequest, (params) => {
	let debugInfo = ['onForget', params.uri];
	return handleRequest(() => {
		let nForgot = Intelephense.forget(params.uri);
		debugInfo.push(`${nForgot} symbols`);
		return nForgot;
	}, debugInfo);
});

// Listen on the connection
connection.listen();

function handleRequest<T>(handler: () => T, debugMsgArray: string[]): T {
	
	try{
		let start = process.hrtime();
		let t = handler();
		let snap = takeProcessSnapshot(start);
		debugMsgArray.push(`${snap.elapsed.toFixed(3)} ms`, `${snap.memory.toFixed(1)} MB`);
		debug(debugMsgArray.join(' | '));
		return t;
	} catch(err) {
		connection.console.error(err.stack);
		return null;
	}
	
}

interface ProcessSnapshot {
	elapsed: number;
	memory: number;
}

function debug(msg: string) {
	if (enableDebug) {
		connection.console.log(`[Debug - ${timeString()}] ${msg}`);
	}
}

function timeString(){
	let time = new Date();
	return time.toLocaleString(undefined, { hour: 'numeric',minute:'numeric', second:'numeric'});
}

function takeProcessSnapshot(hrtimeStart: [number, number]) {
	return <ProcessSnapshot>{
		elapsed: elapsed(hrtimeStart),
		memory: memory()
	};
}

function elapsed(start: [number, number]) {
	if (!start) {
		return -1;
	}
	let diff = process.hrtime(start);
	return diff[0] * 1000 + diff[1] / 1000000;
}

function memory() {
	return process.memoryUsage().heapUsed / 1000000;
}
