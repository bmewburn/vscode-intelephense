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
	connection.console.info('Intelephense initialising.');
	workspaceRoot = params.rootPath;
	return {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			documentSymbolProvider: true,
			workspaceSymbolProvider: true,
			completionProvider: {
				triggerCharacters: ['$', '>', ':']
			},
			signatureHelpProvider:{
				triggerCharacters:['(', ',']
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
	return handleRequest(() => {
		return Intelephense.documentSymbols(params.textDocument);
	}, ['onDocumentSymbol', params.textDocument.uri]);
});

connection.onWorkspaceSymbol((params) => {
	return handleRequest(() => {
		return Intelephense.workspaceSymbols(params.query);
	}, ['onWorkspaceSymbol', params.query]);
});

connection.onCompletion((params) => {
	return handleRequest(() => {
		return Intelephense.completions(params.textDocument, params.position);
	}, ['onCompletion', params.textDocument.uri, JSON.stringify(params.position)]);
});

connection.onSignatureHelp((params)=>{
	return handleRequest(()=>{
		return <SignatureHelp>{
			activeSignature:0,
			activeParameter:0,
			signatures:[
				{
					label:'($param1):void',
					documentation:'sig1 documentation',
					parameters:[
						{
							label:'$param1',
							documentation:'param1 documentation'
						}
					]
				}
			]
		};
	},['onSignatureHelp', params.textDocument.uri, JSON.stringify(params.position)]);
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
	connection.sendDiagnostics(params);
}

let discoverRequest = new RequestType<{ textDocument: TextDocumentItem }, number, void, void>(discoverRequestName);
connection.onRequest(discoverRequest, (params) => {
	return handleRequest(() => {
		return Intelephense.discover(params.textDocument);
	}, ['onDiscover', params.textDocument.uri]);
});

let forgetRequest = new RequestType<{ uri: string }, number, void, void>(forgetRequestName);
connection.onRequest(forgetRequest, (params) => {
	return handleRequest(() => {
		return Intelephense.forget(params.uri);
	}, ['onForget', params.uri]);
});

// Listen on the connection
connection.listen();

function handleRequest<T>(handler: () => T, debugMsgArray: string[]): T {
	let start = process.hrtime();
	let t = handler();
	let snap = takeProcessSnapshot(start);
	debugMsgArray.push(`${snap.elapsed.toFixed(3)} ms`, `${snap.memory.toFixed(1)} MB`);
	debug(debugMsgArray.join(' | '));
	return t;
}

interface ProcessSnapshot {
	elapsed: number;
	memory: number;
}

function debug(msg: string) {
	if (enableDebug) {
		connection.console.info(msg);
	}
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
