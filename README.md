# Intelephense

PHP code intelligence for Visual Studio Code.

Intelephense is a high performance PHP language server packed full of essential features for productive PHP development. 

* Fast camel/underscore case **code completion (IntelliSense)** for document, workspace and built-in symbols and keywords with automatic addition of use declarations.
* Detailed **signature (parameter) help** for document, workspace and built-in constructors, methods, and functions.
* Rapid workspace wide **go to definition** support.
* Workspace wide **find all references**.
* Fast camel/underscore case **workspace symbol search**.
* Full **document symbol search** that also powers **breadcrumbs** and **outline** UI.
* Multiple **diagnostics** for open files via an error tolerant parser and powerful static analysis engine.
* Lossless PSR-12 compatible **document/range formatting**. Formats combined HTML/PHP/JS/CSS files too. 
* Embedded **HTML/JS/CSS code intelligence**.
* Detailed **hover** with links to official PHP documentation.
* Smart **highlight** of references and keywords.
* Advanced PHPDoc type system supporting **templates and callable signatures**.
* Reads **PHPStorm metadata** for improved type analysis and suggestions.
* Easy **rename** of symbols. When appropriate, files/folders are automatically renamed too. [PREMIUM](https://intelephense.com)
* Accurate **code folding** of definitions, blocks, use declarations, heredoc, comments, and custom regions. [PREMIUM](https://intelephense.com)
* Quickly **find all implementations** of interfaces and abstract classes and associated methods. [PREMIUM](https://intelephense.com)
* Fast **go to type definition** of typed variables and parameters. [PREMIUM](https://intelephense.com)
* Fast **go to declaration** for methods implementing an interface or abstract method declaration. [PREMIUM](https://intelephense.com)
* Configurable **auto PHPDoc** creation that infers return types and identifies thrown exceptions. [PREMIUM](https://intelephense.com)
* Syntax tree driven **smart select** to intelligently expand/shrink selection. [PREMIUM](https://intelephense.com)
* Helpful **code actions** to import symbols, add PHPDoc, and implement all abstract methods. [PREMIUM](https://intelephense.com)

## Licence
Purchase a licence at https://intelephense.com to access PREMIUM features. Licence keys grant a single user access to all current and future premium features on multiple devices _forever_. Licence keys must be activated (automatically) via https before use. Features not marked as PREMIUM are free and always will be free.

The language server client (vscode-intelephense) is open source and licensed under the MIT licence. 

The language server (intelephense) is proprietary. Please see [here](https://github.com/bmewburn/vscode-intelephense/blob/master/LICENSE.txt#L29) for details.

## Quick Start

1. Disable the built-in VSCode PHP Language Features. 
    
    * Go to `Extensions`.
    * Search for `@builtin php`
    * Disable `PHP Language Features`. Leave `PHP Language Basics` enabled for syntax highlighting.

    Note that other (3rd party) PHP extensions which provide similar functionality should also be disabled for best results.
2. Add glob patterns for non standard php file extensions to the `files.associations` setting.

    For example: `"files.associations": { "*.module": "php" }`.
3. Optionally purchase and enter your [licence key](https://intelephense.com) by opening the command pallete 
-- `ctrl + shift + p` -- and searching for `Enter licence key`.

Further configuration options are available in the `intelephense` section of settings.

## Support

Try the [Intelephense Documentation](https://github.com/bmewburn/intelephense-docs).

Found a bug? Got a feature request? [Create an issue](https://github.com/bmewburn/vscode-intelephense/issues).

## Acknowledgements

A big thank you to supporters who have bought a premium licence and have enabled the continued development and maintenance of this extension.

Intelephense uses the following open source libraries. Please see the following links for source code and licences.
* [vscode-languageserver-node](https://github.com/Microsoft/vscode-languageserver-node)
* [micromatch](https://github.com/micromatch/micromatch)
* [fs-extra](https://github.com/jprichardson/node-fs-extra)
* [fast-glob](https://github.com/mrmlnc/fast-glob)
* [lru-cache](https://github.com/isaacs/node-lru-cache)
* [turndown](https://github.com/domchristie/turndown)
* [protobufjs](https://github.com/dcodeIO/ProtoBuf.js/)
* [phpstorm-stubs](https://github.com/JetBrains/phpstorm-stubs)
* [js-beautify](https://github.com/beautify-web/js-beautify)
* [vscode-uri](https://github.com/microsoft/vscode-uri)
* [vscode-html-languageserver](https://github.com/vscode-langservers/vscode-html-languageserver)
