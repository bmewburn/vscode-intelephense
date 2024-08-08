/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* Copyright (c) Ben Robert Mewburn 
 * Licensed under the MIT Licence.
 */

'use strict';

import {
    Middleware, HandleDiagnosticsSignature, ConfigurationParams, RequestHandler,
    CodeLens, Location as ILocation, Position as IPosition
} from 'vscode-languageclient';
import {
    CancellationToken, workspace, Disposable, Uri,
    Diagnostic, DiagnosticTag,
    Command,
    Position,
    Location,
    Range,
    CodeLens as VCodeLens
} from 'vscode';

export interface IntelephenseMiddleware extends Middleware, Disposable { }

export function createMiddleware(): IntelephenseMiddleware {

    const toDispose: Disposable[] = [];

    function mergeAssociations(intelephenseAssociations: string[]) {
        let vscodeConfig = workspace.getConfiguration('files');
        if (!vscodeConfig) {
            return intelephenseAssociations;
        }
        let vscodeAssociations = vscodeConfig.get('associations') || {};
        let associationsSet = new Set<string>(intelephenseAssociations);
        for (let [key, val] of Object.entries(vscodeAssociations)) {
            if (val === 'php') {
                associationsSet.add(key);
            }
        }
        return Array.from(associationsSet);
    }

    function mergeExclude(intelephenseExclude: string[], resource?: string) {
        let resourceUri: Uri;
        if (resource) {
            resourceUri = Uri.parse(resource);
        }
        let vscodeConfig = workspace.getConfiguration('files', resourceUri || null);
        if (!vscodeConfig) {
            return intelephenseExclude;
        }
        let vscodeExclude = vscodeConfig.get('exclude') || {};
        let excludeSet = new Set<string>(intelephenseExclude);
        for (let [key, val] of Object.entries(vscodeExclude)) {
            if (val) {
                excludeSet.add(key);
            }
        }
        return Array.from(excludeSet);
    }

    function mergeSettings(settings: any[], configurationParams: ConfigurationParams): any[] {
        settings.forEach((v, i) => {
            if (v && v.files && v.files.associations) {
                v.files.associations = mergeAssociations(v.files.associations);
            }
            if (v && v.files && v.files.exclude) {
                v.files.exclude = mergeExclude(v.files.exclude, configurationParams.items[i].scopeUri);
            }
            if (v && v.telemetry === null) {
                let vscodeConfig = workspace.getConfiguration('telemetry');
                if (vscodeConfig) {
                    v.telemetry.enabled = vscodeConfig.get('enableTelemetry', true);
                }
            }
            if (v && v.diagnostics && v.diagnostics.run === null) {
                let vscodeConfig = workspace.getConfiguration('php.validate');
                if (vscodeConfig) {
                    v.diagnostics.run = vscodeConfig.get('run', 'onType');
                }
            }
        });
        return settings;
    }

    function transformCodeLensResolveResult(lens: CodeLens): CodeLens {

        if (
            lens.command &&
            lens.command.command === 'editor.action.peekLocations' &&
            lens.command.arguments
        ) {
            if (typeof lens.command.arguments[0] === 'string') {
                lens.command.arguments[0] = Uri.parse(lens.command.arguments[0]);
            }

            if (IPosition.is(lens.command.arguments[1])) {
                lens.command.arguments[1] = new Position(lens.command.arguments[1].line, lens.command.arguments[1].character);
            }

            if (Array.isArray(lens.command.arguments[2])) {
                lens.command.arguments[2] = lens.command.arguments[2].map(
                    l => ILocation.is(l)
                        ? new Location(
                            Uri.parse(l.uri),
                            new Range(new Position(l.range.start.line, l.range.start.character), new Position(l.range.end.line, l.range.end.character))
                        )
                        : l
                );
            }
        }
        console.log('transformCodeLensResolveResult');
        return new VCodeLens(
            new Range(new Position(lens.range.start.line, lens.range.start.character), new Position(lens.range.end.line, lens.range.end.character)), 
            lens.command
        );
    }

    let middleware = <IntelephenseMiddleware>{
        workspace: {
            configuration: (
                params: ConfigurationParams,
                token: CancellationToken,
                next: RequestHandler<ConfigurationParams, any[], void>
            ) => {

                let result = next(params, token);
                if (!isThenable(result)) {
                    return Array.isArray(result) ? mergeSettings(result, params) : result;
                }

                return (<Thenable<any>>result).then(r => {
                    return Array.isArray(result) ? mergeSettings(result, params) : result;
                });
            }
        },
        resolveCodeLens: (codeLens, token, next) => {
            let result = next(codeLens, token);
            if (!isThenable(result)) {
                return result ? transformCodeLensResolveResult(result) : result;
            }
            return result.then(r => r ? transformCodeLensResolveResult(r) : r);
        },

        dispose: Disposable.from(...toDispose).dispose
    }

    return middleware;

}

function isThenable(obj: any): obj is Thenable<any> {
    return obj && obj.then !== undefined;
}
