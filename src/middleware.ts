/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* Copyright (c) Ben Robert Mewburn 
 * Licensed under the MIT Licence.
 */

'use strict';

import {
    Middleware, HandleDiagnosticsSignature, ConfigurationParams, RequestHandler
} from 'vscode-languageclient';
import {
    CancellationToken, workspace, Disposable, Uri,
    Diagnostic, DiagnosticTag
} from 'vscode';

export interface IntelephenseMiddleware extends Middleware, Disposable { }

const DIAGNOSTIC_CODE_UNUSED = 10010;
const DIAGNOSTIC_CODE_DEPRECATED = 10016;

export function createMiddleware(): IntelephenseMiddleware {

    const toDispose: Disposable[] = [];
    
    function addDiagnosticTags(diagnostics:Diagnostic[]) {
        let d:Diagnostic;
        for(let n = 0, l = diagnostics.length; n < l; ++n) {
            d = diagnostics[n];
            if(d.code === DIAGNOSTIC_CODE_UNUSED) {
                d.tags = [DiagnosticTag.Unnecessary];
            } else if (d.code === DIAGNOSTIC_CODE_DEPRECATED) {
                d.tags = [DiagnosticTag.Deprecated];
            }
        }
        return diagnostics;
    }

    function mergeAssociations(intelephenseAssociations:string[]) {
        let vscodeAssociations = workspace.getConfiguration('files').get('associations') || { };
        let associationsSet = new Set<string>(intelephenseAssociations);
        for(let [key, val] of Object.entries(vscodeAssociations)) {
            if(val === 'php') {
                associationsSet.add(key);
            }
        }
        return Array.from(associationsSet);
    }

    function mergeExclude(intelephenseExclude:string[], resource?:string) {
        let resourceUri:Uri;
        if(resource) {
            resourceUri = Uri.parse(resource);
        }
        let vscodeExclude = workspace.getConfiguration('files', resourceUri || null).get('exclude') || { };
        let excludeSet = new Set<string>(intelephenseExclude);
        for(let [key, val] of Object.entries(vscodeExclude)) {
            if(val) {
                excludeSet.add(key);
            }
        }
        return Array.from(excludeSet);
    }

    let middleware = <IntelephenseMiddleware>{
        workspace: {
            configuration: (
                params: ConfigurationParams, 
                token: CancellationToken, 
                next: RequestHandler<ConfigurationParams, any[], void>
            ) => {
                
                let result = next(params, token);
                if(!isThenable(result)) {
                    result = Promise.resolve(result);
                }

                return (<Thenable<any>>result).then(r => {
                    if(Array.isArray(r)) {
                        r.forEach((v, i) => {
                            if(v && v.files && v.files.associations) {
                                v.files.associations = mergeAssociations(v.files.associations);
                            }
                            if(v && v.files && v.files.exclude) {
                                v.files.exclude = mergeExclude(v.files.exclude, params.items[i].scopeUri);
                            }
                            if(v && v.telemetry === null) {
                                v.telemetry.enabled = workspace.getConfiguration('telemetry').get('enableTelemetry');
                            }
                        });
                    }
                    return r;
                });
            }
        },

        handleDiagnostics: (uri: Uri, diagnostics: Diagnostic[], next: HandleDiagnosticsSignature) => {
            next(uri, addDiagnosticTags(diagnostics));
        },

        dispose: Disposable.from(...toDispose).dispose
    }

    return middleware;

}

function isThenable(obj: any) {
    return obj && obj.then !== undefined;
}
