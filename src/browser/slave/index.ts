import {ParallelWorkerFunctions} from "../../common/parallel/parallel-worker-functions";
import {staticFunctionRegistry} from "../../common/serialization/static-function-registry";
import {BrowserSlave} from "./browser-slave";

staticFunctionRegistry.registerStaticFunctions(ParallelWorkerFunctions);

const slave = new BrowserSlave();
onmessage = function () {
    slave.onMessage.apply(slave, arguments);
};
