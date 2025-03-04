# Change Log

## [1.14.3 - 2025-03-05]

#### Fixed
- Spurious parser errors when editing adjacent to `if` or `try` blocks.

## [1.14.2 - 2025-03-01]

#### Fixed
- Spurious parser errors when editing mixed html/php containing short echo tags.
- False not all paths return a value with try/finally.
- False method compatibility error when overriding a method with optional parameters with a method with a variadic parameter.

## [1.14.1 - 2025-02-28]

#### Fixed
- RangeError invalid array length.

## [1.14.0 - 2025-02-28]

#### Added
- Templated definitions for `array_find`, `array_find_key`, `array_any`, `array_all`, `uasort`, `uksort`, `array_walk`, `array_walk_recursive`.
- Array shape key completion suggestions in return statement, function/method argument, destructuring contexts.
- `default` added to keyword completion suggestions in match expr.
- Property declaration name suggestions generated from type declaration and from base class.
- Support insert and replace completion suggestion ranges.
- Completion suggestion for type definition name based on file name.
- Completion suggestion for namespace based on file and composer.json.

#### Changed
- Updated stubs
- PHPDoc for variadic params where the ellipsis (`...`) has been omitted and the type is an array are now considered to describe the type of the parameter within the function body, not the type being passed to the function.
- Passing names of PHP non-object built-in types (eg `string`, `int`) to a function that expects `class-string<T>` now resolves `T` to that built-in type instead of a user class with that name.
- Expanded variety of parameter declaration name suggestions to include snake case and shorter name variations.

#### Fixed
- Cannot `@disregard` diagnostics on property declarations.
- Return type diagnostics in traits.
- False return type error in generator.
- Property type inference when redundant `SubClass|SuperClass` scope types encountered.
- Type narrowing with null coalesce assignment in conditional expression.
- False type error when assigning `$this` to property.
- Array type lost when assigning empty array to multidimensional array element.
- False unused method diagnostic when method called in `$this instanceof` conditional block.
- `list<>` key should be `int` not `int|string`.
- False method compatibility error when override declares variadic parameter.
- Range format provider should format token and leading trivia if only leading trivia falls in range.
- Named argument completion suggestions should not be case sensitive.
- Should consider composer.json autoload-dev when generating file renames.

## [1.13.1 - 2024-12-30] Pre-release

#### Fixed
- False parse errors when editing open tags and `intelephense.environment.shortOpenTag` is enabled.
- Default PHP version should be 8.4.
- Missing `frakenphp` from stubs enum.
- False implicit nullable parameter diagnostic when type is `mixed`.
- False abstract not allowed error for PHP8.4 abstract properties.
- Union of `Traversable` and empty array losing traversable template type.

## [1.13.0 - 2024-12-17] Pre-release

#### Added
- PHP 8.4 class member access on instantiation without parentheses.
- PHP 8.4 property hooks.
- PHP 8.4 asymmetric visibility.
- PHP 8.4 deprecated diagnostic for implict nullable parameters.
- Support `@mixin` template types. This improves type inference when using Laravel 11.
- `intelephense.diagnostics.memberAccess` setting that controls whether to show diagnostics relating to member access. Defaults to `true`.

#### Changed
- Default PHP version now 8.4.
- Updated stubs.
- Parent and Overrides code lens no longer shown above methods that have no parent or overrides to reduce clutter.

#### Fixed
- Crash when parsing phpdoc with conditional type containing newlines.
- `Traversable` not treated as covariant to `iterable`.
- Incorrect types for some `$_SERVER` elements.
- Enums not recognised as implementations of interfaces.
- Incorrect parse error for empty heredoc.
- Type not narrowed when using nullsafe operator.
- Template types not resolved for `__invoke`.
- Go to type definition not working for foreach value.
- Incorrect formatting of comments above `default` in match expression.
- False method signature diagnostics when using older versions of PHP.
- Variable type incorrectly inferred as `never` inside while loops with logical conditional expression.
- False readonly property error when initialising trait declared property in exhibiting class.
- Bad range formatting when selecting part of a multiline call chain.
- Template types not resolved when passing `Iterator` to `iterable` constraint.

## [1.12.6 - 2024-09-09]

#### Fixed
- Template types incorrect when implementing `Iterator`.
- `Traverable` template types lost.
- `assert` not working when fully qualified.
- False `unset` variables after logical expression when using `or` operator.
- No completion suggestions for variables declared in array destructure.
- Don't reduce function return types to minimal type as eagerly.
- False unused symbol diagnostic for promoted property with no visibility modifier.

## [1.12.5 - 2024-08-29]

#### Fixed
- Performance issue with large arrays. Array shapes are now only generated internally on arrays with 20 or less elements.
- Go to type definition not working when origin is an assignment expression.
- Type lost when built in constants `true`, `false`, and `null` are prefixed with backslash.
- `static` as a template type argument resolving to wrong type.
- False method signature compatibility errors for built-in PHP symbols when targeting PHP versions < 8.1.
- Incorrect and cut-off completion suggestions when triggered by `use` inside a top level anonymous function.
- Don't eagerly reduce unions when substituting templated types.
- False return type error diagnostics when calling templated parent methods. 

## [1.12.4 - 2024-08-19]

