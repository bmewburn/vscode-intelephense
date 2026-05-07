<?php

class RedService {}
class BlueObject {}
class GreenCollection {}

// ----------------------------------------------------------------------------------------------
// Problem: 
// A function accepts string|object and returns this type after performing some operation.
// We want to return a string if a string is passed or a specific object if an object is passed,
// not a string|object.

// Using PHPStorm metadata:
function paintColourMeta(string|object $input): string|object {}

PHPSTORM_METADATA\override(paintColourMeta(), PHPSTORM_METADATA\type(0));

// Using PHPDoc annotations:

/**
 * @template T of string|object
 * @param T $input
 * @return T
 */
function paintColourDoc(string|object $input): string|object {}
$result = paintColourDoc(new BlueObject); // $result is inferred as BlueObject

// ----------------------------------------------------------------------------------------------
// Problem:
// A function accepts a string and returns a different type based on the string passed in.
// We want to return a specific type based on the string argument, not a union of all possible return types.

// Using PHPStorm metadata:
function getColourMeta(string $value): mixed {}

PHPSTORM_META\override(getColourMeta(), PHPSTORM_META\map([
    'red' => RedService::class,
    'blue' => BlueObject::class,
    'green' => GreenCollection::class,
]));

// Using PHPDoc annotations:

/**
 * @template T of array{red: RedService, blue: BlueObject, green: GreenCollection}
 * @template K of key-of<T>
 * @param K $value
 * @return T[K]
 */
function getColourDoc(string $value): mixed {}
$obj = getColourDoc('red'); // $obj is inferred as RedService

// ----------------------------------------------------------------------------------------------
// Problem: 
// A function returns an array with a specific set of string keys.
// We want to provide language intelligence based on the keys and value types of the returned array.

// Using PHPStorm attributes:

#[\JetBrains\PhpStorm\ArrayShape(['red' => RedService::class, 'blue' => BlueObject::class, 'green' => GreenCollection::class])]
function getColoursAttr(): array {}

// Using PHPDoc annotations:

/**
 * @return array{red: RedService, blue: BlueObject, green: GreenCollection}
 */
function getColoursDoc(): array {}
$green = getColoursDoc()['green']; // $green is inferred as GreenCollection

// ----------------------------------------------------------------------------------------------
// Problem:
// A function accepts a specific set of string literals as arguments.
// We want to provide language intelligence based on the allowed string literals

// Using PHPStorm attributes:

#[\JetBrains\PhpStorm\ExpectedValues(values: ['red', 'blue', 'green'])]
function setColourAttr(string $colour): void {}

// Using PHPDoc annotations:

/**
 * @param 'red'|'blue'|'green' $colour 
 * @return void 
 */
function setColourDoc(string $colour): void {}
setColourDoc(''); // Completion suggestions for 'red', 'blue', 'green'
