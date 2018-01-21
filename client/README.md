# Intelephense

### [Support on Patreon](https://www.patreon.com/bmewburn)

Welcome to Intelephense!

A high performance and feature rich PHP language server implemented in Typescript. This extension offers:

* Fast camel/underscore case code completion (IntelliSense), offering detailed suggestions for document, workspace and built-in symbols and keywords.
* Detailed signature (parameter) help for document, workspace and built-in constructors, methods, and functions.
* Rapid workspace wide go to definition support.
* Workspace wide find all references.
* Fast camel/underscore case workspace symbol search.
* Full document symbol search.
* Multiple parse error diagnostics for open files via an error tolerant parser.
* Lossless PSR-2 compatible document and range formatting.
* Convenient command to add use declarations and condense referenced names.
* HTML request forwarding allowing for a full HTML/Javascript/CSS/PHP development experience.
* Hover, highlight + [more to come ...](https://github.com/bmewburn/intelephense/issues)

Intelephense is under active development. [Contributions](https://github.com/bmewburn/intelephense/blob/master/CONTRIBUTING.md) in the form of bug reports, feature requests and pull requests are most welcome.

## Configuring

1. Turn off the `php.suggest.basic` setting for best results. It is recommended to keep the vscode built-in php linter enabled for the time being as the Intelephense parser does not identify all compile time errors.
2. Add files you do not require intelligence on to the `files.exclude` setting. Reducing the number of unecessary files read will improve user experience through increased performance and more appropriate intelligence.
3. Add any non-standard php file extensions in use to the `files.associations` setting.

## Acknowledgements

* The Microsoft vscode team for vscode and vscode-languageserver-node.