#### Fixed
- Parameter type showing `unset` for anonymous functions declared within an unpacked array.
- Callable signatures with `static` typed parameter losing template type args.
- Parameter type showing `unset` for anonymous functions declared within an anonymous class header.
- Licence key not syncing across machines in VSCode.

## [1.12.3 - 2024-08-13]

#### Fixed
- Hover, go to definition not working on phpdoc `@see` FQSEN. 
- Callable signatures with `static` typed parameter resolving to incorrect type.
- Type inference within `for` statements with no control expression.
- Should not do additional type checks on variables that have `unset` type.
- Variables with type `null` not taking on by ref parameter type when passed as argument.
- Anonymous function parameters showing as undefined when function declared inside array.
- Variables assigned to in `try` block have type `unset` in `catch` clause.

## [1.12.2 - 2024-08-08]

#### Fixed
- Added missing code lens middleware
- TypeError: Cannot read properties of undefined (reading 'scopeTypeDefinition')

## [1.12.1 - 2024-08-08]

#### Fixed
- Added missing code lens settings.

## [1.12.0 - 2024-08-08]

See 1.11.x Pre-Release

#### Added
- Code lens for references, abstract/interface implementations, trait usages, method overrides, method parent. Code lenses are disabled by default and can be enabled by setting the `intelephense.codeLens.references.enable`, `intelephense.codeLens.implementations.enable`, `intelephense.codeLens.usages.enable`, `intelephense.codeLens.overrides.enable`, `intelephense.codeLens.parent.enable` settings to `true` respectively. **[Premium](https://intelephense.com)**
- Find all references for `__construct`. 
- Object shape property hover.

#### Changed
- Built in array function stubs now have templated definitions.
- Improved DOMNodeList::getIterator stub

#### Fixed
- Comparing class-string in conditional return yielding incorrect type when subject is subtype of test type.
- No type inference and false undefined property when accessing property of intersection type with object shape component.
- `@internal` annotation missing description in hover.

## [1.11.8 - 2024-08-01] **Pre-Release**

#### Fixed
- Lost variable types after `xor` expr;

## [1.11.7 - 2024-07-30] **Pre-Release**

#### Changed
- Reducing to minimal union types is now less eager.

#### Fixed
- False undefined class constant in unreachable code.
- Cannot read properties of undefined (reading 'length') intelephense.js:2:2322561

## [1.11.6 - 2024-07-29] **Pre-Release**

#### Added
- Handle phpstan call site variance syntax.

#### Changed
- Template types and metadata return types will no longer resolve to an argument type of `never` in order to prevent code being unintentionally marked unreachable following function/method calls.
- Undefined property diagnostic now suppressed in `isset`, `empty`, `unset`, LHS of null coalesce to match PHP behaviour.
- Type check of LHS of property access expression suppressed in `isset`, `empty`, `unset`, LHS of null coalesce to match PHP behaviour.

#### Fixed
- `float` parameter should permit `int` as argument.
- Type inference with `null` equality comparison.
- Undefined variables not diagnosed inside closure.
- False undefined method diagnostics with templated parameters.
- Auto import function adding unnecessary `function` keyword when in group use list.
- Variable type becoming mixed when passed by ref in closure use clause.
- Circular reference problem when trait has `@mixin` of the same class that exhibits it.
- False argument count error when trait provides implementation for an interface and gives params default args.
- Unable to override variable type with `@var` if RHS of assignment contains closure.

## [1.11.5 - 2024-07-07] **Pre-Release**

#### Fixed
- Various control flow analysis issues.
- Performance and type inference issues with array read/writes.
- Type inference following `yield` expression.
- False type error when unpacking templated type.

## [1.11.4 - 2024-07-04] **Pre-Release**

#### Fixed
- Invalid Argument Error e.toLspSymbolKind lib/intelephense.js:2:3058335

## [1.11.3 - 2024-07-04] **Pre-Release**

#### Fixed
- Laravel eloquent builder queries losing model type.
- Template mapping between class with a base class method.
- Cannot read properties of undefined (reading 'length') when encountering attributed property declared with `var`.

## [1.11.2 - 2024-07-03] **Pre-Release**

#### Fixed
- Type inference for properties with default initialisers.
- Performance degradation in code with many array read and writes.
- False undefined variable after `while` loop with condition expression that resolves to `true` literal type.
- Stack overflow when applying large text edits.

## [1.11.1 - 2024-07-02] **Pre-Release**

#### Changed
- When a trait has an annotated or abstract method and the real method definition is supplied by a base class, then go to definition will now go to the base class definition instead of the trait method declaration.
- Go to implementations now includes implementations provided by a trait where a class both uses the trait and implements the interface.

#### Fixed
- False diagnostic when type `class-string` passed to `string` constraint.
- Setting `completion.suggestObjectOperatorStaticMethods` should be `intelephense.completion.suggestObjectOperatorStaticMethods`.
- Crash when parsing incomplete phpdoc type with template type args.
- Crash when encountering `trigger_error` call with `E_USER_ERROR` as argument.
- Conditional return types with default parameter argument.

## [1.11.0 - 2024-06-29] **Pre-Release**

#### Added
- Type Hierarchy. **[Premium](https://intelephense.com)**
- Support for `key-of<Type>` utility type.
- Support for `T[K]` index access utility types.
- Completion suggestions for `$_SERVER` array keys.
- `unset()` now set variable type to `unset`.
- Phpdoc unsealed array shape syntax - `array{foo: 'bar', ...<int, object>}`.
- Support PHP 8.3 enum and class constant dynamic access syntax.
- Ability to turn formatter off/on with comments. Within PHP - `// @formatter:off`, `// @formatter:on`. Within HTML - `<!-- @formatter:off -->`. Within js/CSS - `/* @formatter:off */`.
- New setting to prefer `@psalm-`, `@phpstan-` prefixed annotations when determining symbol type. Defaults to `false`. `intelephense.compatibility.preferPsalmPhpstanPrefixedAnnotations`.
- Support for `@psalm-type` and `@psalm-import-type` type aliases. Set `intelephense.compatibility.preferPsalmPhpstanPrefixedAnnotations` to `true` to enable.
- Support `@see`, `@uses`, `@link` annotations and inline variants.
- Static member access completion/hover/references when scope is variable of type `class-string<Foo>`.
- Hover on array shape string keys.
- New `intelephense.diagnostics.relaxedTypeCheck` setting. Defaults to `true` (previous version behaviour). This setting makes type checking less thorough by allowing contravariant (wider) types to also satisfy a type constraint. This is useful for projects that may have incomplete or innacurate typings. Set to `false` for more thorough type checks. When this setting is `true`, the `noMixedTypeCheck` setting is ignored.
- New `intelephense.diagnostics.noMixedTypeCheck` setting. Defaults to `true` (previous version behaviour). This setting turns off type checking for the `mixed` type. This is useful for projects that may have incomplete or innacurate typings. Set to `false` to make type checking more thorough by not allowing `mixed` to satisy any type constraint. This setting has no effect when `relaxedTypeCheck` is `true`.
- New `completion.suggestObjectOperatorStaticMethods` setting. PHP permits the calling of static methods using the object operator eg `$obj->myStaticMethod();`. If you would prefer not to have static methods suggested in this context then set this value to `false`. Defaults to `true`.
- Parameter types are now injected into inline closure arguments to functions from the corresponding parameter annotated callable type. For example declaring `function doCallback($myCallback) {}` with annotation `/** @param \Closure(Foo $param): void $myCallback **/` will result in type hints for `$param` inside `doCallback(function ($param) { /* $param type is known */ });`
- Support `@var` annotated type above `define` constants.

#### Changed
- Minimum VSCode version 1.82.
- Recommended nodejs version 20.
- Literal types and array shapes are now used for constants. eg the type of `const FOO = 'bar';` is now `'bar'` instead of `string`, `const ARR = ['foo' => true]` is now `array{foo: true}` instead of `array`.
- `$argv` is now type `string[]`.
- `$http_response_header` is now type `array|unset`.
- `$php_errmsg` is now type `string|unset`.
- Updated stubs.
- Formatter now aims to be [PER-CS](https://www.php-fig.org/per/coding-style/) compliant. As such, `psr12` setting in `intelephense.format.braces` has been removed and `per` added.
- Formatter now allows a single space or no space in unary logical negation.
- Empty class, trait, interface, enum, function, method bodies are formatted to `{}` with a single space preceeding `{`.
- Short anonymous functions are now formatted to have no space between `fn` and `(`.
- Improved multiline `foreach` expression formatting.
- Formatter now allows a single space or no space before colon in alternate control statements.
- Formatter now allows a single space or newline + indent before opening brace in anonymous class.
- Formatter now allows semicolon to be placed on a separate line in multiline chained expression statements.
- Multiline arrays are now formatted to a single element per line.
- Formatter will preserve wrapped attibutes in HTML.
- When multiple method/function candidates are found for a call expression, the result will be a union of the return types of the functions/methods.

#### Fixed
- Template type resolution from args when arg is subtype of param type.
- Various control flow fixes and improvements.
- Missing or poorly displayed code blocks in hover/completion documentation for some built-in symbols.
- Array destructure with skipped elements.
- Shorthand ternary type inference.
- Incorrect import folding range.
- Param with optional array shape element not indicating element is optional when hovering.
- Hover on named arg of closure showing incorrect type `unset`.
- Incorrect type inferred for dynamic object creation expression when dynamic type is union.
- Hover showing non php fenced codeblocks incorrectly.
- Stack overflow with deeply nested string concatenation (TYPO3 PackageArtifact.php).
- Incorrect return type for symbols with metadata and null default parameter value (Laravel `app()`);
- Incorrect type when generating phpdoc for variadic params.
- Declare statement should accept comma separated directive list.
- Incorrect `$matches` type after `preg_match_all` call.
- Promoted property highlight.
- Code actions not showing when narrow or zero length range provided.
- Unable to `@disregard` errors in method header.
- Unnecessary match expr format when operand of binary expr.
- Incorrect file rename if `composer.json` contains autoload paths without trailing `/`.
- `static::class` resolving to parent class name rather than child class name.
- Trait method `self` return type not resolving to consuming class when used as implementation for interface method.
- Don't show `iterable` as interface.
- Variables typed as `iterable<Foo>` not working with array access notation.
- Array destructure with `ArrayAccess`.

## [1.10.4 - 2024-03-26]

#### Fixed
- Cannot read properties of undefined (reading kind) with `for` loops which have parse errors.

## [1.10.3 - 2024-03-25]

#### Fixed
- Incorrect return type when using null safe operator.
- False undefined variable error in 3rd `for` control expression.
- Incorrect return type for traits with method templates.
- False return type error when method returns method or class template type.
- Subclass constructor should not inherit phpdoc from superclass constructor.
- Conditional return types when testing parameter in namespaced file. 
- False unknown named argument diagnostic with closures.
- Formatter adding extra space in method call where method named `catch`.
- Nested heredoc parsing.
- False unknown named argument diagnostic with trait method aliases.
- Metadata overrides when named args are used.
- Various version dependent stub type problems.
- Array callback references not being found.
- Type inference for const symbols with `new` object initialisers.
- Type inference in switch/match with instanceof.
- Trait template mapping when phpdoc provided above trait use declaration.
- Object creation expression with variable returning `object` when more specific type could be inferred.
- False method compatibility diagnostic with base class that has a trait method alias. 
- False method not implemented diagnostics when enum implements interface that extends BackedEnum.

## [1.10.2 - 2023-12-10]

#### Fixed
- Crash when `self` not used inside class.
- False cannot use parent in class with no parent diagnostics. 
- Undefined class not reported when using `ClassName::class`.
- Type inference when destructuring array shape with numeric or no keys.

## [1.10.1 - 2023-11-13]

#### Fixed
- Return types of some stubs
- False error when array or object shape passed to function expecting array or object.
- Array destructure of numeric indexed array shape.
- False error when using argument unpacking.
- False error when using array unpack on an array shape.
- Crash when parsing malformed or unsupported conditional return type syntax.
- Format only providing edit to remove closing tag even though other edits are applicable.
- Method template resolution when method comes from `@mixin` class.
- Expected pattern to be a non-empty string crash.
- Declare correct min vscode version - 1.79

## [1.10.0 - 2023-11-05]

#### Added
- PHP 8.3 support
- Array/Object shapes via annotations. For example - `/** @param array{foo:string, bar:int} $arrayShape */`, `/** @return object{foo:string, bar:int} */`.
- Improved type inference for `new $className` expressions where `$className` is of type `class-string`.
- Annotation to ignore diagnostics/problems on statement level: `/** @disregard [OPTIONAL CODE] [OPTIONAL DESCRIPTION] */`. For example `/** @disregard P1013 method exists on runtime type */`.
- Conditional return types. Must be encapsulated in parentheses. For example - `/** @return ($param is string ? string : object) */`, `/** @return (T is string ? string : object) */`

#### Changed
- Updated stubs.
- Updated dependencies.
- Problem/diagnostic codes are now strings, with the previous codes prefixed with 'P'.
- Properties with a declared or annotated type are now only narrowed on assignment to a subset of the declared/annotated type.

#### Fixed
- Auto indexing on composer install/update
- Signature help showing no parameters when there are multiple definitions in workspace.
- Type lost when null coalescing with empty array.
- Wrong type when bitwise expr operands are both strings.
- PhpDoc being applied to consecutive symbol declarations when used with enum case.
- Property attributes not suggested on constructor promoted properties.
- `class-string<T>|T` type resolution.
- Method definitions not found for method string in callable array function arguments when multiple definitions of class/method are in workspace.
- Methods marked as undefined when packages provide ide helper stubs for other packages.
- Enums not suggested in namespace use declarations.
- Renaming the namespace of an enum not working correctly.
- Renaming a namespace will affect unrelated namespaces with a similar name.
- Rename symbol of variable will impact named parameter.
- Type inference when iterating over `$this` in foreach.
- Symbols being given Global* alias on autocomplete when multiple definitions exist in workspace including in the current file.
- Missing `isIncomplete` flag on suggestion response in some contexts.
- Usage of `self` in trait not resolving to class that trait used in.
- Removal of line breaks when formatting nested parenthesised logical expressions.

## [1.9.5 - 2023-02-06]

#### Fixed
- Document symbol ranges when `SymbolInformation` is returned instead of `DocumentSymbol` (fixes sticky scroll).
- Docblock types inherited too eagerly causing various param and return type issues. 
- Templating issues when trait provides implementation of templated interface.
- Exclude globs working incorrectly.

## [1.9.4 - 2023-01-17]

#### Fixed
- Template inheritance.
- Suggestions when `$this` call chaining.
- `static` type resolution when used as template type argument.
- Nullable types showing incorrectly in hover.
- Not all suggestions showing from types with multiple definitions.

## [1.9.3 - 2023-01-10]

#### Fixed
- False cannot modify readonly property errors.
- Property hover when type is a union of intersection and null.
- Method level `@template` PhpDoc inheritance.
- Template resolution when user has provided overrides for non templated vendor definitions. 

## [1.9.2 - 2023-01-04]

#### Fixed
- False write to readonly property in `__get`.
- False undefined property for types that inherit `__get`, `__set` from super type or traits.
- `intelephense.compatibility.correctForArrayAccessArrayAndTraversableArrayUnionTypes` not working for properties.
- False readonly write error for writes to array/ArrayAccess element.
- Namespace rename creating file renames containing backslashes.

## [1.9.1 - 2023-01-03]

#### Fixed
- Missing `random` stubs.
- Missing `xdiff` stubs.
- Handle non-standard `non-empty-string`, `lowercase-string` , `non-empty-lowercase-string` PHPDOC types.
- False error when assigning to readonly property within constructor.
- Remove template/generics licence requirement.
- Undefined methods showing where users may have multiple type definitions of same name in workspace folder.
- Various template issues.

## [1.9.0 - 2023-01-01]

#### Added
- PHP 8.2 support.
- PHPDOC `@template` support.
- Handle non-standard PHPDOC types like `list`. Internally `list<Foo>` is treated as `Foo[]`. 
- PHPDOC `callable(Foo $foo): Bar`, `\Closure(Foo): Bar` support. Variadic and default args are not supported in the short form.
- Added undefined property diagnostics. Can be disabled via the `intelephense.diagnostics.undefinedProperties` setting.

#### Changed
- Updated dependencies.
- Updated stubs.
- Signature help provider now returns null instead of empty signatures array as per LSP recommendations.
- composer.json `autoload.psr-4` settings used if available for file renames when renaming namespace.
- Added templated `array_map` stub in order to better infer return type.

#### Fixed
- Performance issue when workspace contains multiple symbols with same name.
- Various issues when `__halt_compiler` appears in file.
- False `never` return type when `die` used in logical expression.
- False undefined method when static used in union return type.
- Completion item documentation showing multiple times for namespace suggestions.
- Type inference for return type of closures.
- False unknown arg name when calling closure with named args.
- False unused imports with enum implements.
- False method compatibility error when overriding base method return type of self with static.
- False method compatibility errors when overriding core methods when targeting PHP versions < 8.1 .
- False undefined variable when variable declared as reference in anon function use clause where anon function is argument.
- Incorrect type inferred when variable appears in nested logical expressions.
- Type resolution when using `parent` keyword and `static` return types.
- Unused private methods not detected if they call self.
- False return type error when using `yield` in `for` expr. 
- False duplicate symbol when importing same symbol in different namespace blocks of same name.
- Undefined symbol not reported when import exists in other namespace block of same name.
- False duplicate symbol when defined in match expr.
- Local rename of excluded/stub definition should be allowed.

## [1.8.2 - 2022-02-23]

#### Fixed
- Incorrect completion suggestions for variables.
- False undefined variables in do loop.
- Completion resolve not working.
- couchbase_v3 stub removed.

## [1.8.1 - 2022-02-13]

#### Fixed
- False undefined variable when declared inside expression in conditional statement.
- False non static method should not be called statically for `self::`.
- Enums getting imported repeatedly.
- Enums not suggested for completion in argument lists.
- Type `string` lost from `$var` in conditional when using `!is_numeric($var)`.
- Parsing of `@return Type` when following description starts with html tag.
- Return types for some built in functions/methods incorrect.
- Type inference problems with `break` and `continue`.
- Type inference problems with unary not expr and properties.
- Parameter attributes not analysed for usage.
- Wrong parameter highlighted in signature help when first arg is a named arg.
- Properties and promoted properties when declared with `readonly` and no visibility keyword.
- Don't use > 31 bit numbers in `CompletionItem.data`.
- Variable references within `@var` not getting renamed.
- False diagnostic: Expected type `SimpleXMLElement`. Found `$1`.
- Comment folding in array lists.
- Various smart select issues.
- Method override parameter hover not showing inherited doc.
- Default php version.

## [1.8.0 - 2021-12-05]

#### Added
- PHP 8.1 support

#### Changed
- Redundant unions are not reduced to minimal type as eagerly.
- Added additional logging when indexing.
- Diagnostics limited to parse errors only for non-file URIs.
- PHP 8.1 is now the default version.
- Updated stubs.

#### Fixed
- Iterator|Foo[] not corrected to Iterator<mixed, Foo> in some instances.
- Auto import not working in namespace body when class imported in previous namespace.
- Auto import indent in namespace body.
- False parse error on null-safe object operator and keyword member name.
- File rename incorrect when renaming namespace.
- False undefined variable diagnostic when using named arg and param is by ref.
- Encapsulated expr closing parenthesis format.
- False method not compatible diagnostic when override has an addition parameter that is variadic.
- False undefined variable on LHS of null coalesce compound assignment expr.
- Expected type 'object|array'. Found 'iterable'.
- Anonymous function parameter renaming.
- False method not implement diagnostic when trait provides implementation required by another trait.
- `implements` not suggested when extends class name contains backslash.
- Parsing of nested generic array phpdoc syntax.

## [1.7.1 - 2021-05-02]

#### Changed
- Updated stubs

#### Fixed
- phpdoc `double` normalised to `float`.
- Crash on fetching embedded language folding ranges.
- False duplicate function name.
- Concrete class method is allowed to have different signature to trait abstract method.
- Doc block formatting.
- Excluded files getting indexed on `workspace/didChangeWatchedFiles` notifications.
- False type diagnostics for some built-in symbols.

## [1.7.0 - 2021-04-26]

#### Added
- `@mixin` support. **[Premium](https://intelephense.com)**
- Signature help offset label support.
- `SymbolTag.Deprecated` support for workspace and document symbol requests.
- Added new setting `intelephense.rename.namespaceMode` that can be either `single` (default) or `all`. When set to `single` a rename of a namespace will only affect the symbols defined in that single file. This is the equivalent of a single 'move class' operation. Previously renaming a namespace would affect all symbols that shared that namespace across multiple files. Setting to the value to `all` will produce the old behaviour. **[Premium](https://intelephense.com)**

#### Changed
- Updated stubs.
- Upgraded vscode-languageserver to 7.1 beta.
- `intelephense.files.exclude` globs without path separators are no longer prefixed with `**/`. **BREAKING**
- URIs are now normalised to vscode-uri format.
- Rename requests that fail now return `ResponseError` with appropriate code and message rather than returning null and sending a separate notification.
- `intelephense.environment.shortOpenTag` now defaults to true. **BREAKING**
- Tolerate property annotations with missing `$` in property name. 

#### Fixed
- Parser failing on alternate switch syntax.
- False `parent` static call warning in anon class.
- Division returning `int` instead of `int|float`.
- Refs not found when inside encapsulated expression used as member name.
- Formatting of immediately invoked function expr following phpdoc.
- Completion item detail showing `namespace ...` instead of `use ...` for existing imports.
- Completion item not including additional import edit when symbol shares current namespace but symbol short name is already used.
- Nested regions not folding.
- Property doc inheritance.
- Inline `{@inheritdoc}`.
- Files that are excluded but have textDocument/didOpen sent are now ignored.
- protected visibility when accessing subtype method from supertype.
- `intelephense.phpdoc.useFullyQualifiedNames` not overriding `intelephense.completion.insertUseDeclaration`.
- False not in object context error in arrow function.

## [1.6.3 - 2021-01-31]

#### Fixed
- Multiline `unset` formatting.
- Goto definition from callable arrays using `MyClass::class` expression.
- Wrong `json_encode` parameter name.
- PHPUnit metadata causing `createMock` to return `string`.
- Indexing not working on Apple M1.
- False diagnostics for some built in functions that have multiple signatures.
- Format bug with shebang and `__halt_compiler`.
- Intellisense breaks with doc blocked class inside namespace body.
- `$/cancelRequest` not working.
- Wrong range reported for duplicate symbol diagnostics with attributes.

## [1.6.2 - 2021-01-12]

#### Fixed
- Various cannot read prop of undefined.
- Incorrect method compatibility diagnostics with union types.
- User function named `string` not found.
- Wrong type resolved for `static[]` return type in `IteratorAggregate::getIterator`.
- Incorrect argument count diagnostics when required parameters follows optional.
- `match` formatting.

## [1.6.1 - 2021-01-04]

#### Changed
- Deeper code diagnostics will only be run if file is free of parse errors.

#### Fixed
- Endless parse loop when encountering parse error in argument lists in some contexts.
- Named parameters not suggested in method, constructor, attribute calls.
- Attribute formatting.
- `false`, `null`, `mixed` reported as undefined types.
- Attributes on methods breaks code intelligence.
- False type error when return type is `static`.
- `implements` name list always formatted on next line.

## [1.6.0 - 2021-01-03]

#### Added
- PHP 8 support.
- Rename functionality in embedded HTML/JS. **[Premium](https://intelephense.com)**

#### Changed
- `intelephense.environment.includePaths` can now be relative to workspace folder.
- PHP 8 is now the default PHP version.
- Updated stubs.
- Updated to recent vscode html lang server.
- Updated to jsbeautify 1.3.
- Updated to node-language-server 7 and LSP 3.16.

#### Fixed
- Find all implementations fails after closing and reopening window.
- User types named `Boolean`, `Integer`, `Resource` being confused with phpdoc lowercase types of same name.
- Laravel `Str` not showing in suggestions.
- False implementation diagnostic for method overrides with default params.
- Declaring `$argv` in function scope always gives undefined variable.
- If/else formatting where if/else do not have braces but nested statement does.
- Wrong formatting when `default` is used as name of const, method etc.
- Incorrect heredoc formatting error msg.
- No folding for alternate if/else statements.
- Incompatible method not diagnosed when base method param has default arg.
- False static call of non static method when call scope is in type heirarchy.
- No hover/goto/rename on static protect variables.
- Protected static functions not found when in type heirarchy.
- Trait methods not found when using `insteadof`.
- Magic constants should be case insensitve.
- False implementation error with multiple traits with same function where one is abstract.
- Short ternary expr always resolving to the falsey type.
- HTML/CSS path completion always relative to workspace folder.
- Magic methods not suggested when visibility modifier is private.

## [1.5.4 - 2020-08-16]

#### Fixed
- Parse error with prefix increment array dereference expressions which caused false undefined variable errors.
- Intellisense fails when '@return self` used for interface methods.
- Formatting errors with goto labels.
- Signature diagnostics incorrectly checking against base annotated methods.
- Crash when using reference array destructure eg `[&$var] = [$num];`.
- False implementation errors when trait uses trait containing abstract method.
- `@var` annotations and function static variables.
- False undefined method when calling parent method that has `__call` defined eg `parent::magic()`.
- False undefined global variable errors.
- False type error when passing `$this` to a function call inside trait.

## [1.5.3 - 2020-07-20]

#### Fixed
- User symbols declared with annotations not overriding vendor definitions.
- Return type of anon function passed as argument is `Closure`.
- Duplicate private method names not showing error.
- Incorrect type assigned to variables passed to function with variadic by ref parameter.
- `@var` ignored when declaring function static variable.
- False undefined var/param when multiple methods declared with same name.

## [1.5.2 - 2020-07-13]

#### Fixed
- Fix issue with included files getting forgotten on close.
- Undefined symbols being shown when project first opened and indexing is in progress.

## [1.5.1 - 2020-07-12]

#### Fixed
- `} else ` formatting problem.
- rename/references not working.

## [1.5.0 - 2020-07-11]

#### Added
- Folders can now be included from outside the workspace using the `intelephense.environment.includePaths` setting.
- Class does not implement all abstract methods diagnostic.
- Type check diagnostic on unpack operand.
- Method override/implementation signature check diagnostic. 
- Import symbol code action **[Premium](https://intelephense.com)**
- Implement all abstract methods code action **[Premium](https://intelephense.com)**
- Add PHPDoc code action (in addition to existing `/**` trigger) **[Premium](https://intelephense.com)**

#### Changed
- Updated stubs.
- **BREAKING** Workspace folders are now considered isolated from each other. Use the `intelephense.environment.includePaths` to allow sharing of symbols across workspace folders. 
- Improved handling of methods with multiple signatures defined by `@method`.
- Where symbol names clash then definitions that are _NOT_ vendor definitions are preferred. Previously a union of all definition types was used. This permits user overriding of vendor symbols through the use of helper stubs in the workspace.
- `intelephense.environment.documentRoot` and `intelephense.environment.includePaths` are now resource (folder) scoped settings.
- Method override/implementation completion will now add use declarations (if configured) instead of always using FQN for parameter and return type declarations.
- Type FQN can be used in workspace symbol search.
- Formatter no longer enforces single space between cast operator and operand as this is not specified by PSR12.
- Region and comment code folding now folds to a single line.

#### Fixed
- no definition/hover for private and protected methods in some contexts with `self` or `$this`.
- False unexpected heredoc indentation diagnostics.
- `@var` annotations failing in consecutive foreach loops using same variable name.
- Fomatting problem for `if` / `else` without braces.
- False deprecated nested ternary when nested short ternary expressions are used.
- False undefined variable for for subscript expressions in `isset`.
- False return type error when return `$this` from trait.
- Last region in a block cannot be folded.
- `if`, `else` formatting with `allman` brace setting.
- Fixed index state becoming corrupted during some add and remove operations.
- False undefined method on interfaces when method call follows property access expression.
- Method header completion missing ampersand and elipsis for reference and variadic params.
- Incorrect type for annotated variadic parameters.
- Diagnostics not clearing when files outside of workspace are closed.

## [1.4.1 - 2020-06-01]

#### Fixed
- Signature help failing when call inside of an array element list.
- Variables not being suggested when declared using annotations.
- Variables not being suggested in subsequent branch when declared in sibling branch.
- Type inferrence with loose null equality. 
- Initialise problem with short tags.
- Function return type incorrect when contains switch.
- False undefined var for additional params in method override.
- False undefined type err when using NAMESPACE::class.
- Static member completion failing when php version cant be parsed.
- Format inserting stray whitespace at beginning of file.
- False error on foreach arg when type is `iterable`.
- `@var` typehint failing if preceeded by `if` statement.

## [1.4.0 - 2020-05-27]

#### Added
- Compatibility settings to enable working with some common type annotations that may not accurately reflect intended type.

    * `intelephense.compatibility.correctForBaseClassStaticUnionTypes` resolves `BaseClass|static` to `static` instead of `BaseClass`.
    * `intelephense.compatibility.correctForArrayAccessArrayAndTraversableArrayUnionTypes` resolves `ArrayAccessOrTraversable|ElementType[]` to `ArrayAccessOrTraversable<mixed, ElementType>`.

- Added settings to control formatting of braces. Options are `psr12`, `allman`, `k&r`.
- Go to definition and references for callable strings.
- Completion suggestions marked with deprecated tag where appropriate.
- Language constraint and version dependent (5.3+) diagnostics. Can be controlled with `intelephense.diagnostics.languageConstraints`.
- Short open tag setting `intelephense.environment.shortOpenTag`. Defaults to `false`.
- Added wordpress globals to built-in stubs.
- Added `intelephense.references.exclude` setting to excluded files/folders from reference search. Defaults to `**/vendor/**`.
- Added type diagnostics for LHS of member access expressions and foreach argument.
- Implemented smart select - `textDocument/SelectionRange`. **PREMIUM**

#### Changed
- Unions with `mixed` resolve to `mixed`. Previously the other types in the union were preserved.
- Updated stubs.
- Added `**/.history/**` to `intelephense.files.exclude` default.
- Upgraded to node language server 6.

#### Fixed
- No space after `use` when formatting.
- Division expressions not returning correct type.
- Function static variables not suggested.
- Unused try/catch variable.
- False unused property when used in null coalesce assignment.
- Array type inferrence incorrect and causing performance issues.
- False undefined variable in ternary expressions.
- Boolean addition should return integer.
- Variables being included in auto generated function phpdoc.
- Visibility not checked when determining member access.
- Various `Generator` type inference issues.
- Type inferrence problems when using `$this` in instanceof or as a pass by ref argument.
- Method override completion not considering `static`.
- False unused variables when using `func_get_args` and `get_defined_vars`.
- Negative constants showing as 'expr' in hover.
- Parser/rename bug for property access expressions inside double quoted strings.

## [1.3.11 - 2020-02-15]

#### Changed
- Updated stubs.

#### Fixed
- Crash when reading state from cache.

## [1.3.10 - 2020-02-13]

#### Fixed
- Variable assignments in type guards.
- Instanceof typeguard should preserve existing type where appropriate.
- isIncomplete flag not getting set for member completions.
- Files getting closed prematurely when deleted from disk but still open in editor.

## [1.3.9 - 2020-01-30]

#### Fixed
- Cannot read `name` of undefined.

## [1.3.8 - 2020-01-27]

#### Added
- Bottom type `exit` 

#### Changed
- Updated stubs.
- Imports no longer shown in outline or document symbol search.

#### Fixed
- Problem with `$this` and `static` return types and inheritance.
- Completion call chaining with `__invoke`.
- Incorrect variable types in completions
- Logical `&&` type guards with negated operand.
- Metadata override map types parsed incorrectly.
- Variables of type `bool` become `void` after type guard.
- False type error for functions that throw exception or exit.
- Element of `array` should be `mixed`.
- Array of `array` should be `array` not `array[]`.
- Removed phpstorm stubs helper symbols.
- Auto phpdoc using type template instead of property template.
- Private method used in callable array marked as unused.
- Wrong type when using array access on variable with type `static`.
- Auto phpdoc useFullyQualifiedNames not producing correct short names when false.
- Auto phpdoc for constructors.

## [1.3.7 - 2020-01-06]

#### Changed
- Updated stubs

#### Fixed
- Switch statements not folding
- False undefined symbol for dynamic static function call
- No hover for methods named `toString`.
- Go to def when there are multiple class and methods with same name.
- False unused variable when passed by ref.
- Show diagnostic for all instances of an unused variable.
- Show parse errors for use declarations, namespace definitons and const not in top statment list. 
And function, trait, class, interface declarations not in inner statement list.
- Handle overloaded methods.
- Read prop of undefined error when indexing metadata.
- De-dupe member completion suggestions.
- Suppress false embedded language diagnostics.
- Licence activation with proxy.

## [1.3.6 - 2019-12-18]

#### Changed
- Set default stubs to match current bundled php 7.4 extensions.
- Some more hover/completion documentation polish.

#### Fixed
- Memory leak where large strings were retained.
- Html/php formatting incorrectly adding large indents.
- Functions imported using group clause syntax being marked as undefined.
- Multiple `@` not being replaced in phpstorm metadata maps.
- Variable hover/completion sometimes showing doc from wrong variable.
- Overloaded functions getting lost when restoring from cache.

## [1.3.5 - 2019-12-16]

#### Changed
- `define`d constants now show `define(NAME, VALUE);` in hover signature instead of `const`.
- Constants now have `@var` annotation noting type.
- Short names now used in documentation signatures.
- Documentation function/methods signatures only wrap when they have more than 3 parameters.
- Added activation event on enter licence key command.

#### Fixed
- Regression with type inference giving void type after last update.
- Fixed problem when lexing double quoted strings that start with curly open.
- Only first clode block highlighted on hover.
- Undefined type when referencing parent in trait.
- Use http proxy when activating licence.
- Function overloads lost when restoring from cache.
- phpdoc generation showing `@throws mixed`
- PSR-12 formatting fixes.
- Mixed php/html formatting fixes.
- Unsued symbol not showing when there is a class and function with same name.
- constructor hover param types different to method hover param types.
- Invalid return type shown for nullable types in method documentation signature.
- Trailing comma in `isset` and `unset`.

## [1.3.4 - 2019-12-13]

#### Changed
- Parser is now backwards compatible regarding PHP 7.4 fn keyword.
- Type hinting `/** @var Foo */` above variable and property assignments now works without variable name as well.

#### Fixed
- Stray backslash breaking type inference when using phpstorm metadata overrides.
- Variables declared in conditional blocks missing from completion suggestions.
- Don't assign unset type to variables and properties from unset vars. Assign mixed instead.
- Argument type check not working at times for functions with multiple signatures.
- Ctrl hover on phpdoc reference underlines whole doc block.
- Don't type check undefined variables. Fixes issue when using extract.
- Performance issue when running diagnostics on open files.
- various read prop of undefined errors.

## [1.3.3 - 2019-12-10]

#### Added

- Config to enable/disable each of undefined types, functions, constants, methods, class constants, properties.
- Config to enable/disable embedded language diagnostics.
- Wordpress stubs which can be activated by adding `wordpress` to `intelephense.stubs`.

#### Changed
- Relaxed undefined method diagnostics when calling methods from within traits.
- Relaxed undefined method diagnostics when mixed or object forms part of a union type.
- Relaxed import undefined symbol diagnostics.

#### Fixed
- Duplicate type, function, constant completion suggestions when multiple symbol definitions are found in workspace
- Signature help and argument type checking for built in function that have multiple signatures eg session_set_save_handler.
- Variable has void type after used in ternary expression.
- Variables losing original type after instanceof expr in conditions.
- False unused variable when used in short form closure.
- Variable type not inferred when it is an arg of a function call inside a short form closure.

## [1.3.2 - 2019-12-06]

#### Changed
- Relaxed type checking so that it behaves as in 1.2.
- Moved licence key storage from config to global memento.
- Unused catch clause variable diagnostic suppressed.
- removed interbase, wddx, recode from default stubs.
- Changed default file exclude pattern to `**/vendor/**/{Tests,tests}/**` to not exclude frmaework test classes.

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
