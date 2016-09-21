import {BrowserWorkerSlave} from "./browser-worker-slave";
import {SlaveFunctionLookupTable} from "../../common/function/slave-function-lookup-table";
import {registerStaticParallelFunctions} from "../../common/parallel/slave/register-parallel-worker-functions";

const cache = new SlaveFunctionLookupTable();
registerStaticParallelFunctions(cache);

const slave = new BrowserWorkerSlave(cache);
onmessage = function () {
    slave.onMessage.apply(slave, arguments);
};
