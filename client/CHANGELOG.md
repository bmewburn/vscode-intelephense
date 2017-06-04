# Change Log

## [0.7.0] - TBA
#### Added
* PSR2 compatible, lossless document and range formatting.
* Index cache.
* Add use declaration command.
* Expand to fully qualified name command.
* Indexing of constants declared with define(). 

#### Changes
* Various completion suggestion improvements

#### Fixed
* Conflicts with docBlocker extension
* Complex string parsing
* null coalesce expr type resolution

## [0.6.10] - 2017-0-30
#### Fixed
* Errors with variable completion inside anon.functions

## [0.6.9] - 2017-04-23
#### Fixed
* Use group declaration parse bug
* Heredoc parse bug

## [0.6.8] - 2017-04-21
#### Fixed
* Crash when encountering parse error on namespace use
* Traits mangling parse tree (php7parser)

#### Dependencies
* intelephense 0.6.8

## [0.6.7] - 2017-04-21
#### Dependencies
* intelephense 0.6.7 (php7parser)

## [0.6.6] - 2017-04-21
#### Added 
* Sorting of fuzzy symbol matches

#### Fixed
* Diagnostics being reported on wrong file.
* Document becoming out of sync when applying multiple changes
* Variable types not resolving in various contexts.

#### Dependencies
* intelephense 0.6.6

## [0.6.5] - 2017-04-20
#### Changed
* Shortened name completion item labels to name without namespace prefix.
* Shortened method override/implementation completion labels to just method name.
* Reduced completion spam for extends and implements contexts.
* Rolled back indexing on fqn parts.

#### Fixed
* Use directives from other files showing as completion items

#### Dependencies
* intelephense 0.6.5

## [0.6.4] - 2017-04-19
#### Added
* Detail on variable and constructor completion items.
* Indexing on fqn parts.

#### Fixed
* Variable types not resolving when on rhs of assignment
* Infinite recursion on cyclical inheritance
* Sort order of backslash prefixed completions

#### Dependencies
* intelephense 0.6.4

## [0.6.2] - 2017-04-18
#### Fixed
* Completion provider fixes and tweaks.
* Definition provider go to property fix.

#### Dependencies
* intelephense 0.6.2

## [0.6.1] - 2017-04-17
#### Added
* Document symbols provider
* Workspace symbols provider
* Type definition provider
* Signature help provider
* Diagnostics provider
* Completion provider
