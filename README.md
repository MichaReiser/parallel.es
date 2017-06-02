# parallel.es
[![Build Status](https://travis-ci.org/MichaReiser/parallel.es.svg?branch=master)](https://travis-ci.org/MichaReiser/parallel.es)
[![Coverage Status](https://coveralls.io/repos/github/MichaReiser/parallel.es/badge.svg?branch=master)](https://coveralls.io/github/MichaReiser/parallel.es?branch=master)
[![npm version](https://badge.fury.io/js/parallel-es.svg)](https://badge.fury.io/js/parallel-es)

A JavaScript library to perform parallel JavaScript computations with ease. Full support for the browser and limited support in Node.js.  

## Getting Started
Install Parallel.es using npm:

```sh
npm install --save parallel-es
```

or yarn:

```sh
yarn add parallel-es
```

Performing a single computation in a background thread is as simple as calling a normal method:

```js
import parallel from "parallel-es";

parallel.run(function () {
	//… compute
	return [1, 2, 3];
}).then(result => console.log(result));
```

Or use the reactive API to parallelize data stream based operations. The reactive API automatically splits the input array into sub-arrays, computes the sub-results in a web worker, and joins the resulting arrays:

```js
parallel.range(0, 100000)
	.map(value => value * value)
	.then(result => console.log(result));
```
Note: Lamda functions like `value => value * value` require a compilation step to ES5 functions such as `function(value) {return value * value}`.

To show a progress update, use the [subscribe](https://michareiser.github.io/parallel.es/artifacts/docs/interfaces/parallel.iparallelchain.html#subscribe) method to register a callback that is invoked whenever a sub-result has been computed:

```js
parallel.range(0, 100000)
  .map(value => value * value)
  .subscribe((subresult, taskIndex) => console.log(`The result of the task ${taskIndex} is`, subresult);)
  .then(result => console.log(result));
```

`filter`, `reduce` and `catch` can be chained as well:
```js
parallel.range(0, 10)
  .map(value => value * value)
  .filter(value => value % 2 === 0)
  .reduce(0, (acc, val) => acc + val)
  .subscribe((subresult, taskIndex) => console.log(`The result of the task ${taskIndex} is`, subresult);)
  .then(result => console.log(result))
  .catch(err => {throw new Error(`We have problems: ${err}`)})
  // result: 120
```

Iterate over a collection using `from`:
```js
const addresses = [
  {num: '123', street: 'Main St.', city: 'Boulder', zip: '80305'},
  {num: '555', street: 'Elm St.', city: 'Boulder', zip: '80305'},
  {num: '100', street: '10th Ave.', city: 'Boulder', zip: '80305'}
]

function formatAddresses(address) {
  const {num, street, city, zip} = address
  return `${num} ${street} ${city} ${zip}`
}

parallel.from(addresses)
  .map(formatAddresses)
  .subscribe((subresult, taskIndex) => console.log(`The result of the task ${taskIndex} is`, subresult))
  .then(result => console.log(result))
```

For more detail, take a look at the [API Documentation](https://michareiser.github.io/parallel.es/artifacts/docs/interfaces/parallel.iparallel.html).

## Debugging Support
Parallel.es uses function serialization and, therefore, debugging is not supported out of the box (except if the `debugger` statement is used. However, there is a [webpack plugin](https://github.com/MichaReiser/parallel-es-webpack-plugin) that transpiles the program code and generates the needed source maps to enable debugging (at least in Chrome and Firefox Nightly).

## Referenced Functions, Variables, and Imports
Parallel.es uses function serialization and, therefore, the variables from the closure (outer scope) are no longer available when the function is invoked in the background thread. However, there is a [webpack plugin](https://github.com/MichaReiser/parallel-es-webpack-plugin) that rewrites your code and allows you to use constant variables, and as well, functions defined in the outer scope of the task function. The plugin also exposes any used imports in the background thread.

## Caveats
* Requires compilation to ES5 environment. See [this ticket](https://github.com/MichaReiser/parallel.es/issues/105#issuecomment-301850333) for more information
* Automatic inclusion of environment functions and debugging inside those functions require a webpack plugin. This is currently only support in the browser. [PRs for Node.js](https://github.com/MichaReiser/parallel-es-webpack-plugin) welcome. More context on [environment variables in node.js here](https://github.com/MichaReiser/parallel.es/issues/106)
* Cannot use [`lodash` functions](https://github.com/MichaReiser/parallel.es/issues/103#issuecomment-301775103) passed to the worker environment
* Cannot [bind arguments to functions](https://github.com/MichaReiser/parallel.es/issues/103#issuecomment-301775103) being mapped over. For example, `parallel.map(myFunc.bind(null, arg1))` will not work.

## Documentation
The [API Documentation](https://michareiser.github.io/parallel.es/artifacts/docs/interfaces/parallel.iparallel.html) is available online. The [wiki](../../wiki) describes the architecture in more detail. An academical description of the work is available [here](https://raw.githubusercontent.com/MichaReiser/parallel-es-report/master/parallel-es.pdf).

## Examples
An example project using parallel-es and comparing its performance to related projects is [parallel-es-example](https://github.com/MichaReiser/parallel-es-example). The examples are hosted  [here](https://michareiser.github.io/parallel-es-example/). More [examples here](https://github.com/jefffriesen/parallel-es-node-example).

## Browsers support <sub><sup><sub><sub>made by @godban</sub></sub></sup></sub>

| [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/edge.png" alt="IE / Edge" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>IE / Edge | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/firefox.png" alt="Firefox" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/chrome.png" alt="Chrome" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/safari.png" alt="Safari" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Safari | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/opera.png" alt="Opera" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Opera | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/safari-ios.png" alt="iOS Safari" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>iOS Safari | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/chrome-android.png" alt="Chrome for Android" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Android |
| --------- | --------- | --------- | --------- | --------- | --------- | --------- |
| IE10, IE11, Edge| last 2 versions| last 2 versions| last 2 versions| last 2 versions| iOS 5.1, iOS 6, iOS 7, iOS 8, iOS 9| Chrome, Android 4.4

Automated browser testing is performed using [BrowserStack](https://www.browserstack.com)'s open source offer.

[![BrowserStack](./browser-stack.png?raw=true)](https://www.browserstack.com)

## Node Support
Currently the [webpack plugin](https://github.com/MichaReiser/parallel-es-webpack-plugin) that binds environment variables and allows debugging inside the worker context does not work with Node. This really limits the usability of this in node.js. You can manually bind functions to the environment. If you're interested in using this for Node, you can submit a PR to to the webpack repo to enable this. [An example of passing data](https://github.com/jefffriesen/parallel-es-node-example/blob/master/src/parallel-from-environment.ts) to the worker environment:

```js
// pass in an object with values and serializable functions (not lodash)
const environment = {
  zip: '80305'
}

const addresses = [
  {num: '123', street: 'Main St.', city: 'Boulder'},
  {num: '555', street: 'Elm St.', city: 'Boulder'},
]

function formatAddresses(address, environment): string {
  const {zip} = environment
  const {num, street, city} = address
  return `${num} ${street} ${city} ${zip}`
}

parallel.from(addresses)
  .inEnvironment(environment)
  .map(formatAddresses)
  .then(result => console.log(result))
```

## Related Work
There exist other runtime systems with identical or similar goals. The [report](https://raw.githubusercontent.com/MichaReiser/parallel-es-report/master/parallel-es.pdf) of the project thesis compares these runtime systems concerning applicability and runtime performance.

* [Parallel.js](https://github.com/parallel-js/parallel.js)
* [Hamsters.js](http://www.hamsters.io/)
* [Threads.js](https://github.com/andywer/threads.js)
