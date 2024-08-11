---
tags: [typescript]
title: Typescript assertions
---

The below implies that you have already read the [type assertions](https://www.typescriptlang.org/docs/handbook/basic-types.html#type-assertions) section in typescript documentation.

## List of content

- [`as` cast operator](#as-cast-operator)
- [Const assertions](#const-assertions)
- [Assert functions](#assert-functions)
- [Key remapping in mapped types](#key-remapping-in-mapped-types)

## `as` cast operator

Added in [v1.6](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-1-6.html#new-tsx-file-extension-and-as-operator)

This operator allows you to explicitly cast the type for a value of a different type without typescript raising an error. This is a dangerous a foot gun like feature that should be used with care and consciously. To quote the typescript docs this is a way to tell the compiler `trust me, I know what I’m doing.`

This feature has two ways to use it.

```ts
const a = notFoo as Foo;
/**
 * The same thing
 * but wont work for `.tsx` files
 */
const b = <Foo>notFoo;

/**
 * now both `a` and `b` are of type `Foo`
 */
```

## Const assertions

`const foo = {} as const`

Added in [v3.4](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)

This feature allows you to disable type widening when declaring values in typescript.

```ts
const plainObj = {a: 1, b: 'foo'};

plainObj; // {a: number; b: string}

const constObj = {a: 1, b: 'foo'} as const;
const constObjAlt = <const>{a: 1, b: 'foo'};

constObj; // {readonly a: 1; readonly b: 'foo'}
```

This is **not** the same as using `Object.freeze`

```ts
const constObj = {a: 1, b: 'foo', c: {d: 'bar'}} as const;

constObj; // {readonly a: 1, readonly b: 'foo', readonly c: {readonly d: 'bar}}

// @ts-expect-error Cannot assign to 'd' because it is a read-only property.
constObj.c.d = 'foo'

const frozen = Object.freeze({a: 1, b: 'foo', c: {d: 'bar'}})

frozen; // Readonly<{a: number; b: string; c: {d: string}}>

// @ts-expect-error Cannot assign to 'b' because it is a read-only property.
frozen.b = 'foo 2'

// no error since `Readonly` is not deep
frozen.c.d = 'foo'
```

The key things that happen when const assertions are being used are:

- no literal types in that expression should be widened (e.g. no going from `"hello"` to `string`)
- object literals get `readonly` properties
- array literals become `readonly` tuples

## Assert functions

Added in [v3.7](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions)

Assert functions are similar to `type guards` with the only difference that the function throws instead of returning a falsy value. This works on par with nodejs [`assert`](https://nodejs.org/docs/latest/api/assert.html) module.

Using assert function you can validate an input ie

```ts
function plainAssertion(arg: unknown): asserts arg {
    if (!arg) {
        throw new Error(`arg is expected to be truthy, got "${arg}"`);
    }
}

function foo(input: boolean, item: string | null) {
    input; // boolean
    plainAssertion(input);
    input; // true

    item; // string | null
    plainAssertion(item);
    item; // string
}
```

Alternatively you can narrow down the type to be more specific. This is when the similarity with `type guards` shows.

```ts
function specificAssertion(arg: unknown): asserts arg is string {
    if (typeof arg !== 'string') {
        throw new Error(`arg is expected to be string, got "${arg}"`)
    }
}

function bar(input: string | null) {
    input; // string | null
    specificAssertion(input);
    input; // string
}
```

## Key remapping in mapped types

ie `{[K in keyof T as Foo]: T[K]}`

Added in [v4.1](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html#key-remapping-in-mapped-types)

Reminder of mapped type syntax in typescript

```ts
type Inlined = {
    [key in 'a' | 'b' | 'c']: string
};

type Keys = 'a' | 'b' | 'c';
type Aliased = {
    [key in Keys]: string
};

/**
 * both `Inlined` and `Aliased` have the type
 * `{a: string; b: string; c: string}`
 */
```

Even though the example in the typescript docs present this feature to be useful in many cases when working with object keys. There are times when there is no need for it.

From the typescript docs:

```ts
// Remove the 'kind' property
type RemoveKindField<T> = {
    [K in keyof T as Exclude<K, "kind">]: T[K]
};

interface Circle {
    kind: "circle";
    radius: number;
}

type KindlessCircle = RemoveKindField<Circle>;
//   ^ = type KindlessCircle = {
//       radius: number;
//   }
```

This gets you the same result

```ts
type RemoveKindField<T> = {
    [K in Exclude<keyof T, "kind">]: T[K]
};
```

Where this feature shines is when you would like to remap the keys using template literal type with having the old key to extract the original value type.

Example from typescript docs:

```ts
type Getters<T> = {
    [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
};

interface Person {
    name: string;
    age: number;
    location: string;
}

type LazyPerson = Getters<Person>;
//   ^ = type LazyPerson = {
//       getName: () => string;
//       getAge: () => number;
//       getLocation: () => string;
//   }
```
