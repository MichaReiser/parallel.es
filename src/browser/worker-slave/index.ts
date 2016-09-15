import {ParallelWorkerFunctions} from "../../common/parallel/parallel-worker-functions";
import {staticFunctionRegistry} from "../../common/serialization/static-function-registry";
import {BrowserWorkerSlave} from "./browser-worker-slave";

staticFunctionRegistry.registerStaticFunctions(ParallelWorkerFunctions);

const slave = new BrowserWorkerSlave();
onmessage = function () {
    slave.onMessage.apply(slave, arguments);
};
