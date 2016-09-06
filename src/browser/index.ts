import {DefaultThreadPool} from "../common/thread-pool/default-thread-pool";
import {BrowserWorkerThreadFactory} from "./worker/browser-worker-thread-factory";
import {FunctionRegistry} from "../common/serialization/function-registry";
import {parallelFactory} from "../common/parallel/parallel";

const functionLookupTable = new FunctionRegistry();
const maxConcurrencyLevel = (<any>window.navigator)["hardwareConcurrency"] || 4;
const threadPool = new DefaultThreadPool(new BrowserWorkerThreadFactory(functionLookupTable), functionLookupTable, {maxConcurrencyLevel});

export default parallelFactory({ threadPool, functionLookupTable, maxConcurrencyLevel });