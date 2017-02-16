import {spawn} from "child_process";

import {IWorkerThreadFactory} from "../../common/worker/worker-thread-factory";
import {DefaultWorkerThread} from "../../common/worker/default-worker-thread";
import {IWorkerThread} from "../../common/worker/worker-thread";
import {DynamicFunctionRegistry} from "../../common/function/dynamic-function-registry";
import {ChildProcessWorkerThreadSlaveCommunicationChannel} from "./child-process-worker-thread-slave-communication-channel";

export class NodeWorkerThreadFactory implements IWorkerThreadFactory {
    constructor(private functionLookupTable: DynamicFunctionRegistry) {}

    public spawn(): IWorkerThread {
        // TODO get es5 or es6 version
        const child = spawn("./node-slave.parallel.js");

        return new DefaultWorkerThread(this.functionLookupTable, new ChildProcessWorkerThreadSlaveCommunicationChannel(child));
    }
}
