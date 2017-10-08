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

export namespace WorkspaceDiscovery {

    export var client: LanguageClient;
    export var maxFileSizeBytes: number;

    const delayedDiscoverDebounceTime = 500;
    var delayedDiscoverUriArray:Uri[] = [];
    var delayedDiscoverTimer:NodeJS.Timer;

    export function discover(uriArray:Uri[]) {
        return discoverSymbolsMany(uriArray).then(() => { return discoverReferencesMany(uriArray); });
    }

    export function delayedDiscover(uri:Uri) {
        clearTimeout(delayedDiscoverTimer);
        delayedDiscoverTimer = undefined;
        if(delayedDiscoverUriArray.indexOf(uri) < 0) {
            delayedDiscoverUriArray.push(uri);
        }
		delayedDiscoverTimer = setTimeout(delayedDiscoverFlush, delayedDiscoverDebounceTime);
    }

    export function delayedDiscoverFlush() {
        if(!delayedDiscoverTimer) {
            return;
        }
        clearTimeout(delayedDiscoverTimer);
        delayedDiscoverTimer = undefined;
        discover(delayedDiscoverUriArray);
        delayedDiscoverUriArray = [];
    }

    export function modTime(uri: Uri) {

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

    export function forget(uri: Uri) {
        return forgetRequest(uri);
    }

    function discoverSymbols(uri: Uri) {
        return readTextDocumentItem(uri).then(discoverSymbolsRequest);
    }

    function discoverSymbolsMany(uriArray: Uri[]) {
        return discoverMany(discoverSymbols, uriArray);
    }

    function discoverReferences(uri: Uri) {
        return readTextDocumentItem(uri).then(discoverReferencesRequest);
    }

    function discoverReferencesMany(uriArray: Uri[]) {
        return discoverMany(discoverReferences, uriArray);
    }

    function discoverMany(discoverFn: (uri: Uri) => Promise<number>, uriArray: Uri[]) {

        return new Promise((resolve, reject) => {
            let remaining = uriArray.length;
            let items = uriArray.slice(0);
            let item: Uri;
            let maxOpenFiles = 16;
            let discovered

            let onAlways = () => {
                --remaining;
                let uri = items.pop();
                if (uri) {
                    discoverFn(uri).then(onResolve).catch(onReject);
                } else if (remaining < 1) {
                    resolve();
                }
            }

            let onResolve = (n: number) => {
                onAlways();
            };

            let onReject = (errMsg: string) => {
                client.warn(errMsg);
                onAlways();
            };

            while (maxOpenFiles > 0 && (item = items.pop())) {
                discoverFn(item).then(onResolve).catch(onReject);
                --maxOpenFiles;
            }
        });

    }

    function readTextDocumentItem(uri: Uri) {

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

                if (doc.text.length > maxFileSizeBytes) {
                    reject(`${uri} exceeds maximum file size.`);
                    return;
                }

                resolve(doc);

            });
        });

    }

    function forgetRequest(uri: Uri) {
        return client.sendRequest<void>(
            forgetRequestName,
            { uri: uri.toString() }
        );
    }

    function discoverSymbolsRequest(doc: TextDocumentItem) {
        return client.sendRequest<number>(
            discoverSymbolsRequestName,
            { textDocument: doc }
        );
    }

    function discoverReferencesRequest(doc: TextDocumentItem) {
        return client.sendRequest<number>(
            discoverReferencesRequestName,
            { textDocument: doc }
        );
    }

}