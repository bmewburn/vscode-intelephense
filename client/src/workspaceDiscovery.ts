/* Copyright (c) Ben Robert Mewburn 
 * Licensed under the ISC Licence.
 */
'use strict';

import * as fs from 'fs';
import { LanguageClient, TextDocumentItem } from 'vscode-languageclient';
import { Uri } from 'vscode'

const discoverSymbolsRequestName = 'discoverSymbols';
const discoverReferencesRequestName = 'discoverReferences';
const forgetRequestName = 'forget';
const phpLanguageId = 'php';

export class WorkspaceDiscovery {

    constructor(public client: LanguageClient, public maxFileSizeBytes: number) { }

    modTime(uri: Uri) {

        return new Promise<number>((resolve, reject) => {
            fs.stat(uri.fsPath, (err, stats) => {
                if (err) {
                    reject(err.message);
                    return;
                }
                resolve(stats.mtime.getTime());
            });
        });

    }

    forget(uri:Uri) {
        return this.forgetRequest(uri);
    }

    discoverSymbols(uri: Uri) {
        return this.readTextDocumentItem(uri).then(this.discoverSymbolsRequest);
    }

    discoverSymbolsMany(uriArray:Uri[]) {

        let remaining = uriArray.length;
        let items = uriArray.slice(0);
        let item:Uri;
        let counter = 0;
        let langClient = this.client;
        let discover = this.discoverSymbols;

        let onAlways = () => {
            --remaining;
            let uri = items.pop();
            if(uri) {

            }
        }

        let onResolve = () => {
            --remaining;
        };

        let onReject = (errMsg:string) => {
            --remaining;

        };

        while((item = items.pop())) {
            
            if(++counter === 10) {
                break;
            }
        }


    }

    discoverReferences(uri:Uri) {
        return this.readTextDocumentItem(uri).then(this.discoverReferencesRequest);
    }

    private readTextDocumentItem(uri: Uri) {
        let maxSize = this.maxFileSizeBytes;
        return new Promise<TextDocumentItem>((resolve, reject) => {

            fs.readFile(uri.fsPath, (readErr, data) => {

                if (readErr) {
                    reject(readErr.message);
                    return;
                }

                let doc: TextDocumentItem = {
                    uri: uri.toString(),
                    text: data.toString(),
                    languageId: phpLanguageId,
                    version: 0
                }

                if (doc.text.length > maxSize) {
                    reject(`${uri} exceeds maximum file size.`);
                    return;
                }

                resolve(doc);

            });
        });

    }

    private forgetRequest = (uri: Uri) => {
        return this.client.sendRequest<void>(
            forgetRequestName,
            { uri: uri.toString() }
        );
    }

    private discoverSymbolsRequest = (doc: TextDocumentItem) => {
        return this.client.sendRequest<number>(
            discoverSymbolsRequestName,
            { textDocument: doc }
        );
    }

    private discoverReferencesRequest = (doc: TextDocumentItem) => {
        return this.client.sendRequest<number>(
            discoverReferencesRequestName,
            { textDocument: doc }
        );
    }



}