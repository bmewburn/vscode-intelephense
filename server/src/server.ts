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
	CompletionItem, CompletionItemKind
} from 'vscode-languageserver';

import { Intelephense } from 'intelephense';

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
const languageId = 'php';

// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities. 
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
	workspaceRoot = params.rootPath;
	return {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			documentSymbolProvider: true
		}
	}
});


connection.onDidOpenTextDocument((params) => {
	let snap = processSnapshot();
	Intelephense.openDocument(params.textDocument);
	let diff = processSnapshotDiff(snap);
	connection.console.info(`${params.textDocument.uri} opened ${processSnapshotDiffToString(diff)}`);
});

connection.onDidChangeTextDocument((params) => {
	let snap = processSnapshot();
	Intelephense.editDocument(params.textDocument, params.contentChanges);
	let diff = processSnapshotDiff(snap);
	connection.console.info(`${params.textDocument.uri} changed ${processSnapshotDiffToString(diff)}`);
});

connection.onDidCloseTextDocument((params) => {
	let snap = processSnapshot();
	Intelephense.closeDocument(params.textDocument);
	let diff = processSnapshotDiff(snap);
	connection.console.info(`${params.textDocument.uri} closed ${processSnapshotDiffToString(diff)}`);
});

connection.onDocumentSymbol((params) => {
	let snap = processSnapshot();
	let symbols = Intelephense.documentSymbols(params.textDocument);
	let diff = processSnapshotDiff(snap);
	connection.console.info(`${params.textDocument.uri} symbols ${processSnapshotDiffToString(diff)}`);
	return symbols;
});


// Listen on the connection
connection.listen();

interface ProcessSnapshot {
	time: [number, number];
	memory: NodeJS.MemoryUsage;
}

interface ProcessSnapshotDiff {
	timeDiff:number;
	memoryDiff:number;
}

function processSnapshotDiffToString(diff:ProcessSnapshotDiff){
	return `${diff.timeDiff.toFixed(1)}ms ${diff.memoryDiff}B`;
}

function processSnapshot() {
	return <ProcessSnapshot>{
		time: process.hrtime(),
		memory: process.memoryUsage()
	};
}

function processSnapshotDiff(snapshot:ProcessSnapshot){
	return <ProcessSnapshotDiff>{
		timeDiff:timeDiff(snapshot.time),
		memoryDiff:memoryDiff(snapshot.memory)
	};
}

function timeDiff(start: [number, number]) {
	let diff = process.hrtime(start);
	return diff[0] * 1000 + diff[1] / 1000000;
}

function memoryDiff(before: NodeJS.MemoryUsage) {
	let after = process.memoryUsage();
	return after.heapUsed - before.heapUsed;
}
