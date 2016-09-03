import {WorkerThread} from "../../common/worker/worker-thread";
import {TaskDefinition} from "../../common/task/task-definition";
import {
    WorkerMessage, initializeWorkerMessage, scheduleTaskMessage, isFunctionRequest,
    functionResponseMessage, isWorkerResult, isFunctionExecutionError, stopMessage, FunctionRequest
} from "../../common/worker/worker-messages";
import {FunctionRegistry} from "../../common/serialization/function-registry";

let workerThreadId = 0;

/**
 * Worker Thread Endpoint in the UI-Thread.
 * Implements the communication with the web worker endpoint in the worker thread.
 */
export class BrowserWorkerThread implements WorkerThread {

    /**
     * Unique id of this worker thread
     */
    id = ++workerThreadId;
    oncomplete: (result: any) => void;
    onerror: (error: any) => void;

    constructor(private worker: Worker, private functionLookupTable: FunctionRegistry) {
        this.worker.addEventListener("message", this.onWorkerMessage.bind(this));
        this.worker.addEventListener("error", this.onError.bind(this));
    }

    /**
     * Assigns a unique id to the worker
     */
    initialize() {
        this.sendMessage(initializeWorkerMessage(this.id));
    }

    /**
     * Executes the given task on the worker
     * @param task the task to execute
     */
    run(task: TaskDefinition): void {
        this.sendMessage(scheduleTaskMessage(task));
    }

    toString(): string {
        return `BrowserWorkerThread { id: ${this.id} }`;
    }

    /**
     * Stops the worker as soon as it receives the message. Does not wait to complete the task.
     */
    stop(): void {
        this.sendMessage(stopMessage());
    }

    private onWorkerMessage(event: MessageEvent): void {
        const message = event.data;
        if (isFunctionRequest(message)) {
            const definitions = (message as FunctionRequest).functionIds.map(functionId => {
                const definition = this.functionLookupTable.getDefinition(functionId);
                if (!definition) {
                    throw Error(`${this} requested unknown function with id ${functionId}`);
                }
                return definition;
            });
            this.sendMessage(functionResponseMessage(definitions));
        } else if (isWorkerResult(message)) {
            if (this.oncomplete) {
                this.oncomplete(message.result);
            }
        } else if (isFunctionExecutionError(message)) {
            if (this.onerror) {
                this.onerror(message.error);
            }
        } else {
            throw new Error(`Message from worker cannot be processed ${message.type}`);
        }
    }

    private onError(event: ErrorEvent): void {
        if (this.onerror) {
            this.onerror(event.error);
        }
    }

    private sendMessage(message: WorkerMessage): void {
        this.worker.postMessage(message);
    }
}