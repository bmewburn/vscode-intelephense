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
const documentLanguageRangesRequest = new RequestType<{ textDocument: TextDocumentIdentifier }, { version: number, ranges: LanguageRange[] }, void, void>('documentLanguageRanges');
const knownDocumentsRequest = new RequestType<void, { timestamp: number, documents: string[] }, void, void>('knownDocuments');

interface VscodeConfig extends IntelephenseConfig {
	formatProvider: { enable: boolean }
}

let config: VscodeConfig = {
	debug: {
		enable: false
	},
	completionProvider: {
		maxItems: 100,
		addUseDeclaration: true,
		backslashPrefix: false
	},
	diagnosticsProvider: {
		debounce: 1000,
		maxItems: 100
	},
	file: {
		maxSize: 1000000
	},
	formatProvider: {
		enable: true
	}
};


connection.onInitialize((params) => {
	initialisedAt = process.hrtime();
	connection.console.info('Initialising');
	let initOptions = <InitialisationOptions>{
		storagePath: params.initializationOptions.storagePath,
		logWriter: {
			info: connection.console.info,
			warn: connection.console.warn,
			error: connection.console.error
		},
		clearCache: params.initializationOptions.clearCache
	}

	return Intelephense.initialise(initOptions).then(() => {
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
					triggerCharacters: [
						'$', '>', ':', //php
						'.', '<', '/' //html/js
					]
				},
				signatureHelpProvider: {
					triggerCharacters: ['(', ',']
				},
				definitionProvider: true,
				//documentFormattingProvider: true,
				documentRangeFormattingProvider: false,
				referencesProvider: true,
				documentLinkProvider: { resolveProvider: false },
				hoverProvider: true,
				documentHighlightProvider: true
			}
		}
	});

});

let docFormatRegister: Thenable<Disposable> = null;

connection.onDidChangeConfiguration((params) => {

	let settings = params.settings.intelephense as VscodeConfig;
	if (!settings) {
		return;
	}
	config = settings;
	Intelephense.setConfig(config);

	let enableFormatter = config.formatProvider && config.formatProvider.enable;
	if (enableFormatter) {
		let documentSelector: DocumentSelector = [{ language: languageId, scheme: 'file' }];
		if (!docFormatRegister) {
			docFormatRegister = connection.client.register(DocumentRangeFormattingRequest.type, { documentSelector });
		}
	} else {
		if (docFormatRegister) {
			docFormatRegister.then(r => r.dispose());
			docFormatRegister = null;
		}
	}

});

//atm for html compatibility
connection.onDocumentLinks((params) => {
	return [];
});

connection.onHover((params) => {
	return Intelephense.provideHover(params.textDocument.uri, params.position);
});

connection.onDocumentHighlight((params) => {
	return Intelephense.provideHighlights(params.textDocument.uri, params.position);
})

connection.onDidOpenTextDocument((params) => {

	if (params.textDocument.text.length > config.file.maxSize) {
		connection.console.warn(`${params.textDocument.uri} not opened -- over max file size.`);
		return;
	}
		
	Intelephense.openDocument(params.textDocument);
});

connection.onDidChangeTextDocument((params) => {
	Intelephense.editDocument(params.textDocument, params.contentChanges);
});

connection.onDidCloseTextDocument((params) => {
	Intelephense.closeDocument(params.textDocument);
});

connection.onDocumentSymbol((params) => {
	return Intelephense.documentSymbols(params.textDocument);
});

connection.onWorkspaceSymbol((params) => {
	return Intelephense.workspaceSymbols(params.query);
});

connection.onReferences((params) => {
	return Intelephense.provideReferences(params.textDocument, params.position, params.context);
});

connection.onCompletion((params) => {
	return Intelephense.provideCompletions(params.textDocument, params.position);
});

connection.onSignatureHelp((params) => {
	return Intelephense.provideSignatureHelp(params.textDocument, params.position);
});

connection.onDefinition((params) => {
	return Intelephense.provideDefinition(params.textDocument, params.position);
});

connection.onDocumentRangeFormatting((params) => {
	return Intelephense.provideDocumentRangeFormattingEdits(params.textDocument, params.range, params.options);
});

connection.onShutdown(Intelephense.shutdown);

connection.onRequest(discoverSymbolsRequest, (params) => {

	if (params.textDocument.text.length > config.file.maxSize) {
		connection.console.warn(`${params.textDocument.uri} exceeds max file size.`);
		return 0;
	}

	return Intelephense.discoverSymbols(params.textDocument);
});

connection.onRequest(discoverReferencesRequest, (params) => {

	if (params.textDocument.text.length > config.file.maxSize) {
		connection.console.warn(`${params.textDocument.uri} exceeds max file size.`);
		return 0;
	}
	return Intelephense.discoverReferences(params.textDocument);
});

connection.onRequest(forgetRequest, (params) => {
	return Intelephense.forget(params.uri);
});

connection.onRequest(importSymbolRequest, (params) => {
	return Intelephense.provideContractFqnTextEdits(params.uri, params.position, params.alias);
});

connection.onRequest(knownDocumentsRequest, () => {
	return Intelephense.knownDocuments();
});

connection.onRequest(documentLanguageRangesRequest, (params) => {
	return Intelephense.documentLanguageRanges(params.textDocument);
});

// Listen on the connection
connection.listen();

function elapsed(start: [number, number]) {
	if (!start) {
		return -1;
	}
	let diff = process.hrtime(start);
	return diff[0] * 1000 + diff[1] / 1000000;
}
