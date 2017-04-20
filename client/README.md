# Intelephense

Welcome to Intelephense! **[BETA](https://github.com/bmewburn/intelephense/issues)**

A high performance and feature rich PHP language server implemented in Typescript. This extension offers:

* Fast fuzzy matching completion (IntelliSense), offering detailed suggestions for document, workspace and built-in symbols and keywords.
* Detailed signature help for workspace and built-in constructors, methods, and functions.
* Rapid workspace wide go to definition support.
* Fast fuzzy workspace symbol search.
* Full document symbol search.
* Multiple parse error diagnostics for open files via an error tolerant parser.
* More to come ...

Your feedback, bug reports and help are appreciated and can be filed in the repository found at https://github.com/bmewburn/intelephense. The PHP parser used by the extension can be found at https://github.com/bmewburn/php7parser.

## Configure
1. Turn off the `php.suggest.basic` setting for best results. It is recomended to keep the vscode built-in php linter enabled for the time being as the Intelephense parser does not identify all compile time errors.
2. Add files you do not require intelligence on to the `files.exclude` setting. Reducing the number of unecessary files read will improve the user experience through increased performance and more appropriate intelligence. For example, dependencies of dependencies can be excluded, as can any tests that are included in the dependency source.
3. Add any non-standard php file extensions in use to the `files.associations` setting.

## Acknowledgements

* The Microsoft vscode team for vscode and vscode-languageserver-node.