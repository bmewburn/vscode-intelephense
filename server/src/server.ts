/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	IPCMessageReader, IPCMessageWriter,
	createConnection, IConnection, TextDocumentSyncKind,
	TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
	InitializeParams, InitializeResult, TextDocumentPositionParams,
	CompletionItem, CompletionItemKind, RequestType, TextDocumentItem
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
	connection.console.info('Intelephense server initialising.');
	workspaceRoot = params.rootPath;
	return {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			documentSymbolProvider: true,
			workspaceSymbolProvider: true
		}
	}
});


connection.onDidOpenTextDocument((params) => {
	handleRequest(() => {
		Intelephense.openDocument(params.textDocument);
	}, `onDidOpenTextDocument ${params.textDocument.uri}`);
});

connection.onDidChangeTextDocument((params) => {
	handleRequest(() => {
		Intelephense.editDocument(params.textDocument, params.contentChanges);
	}, `onDidChangeTextDocument ${params.textDocument.uri}`);
});

connection.onDidCloseTextDocument((params) => {
	handleRequest(() => {
		Intelephense.closeDocument(params.textDocument);
	}, `onDidCloseTextDocument ${params.textDocument.uri}`);
});

connection.onDocumentSymbol((params) => {
	return handleRequest(() => {
		return Intelephense.documentSymbols(params.textDocument);
	}, `onDocumentSymbol ${params.textDocument.uri}`);
});

connection.onWorkspaceSymbol((params)=>{
	return handleRequest(()=>{
		return Intelephense.workspaceSymbols(params.query);
	}, 'onWorkspaceSymbol');	
});

let discoverRequest = new RequestType<{ textDocument: TextDocumentItem }, number, void, void>(discoverRequestName);
connection.onRequest(discoverRequest, (params) => {
	return handleRequest(()=>{
		return Intelephense.discover(params.textDocument);
	}, `onDiscover ${params.textDocument.uri}`);
});

let forgetRequest = new RequestType<{ uri: string }, [number, number], void, void>(forgetRequestName);
connection.onRequest(forgetRequest, (params) => {
	return handleRequest(()=> {
		return Intelephense.forget(params.uri);
	}, `onForget ${params.uri} `);
});

// Listen on the connection
connection.listen();

function handleRequest<T>(handler: () => T, debugMsg: string): T {
	let start = process.hrtime();
	let t = handler();
	let snap = takeProcessSnapshot(start);
	debug(`${debugMsg} | ${snap.elapsed.toFixed(3)} ms | ${snap.memory.toFixed(1)} MB`);
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
	let diff = process.hrtime(start);
	return diff[0] * 1000 + diff[1] / 1000000;
}

function memory() {
	return process.memoryUsage().heapUsed / 1000000;
}
