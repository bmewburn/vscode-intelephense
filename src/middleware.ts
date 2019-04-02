/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* Copyright (c) Ben Robert Mewburn 
 * Licensed under the MIT Licence.
 */

'use strict';

import {
    Middleware, ProvideCompletionItemsSignature, LanguageClient, TextDocumentIdentifier,
    Range as RangeDto, ProvideSignatureHelpSignature, ProvideDefinitionSignature,
    ProvideReferencesSignature, ProvideDocumentHighlightsSignature, ProvideHoverSignature,
    HandleDiagnosticsSignature, ResolveCompletionItemSignature
} from 'vscode-languageclient';
import {
    TextDocument, Position, CancellationToken, Range, workspace,
    EventEmitter, Disposable, Uri, commands, ProviderResult, CompletionItem, CompletionList,
    SignatureHelp, Definition, Location, DocumentHighlight,
    Hover, CompletionContext, DefinitionLink, Diagnostic, DiagnosticTag
} from 'vscode';
import {
    getEmbeddedContentUri, getHostDocumentUri,
    isEmbeddedContentUri, EMBEDDED_CONTENT_SCHEME
} from './embeddedContentUri';

const documentLanguageRangesRequestName = 'documentLanguageRanges';
const phpLanguageId = 'php';
const htmlLanguageId = 'html';

interface LanguageRange {
    range: RangeDto;
    languageId?: string;
}

interface VLanguageRange {
    range: Range;
    languageId?: string;
}

export interface IntelephenseMiddleware extends Middleware, Disposable { }

const DIAGNOSTIC_CODE_UNUSED = 10010;

