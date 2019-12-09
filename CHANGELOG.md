# Change Log

## [1.3.2 - 2019-12-06]

#### Changed
- Relaxed type checking so that it behaves as in 1.2.
- Moved licence key storage from config to global memento.
- Unused catch clause variable diagnostic suppressed.
- removed interbase, wddx, recode from default stubs.
- Changed default file exclude pattern to `**/vendor/**/{Tests,tests}/**` to not exclude framework test classes.

#### Fixed
- False undefined var in arrow functions.
- phpstorm meta not working when map contains empty string key.
- variable type lost when in single if statements.
- False type error expected type callable. Found callable.
- Types not assigned in short array destructure syntax.
- Type inference breaking in logical and/or expression type guards.
- Type inference breaking in yoda conditions.
- Flashing diagnostics in problem tab.
- HTML/JS/CSS language intelligence not working in some files.
- Phpdoc completion above variable creating function docblock.

## [1.3.1 - 2019-12-04]

#### Fixed
- False undefined methods when `__call` and/or `__callStatic` is implemented.
- Arrow functions failing to parse correctly when defined in argument lists.
- Arrow function return type always void.
- Javascript completion not working.
- Union type comparison always failing.
- unary + and - expr should return specific type if possible.

## [1.3.0 - 2019-12-03]

#### Added
- PHP 7.4 support.
- Config to enable/disable diagnostics and diagnostic categories.
- Config to set target PHP version.
- Undefined Type, function, constant, member diagnostic errors.
- Deprecated diagnostic hints.
- Support for running diagnostics `onSave`.
- Auto phpdoc creation. Triggered by `/**`. **PREMIUM**

#### Changed
- HTML/JS/CSS language service moved to server.
- `@global` annotation support removed.
- Improved sorting of suggestions.
- Namespace now shows in completion suggestion label in cases where there are similarly named items.
- `false` and `true` no longer generalised to `bool`.
- Improved type inference. Expressions like `($a)`, `($a === null)`, `($a === false)` now supported. 
- Global or script level variables must be explicitly `include`d or imported with `global`. 
Previously, attempts were made to look up types of script scoped variables always leading to many irrelevant lookups in view files. 
- Undeclared variables are now given a type of `unset` instead of `mixed`.
- Improved merging of declared types and phpdoc types so as to not lose more specific type information.
- Definition requests now use `LocationLink`.
- Updated stubs.
- Type checking is more strict for union types. Previously any type could match, now all types must match.

