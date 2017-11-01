/* Copyright (c) Ben Robert Mewburn 
 * Licensed under the ISC Licence.
 */
'use strict';

import {
	IPCMessageReader, IPCMessageWriter,
	createConnection, IConnection, TextDocumentSyncKind,
	TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
	InitializeParams, InitializeResult, TextDocumentPositionParams,
	CompletionItem, CompletionItemKind, RequestType, TextDocumentItem,
	PublishDiagnosticsParams, SignatureHelp, DidChangeConfigurationParams,
	Position, TextEdit, Disposable, DocumentRangeFormattingRequest, 
	DocumentFormattingRequest, DocumentSelector, TextDocumentIdentifier
} from 'vscode-languageserver';

import { Intelephense, IntelephenseConfig, InitialisationOptions, LanguageRange } from 'intelephense';

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let initialisedAt: [number, number];

const languageId = 'php';
const discoverSymbolsRequest = new RequestType<{ textDocument: TextDocumentItem }, number, void, void>('discoverSymbols');
const discoverReferencesRequest = new RequestType<{ textDocument: TextDocumentItem }, number, void, void>('discoverReferences');
const forgetRequest = new RequestType<{ uri: string }, void, void, void>('forget');
const importSymbolRequest = new RequestType<{ uri: string, position: Position, alias?: string }, TextEdit[], void, void>('importSymbol');
const cachedDocumentsRequest = new RequestType<void, {timestamp:number, documents:string[]}, void, void>('cachedDocuments');
const documentLanguageRangesRequest = new RequestType<{ textDocument: TextDocumentIdentifier }, LanguageRange[], void, void>('documentLanguageRanges');

interface VscodeConfig extends IntelephenseConfig {
	format: {enable:boolean}
}

let config: VscodeConfig = {
	debug: {
		enable: false
	},
	completionProvider: {
		maxItems: 100,
		addUseDeclaration:true,
        backslashPrefix:true
	},
	diagnosticsProvider: {
		debounce: 1000,
		maxItems: 100
	},
	file: {
		maxSize: 1000000
	},
	format: {
		enable: true
	}
};



// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities. 
let workspaceRoot: string;
connection.onInitialize((params) => {
	initialisedAt = process.hrtime();
	connection.console.info('Initialising');
	let initOptions = <InitialisationOptions>{
		storagePath:params.initializationOptions.storagePath,
		logWriter:{
			info: connection.console.info,
			warn: connection.console.warn,
			error:connection.console.error
		},
		clearCache:params.initializationOptions.clearCache
	}
	workspaceRoot = params.rootPath;
	return Intelephense.initialise(initOptions).then(()=>{
		Intelephense.onPublishDiagnostics((args) => {
			connection.sendDiagnostics(args);
		});
		connection.console.info(`Initialised in ${elapsed(initialisedAt).toFixed()} ms`);
		
		return <InitializeResult>{
			capabilities: {
				textDocumentSync: TextDocumentSyncKind.Incremental,
				documentSymbolProvider: true,
				workspaceSymbolProvider: true,
				completionProvider: {
					triggerCharacters: ['$', '>', ':']
				},
				signatureHelpProvider: {
					triggerCharacters: ['(', ',']
				},
				definitionProvider: true,
				documentFormattingProvider: true,
				documentRangeFormattingProvider: true,
				referencesProvider: true
			}
		}
	});
	
});

let docFormatRegister:Thenable<Disposable> = null;
let rangeFormatRegister:Thenable<Disposable> = null;

connection.onDidChangeConfiguration((params) => {

	let settings = params.settings.intelephense as VscodeConfig;
	if(!settings) {
		return;
	}
	config = settings;
	Intelephense.setConfig(config);

	let enableFormatter = config.format && config.format.enable;
	if (enableFormatter) {
		let documentSelector: DocumentSelector = [{ language: languageId }];
		if (!docFormatRegister) {
			docFormatRegister = connection.client.register(DocumentFormattingRequest.type, { documentSelector });
		}
		if(!rangeFormatRegister) {
			rangeFormatRegister = connection.client.register(DocumentRangeFormattingRequest.type, { documentSelector });
		}
	} else {
		if(docFormatRegister) {
			docFormatRegister.then(r => r.dispose());
			docFormatRegister = null;
		}
		if(rangeFormatRegister) {
			rangeFormatRegister.then(r => r.dispose());
			rangeFormatRegister = null;
		}
	}

});

