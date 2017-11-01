/* Copyright (c) Ben Robert Mewburn 
 * Licensed under the ISC Licence.
 */
'use strict';

import {
    Middleware, ProvideCompletionItemsSignature, LanguageClient, TextDocumentIdentifier,
    CompletionItem, CompletionList, Range as RangeDto
} from 'vscode-languageclient';
import { TextDocument, Position, CancellationToken, Range, workspace } from 'vscode';

const documentLanguageRangesRequestName = 'documentLanguageRanges';
const phpLanguageId = 'php';
const htmlLanguageId = 'html';

interface LanguageRange {
    range: RangeDto;
    languageId?: string;
}

export namespace HtmlMiddleware {

    export var client: LanguageClient;

    export function provideCompletionItem(document: TextDocument, position: Position, token: CancellationToken, next: ProvideCompletionItemsSignature) {
        let result = next(document, position, token) as Thenable<CompletionItem[] | CompletionList>;
        if (!this.isThenable(result)) {
            result = Promise.resolve(result);
        }

        return result.then((value)=>{
            if(!isFalseyCompletionResult) {
                return value;
            }

            let ranges = 

        });
    }

    function isFalseyCompletionResult(result:CompletionItem[]|CompletionList) {
        return !result || (Array.isArray(result) && result.length < 1) || ((<CompletionList>result).items && (<CompletionList>result).items.length < 1);
    }

    function documentLanguageRangesRequest(doc: TextDocument) {
        return client.sendRequest<LanguageRange[]>(
            documentLanguageRangesRequestName,
            { textDocument: <TextDocumentIdentifier>{ uri: doc.uri.toString() } }
        );
    }

    function isPositionOutsidePhpLanguageRange(ranges:LanguageRange[], position:Position) {
        let r:Range;
        for(let n = 0, l = ranges.length; n < l; ++n) {
            r = ranges[n].range;
            if(
                (position.line > r.start.line || (position.line === r.start.line && position.character >= r.start.character)) &&
                (position.line < r.end.line || (position.line === r.end.line && position.character <= r.end.character))
            ) {
                return ranges[n].languageId !== phpLanguageId;
            }
        }
        return false;
    }

    const replacePattern = /\S/g;
    function escapedPhpRangeTextDocument(ranges:LanguageRange[], uri) {
        let finderFn = (x:TextDocument) => {
            return x.uri === uri; 
        }
        let doc = workspace.textDocuments.find(finderFn);
        if(!doc) {
            return undefined;
        }
        
        let r:LanguageRange;
        let text = '';
        let part:string;
        for(let n = 0, l = ranges.length; n < l; ++n) {
            r = ranges[n];
            part = doc.getText(new Range(r.range.start.line, r.range.start.character, r.range.end.line, r.range.end.character));
            if(part && r.languageId === phpLanguageId) {
                part = '<' + part.slice(1, -1).replace(replacePattern, ' ') + '>';
            }
            text += part;
        }

        if(text) {
            return 
        }
    }

    function isThenable(obj: any) {
        return obj.then !== undefined;
    }

}

class PhtmlTextDocumentContentProvider {

    


}