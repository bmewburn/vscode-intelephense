# Change Log

## [0.8.8] - 2018-02-13
#### Fixed
* Signature help showing ouside of ()
* Dynamic variable formatting

## [0.8.6] - 2018-02-11
#### Changed
* Improvements to completion suggestions when typing FQNs

#### Fixed
* Signature help not returning a result when in method
* Incorrect parse error with <?= expression lists
* Constructor completion
* Handle undefined range in TextDocumentContentChangeEvent
* lowercase true, false, null
* -> static methods

## [0.8.5] - 2018-01-06
#### Changed
* Removed debug option in favour of trace

#### Fixed
* !== format bug
* crash on merge conflict marker
* workspace activation event

## [0.8.4] - 2017-12-17
#### Added
* @method static support

#### Changed
* Dont use snippet or trigger param hints in completion if function/method/constructor has no params
* Use DocumentHighlightKind.read for highlights
* Make private members workspace searchable
* Allow utf8 names
* Backslash prefix default is now false
* `*.php` always included when finding php files.

#### Fixed
* Various PSR2 formatting fixes
* Various keyword completions in class header and body
* Completion item sortText
* Crash relating to anon functions used without assignment
* Import symbol edits existing use decl

## [0.8.2] - 2017-11-18
#### Added
* Completions for trait names in use trait clauses.

#### Fixed
* Case where private and protected members not suggested inside last function in class
* Crash when no storagePath available
* References not found after first call to reference provider.
* Incorrect symbol kind for built in class constants causing completion crash.
* Fix member completions inside instanceof type guard.

## [0.8.1] - 2017-11-13
#### Fixed
* Improved error handling when reading and writing to cache
* use JSONStream for reading/writing large arrays
* completions for static members with static keyword.
* default public members
* global inbuilt variable completions 
* crash when forwarding to html server

## [0.8.0] - 2017-11-05
#### Added
* Reference provider
* hover provider
* highlight provider
* Auto add use declarations on completion and associated config option
* Config to enable/disable formatting
* Config to enable/disable backslash prefix of global functions and constants
* Invoke param hints on method/function completion
* phpdoc inheritance
* multi root workspace support
* html request forwarding

#### Changed
* Up to 4 fold improvement in parsing speeds
* Return multiple locations for go to defintion when applicable
* Improved type resolution for phpdoc static and $this
* Caching moved from client to server

#### Fixed
* Extra lines and spaces repeatedly added when formatting
* Various PSR2 format fixes
* Completions within closures
* Go to defintion for defines

#### Dependencies
* Intelephense 0.8.0

## [0.7.2] - 2017-07-03
#### Fixed
* Error on signature help for function with no params
* Format weirdness after comments
* Parse error on unset cast
* Workspace discover errors when textDocument is undefined.

#### Dependencies
* Intelephense 0.7.2

## [0.7.1] - 2017-06-25
#### Fixed
* Crash when reading anon. classes.

#### Dependencies
* Intelephense 0.7.0 

## [0.7.0] - 2017-06-24
#### Added
* PSR2 compatible, lossless document and range formatting.
* Index cache.
* Add use declaration command.
* Indexing of constants declared with define().
* HTML language mode support allowing full HTML/Javascript/CSS/PHP dev experience.

#### Changed
* Improved completions when a use declaration is available.

#### Fixed
* Conflicts with docBlocker extension
* Conflicts with local history extension
* Complex string parsing
* null coalesce expr type resolution
* Cleaned up built-in symbol definitions

#### Dependencies
* Intelephense 0.7.0

## [0.6.10] - 2017-04-30
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
