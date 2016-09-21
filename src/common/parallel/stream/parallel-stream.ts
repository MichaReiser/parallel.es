/**
 * @module parallel
 */
/** needed, typedoc issue */

import {ITask} from "../../task/task";
import {ResolvedParallelStream} from "./resolved-parallel-stream";
import {ScheduledParallelStream} from "./scheduled-parallel-stream";
import {IPromise} from "../../util/promise";
/**
 * Parallel processing stream that allows access to the sub results or end result of a {@link IParallelJob}
 *
 * The end result can be retrieved by using the then function. The then function is called
 * with the merged result of all tasks. At the other hand, subscribe can be used to register an
 * onNext handler that is called with the result of every spawned task. This allows to stream to the
 * task results and using intermediate results until all tasks have completed.
 *
 * Catch can be used to register to task failures. Without a catch handler, task failures are silently ignored.
 * The stream implements a fast fail interface. If any task fail, all other tasks are canceled.
 * @param TSubResult the results produced by a single task that needs to be joined to the end result
 * @param TEndResult the joined result of all tasks.
 */
export interface IParallelStream<TSubResult, TEndResult> extends IPromise<TEndResult> {
    /**
     * Registers the given next, error and complete handler.
     * @param onNext is called with the sub result produced by a completed task. The sub result of this task, the relative
     * task number and the values processed by each worker (max) is passed to the onNext handler.
     * @param onError is invoked whenever any task has failed.
     * @param onComplete is invoked with the joined result when all tasks have completed
     */
    subscribe(onNext: (this: void, subResult: TSubResult, taskIndex: number, valuesPerWorker: number) => void, onError?: (this: void, reason: any) => void, onComplete?: (this: void, result: TEndResult) => void): IParallelStream<TSubResult, TEndResult>;
}

/**
 * Function that resolves the next sub result for a parallel stream
 * @param subResult the sub result
 * @param TSubResult type of the sub result
 * @param taskIndex the job relative index of the task that has computed the sub result
 * @param valuesPerTask the number of values each task has to process at most
 */
type INextCallback<TSubResult> = (subResult: TSubResult, taskIndex: number, valuesPerTask: number) => any

/**
 * Function that resolves the end result of a parallel stream
 * @param result the end result of the stream
 * @param TEndResult type of the end result
 */
type IResolveCallback<TEndResult> = (result: TEndResult) => any;

/**
 * Function to reject a parallel stream
 * @param reason the rejection reason
 */
type IRejectCallback = (reason: any) => any;

/**
 * Callback that is invoked for a new {@link ParallelStream}
 *
 * @param {(value: TSubResult, taskIndex: number, valuesPerTask: number) => void} next
 * @param {(result: TEndResult) => void} resolve callback that can be invoked to complete the parallel stream
 * @param {(reason: any) => void} reject callback that can be invoked to reject the parallel stream
 */
type IExecutorCallback<TSubResult, TEndResult> = (next: INextCallback<TSubResult>, resolve: IResolveCallback<TEndResult>, reject: IRejectCallback) => any

/**
 * Generic parallel stream. Allows to implement own parallel streams like it is the case for {@link PromiseConstructor}
 */
export class ParallelStream<TSubResult, TEndResult> implements IParallelStream<TSubResult, TEndResult> {
    /**
     * Creates a new parallel that is based on the given input stream but transforms the end result using the given transformer
     * @param inputStream the input stream on which the returned stream is based on
     * @param transformer the transformer used to transform the end result
     * @param TIn type of the input elements for this stream
     * @param TIntermediate type of the end results from the input stream
     * @param TResult end result after applying the transformer.
     * @returns parallel stream that is based on the given input stream but with the transformed end result
     */
    public static transform<TIn, TIntermediate, TResult>(inputStream: IParallelStream<TIn, TIntermediate>, transformer: (result: TIntermediate) => TResult) {
        let next: ((subResult: TIn, taskIndex: number, valuesPerTask: number) => void) | undefined = undefined;
        let resolve: ((result: TResult) => void) | undefined = undefined;
        let reject: ((reason: any) => void) | undefined = undefined;

        const transformedStream = new ParallelStream<TIn, TResult>((nxt, rsolve, rject) => {
            next = nxt;
            resolve = rsolve;
            reject = rject;
        });

        inputStream.subscribe(next!, reject!, (result) => resolve!(transformer(result)));

        return transformedStream;
    }

