---
tags: [flow, typescript]
---

# Flow to typescript migration notes

Core difference to note when switching from flow type system to typescript. I've been mainly using flow v0.83, if you used newer versions your experience may vary.

## Why static types

- Documentation
- Tests/contracts
- DX
- Type safety\*

## Preword

⚠️ - marks things to pay close attention to

## Types and guarantees

![working-with-typed-programs](https://user-images.githubusercontent.com/5817809/112736958-c8e84200-8f67-11eb-872a-216ca432c5c8.png)

Types are about contract validation within your program. Unlike tests types have a chance to let the developer know what can go wrong before they finish the work.

DX improvement - how few things people have to keep in their head while working on a project. Types help to reduce this load.

## Core difference

Flow aims at being a sound type system. In other words flow might have false positives when raising an error.

Typescript aims to be a complete type system. In other words typescript might have false negatives when raising an error. See [non-goals](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Design-Goals#non-goals).

## Language differences

- Flow only provides type annotations
- Typescript expands javascript syntax with type annotation and the following:
    - Enums
    - Non null assertions
    - `private` class properties(not `#name` syntax, it has both)
    - Decorators
    - [Parameter properties](https://www.typescriptlang.org/docs/handbook/2/classes.html#parameter-properties)
    - Abstract classes
    - ... **TODO**

## Structural/nominal vs structural only

Flow has a mix of structural and [nominal types](https://en.wikipedia.org/wiki/Nominal_type_system)(classes use nominal types).

```typescript
// @flow

class Foo {
  method(input: string): number { return 42 }
}

class Bar {
  method(input: string): number { return 42 }
}

let foo: Foo = new Bar() // ERROR!!
```

Typescript uses purely [structural typing](https://en.wikipedia.org/wiki/Structural_type_system).

```typescript
// typescript

class Foo {
  method(input: string): number { return 42 }
}

class Bar {
  method(input: string): number { return 42 }
}

let foo: Foo = new Bar() // OK
```

<!-- minor syntax diff -->

## Suppression comments

Flow marks every unused suppression comment as unused if there's no error. If used `include_warnings=true` unused suppressions are marked as errors.

Typescript allows to have `// @ts-ignore` anywhere yet doesn't report it as an error/warning when there's no error to suppress ⚠️.

In [v3.9](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html#-ts-expect-error-comments) a `// @ts-expect-error` was added which is reported as an error where there's no error to suppress.

Both typescript and flow cannot suppress a specific error by error code or other methods.

## Maybe values

Flow has maybe operator `?type` and typescript doesn't

```
// @flow

type A = ?string

// the same as
type B = string | void | null
```

```typescript
// typescript

type A = string | undefined | null
```

## Dangerous types

In flow `Object` type can be used to describe an object that can have any key and any value.

```typescript
// @flow

const obj: Object = {}

// the same as {[string | number]: any}
```

In typescript `Object` type is the actual Object constructor, which means almost every value can assigned to it

```typescript
// typescript

const bool: Object = true // ok
const str: Object = 'foo' // ok
const num: Object = 123 // ok

const nil: Object = null // err
```

If you need the "whatever" object type in typescript you can use the `object` type with lowercase o

```typescript
// typescript

const obj1: object = {} // ok

const obj2: object = {
    a: 'string',
    b: true,
    c: 123,
    d: null,
} // ok
```

```typescript
// @flow

const obj1: Object = {} // ok

const obj2: Object = {
    a: 'string',
    b: true,
    c: 123,
    d: null,
} // ok
```

Other dangerous types can be `Function` or `{}`. See [ban-types](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/ban-types.md) eslint rule from typescript-eslint-plugin.

## Named arguments / keys

In Flow one does not have to specify argument or object key names in order to provide a type annotation.

```typescript
// @flow

const func
    : string => void
    = (arg) => console.log(arg)

const obj
    : {[string]: number}
    = {foo: 1}
```

Typescript marks this code with errors forcing users to provide a more explanatory names that will be used in type hints

```typescript
// typescript

const func
    : (arg: string) => void
    = (arg) => console.log(arg)

const obj
    : {[key: string]: number}
    = {foo: 1}
```

<img width="372" alt="Screen Shot 2021-03-28 at 5 00 30 PM" src="https://user-images.githubusercontent.com/5817809/112754957-3d15fa80-8fe7-11eb-9bc4-dad86c5f149b.png">

## JSDoc support

Typescript has support for [JSDoc comments](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html) and will show you them on type hits.

```typescript
// typescript

/**
 * Does cool stuff
 *
 * @example
 *
 * `foo('hey', 'you') => 'hey, you'`
 */
type Foo = (start: string, end: string) => string
```

Preview:

![Screen Shot 2021-03-28 at 10 12 19 PM](https://user-images.githubusercontent.com/5817809/112764820-f2aa7300-9012-11eb-9b34-277e5dc51311.png)

✅ It's a good idea to always include comments for utility functions.

## Intersection / spread object types

In flow you can "merge" object types by using intersection or by spreading types. Spreads create an inexact object type therefore if we need an exact one we have to specify it with `{||}` syntax.

```typescript
// @flow

type A = {a: string}
type B = {b: number}

type AB_1 = A & B // {a: string, b: number}
type AB_2 = {...A, ...B} // {a: string, b: number}

type AB = {a: boolean, b: boolean}

type AB_3 = {...A, ...B, ...AB} // {a: boolean, b: boolean}

type AB_3_strict = {|...A, ...B, ...AB|} // {|a: boolean, b: boolean|}
```

In typescript we cannot spread object types though the experience is pretty similar.

```typescript
// typescript

type A = {a: string}
type B = {b: number}

type AB_1 = A & B // {a: string, b: number}

type AB = {a: boolean, b: boolean}

type AB_3 = A & B & AB // never 😳

type FML = string & number // never
```

```typescript
// typescript

interface A {
    a: string
}

interface B extends A {
//        ^ error
    a: number
}
// Interface 'B' incorrectly extends interface 'A'.
//  Types of property 'a' are incompatible.
//    Type 'number' is not assignable to type 'string'.
```

When intersecting object with the same key TS attemps to find the common type between the value types under the common key.
```typescript
// typescript

type Strs = 'A' | 'B' | 'C'
type Str = 'A'

type IntStr = Strs & Str

const a: IntStr = 'A' // ok
const b: IntStr = 'B' // error
const c: IntStr = 'C' // error

// ===============

type A1 = {prop: 'A' | 'B' | 'C'}
type A2 = {prop: 'A'}

type Intersection = A1 & A2

const a: Intersection = {prop: 'A'} // ok
const b: Intersection = {prop: 'B'} // error
const c: Intersection = {prop: 'C'} // error
```

To get a similar result as object spreads in flow we can add a utility type like `ShallowMerge`

```typescript
// typescript

type A = {a: string}
type B = {b: number}

type AB_1 = A & B // {a: string, b: number}

type AB = {a: boolean, b: boolean}
type ShallowMerge<A extends object, B extends object> = Omit<A, keyof B> & B

type AB_merged = ShallowMerge<A, AB> // {a: boolean, b: boolean}
```

## Type casting

```typescript
// @flow

const str = 'foobar'

str // string

const func = ((str: any): Function)

func() // ok
```

```typescript
// typescript

const str = 'foobar'

str // string

const func = (str as any) as Function

func() // ok
```

This feature should be avoided when possible.

## Difference between `void` & `undefined` in typescript

In flow one uses `void` at all times. In typescript you use `undefined` where it is an expected value to be used and `void` otherwise. For example for a function which result should not be used.

```typescript
// @flow

const func
    : string => void
    = (arg) => console.log(arg)

if (func()) { // ok
}
```

```typescript
const func
    : (arg: string) => void
    = (arg) => console.log(arg)

if (func()) { // error: An expression of type 'void' cannot be tested for truthiness.(1345)
}

const bar: undefined = void 0

if (bar) { // ok
}
```

## Typed `this`

In flow you cannot specify the type for `this` for functions

In typescript you can specify the type by naming the first argument type `this`

```typescript
// typescript in
function HtmlPage(this: {redirect: (url: string) => void}, params: Record<string, string>) {
    if (typeof params.id !== 'string') {
        this.redirect('/login')
    }

    // logic
}

// javascript out
function HtmlPage(params) {
    if (typeof params.id !== 'string') {
        this.redirect('/login')
    }

    // logic
}
```

## `any` vs `mixed` in flow or `any` vs `unknown` in typescript

`any` is a hack in both type systems ⚠️. It is both a subtype and a supertype of every type. This is why you can use it in any way

```typescript
function foo(arg: any) {
    arg(null)

    arg(1, 2, 3)

    arg.toFixed(5)

    arg.map(console.log)

    arg.has(42)

    arg.then(someFunc)
} // ok
```

There is a type to represent an unknown value in both type systems, it typescript it is called `unknown` and in flow we have `mixed`

```typescript
// typescript

function foo(arg: unknown) {
    if (typeof arg === 'function') {
        arg(null)

        arg(1, 2, 3)
    }

    if (typeof arg === 'number') {
        arg.toFixed(5)
    }

    if (Array.isArray(arg)) {
        arg.map(console.log)
    }

    if (arg instanceof Set) {
        arg.has(42)
    }

    if (arg instanceof Promise) {
        arg.then(someFunc)
    }
} // ok
```

⚠️ Avoid using `any` at all costs

## Type narrowing a.k.a. type refinement

[typescript](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

[flow](https://flow.org/en/docs/lang/refinements/)

Kinds of guards:
- `typeof` guards can narrow the type to string/number/biging/boolean/symbol/undefined/object/function
- Truthiness narrowing via `&&`/`||`/`if`/`!`, misses `0`/`NaN`/`''`/`0n`/`null`/`undefined`
- Equality narrowing `===`/`==`/`!==`/`!=`
- `instanceof` narrowing

```typescript
// typescript
function foo(arg: string) {
    if (['A', 'B'].includes(arg)) {
        arg // string
    }

    if (arg === 'A' || arg === 'B') {
        arg // 'A' | 'B'
    }
}
```

## Type guards

Both [typescript](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) and [flow](https://flow.org/en/docs/types/functions/#toc-predicate-functions) have type guards.

Example: let's check that the given nullable variable is not in fact `null`

```typescript
// @flow

function isNonNullable(arg: string | null | void): boolean %checks {
    return arg != null
}

function foo(arg: ?string) {
    if (isNonNullable(arg)) {
        arg // string
    }
}
```

```typescript
// typescript

function isNonNullable(arg: string | null | undefined): arg is string {
    return arg != null
    // return typeof arg === 'string'
}

function foo(arg: string | null | undefined) {
    if (isNonNullable(arg)) {
        arg // string
    }
}
```

### Handling sloppy cases

Flow forces you to check the type withing your type predicate

```typescript
// @flow

function isNonNullable(arg: string | null | void): boolean %checks {
    return true // <-- sloppy check
}

function foo(arg: ?string) {
    if (isNonNullable(arg)) {
        arg // ?string
        //     ^ note the `?`
    }
}
```

```typescript
// typescript

function isNonNullable(arg: string | null | undefined): arg is string {
    return true
}

function foo(arg: string | null | undefined) {
    if (isNonNullable(arg)) {
        arg // string
        //     ^^^^^^ still works 😳
    }
}
```

⚠️ Pay close attention to type predicates, typescript won't guard you from writing sloppy checks

## Type assertion

### Non-null assertion operator

Unlike flow typescript expands javascript syntax. An example can be [non-null assertion operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html#non-null-assertion-operator). Its usage does not affect the runtime, ie it can be dangerous ⚠️

```typescript
// typescript

declare function foo(): null | {prop: string}

foo().prop // error

foo()!.prop // ok
//   ^ this

// transpiled javascript
foo().prop
```

### Const assertions

`const foo = {} as const`

Added in [v3.4](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)

This feature allows you to disable type widening when declaring values in typescript.

```typescript
// typescript

const plainObj = {a: 1, b: 'foo'}

plainObj // {a: number; b: string}

const constObj = {a: 1, b: 'foo'} as const

constObj // {readonly a: 1; readonly b: 'foo'}
```

This is **not** the same as using `Object.freeze`

```typescript
// typescript
const constObj = {a: 1, b: 'foo', c: {d: 'bar'}} as const

constObj // {readonly a: 1, readonly b: 'foo', readonly c: {readonly d: 'bar}}

// @ts-expect-error Cannot assign to 'd' because it is a read-only property.
constObj.c.d = 'foo'

// ------------------------

const frozen = Object.freeze({a: 1, b: 'foo', c: {d: 'bar'}})

frozen // Readonly<{a: number; b: string; c: {d: string}}>

// @ts-expect-error Cannot assign to 'b' because it is a read-only property.
frozen.b = 'foo 2'

// no error since `Readonly` is not deep
frozen.c.d = 'foo'
```

The key things that happen when const assertions are being used are:

- no literal types in that expression should be widened (e.g. no going from `"hello"` to `string`)
- object literals get `readonly` properties
- array literals become `readonly` tuples

### Assert functions

Added in [v3.7](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions)

Assert functions are similar to `type guards` with the only difference that the function throws instead of returning a falsy value. This works on par with nodejs [`assert`](https://nodejs.org/docs/latest/api/assert.html) module.

Using assert function you can validate an input ie

```ts
// typescript

function plainAssertion(arg: unknown): asserts arg {
    if (!arg) {
        throw new Error(`arg is expected to be truthy, got "${arg}"`)
    }
}

function foo(input: boolean, item: string | null) {
    input // boolean
    plainAssertion(input)
    input // true

    item // string | null
    plainAssertion(item)
    item // string
}
```

Alternatively you can narrow down the type to be more specific. This is when the similarity with `type guards` shows.

```ts
// typescript

type Item = {
    type: 'item';
}

function assertItem(arg: unknown): asserts arg is Item {
    if (isObject(arg) && 'type' in arg && arg.type === 'item') {
        return arg
    }

    throw new Error(`arg is expected to be an Item, got "${arg}"`)
}

function getItemById(state: State, id: string): Item | undefined {
    const item = state.collections.items[id]

    item // undefined | Item

    return item
}

function getItemByIdSafe(state: State, id: string): Item {
    const item = state.collections.items[id]

    item // undefined | Item

    assertItem(item)

    item // Item

    return item
}
```

The same as plain type guards you don't have to validate the entire object scheme to guard other values. In other words the below code is OK for typescript standards ⚠️

```typescript
function assertWhatever(arg: unknown): asserts arg is Item {
    return undefined
}

function foo(arg: unknown) {
    arg // unknown

    assertWhatever(arg)

    arg // Item
}
```


<!-- intermediate diff -->

## Type narrowing invalidation

Flow has so called [refinement invalidations](https://flow.org/en/docs/lang/refinements/#toc-refinement-invalidations)

```typescript
// @flow
function func(value: { prop?: string }) {
    if (value.prop) {
        value.prop // string
        otherMethod()
        value.prop // string | void
        // $ExpectError
        value.prop.charAt(0)
    }
}
```

Once we checked for `value.prop` value, the refined type is string. However if we call something within the current scope. Flow invalidated the refinement since it is possible that the object `value` was mutated within `otherMethod`. To avoid the invalidation one can extract the primitive value into its own variable ie

```typescript
// typescript
function func(value: { prop?: string }) {
    if (value.prop) {
        const {prop} = value
        prop // string
        otherMethod()
        prop // string
        value.prop // void | string
        prop.charAt(0)
    }
}
```

Typescript is missing this feature on purpose since its [goals](https://github.com/microsoft/TypeScript/wiki/TypeScript-Design-Goals) aim at being a complete type system rather than sound.

## Strict vs loose objects

Flow has syntax to specify whether the objects has a specified set of fields and nothing more aka strict or non extensible or is loose aka can have other non specified fields

```typescript
// @flow
type L = {a: number}
const loose_1: L = {a: 1} // ok
const loose_2: L = {a: 1, b: 'str', c: true} // ok

type S = {|a: number|}
const strict_1: L = {a: 1} // ok
const strict_2: L = {a: 1, b: 'str', c: true} // error
```

In typescript objects are "strict" by default

```typescript
// typescript
type O = {a: number}
const obj_1: O = {a: 1} // ok
const obj_2: O = {a: 1, b: 'str', c: true} // error
```

However this does not always guarantee that typescript wont raise errors about unwanted fields.

```typescript
// typescript

type A = {a: number}

declare function takesA(arg: A): void

takesA({a: 1}) // ok
takesA({a: 1, b: 'foo'}) // error

// -----------------

const x = {a: 1, b: 'foo'}
takesA(x) // ok 😳
```

According to typescript this is a valid code. [playground](https://www.typescriptlang.org/play?#code/C4TwDgpgBAggQlAvFA3gQwFxQEYHtcA2EaAdgDQ5Z6HEkC+AUKJFAMJKoDGV+RpjzaAFUAcgEkA8iI7woAHzYMGnXCQDOwKLmwArLKMnTkKbFmAAnAK4QK3KBet0gA)

```typescript
type AB = {a: boolean, b: boolean}
type C = {c: boolean}
type UNION = AB | C

const obj: UNION = {b: true, c: true} // ok 😳
```

## Tuple Bugs

Typescript [issue](https://github.com/microsoft/TypeScript/issues/6594#issuecomment-174315415) for context

```typescript
// typescript

const a: number[][] = [[1,2], [3,4]]
const b: number[] = [1,2]
const c: number[][] = a.concat(b) // no error

c // typescript type `number[][]`
c // runtime value `[[1,2], [3,4], 1, 2]`
```

[ts playground](https://www.typescriptlang.org/play?#code/MYewdgzgLgBAhgLhmArgWwEYFMBOBtAXUJgF4Y88BGAGgCYDryBmagFgIIChRJYMlUmXMTJU6XHtBjAB6bPiIFS8AHQ9gcKAAoMASk7cYAeiMwoATwAOWCMBwBLS7AvWYAA0HzChN4ZMwcFDAoezQsGAA3OAAbFHC3Chp6RjwWdkYaGHo3IA)
[flow raises an error as expected](https://flow.org/try/#0MYewdgzgLgBAhgLhmArgWwEYFMBOBtAXUJgF4Y88BGAGgCYDryBmagFgIIChRJYMlUmXMTJU6XHtBjAB6bPiIFS8AHQ9gcKAAoMASk7cYAeiMwoATwAOWCMBwBLS7AvWYAA0HzChN4ZMwcFDAoezQsGAA3OAAbFHC3Chp6RjwWdkYaGHo3IA)

## Enums

see [play](https://www.typescriptlang.org/play?#code/KYOwrgtgBACgNgQwJYigbwFBW1A9iYAGixwBcB3XYnKUgCwCdhgMBfDDUSKAOQQmAATdCWz5gUALxQA5OJnUylKbIq4Fo2o2YqZ9JsBlsOAY3wBnUlC7QAwhauYa43fMXY1utRpr6d0vW1DYwxSAE8ABwkAUXAIAGlgMPMVAGsk3AAzWkjgLNhEFABuKAB6UqgAInFKqAAfKrVahsq-YEqOTLAQE1IkfChM3FwACgjCkAAuAuQQQigQfiFpvgFBeZMzEEtp+23SAEoRGiRssYmpSQD5I7RWMorgBgZcBmn6CXColJl4WZkoAgQMIZJYGCgAOYAugIABuEhAuDw8IYiAiADoOCczuNZpdpH8UOjxLdNDRcSgHjMieJNOxNKcoCNFmt8bwloJiQRSTQaCyhFTVkIuSwaPTsUzNg42XtLCKebzsFL9lTZaQRXSQkNRnICApVJR9YEDDIjuVrM9Xu9crJqgRKgCkClEVYEOZzEgIYsAEZwT5IiIIBhLUhPPDZL4SX4TIwYbUjQkgEXzIWctTzNXotoHIA)

```typescript
enum Plain {
    one,
    two,
    three
}

enum Named {
    one = 'one',
    two = 'two',
    three = 'three'
}

const enum Const {
    one = 'one',
    two = 'two',
    three = 'three'
}

type EnumKeys = keyof typeof Plain; // "one" | "two" | "three"

function foo(plain: Plain, named: Named, cconst: Const) {
    if (plain === 'one') {} // error: the types 'Plain' and 'string' have no overlap.

    if (plain === Plain.one) {
        plain // Plain.one
    }

    if (named === Named.one) {
        named // Named.one
    }

    if (cconst === Const.one) {
        cconst // Const.one
    }
}

foo('one', 'two', 'three') // error: type '"one"' is not assignable to parameter of type 'Plain'

foo(Plain.one, Named.two, Const.three)
```

## Opaque types

Flow has support for `opaque` type aliases. They are the same as regular type aliases but do not allow access to their underlying type outside of the file in which they are defined.

```typescript
// @flow

// a.js

opaque type UserId = string

type User = {id: UserId, name: string}

declare function getUserById(id: UserId): User | void

// b.js (has to be a different file)

getUserById('1234') // error

const someId: UserId = '4321'

getUserById(someId) // ok
```

Typescript does not have such feature since it is not nominal yet you can get somewhat similar result

```typescript
// typescript

type Brand<K, T> = K & { __brand: T }

type UserId = Brand<string, 'userId'>
type User = {id: UserId, name: string}

declare function getUserById(id: UserId): User | void

getUserById('1234') // error

const someId: UserId = '4321'
//    ^^^^^^ Type 'string' is not assignable to type '{ __brand: "userId"; }'.

const castedId = '4321' as UserId // have to cast explicitly

getUserById(castedId) // ok
```

This has an issue since these "branded" types cannot be used to index collections.

```typescript
// typescript

type UserCollection = Record<UserId, User>

const userCollection: UserCollection = {}

let a = userCollection[castedId]
//      ^^^^^^^^^^^^^^^^^^^^^^^^ Element implicitly has an 'any' type because expression of
//                               type 'UserId' can't be used to index type 'UserCollection'
```

## Mapped types

For the typical `$ObjMap` & `$ObjMapi` enjoyers, typescript cannot call functions at a type level therefore they have a syntax for mapping over a union

```typescript
// typescript
type Union = 'A' | 'B' | 'C'

type Obj = {
    [K in Union]: K;
}

// typeof Obj -> {A: 'A'; B: 'B'; C: 'C'}
```

## Built-in utils

- Partial
- Required
- Readonly
- Record
- Pick
- Omit
- Exclude
- Extract
- NonNullable
- Parameters
- ConstructorParameters
- ReturnType
- InstanceType
- ThisParameterType
- OmitThisParameter
- ThisType

```typescript
// typescript

type Record<K extends string | number | symbol, T> = {
    [P in K]: T;
}

const userCollection: Record<UserId, User> = {
    '1': {
        id: '1',
        name: 'John Doe',
    }
}

// ======================

type Props = {
    active: boolean;
    className: string;
}

declare function MyComponent(props: Props): ReactNode

type GetComponentProps<T extends (props: any) => ReactNode> = Parameters<T>[0]

type CompProps = GetComponentProps<typeof MyComponent> // Props
```

## Generics syntax

### generic types

```typescript
// @flow

type ToTuple<T> = [T]

type ToStringTuple<T: string> = [T]

type ToDefaultToStringTuple<T = 'B'> = [T]

type ToTogetherTuple<T: string = 'C'> = [T]

type A = ToStringTuple<'A'>

type B = ToDefaultToStringTuple<>

type C = ToTogetherTuple<string>

const a: A = ['A']

const b: B = ['B']

const c: C = ['F']
```

```typescript
// typescript

type ToTuple<T> = [T]

type ToStringTuple<T extends string> = [T]

type ToDefaultToStringTuple<T = 'B'> = [T]

type ToTogetherTuple<T extends string = 'C'> = [T]

type A = ToStringTuple<'A'>

type _B = ToDefaultToStringTuple<>
//                              ^^ error: cannot be empty

type B = ToDefaultToStringTuple<string>

type C = ToTogetherTuple<string>

const a: A = ['A']

const b: B = ['B']

const c: C = ['F']
```

### generic functions

```typescript
// @flow

declare function foo<T>(arg: T): {foo: T}

declare function bar<T: string>(arg: T): {bar: T}

declare function baz<T: string = ''>(arg: T): {baz: T}
```

```typescript
// typescript

declare function foo<T>(arg: T): {foo: T}

declare function bar<T extends string>(arg: T): {bar: T}

declare function baz<T extends string = ''>(arg: T): {baz: T}
```

---

```typescript
// @flow

declare function easy<T: {a: string}>(arg: T): T

const aaa = easy({a: '', b: 42}) // ok

aaa // {|a: string, b: number|}

declare function strict<T: {|a: string|}>(arg: T): T

const bbb = strict({a: '', b: 42}) // error

const ccc = strict({a: ''}) // ok

ccc // {|a: string|}
```

```typescript
// typescript

declare function func<T extends {a: string}>(arg: T): T

const qlwerk = func({a: '', b: 42}) // ok

qlwerk // {a: string, b: number}
```

## Generic type variance

```typescript
// @flow

type A = {|a: string|}

type AB = {|a: string, b: string|}

type ABC = {|a: string, b: string, c: string|}

declare function takesAB<T: AB>(arg: T): void

declare var a__: A
declare var ab_: AB
declare var abc: ABC

takesAB(a__) // error

takesAB(ab_) // ok

takesAB(abc) // error
```

⚠️ Typescript generics are covariant and there's nothing one can do about it

```typescript
// typescript

type A = {a: string}

type AB = {a: string, b: string}

type ABC = {a: string, b: string, c: string}

declare function takesAB<T extends AB>(arg: T): void

declare var a__: A
declare var ab_: AB
declare var abc: ABC

takesAB(a__) // error

takesAB(ab_) // ok

takesAB(abc) // ok
```

While in flow generics are invariant by default, but one [can specify](https://flow.org/en/docs/types/generics/#toc-variance-sigils) if they want it to behave covariant or contravariant.

## Type variance

**Flow**:
- see [flow docs](https://flow.org/en/docs/lang/variance/)
- allows you to make types covariant or contravariant [docs](https://flow.org/en/docs/types/generics/#toc-variance-sigils)

**Typescript**

```typescript
// typescript

class Noun {}
class City extends Noun {}
class SanFrancisco extends City {}

declare function method(value: City): void

method(new Noun())         // ok
method(new City())         // ok
method(new SanFrancisco()) // ok

// stucture check, {} === {}
method({}) // proof

method([]) // 😳

method('foo') // still an object

method(null) // err
```

```typescript
// typescript

class Noun {
    count() { }
}
class City extends Noun {}
class SanFrancisco extends City {}

method(new Noun()) // ok

method(new City()) // ok

method(new SanFrancisco()) // ok

method({}) // error

method({ count() {} }) // ok
method(Object.assign([], { count() {} })) // ok
```

covariant like check

```typescript
// typescript

class Noun {
    constructor(public name: string) {}
}
class City extends Noun {
    constructor(public name: string, public geo: number) {
        super(name)
    }
}
class SanFrancisco extends City {
    constructor(public name: string, public geo: number, public whatever: string) {
        super(name, geo)
    }
}

declare function method(value: City): void

method(new Noun('moscow'))                 // error
method(new City('moscow', 42))             // ok
method(new SanFrancisco('moscow', 42, '')) // ok
```

### Conditional types

```typescript
// typescript

type IsString<T> = T extends string ? true : false

type A = IsString<string> // true

type B = IsString<{}> // false
```

### Infer

```typescript
// typescript

type ElementType<A> = A extends Array<infer U> ? U : never

type A = ElementType<string> // never

type B = ElementType<['A', 'B']> // 'A' | 'B'
```

```typescript
// typescript

declare function add(a: string, b: string): string
declare function add(a: number, b: number): number
declare function add(a: string | number, b: string | number): string | number

type SillyResult = ReturnType<typeof add> // string | number

type SmartReturnType<F, A extends Array<any>> = F extends (...args: A) => infer R ? R : never

type NotThatSilly = SmartReturnType<typeof add, [string, string]> // string | number

type AtLeastWeHaveThis = SmartReturnType<typeof add, [string, number]> // never
```

```typescript
// @flow

declare function add(a: string, b: string): string
declare function add(a: number, b: number): number
declare function add(a: string | number, b: string | number): string | number

type Returns = $Call<typeof add, string, string> // string
```