connection.onDidOpenTextDocument((params) => {

	if (params.textDocument.text.length > config.file.maxSize) {
		connection.console.warn(`${params.textDocument.uri} not opened -- over max file size.`);
		return;
	}

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

connection.onReferences((params) => {
	let debugInfo = ['onReferences', params.textDocument.uri, JSON.stringify(params.position)];
	return handleRequest(() => {
		return Intelephense.provideReferences(params.textDocument, params.position, params.context);
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

connection.onDefinition((params) => {

	let debugInfo = ['onDefinition', params.textDocument.uri, JSON.stringify(params.position)];
	return handleRequest(() => {
		return Intelephense.provideDefinition(params.textDocument, params.position);
	}, debugInfo);
});

connection.onDocumentFormatting((params) => {
	let debugInfo = ['onDocumentFormat', params.textDocument.uri];
	return handleRequest(() => {
		return Intelephense.provideDocumentFormattingEdits(params.textDocument, params.options);
	}, debugInfo);
});

connection.onDocumentRangeFormatting((params) => {
	let debugInfo = ['onDocumentFormat', params.textDocument.uri];
	return handleRequest(() => {
		return Intelephense.provideDocumentRangeFormattingEdits(params.textDocument, params.range, params.options);
	}, debugInfo);
});

connection.onShutdown(Intelephense.shutdown);

connection.onRequest(discoverSymbolsRequest, (params) => {

	if (params.textDocument.text.length > config.file.maxSize) {
		connection.console.warn(`${params.textDocument.uri} exceeds max file size.`);
		return 0;
	}

	let debugInfo = ['onDiscoverSymbols', params.textDocument.uri];
	return handleRequest(() => {
		let symbolCount = Intelephense.discoverSymbols(params.textDocument);
		return symbolCount;
	}, debugInfo);
});

connection.onRequest(discoverReferencesRequest, (params) => {

	if (params.textDocument.text.length > config.file.maxSize) {
		connection.console.warn(`${params.textDocument.uri} exceeds max file size.`);
		return 0;
	}

	let debugInfo = ['onDiscoverReferences', params.textDocument.uri];
	return handleRequest(() => {
		let refCount = Intelephense.discoverReferences(params.textDocument);
		return refCount;
	}, debugInfo);
});

connection.onRequest(forgetRequest, (params) => {
	let debugInfo = ['onForget', params.uri];
	return handleRequest(() => {
		let nForgot = Intelephense.forget(params.uri);
		debugInfo.push(`${nForgot} symbols`);
		return nForgot;
	}, debugInfo);
});

connection.onRequest(importSymbolRequest, (params) => {
	let debugInfo = ['onImportSymbol', params.uri];
	return handleRequest(() => {
		return Intelephense.provideContractFqnTextEdits(params.uri, params.position, params.alias);
	}, debugInfo);
});

connection.onRequest(cachedDocumentsRequest, () => {
	let debugInfo = ['onCachedDocument'];
	return handleRequest(() => {
		return Intelephense.cachedDocuments();
	}, debugInfo);
});

connection.onRequest(documentLanguageRangesRequest, (params) => {
	let debugInfo = ['onDocumentLanguageRanges'];
	return handleRequest(() => {
		return Intelephense.documentLanguageRanges(params.textDocument);
	}, debugInfo);
});


// Listen on the connection
connection.listen();

function handleRequest<T>(handler: () => T, debugMsgArray: string[]): T {

	try {
		let start = process.hrtime();
		let t = handler();
		let snap = takeProcessSnapshot(start);
		debugMsgArray.push(`${snap.elapsed.toFixed(3)} ms`, `${snap.memory.toFixed(1)} MB`);
		debug(debugMsgArray.join(' | '));
		return t;
	} catch (err) {
		connection.console.error(debugMsgArray.join(' | ') + '\n' + err.stack);
		return null;
	}

}

interface ProcessSnapshot {
	elapsed: number;
	memory: number;
}

function debug(msg: string) {
	if (config.debug.enable) {
		connection.console.log(`[Debug - ${timeString()}] ${msg}`);
	}
}

function timeString() {
	let time = new Date();
	return time.toLocaleString(undefined, { hour: 'numeric', minute: 'numeric', second: 'numeric' });
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
