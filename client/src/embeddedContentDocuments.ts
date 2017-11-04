/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* Copyright (c) Ben Robert Mewburn 
 * Licensed under the ISC Licence.
 */

'use strict';

import {
    Middleware, ProvideCompletionItemsSignature, LanguageClient, TextDocumentIdentifier,
    Range as RangeDto, ProvideSignatureHelpSignature, ProvideDefinitionSignature,
    ProvideReferencesSignature, ProvideDocumentSymbolsSignature, ProvideDocumentLinksSignature,
    ProvideDocumentHighlightsSignature, ProvideHoverSignature
} from 'vscode-languageclient';
import {
    TextDocument, Position, CancellationToken, Range, workspace,
    EventEmitter, Disposable, Uri, commands, ProviderResult, CompletionItem, CompletionList,
    SignatureHelp, Definition, Location, SymbolInformation, DocumentLink, DocumentHighlight,
    Hover
} from 'vscode';
import {
    getEmbeddedContentUri, getEmbeddedLanguageId, getHostDocumentUri,
    isEmbeddedContentUri, EMBEDDED_CONTENT_SCHEME
} from './embeddedContentUri';

const documentLanguageRangesRequestName = 'documentLanguageRanges';
const phpLanguageId = 'php';
const htmlLanguageId = 'html';

interface LanguageRange {
    range: RangeDto;
    languageId?: string;
}

export interface EmbeddedDocuments extends Disposable {
    middleware: Middleware;
}

