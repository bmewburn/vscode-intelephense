# Intelephense

### Support via [Patreon](https://www.patreon.com/bmewburn) | [PayPal](https://www.paypal.me/bmewburn)

Welcome to Intelephense!

Intelephense is a high performance and feature rich PHP language server offering:

* Fast camel/underscore case **code completion (IntelliSense)**. Offering detailed suggestions for document, workspace and built-in symbols and keywords. Automatic addition of use declarations.
* Detailed **signature (parameter) help** for document, workspace and built-in constructors, methods, and functions.
* Rapid workspace wide **go to definition** support.
* Workspace wide **find all references**.
* Fast camel/underscore case **workspace symbol search**.
* Full **document symbol search** that also powers **breadcrumbs** and **outline** UI.
* Multiple **diagnostics** for open files via an error tolerant parser and powerful static analysis engine.
* Lossless [PSR-12](https://github.com/php-fig/fig-standards/blob/master/proposed/extended-coding-style-guide.md) compatible document and **range formatting**. Will format combined HTML/PHP/JS/CSS files too. 
* HTML request forwarding allowing for a **full HTML/Javascript/CSS/PHP development experience**.
* Detailed **hover** with links to official PHP documentation.
* Smart **highlight** of references and keywords.
* Reads PHPStorm metadata.

_This extension may conflict with other PHP extensions which provide similar functionality. Should you experience duplicate suggestions, incorrect results and/or poor performance, try disabling other extensions first before reporting an issue. Disabling the built-in VSCode PHP Language Features is recommended. Please check the configuration section for language server options._

## Licence
The language server client (vscode-intelephense) is open source and licensed under the MIT licence. The language server (intelephense) is proprietary. Please see [here](https://github.com/bmewburn/vscode-intelephense/blob/master/LICENSE.txt#L29) for details.

## Acknowledgements

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
