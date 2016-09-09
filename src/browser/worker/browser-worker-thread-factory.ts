import {WorkerThreadFactory} from "../../common/worker/worker-thread-factory";
import {WorkerThread} from "../../common/worker/worker-thread";
import {BrowserWorkerThread} from "./browser-worker-thread";
import {FunctionRegistry} from "../../common/serialization/function-registry";

declare function require(module: string): any;
/* tslint:disable:no-var-requires */
const SlaveWorker = require("worker?inline=true&name=worker-slave.parallel-es.js!../slave");

/**
 * Thread factory that creates web worker based threads.
 */
export class BrowserWorkerThreadFactory implements WorkerThreadFactory {
    constructor(private functionLookupTable: FunctionRegistry) {}

    public spawn(): WorkerThread {
        if (!(window as any)["Worker"]) {
            throw new Error("Missing Web Worker support");
        }

        const webWorker = new SlaveWorker();
        const workerThread = new BrowserWorkerThread(webWorker, this.functionLookupTable);
        workerThread.initialize();
        return workerThread;
    }
}
