---
title: ESM dynamic import secrets
excerpt: Things you don't know about dynamic imports in ECMAScript modules.
---

Import calls A.K.A. `import()` has been a [part](https://tc39.es/ecma262/#sec-import-calls) of the ECMASpec for almost a decade. Besides allowing to dynamically import javascript modules it has a couple of gotchas and more tricks up its sleeve. Let's dig in.

## Thing you can import

All modern run times i.e. browser/node/deno/bun/etc support the most common cases

* Relative paths `import('./module.js')`
* Absolute paths `import('/Users/username/project/module.js')`
* Http\[s] URLs `import('https://example.com/module.js')`
* File URLs `import('file:///Users/username/project/module.js')`
* Data URLs `import('data:text/javascript,export default 42')`

Some run times may extend the supported cases and add other supported protocols. Example: nodejs supports `node:*` protocol to import [node's builtin modules](https://nodejs.org/api/esm.html#node-imports).

Before NodeJS added support for `require`'ing ES modules, dynamic import was the only way to load ES modules from a CommonJS module.

## Secret 1: windows paths

Absolute paths are tricky. The following code will work on MacOS and Linux but will fail on Windows.

```javascript
// file.cjs

import path from 'node:path';

import(path.join(__dirname, 'module.js'));
```

On unixy systems this resolves to

```javascript
import('/Users/username/project/module.js');
```

On Windows this resolves to

```javascript
import('c:\\Users\\username\\project\\module.js');
```

And results in an error:

> Only URLs with a scheme in: file, data, and node are supported by the default ESM loader. On Windows, absolute paths must be valid file:// URLs. Received protocol 'c:'

This throws an error as `c:` is not a supported protocol. In order to fix it you need to signal that the following is a file path. This can be done by using a supported file URL protocol


```javascript
import('file://c:\\Users\\username\\project\\module.js');
```

Now this will work as expected. But how can we do this? This brings us to the next secret.

## Secret 2: import.meta

[`import.meta`](https://tc39.es/ecma262/#sec-meta-properties) is a special object that is available on import keyword. Among other things it contains an utility method that can help us `import.meta.resolve()`. It resolves a module specifier to a URL

> import.meta.resolve() is a built-in function defined on the import.meta object of a JavaScript module that resolves a module specifier to a URL using the current module's URL as base.

<small>source: [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import.meta/resolve)</small>

Sounds exactly what we need.

```javascript
// file.cjs
import(import.meta.resolve('module.js'));
```

This works in ES modules. But since our file is a CommonJS module it throws an error as `import.meta` can only be using from within ES modules. For this reason in CommonJS files we have to fallback to node's builtin utility

```javascript
// file.cjs
import url from 'node:url';

import(url.pathToFileURL(path.join(__dirname, 'module.js')));
```

Hooray, it works on all platforms.

## Eval JavaScript

As you could notice, besides importing modules from URLs you can also import from data URLs. This can be used to eval JavaScript code.

```javascript
const mod = await import('data:text/javascript,export default 42');

console.log(mod.default); // 42
```

At first glance this may look like a good old `eval`. But it is not. The code is executed in a separate context and does not have access to the current scope. This is good not only for security reasons but also for correctly attributing errors.

## Secret 3: Keep source maps for generated code

```javascript
const mod = await import('data:text/javascript,export default 42\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjoiMS4wLjAifQ==');
```

Now if during the execution of our new "virtual" module an error occurs, the error will be correctly attributed to the original source file.
