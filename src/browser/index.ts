/**
 * Main Facade for the parallel module. The default export is the global {@link IParallel} instance.
 * @module parallel
 * @preferred
 */ /** */

import {parallelFactory} from "../common/parallel/parallel-impl";
import {FunctionRegistry} from "../common/function/function-registry";
import {DefaultThreadPool} from "../common/thread-pool/default-thread-pool";
import {BrowserWorkerThreadFactory} from "./worker/browser-worker-thread-factory";
import {DefaultParallelScheduler} from "../common/parallel/scheduling/default-parallel-scheduler";
import {IParallel} from "../common/parallel";

export {ITaskDefinition} from "../common/task/task-definition";
export {ITask} from "../common/task/task";
export {IFunctionDefinition} from "../common/function/function-defintion";
export {FunctionCall} from "../common/function/function-call";
export {ISerializedFunctionCall, isSerializedFunctionCall} from "../common/function/serialized-function-call";
export {FunctionCallSerializer} from "../common/function/function-call-serializer";
export {IThreadPool} from "../common/thread-pool/thread-pool";
export * from "../common/parallel";

const functionLookupTable = new FunctionRegistry();
const maxConcurrencyLevel = (window.navigator as any)["hardwareConcurrency"] || 4;
const threadPool = new DefaultThreadPool(new BrowserWorkerThreadFactory(functionLookupTable), functionLookupTable, {maxConcurrencyLevel});

/**
 * The global parallel instance.
 */
const parallel: IParallel = parallelFactory({ maxConcurrencyLevel, scheduler: new DefaultParallelScheduler(), threadPool });
export default parallel;
