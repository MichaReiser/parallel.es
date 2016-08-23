require('es6-promise').polyfill();


var testsContext = require.context(".", true, /.*specs\.ts$/);
testsContext.keys().forEach(testsContext);
