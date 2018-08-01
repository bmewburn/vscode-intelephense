/* Copyright (c) Virion.IT Mikołaj Milewski
 * Licensed under the ISC Licence.
 */
'use strict';

import {
	TextDocument, commands, Position, CancellationToken,
    CodeLensProvider, CodeLens, SymbolInformation, SymbolKind, Location
} from 'vscode';

export class ReferencesCodeLens extends CodeLens {
    constructor(
        public document: TextDocument,
        public symbol: SymbolInformation
    ) {
        super(symbol.location.range);
    }
}

export class ReferencesCodeLensProvider implements CodeLensProvider {
    async provideCodeLenses(document: TextDocument, token: CancellationToken): Promise<CodeLens[]> {
        return new Promise<CodeLens[]>(resolve => {
            commands
                .executeCommand<SymbolInformation[]>('vscode.executeDocumentSymbolProvider', document.uri)
                .then(symbols => {
                    resolve(
                        (typeof symbols == 'undefined')
                            ? []
                            : symbols
                                .filter(symbol =>
                                    (
                                        (symbol.kind == SymbolKind.Interface) ||
                                        (symbol.kind == SymbolKind.Class) ||
                                        (symbol.kind == SymbolKind.Method)
                                    ) &&
                                    !document.lineAt(symbol.location.range.start.line).text.toLowerCase().trim().startsWith('use ')
                                )
                                .map(symbol => new ReferencesCodeLens(document, symbol))
                        );
                });
        });
    }

    resolveCodeLens(codeLens: ReferencesCodeLens, token: CancellationToken): Thenable<CodeLens> {
        codeLens.command = {
            title: '0 references',
            command: ''
        };

		return new Promise<CodeLens>((resolve, reject) => {
            let start = codeLens.symbol.location.range.start;
            let index = codeLens.document.lineAt(start.line).text.indexOf(codeLens.symbol.name, start.character);

            if (index == -1) {
                resolve(codeLens);
                return;
            }

            let position = new Position(start.line, start.character + index);
            commands.executeCommand<Location[]>('vscode.executeReferenceProvider', codeLens.document.uri, position).then(locations => {
                locations = locations.filter(location => location.range.start.line != codeLens.symbol.location.range.start.line);
                if (locations.length > 0) {
                    codeLens.command = {
                        title: locations.length + ' reference' + (locations.length > 1 ? 's' : ''),
                        command: 'editor.action.showReferences',
                        arguments: [codeLens.document.uri, position, locations]
                    };
                }

                resolve(codeLens);
            });
        });
    }
}