import {BrowserSlave} from "./browser-slave";
import {staticFunctionRegistry} from "../../common/serialization/static-function-registry";
import {ParallelWorkerFunctions} from "../../common/parallel/parallel-worker-functions";

staticFunctionRegistry.registerStaticFunctions(ParallelWorkerFunctions);

const slave = new BrowserSlave();
onmessage = slave.onMessage.bind(slave);