#### Fixed
- Extra parentheses added when accepting completion suggestion within existing invocation.
- False scalar type errors when `strict_type=1` is not declared in file.
- False type error when object has `_toString` implementation.
- No variables imported from `include` when inside function/method body.
- Variable type lost if assigned in a control expression.
- False undefined variable diagnostic for self referencing anonymous functions.
- False undefined variable diagnostic on left hand side of `??`.
- No completion suggestions when chaining `ArrayAccess`.
- Types getting lost when assigning array elements.
- Empty type when hovering property declaration.
- Completion suggestion types not accurate and different to type seen in hover.
- Type narrowing now considers `die`, `throw`, `exit` as terminating.
- Namespace definition breaking type inference.
- Abstract methods being inferred as `void`.
- Autocomplete adds `\` to `void`
- Heredoc not recognised as string.

## [1.2.3 - 2019-09-04]

#### Fixed
- Premium features not accessible on remotes because outbound https cant be made. 
Activating on a local php project now also activates for remotes.
- Code folding for arrays,
- Hover for anonymous use variables.
- find all references/rename not working for trait/interface methods.
- max file size.

## [1.2.2 - 2019-08-28]

#### Changed
- Removed upgrade notification that showed every day. 
Replaced with a notification that appears once per update that reads 
"Intelephense updated to X.X.X. Click 'Open' to read about the latest features and fixes."
- added upper case __HALT_COMPILER completion as required by phar.
- __HALT_COMPILER is no longer lowercased on format as required by phar.

#### Fixed
- trait adaptation list format indent
- maxSize not respected
- overriden method params with default args losing typing of base method
- mixed html/php format indentation
- __halt_compiler has space inserted between keyword and opening parentheses
- code folding in mixed php/html/js/css not working

## [1.2.1 - 2019-08-22]

#### Added
- additional command palette command to enter licence key.

#### Changed
- Server start notification will show at most once every 24 hours.

#### Fixed
- Rename not detecting anonymous function use variables.

## [1.2.0 - 2019-08-20]

#### Added
* Rename. [PREMIUM](https://intelephense.com)
* Find implementations. [PREMIUM](https://intelephense.com)
* Folding. [PREMIUM](https://intelephense.com)
* Go to declaration. [PREMIUM](https://intelephense.com)
* Go to type definition. [PREMIUM](https://intelephense.com)

#### Fixed
* Various cannot read prop of undefined errors
* Mixed PHP/HTML if else blocks not indenting correctly on format

## [1.1.6 - 2019-08-12]

#### Added
* declare directive completion

#### Changed
* completion suggestion order of symbols with same name changed to local > project > builtin/stub > vendor
* use declarations now added in alphabetical order and after any top level comment, script level doc block, or declare directive.
* signature help no longer shows if inside a deep multiline argument. eg inside a closure that is a function argument.

#### Fixed
* various cannot read prop of undefined errors
* formatter repeatedly adding spaces to some sections of html/js
* auto complete prefixing array type declaration with \
* documentation sometimes shows raw html instead of markdown table
* features stop working for files/folders containing a `.`
* group use declaration list trailing comma
* false unused var/param when used in a member name expression.
* some control structure keywords not being suggested - eg endif, endforeach.
* format enable setting beng ignored.
* false unused use declarations when use declaration is a namespace only.
* auto use decl not creating alias when there is a name clash with a declared class.
* doc block type completion when using union/intersection types
* completion suggestion documentation not showing full documentation of symbol if it is imported.

## [1.1.5 - 2019-07-20]

#### Added
* Telemetry to report anonymous usage and crash data. Use `intelephense.telemetry.enabled` to configure. Inherits from `telemetry.enableTelemetry`.

#### Changed
* jsbeautify 1.10.1
* Diagnostics now refresh after indexing completed and when referenced files are edited.
* Format now aborts if a parse error is encountered.
* compiled with strictNullChecks.
* updated stubs.

#### Fixed
* Trait property member completion.
* Type inferrence when a conditional block with type guard has return statement.
* Type inferrence for properties when used in type guards.
* Bad formatting when HTML embedded in methods.
* Formatter repeatedly indents commented html.
* Preserve indentation on phpdoc markdown code blocks.
* $this shouldnt be suggested when in static context.
* Various read prop of undefined errors.
* Formatter adding spaces before variables in double quoted string.
* Formatter inserting spaces in else keyword if no if statement provided.
* `return` not showing in completion suggestions.

## [1.1.4 - 2019-07-11]

#### Added
* On enter rules for doc blocks.

#### Changed
* Updated stubs.
* vscode-uri 2.0.3

#### Fixed
* Bad formatting in mixed JS/PHP script block -- again.
* Use declaration clause completion not working when typing fully qualified names.
* Single level namespaces not indexing.
* Global var hover sometimes shows multiple identical tag annotations.

## [1.1.3 - 2019-07-09]

#### Changed
* Updated stubs.

## [1.1.2 - 2019-07-09]

#### Changed
* Updated stubs.

#### fixed
* Bad formatting in mixed JS/PHP script block.
* Copy and paste argument inserts a space in front of it.
* False undefined variable for anon. use variables when anon function is in script scope.
* Path intellisense for windows paths.
* Cannot read property codePointAt of undefined.
* False unused variable diagnostics when assigning to array.

## [1.1.1 - 2019-06-27]

#### Changed
* Updated stubs.

## [1.1.0 - 2019-06-27]
#### Added
* Support for PhpDoc intersection types, generic collections, variadic notation, default param args
* File path completion
* Support PHPStorm metadata
* Support .jsbeautifyrc file in project root
* Setting to enable/disable triggering param hints on completion `intelephense.completion.triggerParameterHints`
* Setting to run server with alternate node runtime `intelephense.runtime`
* Setting to control server memory usage `intelephense.maxMemory`
* Setting to declare document root `intelephense.environment.documentRoot`
* Setting to declare include paths `intelephense.environment.includePaths`
* Global scoped variable completion/hover/definition
* Client now webpacked.
* Plain text documentation support.

#### Changed
* updated stubs
* fast-glob 3
* Improved type inferrence when using asserts, instanceof (negation too), and built in function type guards
* improved keyword completion
* x2+ increase in indexing speed

#### Fixed
* Group use declaration formatting
* Range formatting with mixed php/html files
* Formatting removing comments
* False undefined var diagnostics in closures
* Completion not working in anon class argument lists
* Wrong closure signature when inspecting closures that return closures.
* Error when indexing workspace with NTFS junctions
* Auto add group use declaration adding name with backslash
* Unused method diagnostics not considering traits
* Obey LSP client capabilities
* Index workspace now guaranteed to clear cache.
* Various read prop of undefined errors.
* Diagnostics/signature help using overidden base constructor signature.

## [1.0.14 - 2019-04-30]

#### Changed
* Removed mysql from default stubs (can be reenabled by adding `mysql` to `intelephense.stubs` setting).
* Updated stubs.
* didChangeWatchedFiles and didChangeConfiguration now dynamically registered if client has support.
* bundle extension with webpack.
* micromatch 4

#### Fixed
* if statement formatting.
* multi line method header formatting.
* Variable variable false positive diagnostic.
* Diagnose undefined self referencing variables.
* False positive duplicate identifier diagnostics when symbol conditionally declared.
* Various cannot read property of undefined erros.
* Nullable types not displaying correctly in documentation.
* Constant values not showing in documentation.

## [1.0.13 - 2019-04-05]
#### Fixed
* Various formatting fixes
* Various false diagnostic fixes.

## [1.0.12 - 2019-04-04]
#### Fixed
* cant read property type of undefined with variable variable function calls
* ternary expr formatting
* no completion for magic members

## [1.0.11 - 2019-04-03]
#### Fixed
* cant read property values of undefined with built in variables
* doc block formatting

## [1.0.10 - 2019-04-03]
#### Fixed
* Removed console.log

## [1.0.9 - 2019-04-03]
#### Changed
* updated stubs
* improved extension activation time and size by using turndown with minidom instead of jsdom
* jsbeautify 1.9.1
* vscode-languageserver 5.2.1

#### Fixed
* various false diagnostics.
* various get/set of undefined errors.
* not indexing hidden directories.
* bad method declaration completion when nullable types are used.
* extra / inserted on html end tag completion.
* bad type inferrence on array addition
* should not lowercase keywords that are used as class const and methods
* type changes to properties not being tracked.
* classes with __invoke are valid callable args
* overlapping format ranges
* soft reserved names being treated as reserved.
* preserve comment position when inserting use declaration
* handle nullable types in phpdoc
* dont treat downcasting as type error
* allow $this to be typehinted again
* failed to apply changes errors from open doc being prematurely closed
* member modifiers sometimes not showing as completion suggestions
* range formatting adding random spaces in code
* html request forwarding failing for urls with encoded characters
* mixed html/php indentation.

## [1.0.8 - 2019-03-06]
#### Fixed
* defined constants not indexed if define is fully qualified.
* dont grey out method body when identifying unused methods.
* infinite loop when searching for references.
* regression where property types were not inferred from constructor assignment.
* $this type hint being ignored when inferring types.

## [1.0.7 - 2019-03-04]
#### Fixed
* fixed $this type resolution when type checking.
* get property of undefined error on closure array dereference call.

## [1.0.6 - 2019-03-04]
#### Fixed
* fixed compilation routine skipping object creation arg list.

## [1.0.5 - 2019-03-04]
#### Changed
* js-beautifier 1.9

#### Fixed
* various false diagnostics.
* obey tab format options.
* formatting breaks code when close bracket follows a comment.
* crash when attempting to save server state to disk.
* chained function call completion.
* dont store stub references.
* late static binding type inference.
* variable typings lost after assignment in conditional statements.
* intelephense command pallet commands should only be available when language is php.

## [1.0.4 - 2019-02-28]
#### Changed
* updated stub files

#### Fixed
* various false diagnostics
* various set/read of undefined errors
* array dereferencing union type arrays.
* freeze/crash when inferring type of global vars
* global function/constant refs not found when not fully qualified in namespaced code
* maximum file size
* correct spaceship operator return type
* parse error when phpdoc immediately follows else
* empty type when iterating over object in foreach

## [1.0.3 - 2019-02-25]
#### Added
* use cancellation tokens for long running async functions.

#### Fixed
* various read/set property of undefined errors.
* various false diagnostics.
* infinite recursion on circular refs.
* parse bug with dollar curly open ${v}.
* completions with dollar curly open.
* parse error on use decl with backslash prefix causing incorrect symbol data to be sent. 

## [1.0.2 - 2019-02-21]
#### Added
* default exlude globs

#### Fixed
* various read/set property of undefined errors
* fixed Index workspace cmd causing corrupted open document state
* fixed cancel indexing cmd causing crash
* reference transform recursion limit

## [1.0.1 - 2019-02-20]
#### Fixed
* uri/path conversion failing on windows

## [1.0.0 - 2019-02-20]
#### Added
* Undefined vars, unused symbols, type checking, arg count, duplicate definitions diagnostics.
* Go to, completion, highlight, hover, references inside doc blocks.
* HTML/js/CSS formatting in php template files via js-beautify.
* Detailed hover documentation.
* PHP 7.3 support.
* Trait alias and precedence support.
* Compile time constant values.
* `global` and `@global` support.
* `ArrayAccess` and `Iterator` support.
* Added associations and exclude files config.
* Added stub config.
* Added completion resolve provider

#### Changed
* Improved/refactored compilation and type inference.
* Improved/refactored highlight.
* Improved built-in symbol documentation.
* Improved/refactored caching of symbols and indexes.
* Improved/refactored response to file change events.
* Completions now use `TextEdit` interface.
* Document symbols now use `DocumentSymbol` interface.
* Changed licence.
* Anon functions now have more concise name.
* Goto on object creation will send location of constructor _and_ class.
* Format now preserves horizontal whitespace where PSR2 allows.
* Various format changes to match extended PSR2.
* Changed names of several config settings.
* Moved indexing to server.

#### Fixed
* Nested signature help.
* Various parser fixes.
* Variable variables causing outline and symbol search to not work.
* Buggy completions when name starts with keyword.
* `__CLASS__` getting lowercased on format.
* Various PSR2 formatting fixes.
* Variable completion adding extra `$`.

#### Removed
* Add use declaration command (can use tigger suggestions keybinding to auto add use decl).
* Clear cache and reload (cmd is now `Index workspace`).

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
