/* Copyright (c) Ben Robert Mewburn 
 * Licensed under the ISC Licence.
 */
'use strict';

import * as fs from 'fs-extra';
import { LanguageClient, TextDocumentItem } from 'vscode-languageclient';
import { Uri } from 'vscode'

const discoverSymbolsRequestName = 'discoverSymbols';
const discoverReferencesRequestName = 'discoverReferences';
const forgetRequestName = 'forget';
const cachedDocumentsRequestName = 'cachedDocuments';
const phpLanguageId = 'php';

export namespace WorkspaceDiscovery {

    export var client: LanguageClient;
    export var maxFileSizeBytes: number;

    const delayedDiscoverDebounceTime = 500;
    var delayedDiscoverUriArray: Uri[] = [];
    var delayedDiscoverTimer: NodeJS.Timer;

    export function checkCacheThenDiscover(uriArray: Uri[]) {
        return cachedDocumentsRequest().then((status) => {

            let timestamp = status.timestamp;
            let cachedUriSet = new Set<string>(status.documents);
            let notKnown: Uri[] = [];
            let known: Uri[] = [];
            let uri: Uri;
            let uriString: string;

            for (let n = 0, l = uriArray.length; n < l; ++n) {
                uri = uriArray[n];
                uriString = uri.toString();
                if (cachedUriSet.has(uriString)) {
                    known.push(uri);
                    cachedUriSet.delete(uriString);
                } else {
                    notKnown.push(uri);
                }
            }

            return forgetMany(Array.from(cachedUriSet)).then(() => {
                return filterKnownByModtime(known, timestamp);
            }).then((filteredUriArray)=>{
                Array.prototype.push.apply(notKnown, filteredUriArray);
                return discover(notKnown);
            });

        });
    }

    function modTime(uri:Uri):Promise<[Uri, number]> {

        return fs.stat(uri.fsPath).then((stats)=>{
            return <[Uri, number]>[uri, stats.mtime.getTime()];
        }).catch((err)=>{
            if(err && err.message) {
                client.warn(err.message);
            }
            return <[Uri, number]>[uri, 0];
        });

    }

    function filterKnownByModtime(knownUriArray: Uri[], timestamp) {

        return new Promise<Uri[]>((resolve, reject) => {

            if (!timestamp || knownUriArray.length < 1) {
                resolve(knownUriArray);
            }

            let filtered:Uri[] = [];

            let onResolved = (result:[Uri, number]) => {
                client.info(JSON.stringify([timestamp, ...result]));
                if(result[1] > timestamp) {
                    //was modified since last shutdown
                    filtered.push(result[0]);
                }
                --count;
                if(count < 1) {
                    resolve(filtered);
                } else {
                    let uri = knownUriArray.pop();
                    if(uri){
                        modTime(uri).then(onResolved);
                    }
                }
            }     

            let count = knownUriArray.length;
            knownUriArray = knownUriArray.slice(0);
            let batchSize = Math.min(8, count);
            let uri:Uri;

            while(batchSize-- > 0 && (uri = knownUriArray.pop())) {
                modTime(uri).then(onResolved);
            }

        });

    }

    function forgetMany(uriArray: (Uri | string)[]) {

        return new Promise<void>((resolve, reject) => {

            if (uriArray.length < 1) {
                resolve();
            }

            uriArray = uriArray.slice(0);
            let count = uriArray.length;
            let batchSize = Math.min(8, count);

            let onFulfilled = () => {
                --count;
                if (count < 1) {
                    resolve();
                } else {
                    let uri = uriArray.pop();
                    if (uri) {
                        forgetRequest(uri).then(onFulfilled, onFailed);
                    }
                }
            }

            let onFailed = (msg) => {
                client.warn(msg);
                onFulfilled();
            }

            let uri: Uri | string;
            while (batchSize-- > 0 && (uri = uriArray.pop())) {
                forgetRequest(uri).then(onFulfilled, onFailed);
            }

        });

    }

    export function discover(uriArray: Uri[]) {
        return discoverSymbolsMany(uriArray).then(() => { return discoverReferencesMany(uriArray); });
    }

    export function delayedDiscover(uri: Uri) {
        clearTimeout(delayedDiscoverTimer);
        delayedDiscoverTimer = undefined;
        if (delayedDiscoverUriArray.indexOf(uri) < 0) {
            delayedDiscoverUriArray.push(uri);
        }
        delayedDiscoverTimer = setTimeout(delayedDiscoverFlush, delayedDiscoverDebounceTime);
    }

    export function delayedDiscoverFlush() {
        if (!delayedDiscoverTimer) {
            return;
        }
        clearTimeout(delayedDiscoverTimer);
        delayedDiscoverTimer = undefined;
        discover(delayedDiscoverUriArray);
        delayedDiscoverUriArray = [];
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

        if(uriArray.length < 1) {
            return Promise.resolve<number>(0);
        }

        return new Promise<number>((resolve, reject) => {
            let remaining = uriArray.length;
            let items = uriArray.slice(0);
            let item: Uri;
            let maxOpenFiles = 8;
            let discovered

            let onAlways = () => {
                --remaining;
                let uri = items.pop();
                if (uri) {
                    discoverFn(uri).then(onResolve).catch(onReject);
                } else if (remaining < 1) {
                    resolve(uriArray.length);
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

    function forgetRequest(uri: Uri | string) {
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

    function cachedDocumentsRequest() {
        return client.sendRequest<{timestamp:number, documents:string[]}>(
            cachedDocumentsRequestName
        );
    }

}