    /**
     * Creates a new parallel stream for the given set of tasks.
     * @param tasks the set of tasks that compute the results of the stream
     * @param joiner the joiner to use to join the computed results of the stream
     * @param TTaskResult type of the task results
     * @param TEndResult result of the created stream. Created by applying the end results of the stream to the joiner
     * @returns stream for the given set of tasks
     */
    public static fromTasks<TTaskResult, TEndResult>(tasks: ITask<TTaskResult>[], joiner: (subResults: TTaskResult[]) => TEndResult): IParallelStream<TTaskResult, TEndResult> {
        if (tasks.length === 0) {
            return new ResolvedParallelStream(joiner.apply(undefined, [[]]));
        }

        return new ScheduledParallelStream(tasks, joiner);
    }

    private promise: Promise<TEndResult>;

    /**
     * Registered handlers that should be called for each sub result
     * @type {Array}
     * @private
     */
    private nextHandlers: { (subResult: TSubResult, worker: number, valuesPerWorker: number): void}[] = [];
    private resolve: (result: TEndResult) => void;
    private reject: (reason: any) => void;

    /**
     * Creates a new, generic parallel stream
     * @param executor the executor function that gets passed the next, resolve and reject functions
     */
    constructor(executor: IExecutorCallback<TSubResult, TEndResult>) {
        const next = (subResult: TSubResult, worker: number, valuesPerWorker: number) => this._next(subResult, worker, valuesPerWorker);
        const reject = (reason: any) => this.reject(reason);
        const resolve = (result: TEndResult) => this.resolve(result);

        executor(next, resolve, reject);

        this.promise = new Promise((res, rej) => {
            this.resolve = res;
            this.reject = rej;
        });
    }

    public subscribe(onNext: (subResult: TSubResult, taskIndex: number, valuesPerWorker: number) => void, onError?: (reason: any) => void, onComplete?: (result: TEndResult) => void): IParallelStream<TSubResult, TEndResult> {
        this.nextHandlers.push(onNext);

        if (onError || onComplete) {
            this.promise.then(onComplete!, onError!);
        }

        return this;
    }

    public then<TResult1, TResult2>(onfulfilled: (value: TEndResult) => (PromiseLike<TResult1>|TResult1), onrejected: (reason: any) => (PromiseLike<TResult2>|TResult2)): Promise<TResult2|TResult1>;
    public then<TResult>(onfulfilled: (value: TEndResult) => (PromiseLike<TResult>|TResult), onrejected: (reason: any) => (PromiseLike<TResult>|TResult)): Promise<TResult>;
    public then<TResult>(onfulfilled: (value: TEndResult) => (PromiseLike<TResult>|TResult)): IPromise<TResult>;
    public then<TResult>(onfulfilled?: (value: TEndResult) => (PromiseLike<TResult>|TResult), onrejected?: (reason: any) => (PromiseLike<TResult>|TResult)): Promise<TResult>;
    public then<TResult>(onfulfilled?: (value: TEndResult) => (PromiseLike<TResult>|TResult), onrejected?: (reason: any) => void): Promise<TResult>;
    public then(onfulfilled?: any, onrejected?: any): any {
        return this.promise.then(onfulfilled, onrejected);
    }

    public catch<TResult>(onrejected: (reason: any) => (PromiseLike<TResult>|TResult)): Promise<TResult|TEndResult>;
    public catch(onrejected: (reason: any) => (PromiseLike<TEndResult>|TEndResult)): Promise<TEndResult>;
    public catch(onrejected: any): any {
        return this.promise.catch(onrejected);
    }

    private _next(subResult: TSubResult, taskIndex: number, valuesPerTask: number) {
        for (const nextHandler of this.nextHandlers) {
            nextHandler.apply(undefined, arguments);
        }
    }
}
