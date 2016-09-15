import {ITask} from "../task/task";
import {IParallelTaskDefinition} from "./parallel-task-definition";
import {IParallelStream} from "./parallel-stream";

export class ParallelStreamImpl<TSubResult, TEndResult> implements IParallelStream<TSubResult, TEndResult> {
    /**
     * Internal promise, is resolved as soon as all sub results have been calculated and are joined
     */
    private promise: Promise<TEndResult>;

    /**
     * The tasks executed by this stream
     */
    private tasks: ITask<TSubResult>[];

    /**
     * Resolves the _promise with the given end result
     */
    private resolve: (result: TEndResult) => void;

    /**
     * Rejects the _promise with the given reason
     */
    private reject: (reason: any) => void;

    /**
     * Number of still pending tasks
     */
    private pending: number;

    /**
     * Indicator if any task has failed. If this is the case, then registered next handlers are no longer called
     * for outstanding results.
     * @type {boolean}
     * @private
     */
    private failed: boolean = false;

    /**
     * Array containing the retrieved sub results. Not yet retrieved sub results are default initialized
     */
    private subResults: TSubResult[];

    /**
     * Function used to join the sub results to the end result
     */
    private joiner: (subResults: TSubResult[]) => TEndResult | PromiseLike<TEndResult>;

    /**
     * Registered handlers that should be called for each sub result
     * @type {Array}
     * @private
     */
    private nextHandlers: { (subResult: TSubResult, worker: number, valuesPerWorker: number): void}[] = [];

    constructor(tasks: ITask<TSubResult>[], join: (subResults: TSubResult[]) => TEndResult | PromiseLike<TEndResult>) {
        this.tasks = tasks;
        this.joiner = join;
        this.subResults = new Array(tasks.length);
        this.pending = tasks.length;

        this.promise = new Promise((resolvePromise, rejectPromise) => {
            this.resolve = resolvePromise;
            this.reject = rejectPromise;
        });

        tasks.forEach(
            (task, index) => task.then(
                (subResult: TSubResult) => this._taskCompleted(subResult, task.definition as IParallelTaskDefinition),
                (reason: any) => this._taskFailed(reason))
        );

        if (tasks.length === 0) {
            this.resolve([] as any);
        }
    }

    public subscribe(onNext: (subResult: TSubResult, worker: number, valuesPerWorker: number) => void, onError?: (reason: any) => void, onComplete?: (result: TEndResult) => void): IParallelStream<TSubResult, TEndResult> {
        this.nextHandlers.push(onNext);

        if (onError) {
            this.promise.catch(onError);
        }

        if (onComplete) {
            this.promise.then(onComplete);
        }

        return this;
    }

    public then(onfulfilled?: any, onrejected?: any): Promise<any> {
        return this.promise.then(onfulfilled, onrejected);
    }

    public catch(onrejected: any): Promise<any> {
        return this.promise.catch(onrejected);
    }

    private _taskCompleted(subResult: TSubResult, taskDefinition: IParallelTaskDefinition): void {
        if (this.pending === 0) {
            throw new Error("Stream already resolved but taskCompleted called one more time");
        }

        --this.pending;

        this.subResults[taskDefinition.taskIndex] = subResult;

        if (this.failed) {
            return;
        }

        for (const nextHandler of this.nextHandlers) {
            nextHandler.apply(undefined, [subResult, taskDefinition.taskIndex, taskDefinition.valuesPerTask]);
        }

        if (this.pending === 0) {
            this.resolve(this.joiner.apply(undefined, [this.subResults]));
        }
    }

    private _taskFailed(reason: any): void {
        this.failed = true;

        // Cancel all not yet completed tasks
        for (let i = 0; i < this.tasks.length; ++i) {
            if (typeof(this.subResults[i]) === "undefined") {
                this.tasks[i].cancel();
            }
        }

        this.reject(reason);
    }
}
