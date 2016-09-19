import {IWorkerThreadFactory} from "../../common/worker/worker-thread-factory";
import {IWorkerThread} from "../../common/worker/worker-thread";
import {BrowserWorkerThread} from "./browser-worker-thread";
import {FunctionRegistry} from "../../common/function/function-registry";

declare function require(module: string): any;
/* tslint:disable:no-var-requires */
const SlaveWorker = require("worker?inline=true&name=worker-slave.parallel-es.js!../worker-slave");

/**
 * Thread factory that creates web worker based threads using {@link BrowserWorkerThread}.
 */
export class BrowserWorkerThreadFactory implements IWorkerThreadFactory {
    constructor(private functionLookupTable: FunctionRegistry) {}

    public spawn(): IWorkerThread {
        if (!(window as any)["Worker"]) {
            throw new Error("Missing Web Worker support");
        }

        const webWorker = new SlaveWorker();
        const workerThread = new BrowserWorkerThread(webWorker, this.functionLookupTable);
        workerThread.initialize();
        return workerThread;
    }
}
