import {Task} from "../task/task";

/**
 * Parallel processing stream.
 *
 * The end result can be retrieved by using the then function. The then function is called
 * with the merged result of all tasks. At the other hand, subscribe can be used to register an
 * onNext handler that is called with the result of every spawned task. This allows to stream to the
 * task results and using intermediate results until all tasks have completed.
 *
 * Catch can be used to register to task failures. Without a catch handler, task failures are silently ignored.
 * The stream implements a fast fail interface. If any task fail, all other tasks are canceled.
 */
export interface ParallelStream<TSubResult, TEndResult> extends PromiseLike<TEndResult> {
    /**
     * Registers the given next, error and complete handler.
     * @param onNext is called with the sub result produced by a completed task. The sub result of this task and the relative
     * task number is passed to the onNext handler.
     * @param onError is invoked whenever any task has failed.
     * @param onComplete is invoked with the joined result when all tasks have completed
     */
    subscribe(onNext: (this: void, subResult: TSubResult, taskIndex: number) => void, onError?: (this: void, reason: any) => void, onComplete?: (this: void, result: TEndResult) => void): ParallelStream<TSubResult, TEndResult>;

    catch<TResult>(onrejected: (reason: any) => TResult | PromiseLike<TResult>): Promise<TResult>;
    catch(onrejected: (reason: any) => void): Promise<TEndResult>;
}

export class ParallelStreamImpl<TSubResult, TEndResult> implements ParallelStream<TSubResult, TEndResult> {
    /**
     * Internal promise, is resolved as soon as all sub results have been calculated and are joined
     */
    private _promise: Promise<TEndResult>;

    /**
     * The tasks executed by this stream
     */
    private _tasks: Task<TSubResult>[];

    /**
     * Resolves the _promise with the given end result
     */
    private _resolve: (result: TEndResult) => void;

    /**
     * Rejects the _promise with the given reason
     */
    private _reject: (reason: any) => void;

    /**
     * Number of still pending tasks
     */
    private _pending: number;

    /**
     * Indicator if any task has failed. If this is the case, then registered next handlers are no longer called
     * for outstanding results.
     * @type {boolean}
     * @private
     */
    private _failed: boolean = false;

    /**
     * Array containing the retrieved sub results. Not yet retrieved sub results are default initialized
     */
    private _subResults: TSubResult[];

    /**
     * Function used to join the sub results to the end result
     */
    private _joiner: (subResults: TSubResult[]) => TEndResult | PromiseLike<TEndResult>;

    /**
     * Registered handlers that should be called for each sub result
     * @type {Array}
     * @private
     */
    private _nextHandlers: { (subResult: TSubResult, worker: number): void}[] = [];

    constructor(tasks: Task<TSubResult>[], join: (subResults: TSubResult[]) => TEndResult | PromiseLike<TEndResult>) {
        this._tasks = tasks;
        this._joiner = join;
        this._subResults = new Array(tasks.length);
        this._pending = tasks.length;

        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });

        tasks.forEach(
            (task, index) => task.then(
                (subResult: TSubResult) => this._taskCompleted(subResult, index),
                (reason: any) => this._taskFailed(reason))
        );
    }

    subscribe(onNext: (subResult: TSubResult, worker: number) => void, onError?: (reason: any) => void, onComplete?: (result: TEndResult) => void): ParallelStream<TSubResult, TEndResult> {
        this._nextHandlers.push(onNext);

        if (onError) {
            this._promise.catch(onError);
        }

        if (onComplete) {
            this._promise.then(onComplete);
        }

        return this;
    }

    then(onfulfilled?: any, onrejected?: any): Promise<any> {
        return this._promise.then(onfulfilled, onrejected);
    }

    catch(onrejected: any): Promise<any> {
        return this._promise.catch(onrejected);
    }

    private _taskCompleted(subResult: TSubResult, index: number): void {
        if (this._pending === 0) {
            throw new Error("Stream already resolved but taskCompleted called one more time");
        }

        --this._pending;

        this._subResults[index] = subResult;

        if (this._failed) {
            return;
        }

        for (const nextHandler of this._nextHandlers) {
            nextHandler.apply(undefined, [subResult, index]);
        }

        if (this._pending === 0) {
            this._resolve(this._joiner.apply(undefined, [this._subResults]));
        }
    }

    private _taskFailed(reason: any): void {
        this._failed = true;
        this._reject(reason);
    }
}