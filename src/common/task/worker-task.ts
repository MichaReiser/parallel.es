import {Task} from "./task";
import {TaskDefinition} from "./task-definition";
import {WorkerThread} from "../worker/worker-thread";

/**
 * Implementation of a task.
 */
export class WorkerTask<T> implements Task<T> {
    private _resolve: (result?: T) => void;
    private _reject: (error: any) => void;
    private _worker?: WorkerThread;
    isCancellationRequested = false;
    isCanceled = false;

    private promise: Promise<T>;

    /**
     * Creates a new task that is used to execute the passed in task
     * @param taskDefinition the definition of the task to execute
     */
    constructor(public taskDefinition: TaskDefinition) {
        this.promise = new Promise<T>((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    /**
     * Executes the task on the given worker. Assumes that the worker is not performing any other work at the moment.
     * If the task has been cancled in the meantime, no operation is performed and the reject callback is invoked immediately.
     * @param worker the worker thread that should be used to execute this task
     */
    runOn(worker: WorkerThread): void {
        this._worker = worker;
        this._worker.oncomplete = result => this._taskCompleted(result);
        this._worker.onerror = (error: any) => this._reject(error);

        if (!this.isCancellationRequested) {
            this._worker.run(this.taskDefinition);
        } else {
            this._taskCompleted(undefined);
        }
    }

    private _taskCompleted(result?: T): void {
        if (this.isCancellationRequested) {
            this.isCanceled = true;
            this._reject("Task has been canceled");
        } else {
            this._resolve(result);
        }
    }

    /**
     * Releases the used worker.
     * @returns {WorkerThread} the worker used by this task
     */
    releaseWorker(): WorkerThread {
        if (!this._worker) {
            throw new Error("Cannot release a worker task that has no assigned worker thread.");
        }

        const worker = this._worker;
        worker.oncomplete = worker.onerror = undefined;
        this._worker = undefined;
        return worker;
    }

    then<TResult>(onfulfilled: (value: T) => (PromiseLike<TResult>|TResult), onrejected?: (reason: any) => (PromiseLike<TResult>|TResult)): Promise<TResult> {
        if (onrejected) {
            return this.promise.then(onfulfilled, onrejected);
        }
        return this.promise.then(onfulfilled);
    }

    catch(onrejected: (reason: any) => (PromiseLike<T>|T)): Promise<T> {
        return this.promise.catch(onrejected);
    }

    cancel(): void {
        this.isCancellationRequested = true;
    }

    /**
     * Registers a handler that is invoked when the task is always invoked when the task has completed, independently if it
     * was successful or not.
     * @param handler The handler to invoke.
     */
    always(handler: () => void): void {
        this.promise.then(handler, handler);
    }
}