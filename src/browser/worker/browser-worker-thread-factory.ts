import {WorkerThreadFactory} from "../../common/worker/worker-thread-factory";
import {WorkerThread} from "../../common/worker/worker-thread";
import {BrowserWorkerThread} from "./browser-worker-thread";
import {DynamicFunctionLookupTable} from "../../common/thread-pool/dynamic-function-lookup-table";

declare function require(module: string): any;
const SlaveWorker = require("worker?name=worker-slave.parallel-es.js!../slave/browser-slave");

/**
 * Thread factory that creates web worker based threads.
 */
export class BrowserWorkerThreadFactory implements WorkerThreadFactory {
    constructor(private functionLookupTable: DynamicFunctionLookupTable) {}

    spawn(): WorkerThread {
        if (!(<any>window)["Worker"]) {
            throw new Error("Missing Web Worker support");
        }

        const webWorker = new SlaveWorker();
        const workerThread = new BrowserWorkerThread(webWorker, this.functionLookupTable);
        workerThread.initialize();
        return workerThread;
    }
}