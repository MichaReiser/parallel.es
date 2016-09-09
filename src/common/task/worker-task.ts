import {Task} from "./task";
import {TaskDefinition} from "./task-definition";
import {WorkerThread} from "../worker/worker-thread";

/**
 * Implementation of a task.
 */
export class WorkerTask<T> implements Task<T> {
    public isCancellationRequested = false;
    public isCanceled = false;

    private resolve: (result?: T) => void;
    private reject: (error: any) => void;
    private worker?: WorkerThread;
    private promise: Promise<T>;

    /**
     * Creates a new task that is used to execute the passed in task
     * @param taskDefinition the definition of the task to execute
     */
    constructor(public taskDefinition: TaskDefinition) {
        this.promise = new Promise<T>((resolvePromise, rejectPromise) => {
            this.resolve = resolvePromise;
            this.reject = rejectPromise;
        });
    }

    /**
     * Executes the task on the given worker. Assumes that the worker is not performing any other work at the moment.
     * If the task has been cancled in the meantime, no operation is performed and the reject callback is invoked immediately.
     * @param worker the worker thread that should be used to execute this task
     */
    public runOn(worker: WorkerThread): void {
        this.worker = worker;
        this.worker.oncomplete = result => this._taskCompleted(result);
        this.worker.onerror = (error: any) => this.reject(error);

        if (!this.isCancellationRequested) {
            this.worker.run(this.taskDefinition);
        } else {
            this._taskCompleted(undefined);
        }
    }

    /**
     * Releases the used worker.
     * @returns {WorkerThread} the worker used by this task
     */
    public releaseWorker(): WorkerThread {
        if (!this.worker) {
            throw new Error("Cannot release a worker task that has no assigned worker thread.");
        }

        const worker = this.worker;
        worker.oncomplete = worker.onerror = undefined;
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
     * Registers a handler that is invoked when the task is always invoked when the task has completed, independently if it
     * was successful or not.
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
