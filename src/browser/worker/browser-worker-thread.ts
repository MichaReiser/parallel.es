import {FunctionRegistry} from "../../common/serialization/function-registry";
import {ITaskDefinition} from "../../common/task/task-definition";
import {initializeWorkerMessage, IWorkerMessage, stopMessage, scheduleTaskMessage} from "../../common/worker/worker-messages";
import {IWorkerThread} from "../../common/worker/worker-thread";
import { BrowserWorkerThreadState, BrowserWorkerThreadExecutingState } from "./browser-worker-thread-state";

let workerThreadId = 0;

/**
 * Worker Thread Endpoint in the UI-Thread.
 * Implements the communication with the {@link BrowserWorkerSlave} in the worker thread.
 */
export class BrowserWorkerThread implements IWorkerThread {

    /**
     * Unique id of this worker thread
     */
    public id = ++workerThreadId;

    /**
     * The current state of the browser worker thread
     */
    public state: BrowserWorkerThreadState = new BrowserWorkerThreadState("default");

    private stopped: boolean = false;

    /**
     * Creates a new instance that communicates with the given worker
     * @param worker the {@link BrowserWorkerSlave}
     * @param functionLookupTable
     */
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
     * Can only be invoked once. Must be invoked before any task is scheduled.
     */
    public initialize() {
        if (this.state.name !== "default") {
            throw new Error(`The browser worker thread can only be initialized if in state default but actual state is '${this.state.name}'.`);
        }

        this.sendMessage(initializeWorkerMessage(this.id));
        this.state = new BrowserWorkerThreadState("idle");
    }

    /**
     * Executes the given task on the worker.
     * Requires that the worker thread has been initialized
     * @param task the task to execute
     */
    public run(task: ITaskDefinition, callback: (error: any, result: any) => void): void {
        if (this.state.name !== "idle") {
            throw new Error(`The browser worker thread can only execute a new task if in state idle but actual state is '${this.state.name}'.`);
        }

        this.sendMessage(scheduleTaskMessage(task));
        const onComplete = (error: any, result: any) => {
            if (!this.stopped) {
                this.state = new BrowserWorkerThreadState("idle");
            } else {
                this.state = new BrowserWorkerThreadState("stopped");
            }
            callback(error, result);
        };
        this.state = new BrowserWorkerThreadExecutingState(onComplete, this.functionLookupTable, this.worker);
    }

    /**
     * Stops the worker as soon as it receives the message. Does not wait to complete the task.
     */
    public stop(): void {
        if (this.stopped) {
            return;
        }

        this.sendMessage(stopMessage());
        this.stopped = true;
        if (this.state.name !== "executing") {
            this.state = new BrowserWorkerThreadState("stopped");
        }
    }

    public toString(): string {
        return `BrowserWorkerThread { id: ${this.id}, state: ${this.state.name }`;
    }

    private onWorkerMessage(event: MessageEvent): void {
        this.state.onMessage(event);
    }

    private onError(event: ErrorEvent): void {
        this.state.onError(event);
        this.state = new BrowserWorkerThreadState("errored");
    }

    private sendMessage(message: IWorkerMessage): void {
        this.worker.postMessage(message);
    }
}
