import { IWorkerThreadFactory } from "../../common/worker/worker-thread-factory";
import { IWorkerThread } from "../../common/worker/worker-thread";
import { DynamicFunctionRegistry } from "../../common/function/dynamic-function-registry";
import { WebWorkerThreadSlaveCommunicationChannel } from "./web-worker-thread-slave-communication-channel";
import { DefaultWorkerThread } from "../../common/worker/default-worker-thread";

declare function require(module: string): any;
/* tslint:disable:no-var-requires */
const SlaveWorker = require("worker-loader?name=worker-slave!../worker-slave");

/**
 * Thread factory that creates web worker based threads using {@link BrowserWorkerThread}.
 */
export class BrowserWorkerThreadFactory implements IWorkerThreadFactory {
	constructor(private functionLookupTable: DynamicFunctionRegistry) {}

	public spawn(): IWorkerThread {
		if (!(window as any)["Worker"]) {
			throw new Error("Missing Web Worker support");
		}

		const webWorker = new SlaveWorker();
		const workerThread = new DefaultWorkerThread(
			this.functionLookupTable,
			new WebWorkerThreadSlaveCommunicationChannel(webWorker),
		);
		workerThread.initialize();
		return workerThread;
	}
}
