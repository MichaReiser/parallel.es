# parallel.es
[![Build Status](https://travis-ci.org/MichaReiser/parallel.es.svg?branch=master)](https://travis-ci.org/MichaReiser/parallel.es)
[![Coverage Status](https://coveralls.io/repos/github/MichaReiser/parallel.es/badge.svg?branch=master)](https://coveralls.io/github/MichaReiser/parallel.es?branch=master)
[![npm version](https://badge.fury.io/js/parallel-es.svg)](https://badge.fury.io/js/parallel-es)

A JavaScript library to perform parallel JavaScript computations with ease (and other environments soon).  

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

To show a progress update, use the [subscribe](https://michareiser.github.io/parallel.es/artifacts/docs/interfaces/parallel.iparallelchain.html#subscribe) method to register a callback that is invoked whenever a sub-result has been computed:

```js
parallel.range(0, 100000)
	.map(value => value * value)
	.subscribe((subresult, taskIndex) => console.log(`The result of the task ${taskIndex} is`, subresult);)
	.then(result => console.log(result));
```

For more detail, take a look at the [API](https://michareiser.github.io/parallel.es/artifacts/docs/interfaces/parallel.iparallel.html) Documentation.

## Debugging Support
Parallel.es uses function serialization and, therefore, debugging is not supported out of the box (except if the `debugger` statement is used. However, there is a [webpack plugin](https://github.com/MichaReiser/parallel-es-webpack-plugin) that transpiles the program code and generates the needed source maps to enable debugging (at least in Chrome and Firefox Nightly). 

## Referenced Functions, Variables, and Imports
Parallel.es uses function serialization and, therefore, the variables from the closure (outer scope) are no longer available when the function is invoked in the background thread. However, there is a [webpack plugin](https://github.com/MichaReiser/parallel-es-webpack-plugin) that rewrites your code and allows you to use constant variables, and as well, functions defined in the outer scope of the task function. The plugin also exposes any used imports in the background thread.

## Documentation
The [API Documentation](https://michareiser.github.io/parallel.es/artifacts/docs/interfaces/parallel.iparallel.html) is available online. The [wiki](../../wiki) describes the architecture in more detail. An academical description of the work is available [here](https://raw.githubusercontent.com/MichaReiser/parallel-es-report/master/parallel-es.pdf).

## Examples
An example project using parallel-es and comparing its performance to related projects is [parallel-es-example](https://github.com/MichaReiser/parallel-es-example). The examples are hosted  [here](https://michareiser.github.io/parallel-es-example/).

## Browsers support <sub><sup><sub><sub>made by @godban</sub></sub></sup></sub>

| [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/edge.png" alt="IE / Edge" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>IE / Edge | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/firefox.png" alt="Firefox" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/chrome.png" alt="Chrome" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/safari.png" alt="Safari" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Safari | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/opera.png" alt="Opera" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Opera | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/safari-ios.png" alt="iOS Safari" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>iOS Safari | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/chrome-android.png" alt="Chrome for Android" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Android |
| --------- | --------- | --------- | --------- | --------- | --------- | --------- |
| IE10, IE11, Edge| last 2 versions| last 2 versions| last 2 versions| last 2 versions| iOS 5.1, iOS 6, iOS 7, iOS 8, iOS 9| Chrome, Android 4.4

Automated browser testing is performed using [BrowserStack](https://www.browserstack.com)'s open source offer.

[![BrowserStack](./browser-stack.png?raw=true)](https://www.browserstack.com)
