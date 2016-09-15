import {ITask} from "./task";
import {ITaskDefinition} from "./task-definition";
import {IWorkerThread} from "../worker/worker-thread";

/**
 * Default implementation of a task.
 * Executes the task on a {@link IWorkerThread}.
 */
export class WorkerTask<T> implements ITask<T> {
    public isCancellationRequested = false;
    public isCanceled = false;

    private resolve: (result?: T) => void;
    private reject: (error: any) => void;
    private worker?: IWorkerThread;
    private promise: Promise<T>;

    /**
     * Creates a new worker task that executes the operation defined by the given definition
     * @param definition the definition of the operation to execute
     */
    constructor(public definition: ITaskDefinition) {
        this.promise = new Promise<T>((resolvePromise, rejectPromise) => {
            this.resolve = resolvePromise;
            this.reject = rejectPromise;
        });
    }

    /**
     * Executes the task on the given worker. Assumes that the worker is not performing any other work at the moment.
     * If the task has been canceled in the meantime, no operation is performed and the reject callback is invoked immediately.
     * @param worker the worker thread that should be used to execute this task
     */
    public runOn(worker: IWorkerThread): void {
        this.worker = worker;

        if (!this.isCancellationRequested) {
            const callback = (error: any, result: any) => {
                if (error) {
                    this.reject(error);
                } else {
                    this._taskCompleted(result);
                }
            };

            this.worker.run(this.definition, callback);
        } else {
            this._taskCompleted(undefined);
        }
    }

    /**
     * Releases the used worker.
     * @returns {IWorkerThread} the worker used by this task
     */
    public releaseWorker(): IWorkerThread {
        if (!this.worker) {
            throw new Error("Cannot release a worker task that has no assigned worker thread.");
        }

        const worker = this.worker;
        this.worker = undefined;
        return worker;
    }

    public then<TResult>(onfulfilled: (value: T) => (PromiseLike<TResult>|TResult), onrejected?: (reason: any) => (PromiseLike<TResult>|TResult)): Promise<TResult> {
        if (onrejected) {
            return this.promise.then(onfulfilled, onrejected);
        }
        return this.promise.then(onfulfilled);
    }

    public catch(onrejected: (reason: any) => (PromiseLike<T>|T)): Promise<T> {
        return this.promise.catch(onrejected);
    }

    public cancel(): void {
        this.isCancellationRequested = true;
    }

    /**
     * Registers a handler that is invoked always invoked when the task has completed, independently if the execution was successful or not
     * @param handler The handler to invoke.
     */
    public always(handler: () => void): void {
        this.promise.then(handler, handler);
    }

    private _taskCompleted(result?: T): void {
        if (this.isCancellationRequested) {
            this.isCanceled = true;
            this.reject("Task has been canceled");
        } else {
            this.resolve(result);
        }
    }
}