export function createMiddleware(getClient: () => LanguageClient): IntelephenseMiddleware {

    const toDispose: Disposable[] = [];
    const embeddedContentChanged = new EventEmitter<Uri>();
    // remember all open virtual documents with the version of the content
    const openVirtualDocuments: { [virtualUri: string]: number } = {};
    //doc lang ranges
    const documentLanguageRanges: { [virtualUri: string]: VLanguageRange[] } = {};

    // documents are closed after a time out or when collected.
    toDispose.push(workspace.onDidCloseTextDocument(d => {
        if (isEmbeddedContentUri(d.uri)) {
            delete openVirtualDocuments[d.uri.toString()];
            delete documentLanguageRanges[d.uri.toString()];
        }
    }));

    function languageRange2Code(v: LanguageRange) {
        return <VLanguageRange>{
            range: new Range(new Position(v.range.start.line, v.range.start.character), new Position(v.range.end.line, v.range.end.character)),
            languageId: v.languageId
        }
    }

    async function fetchRanges(virtualUri: Uri) {
        const hostUri = getHostDocumentUri(virtualUri);
        const languageRanges = await documentLanguageRangesRequest(hostUri, getClient());
        const virtualURIString = virtualUri.toString();
        if (!languageRanges || !languageRanges.version || !languageRanges.ranges) {
            delete documentLanguageRanges[virtualURIString];
            delete openVirtualDocuments[virtualURIString];
            return undefined;
        }

        openVirtualDocuments[virtualURIString] = languageRanges.version;
        documentLanguageRanges[virtualURIString] = languageRanges.ranges.map(languageRange2Code);
        return documentLanguageRanges[virtualURIString];
    }

    const replacePattern = /\S/g;
    function phpEscapedContent(ranges: VLanguageRange[], uri: string) {
        const finderFn = (x: TextDocument) => {
            return x.uri.toString() === uri;
        }
        const doc = workspace.textDocuments.find(finderFn);
        if (!doc || !ranges || ranges.length < 1) {
            return '';
        }

        let r: VLanguageRange;
        let text = '';
        let part: string;
        for (let n = 0, l = ranges.length; n < l; ++n) {
            r = ranges[n];
            part = doc.getText(r.range);
            if (part && r.languageId === phpLanguageId) {
                part = part.replace(replacePattern, ' ');
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
                    return phpEscapedContent(docRanges, getHostDocumentUri(uri));
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

    async function shouldForwardRequest(virtualURI: Uri, expectedVersion: number, place?: Position | Range) {

        let virtualURIString = virtualURI.toString();
        let virtualDocVersion = openVirtualDocuments[virtualURIString];

        if (isDefined(virtualDocVersion) && virtualDocVersion !== expectedVersion) {

            await new Promise<void>((resolve, reject) => {
                let subscription = workspace.onDidChangeTextDocument(d => {
                    if (d.document.uri.toString() === virtualURIString) {
                        subscription.dispose();
                        resolve();
                    }
                });
                delete documentLanguageRanges[virtualURIString];
                delete openVirtualDocuments[virtualURIString];
                embeddedContentChanged.fire(virtualURI);
            });
        }

        const ranges = await fetchRanges(virtualURI);

        if (!ranges || ranges.length < 1) {
            return false;
        } else if (!place) {
            return ranges.length > 1;
        } else if ((<Position>place).line) {
            return !isPositionPhp(ranges, <Position>place);
        } else {
            return !isRangePhpOnly(ranges, <Range>place);
        }
    }

    async function openEmbeddedContentDocument(virtualURI: Uri, expectedVersion: number) {
        const doc = await workspace.openTextDocument(virtualURI)
        if (expectedVersion === openVirtualDocuments[virtualURI.toString()]) {
            return doc;
        }
        return void 0;
    };

    function isPositionPhp(ranges: VLanguageRange[], position: Position) {

        if (!ranges || ranges.length < 1) {
            return true;
        }

        let r: Range;
        for (let n = 0, l = ranges.length; n < l; ++n) {
            r = ranges[n].range;
            if (r.contains(position)) {
                return ranges[n].languageId === phpLanguageId;
            }
        }
        return true;

    }

    function isRangePhpOnly(ranges: VLanguageRange[], range: Range) {

        if (!ranges || ranges.length < 1) {
            return false;
        }

        let r: Range;
        let started = false;
        for (let n = 0, l = ranges.length; n < l; ++n) {
            r = ranges[n].range;
            if (!started && r.contains(range.start)) {
                if (ranges[n].languageId !== phpLanguageId) {
                    return false;
                } else {
                    started = true;
                }
            } else if (started) {
                if (ranges[n].languageId !== phpLanguageId) {
                    return false;
                }
                if (r.contains(range.end)) {
                    return ranges[n].languageId !== phpLanguageId;
                }
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
        token: CancellationToken
    ): ProviderResult<R> {

        let result = first();

        if (!isThenable(result)) {
            result = Promise.resolve(result);
        }

        return (<Thenable<R>>result).then((value): ProviderResult<R> => {

            if (!isFalseyResult(value) || token.isCancellationRequested) {
                return value;
            }

            let embeddedContentUri = getEmbeddedContentUri(doc.uri.toString(), htmlLanguageId);
            return shouldForwardRequest(embeddedContentUri, doc.version, position).then(shouldForward => {
                if (!shouldForward || token.isCancellationRequested) {
                    return defaultResult;
                } else {
                    return openEmbeddedContentDocument(embeddedContentUri, doc.version).then(vdoc => {
                        return vdoc ? next(vdoc) : defaultResult;
                    });
                }
            });

        });

    }

    function diagnosticsTagAsUnnecessary(diagnostics:Diagnostic[]) {
        let d:Diagnostic;
        for(let n = 0, l = diagnostics.length; n < l; ++n) {
            d = diagnostics[n];
            if(d.code === DIAGNOSTIC_CODE_UNUSED) {
                d.tags = [DiagnosticTag.Unnecessary];
            }
        }
        return diagnostics;
    }

    let lastCompletionWasPhp = true;
    let middleware = <IntelephenseMiddleware>{
        handleDiagnostics: (uri: Uri, diagnostics: Diagnostic[], next: HandleDiagnosticsSignature) => {
            next(uri, diagnosticsTagAsUnnecessary(diagnostics));
        },
        provideCompletionItem: (document: TextDocument, position: Position, context: CompletionContext, token: CancellationToken, next: ProvideCompletionItemsSignature) => {
            return middleWarePositionalRequest<CompletionList | CompletionItem[]>(document, position, () => {
                lastCompletionWasPhp = true;
                if (context.triggerCharacter === '<' || context.triggerCharacter === '/' || context.triggerCharacter === '.') {
                    //not php trigger chars -- dont send request to php server
                    return undefined;
                }
                return next(document, position, context, token);
            }, isFalseyCompletionResult, (vdoc) => {
                if (context.triggerCharacter === '$' || context.triggerCharacter === '>' || context.triggerCharacter === '\\') {
                    //these are php trigger chars -- dont forward to html
                    return new CompletionList([], false);
                }
                lastCompletionWasPhp = false;
                return commands.executeCommand<CompletionList>('vscode.executeCompletionItemProvider', vdoc.uri, position, context.triggerCharacter);
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
            return middleWarePositionalRequest<Definition | DefinitionLink[]>(document, position, () => {
                return next(document, position, token);
            }, (r) => { return !r || (Array.isArray(r) && r.length < 1); }, (vdoc) => {
                return commands.executeCommand<Definition>('vscode.executeDefinitionProvider', vdoc.uri, position).then((def) => {
                    if (!def) {
                        return def;
                    } else if (Array.isArray(def)) {
                        def.forEach((v) => {
                            if (isEmbeddedContentUri(v.uri)) {
                                v.uri = getClient().protocol2CodeConverter.asUri(getHostDocumentUri(v.uri));
                            }
                        });
                        return def;
                    } else {
                        if (isEmbeddedContentUri(def.uri)) {

                            def.uri = getClient().protocol2CodeConverter.asUri(getHostDocumentUri(def.uri));
                        }
                        return def;
                    }
                });
            }, [], token);
        },

        provideReferences: (document: TextDocument, position: Position, options: {
            includeDeclaration: boolean;
        }, token: CancellationToken, next: ProvideReferencesSignature) => {

            return middleWarePositionalRequest<Location[]>(document, position, () => {
                return next(document, position, options, token);
            }, (r) => { return !r || (Array.isArray(r) && r.length < 1); }, (vdoc) => {
                return commands.executeCommand<Location[]>('vscode.executeReferenceProvider', vdoc.uri, position).then(locs => {
                    locs.forEach((v) => {
                        if (isEmbeddedContentUri(v.uri)) {
                            v.uri = getClient().protocol2CodeConverter.asUri(getHostDocumentUri(v.uri));
                        }
                    });
                    return locs;
                })
            }, [], token);

        },
/*
        provideDocumentLinks: (document: TextDocument, token: CancellationToken, next: ProvideDocumentLinksSignature) => {
            let vdocUri = getEmbeddedContentUri(document.uri.toString(), htmlLanguageId);
            return shouldForwardRequest(vdocUri, document.version).then(result => {

                if (!result || token.isCancellationRequested) {
                    return [];
                }

                return openEmbeddedContentDocument(vdocUri, document.version).then((vdoc) => {
                    return vdoc ? commands.executeCommand<DocumentLink[]>('vscode.executeLinkProvider', vdoc.uri) : [];
                });
            });
        },
*/
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
            }, (r) => { return !r || !r.contents || (Array.isArray(r.contents) && r.contents.length < 1); }, (vdoc) => {
                return commands.executeCommand<Hover[]>('vscode.executeHoverProvider', vdoc.uri, position).then((h) => {
                    return h.shift();
                });
            }, undefined, token);
        },

        resolveCompletionItem: (item:CompletionItem, token: CancellationToken, next: ResolveCompletionItemSignature) => {
            return lastCompletionWasPhp ? next(item, token) : item;
        },

        dispose: Disposable.from(...toDispose).dispose
    }

    return middleware;

}

function isDefined(o: any) {
    return typeof o !== 'undefined';
}

function documentLanguageRangesRequest(uri: string, client: LanguageClient) {
    return client.sendRequest<{ version: number, ranges: LanguageRange[] }>(
        documentLanguageRangesRequestName,
        { textDocument: <TextDocumentIdentifier>{ uri: uri } }
    );
}

function isThenable(obj: any) {
    return obj && obj.then !== undefined;
}

function isFalseyCompletionResult(result: CompletionItem[] | CompletionList) {
    return !result || (Array.isArray(result) && result.length < 1) || !(<CompletionList>result).items || (<CompletionList>result).items.length < 1;
}
