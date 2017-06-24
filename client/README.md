# Intelephense

Welcome to Intelephense!

A high performance and feature rich PHP language server implemented in Typescript. This extension offers:

* Fast fuzzy matching code completion (IntelliSense), offering detailed suggestions for document, workspace and built-in symbols and keywords.
* Detailed signature help for document, workspace and built-in constructors, methods, and functions.
* Rapid workspace wide go to definition support.
* Fast fuzzy workspace symbol search.
* Full document symbol search.
* Multiple parse error diagnostics for open files via an error tolerant parser.
* Lossless PSR-2 compatible document and range formatting.
* Convenient command to add use declarations and condense referenced names.
* HTML language mode support allowing for a full HTML/Javascript/CSS/PHP development experience.
* [More to come ...](https://github.com/bmewburn/intelephense/issues)

Intelephense is under active development. [Contributions](https://github.com/bmewburn/intelephense/blob/master/CONTRIBUTING.md) in the form of bug reports, feature requests and pull requests are most welcome.

##### HTML Language Mode
Intelephense works in HTML language mode as well so you get a great development experience when editing your HTML/JS/CSS/PHP view files. There are a still a few quirks to be addressed. PHP syntax colouring whilst in HTML mode is not available and formatting is a multi-step process (format HTML -> switch to PHP mode -> format PHP).

## Configuring

1. Turn off the `php.suggest.basic` setting for best results. It is recommended to keep the vscode built-in php linter enabled for the time being as the Intelephense parser does not identify all compile time errors.
2. Add files you do not require intelligence on to the `files.exclude` setting. Reducing the number of unecessary files read will improve user experience through increased performance and more appropriate intelligence.
3. Add any non-standard php file extensions in use to the `files.associations` setting.

## Acknowledgements

* The Microsoft vscode team for vscode and vscode-languageserver-node.