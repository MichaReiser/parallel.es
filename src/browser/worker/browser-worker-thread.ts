import {FunctionRegistry} from "../../common/serialization/function-registry";
import {TaskDefinition} from "../../common/task/task-definition";
import {
    IFunctionRequest, initializeWorkerMessage, isFunctionExecutionError, isFunctionRequest, isWorkerResult, IWorkerMessage,
    functionResponseMessage, stopMessage, scheduleTaskMessage
} from "../../common/worker/worker-messages";
import {WorkerThread} from "../../common/worker/worker-thread";

let workerThreadId = 0;

/**
 * Worker Thread Endpoint in the UI-Thread.
 * Implements the communication with the web worker endpoint in the worker thread.
 */
export class BrowserWorkerThread implements WorkerThread {

    /**
     * Unique id of this worker thread
     */
    public id = ++workerThreadId;
    public oncomplete: (result: any) => void;
    public onerror: (error: any) => void;

    constructor(private worker: Worker, private functionLookupTable: FunctionRegistry) {
        const that = this;
        this.worker.addEventListener("message", function () {
            that.onWorkerMessage.apply(that, arguments);
        });
        this.worker.addEventListener("error", function () {
            that.onError.apply(that, arguments);
        });
    }

    /**
     * Assigns a unique id to the worker
     */
    public initialize() {
        this.sendMessage(initializeWorkerMessage(this.id));
    }

    /**
     * Executes the given task on the worker
     * @param task the task to execute
     */
    public run(task: TaskDefinition): void {
        this.sendMessage(scheduleTaskMessage(task));
    }

    public toString(): string {
        return `BrowserWorkerThread { id: ${this.id} }`;
    }

    /**
     * Stops the worker as soon as it receives the message. Does not wait to complete the task.
     */
    public stop(): void {
        this.sendMessage(stopMessage());
    }

    private onWorkerMessage(event: MessageEvent): void {
        const message = event.data;
        if (isFunctionRequest(message)) {
            const definitions = (message as IFunctionRequest).functionIds.map(functionId => {
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

    private sendMessage(message: IWorkerMessage): void {
        this.worker.postMessage(message);
    }
}
