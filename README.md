# parallel.es
[![Build Status](https://travis-ci.org/DatenMetzgerX/parallel.es.svg?branch=master)](https://travis-ci.org/DatenMetzgerX/parallel.es)
[![Coverage Status](https://coveralls.io/repos/github/DatenMetzgerX/parallel.es/badge.svg?branch=master)](https://coveralls.io/github/DatenMetzgerX/parallel.es?branch=master)

A JavaScript library that simplifies parallel computation in the browser (and other environments soon).  

## Getting Started
Install the library using npm:

```sh
npm install --save parallel-es
```

Perform a single computation on a worker thread:

```js
import parallel from "parallel-es";

parallel.run(function () {
	//… compute
	return [1, 2, 3];
}).then(result => console.log(result));
```

Or use the reactive api that automatically schedules the work onto multiple worker without any additional doing:

```js
parallel.range(0, 100000)
	.map(value => value * value)
	.then(result => console.log(result));
```

## Debugging Support
The Library uses Function serialization and therefore debugging is not supported out of the box. However, there is a [webpack plugin](https://github.com/DatenMetzgerX/parallel-es-webpack-plugin) that rewrites your code in a way that allows debugging (at least in Chrome and Firefox Nightly). 

## Referencing Functions and Variables
The library uses function serialization and therefore the outer scope is no longer available when the function is invoked in the  worker thread. However, there is a [webpack plugin](https://github.com/DatenMetzgerX/parallel-es-webpack-plugin) that rewrites your code and allows you to use const variables from the outer scope or reference functions.

## Documentation
The [API Documentation](https://datenmetzgerx.github.io/parallel.es/artifacts/docs/interfaces/parallel.iparallel.html) is available online. The [wiki](./wiki) describes the architecture and programing model in more detail.

## Examples
More sophisticated examples can be seen [here](https://datenmetzgerx.github.io/parallel.es/artifacts/example.html).

## Browsers support <sub><sup><sub><sub>made by @godban</sub></sub></sup></sub>

| [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/edge.png" alt="IE / Edge" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>IE / Edge | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/firefox.png" alt="Firefox" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/chrome.png" alt="Chrome" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/safari.png" alt="Safari" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Safari | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/opera.png" alt="Opera" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Opera | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/safari-ios.png" alt="iOS Safari" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>iOS Safari | [<img src="https://raw.githubusercontent.com/godban/browsers-support-badges/master/src/images/chrome-android.png" alt="Chrome for Android" width="16px" height="16px" />](http://godban.github.io/browsers-support-badges/)</br>Android |
| --------- | --------- | --------- | --------- | --------- | --------- | --------- |
| IE10, IE11, Edge| last 2 versions| last 2 versions| last 2 versions| last 2 versions| iOS 5.1, iOS 6, iOS 7, iOS 8, iOS 9| Chrome, Android 4.4

Automated browser testing is performed using [BrowserStack](https://www.browserstack.com)'s open source offer.

[![BrowserStack](./browser-stack.png?raw=true)](https://www.browserstack.com)
