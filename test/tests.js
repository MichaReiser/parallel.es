require("../src/index");

var testsContext = require.context(".", true, /.*specs\.ts$/);
testsContext.keys().forEach(testsContext);
