/**
 * Main Facade for the parallel module. The default export is the global {@link IParallel} instance.
 * @module parallel
 * @preferred
 */ /** */

import {parallelFactory} from "../common/parallel/parallel-impl";
import {FunctionRegistry} from "../common/serialization/function-registry";
import {DefaultThreadPool} from "../common/thread-pool/default-thread-pool";
import {BrowserWorkerThreadFactory} from "./worker/browser-worker-thread-factory";

export {ITaskDefinition} from "../common/task/task-definition";
export {ITask} from "../common/task/task";
export {IThreadPool} from "../common/thread-pool/thread-pool";
export {IParallel} from "../common/parallel/parallel";
export {IParallelOptions} from "../common/parallel/parallel-options";
export {IParallelStream} from "../common/parallel/parallel-stream";
export {IParallelChain} from "../common/parallel/parallel-chain";
export {IParallelTaskEnvironment, IEmptyParallelEnvironment} from "../common/parallel/parallel-environment";

const functionLookupTable = new FunctionRegistry();
const maxConcurrencyLevel = (window.navigator as any)["hardwareConcurrency"] || 4;
const threadPool = new DefaultThreadPool(new BrowserWorkerThreadFactory(functionLookupTable), functionLookupTable, {maxConcurrencyLevel});

/**
 * The global parallel instance.
 */
const parallel = parallelFactory({ threadPool, maxConcurrencyLevel });
export default parallel;
