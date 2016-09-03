var testsContext = require.context(".", true, /.*\.integration-specs\.ts$/);
testsContext.keys().forEach(testsContext);
