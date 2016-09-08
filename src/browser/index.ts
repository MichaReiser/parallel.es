import {parallelFactory} from "../common/parallel/parallel";
import {FunctionRegistry} from "../common/serialization/function-registry";
import {DefaultThreadPool} from "../common/thread-pool/default-thread-pool";
import {BrowserWorkerThreadFactory} from "./worker/browser-worker-thread-factory";

const functionLookupTable = new FunctionRegistry();
const maxConcurrencyLevel = (window.navigator as any)["hardwareConcurrency"] || 4;
const threadPool = new DefaultThreadPool(new BrowserWorkerThreadFactory(functionLookupTable), functionLookupTable, {maxConcurrencyLevel});

/**
 * The global parallel instance.
 */
const parallel = parallelFactory({ threadPool, functionLookupTable, maxConcurrencyLevel });
export default parallel;