export function initializeEmbeddedContentDocuments(client: LanguageClient): EmbeddedDocuments {
    let toDispose: Disposable[] = [];

    let embeddedContentChanged = new EventEmitter<Uri>();

    // remember all open virtual documents with the version of the content
    let openVirtualDocuments: { [virtualUri: string]: number } = {};

    //doc lang ranges
    let documentLanguageRanges: { [virtualUri: string]: LanguageRange[] } = {};

    // documents are closed after a time out or when collected.
    toDispose.push(workspace.onDidCloseTextDocument(d => {
        if (isEmbeddedContentUri(d.uri)) {
            delete openVirtualDocuments[d.uri.toString()];
        }
    }));

    let fetchRanges = (virtualUri: Uri) => {
        let hostUri = getHostDocumentUri(virtualUri);
        return documentLanguageRangesRequest(hostUri, client).then((ranges) => {
            documentLanguageRanges[hostUri] = ranges;
            return ranges;
        });
    }

    const replacePattern = /\S/g;
    function phpEscapedContent(ranges: LanguageRange[], uri) {
        let finderFn = (x: TextDocument) => {
            return x.uri === uri;
        }
        let doc = workspace.textDocuments.find(finderFn);
        if (!doc || !ranges || ranges.length < 1) {
            return '';
        }

        let r: LanguageRange;
        let text = '';
        let part: string;
        for (let n = 0, l = ranges.length; n < l; ++n) {
            r = ranges[n];
            part = doc.getText(new Range(r.range.start.line, r.range.start.character, r.range.end.line, r.range.end.character));
            if (part && r.languageId === phpLanguageId) {
                part = '<' + part.slice(1, -1).replace(replacePattern, ' ') + '>';
            }
            text += part;
        }

        return text;
    }

    // virtual document provider
    toDispose.push(workspace.registerTextDocumentContentProvider(EMBEDDED_CONTENT_SCHEME, {
        provideTextDocumentContent: uri => {
            if (isEmbeddedContentUri(uri)) {
                let docRanges = documentLanguageRanges[uri.toString()];
                if (!docRanges) {
                    return fetchRanges(uri).then((ranges) => {
                        return phpEscapedContent(ranges, getHostDocumentUri(uri));
                    });
                } else {
                    return phpEscapedContent(docRanges, uri);
                }
            }
            return '';
        },
        onDidChange: embeddedContentChanged.event
    }));

    /*
    // diagnostics for embedded contents
    client.onNotification(EmbeddedContentChangedNotification.type, p => {
        for (let languageId in embeddedLanguages) {
            if (p.embeddedLanguageIds.indexOf(languageId) !== -1) {
                // open the document so that validation is triggered in the embedded mode
                let virtualUri = getEmbeddedContentUri(p.uri, languageId);
                openEmbeddedContentDocument(virtualUri, p.version);
            }
        }
    });
    */

    function ensureContentUpdated(virtualURI: Uri, expectedVersion: number) {
        let virtualURIString = virtualURI.toString();
        let virtualDocVersion = openVirtualDocuments[virtualURIString];
        if (isDefined(virtualDocVersion) && virtualDocVersion !== expectedVersion) {
            return new Promise<void>((resolve, reject) => {
                let subscription = workspace.onDidChangeTextDocument(d => {
                    if (d.document.uri.toString() === virtualURIString) {
                        subscription.dispose();
                        resolve();
                    }
                });
                delete documentLanguageRanges[virtualURIString];
                embeddedContentChanged.fire(virtualURI);
            });
        }
        return Promise.resolve();
    };

    function openEmbeddedContentDocument(virtualURI: Uri, expectedVersion: number): Thenable<TextDocument> {
        return ensureContentUpdated(virtualURI, expectedVersion).then(_ => {
            return workspace.openTextDocument(virtualURI).then(document => {
                if (expectedVersion === openVirtualDocuments[virtualURI.toString()]) {
                    return document;
                }
                return void 0;
            });
        });
    };

    function isPositionOutsidePhpLanguageRange(uri: Uri, position: Position) {

        let ranges = documentLanguageRanges[getEmbeddedContentUri(uri.toString(), htmlLanguageId).toString()];

        if (!ranges || ranges.length < 1) {
            return false;
        }

        let r: RangeDto;
        for (let n = 0, l = ranges.length; n < l; ++n) {
            r = ranges[n].range;
            if (
                (position.line > r.start.line || (position.line === r.start.line && position.character >= r.start.character)) &&
                (position.line < r.end.line || (position.line === r.end.line && position.character <= r.end.character))
            ) {
                return ranges[n].languageId !== phpLanguageId;
            }
        }
        return false;

    }


    function middleWarePositionalRequest<R>(
        doc: TextDocument,
        position: Position,
        first: () => ProviderResult<R>,
        isFalseyResult: (v: any) => boolean,
        next: (virtualDoc: TextDocument) => ProviderResult<R>,
        defaultResult: ProviderResult<R>,
        token:CancellationToken
    ): ProviderResult<R> {

        let result = first();
        if (!this.isThenable(result)) {
            result = Promise.resolve(result);
        }

        return (<Thenable<R>>result).then((value): ProviderResult<R> => {
            if (!isFalseyResult(value) || token.isCancellationRequested) {
                return value;
            }

            let embeddedContentUri = getEmbeddedContentUri(doc.uri.toString(), htmlLanguageId);
            return openEmbeddedContentDocument(embeddedContentUri, doc.version).then((vdoc) => {
                if (isPositionOutsidePhpLanguageRange(doc.uri, position) && !token.isCancellationRequested) {
                    return next(vdoc);
                } else {
                    return defaultResult;
                }
            });

        });

    }


    let middleware = <Middleware>{

        provideCompletionItem: (document: TextDocument, position: Position, token: CancellationToken, next: ProvideCompletionItemsSignature) => {

            return middleWarePositionalRequest<CompletionList | CompletionItem[]>(document, position, () => {
                return next(document, position, token);
            }, isFalseyCompletionResult, (vdoc) => {
                return commands.executeCommand<CompletionList>('vscode.executeCompletionItemProvider', vdoc.uri, position);
            }, new CompletionList([], false), token);

        },

        provideSignatureHelp: (document: TextDocument, position: Position, token: CancellationToken, next: ProvideSignatureHelpSignature) => {
            return middleWarePositionalRequest<SignatureHelp>(document, position, () => {
                return next(document, position, token);
            }, (r) => { return !r; }, (vdoc) => {
                return commands.executeCommand<SignatureHelp>('vscode.executeSignatureHelpProvider', vdoc.uri, position);
            }, undefined, token);
        },

        provideDefinition: (document: TextDocument, position: Position, token: CancellationToken, next: ProvideDefinitionSignature) => {
            return middleWarePositionalRequest<Definition>(document, position, () => {
                return next(document, position, token);
            }, (r) => { return !r || (Array.isArray(r) && r.length < 1); }, (vdoc) => {
                return commands.executeCommand<Definition>('vscode.executeDefinitionProvider', vdoc.uri, position);
            }, [], token);
        },

        provideReferences: (document: TextDocument, position: Position, options: {
            includeDeclaration: boolean;
        }, token: CancellationToken, next: ProvideReferencesSignature) => {

            return middleWarePositionalRequest<Location[]>(document, position, () => {
                return next(document, position, options, token);
            }, (r) => { return !r || (Array.isArray(r) && r.length < 1); }, (vdoc) => {
                return commands.executeCommand<Location[]>('vscode.executeReferenceProvider', vdoc.uri, position);
            }, [], token);

        },

        provideDocumentSymbols: (document: TextDocument, token: CancellationToken, next: ProvideDocumentSymbolsSignature) => {

            return new Promise((resolve, reject) => {

                let vdocUri = getEmbeddedContentUri(document.uri.toString(), htmlLanguageId);
                let symbolInformationArray = [];
                let responseCounter = 2;


                let onResolved = (value: SymbolInformation[]) => {
                    if (value) {
                        Array.prototype.push.apply(symbolInformationArray, value);
                    }
                    if (--responseCounter < 1) {
                        resolve(symbolInformationArray);
                    }
                }

                let htmlResult = openEmbeddedContentDocument(vdocUri, document.version).then((vdoc) => {
                    return commands.executeCommand<SymbolInformation[]>('vscode.executeDocumentSymbolProvider', vdoc.uri);
                });
                if (!isThenable(htmlResult)) {
                    htmlResult = Promise.resolve(htmlResult);
                }
                htmlResult.then(onResolved);

                let phpResult = next(document, token);
                if (!isThenable(phpResult)) {
                    phpResult = Promise.resolve(phpResult);
                }
                (<Thenable<SymbolInformation[]>>phpResult).then(onResolved);

            });

        },

        provideDocumentLinks: (document: TextDocument, token: CancellationToken, next: ProvideDocumentLinksSignature) => {
            let vdocUri = getEmbeddedContentUri(document.uri.toString(), htmlLanguageId);
            return openEmbeddedContentDocument(vdocUri, document.version).then((vdoc) => {
                if(token.isCancellationRequested) {
                    return [];
                }
                return commands.executeCommand<DocumentLink[]>('vscode.executeLinkProvider', vdoc.uri);
            });
        },

        provideDocumentHighlights: (document: TextDocument, position: Position, token: CancellationToken, next: ProvideDocumentHighlightsSignature) => {
            return middleWarePositionalRequest<DocumentHighlight[]>(document, position, () => {
                return next(document, position, token);
            }, (r) => { return !r || (Array.isArray(r) && r.length < 1); }, (vdoc) => {
                return commands.executeCommand<DocumentHighlight[]>('vscode.executeDocumentHighlights', vdoc.uri, position);
            }, [], token);

        },

        provideHover: (document: TextDocument, position: Position, token: CancellationToken, next: ProvideHoverSignature) => {
            return middleWarePositionalRequest<Hover>(document, position, () => {
                return next(document, position, token);
            }, (r) => { return !r || (Array.isArray(r) && r.length < 1); }, (vdoc) => {
                return commands.executeCommand<Hover>('vscode.executeHoverProvider', vdoc.uri, position);
            }, undefined, token);
        },

        


    }

    return {
        middleware: middleware,
        dispose: Disposable.from(...toDispose).dispose
    };

}

function isDefined(o: any) {
    return typeof o !== 'undefined';
}

function documentLanguageRangesRequest(uri: string, client: LanguageClient) {
    return client.sendRequest<LanguageRange[]>(
        documentLanguageRangesRequestName,
        { textDocument: <TextDocumentIdentifier>{ uri: uri } }
    );
}

function isThenable(obj: any) {
    return obj.then !== undefined;
}

function isFalseyCompletionResult(result: CompletionItem[] | CompletionList) {
    return !result || (Array.isArray(result) && result.length < 1) || ((<CompletionList>result).items && (<CompletionList>result).items.length < 1);
}
