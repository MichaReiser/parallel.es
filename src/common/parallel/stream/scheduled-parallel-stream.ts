import {ITask} from "../../task/task";
import {IParallelTaskDefinition} from "../parallel-task-definition";
import {IParallelStream} from "./parallel-stream";
import {ParallelStream} from "./parallel-stream-impl";

/**
 * Stream that has been scheduled on the thread pool and waits for completion of its tasks.
 * @param TSubResult type of the sub results
 * @param TEndResult type of the end result
 */
export class ScheduledParallelStream<TSubResult, TEndResult> implements IParallelStream<TSubResult, TEndResult> {
    /**
     * The tasks executed by this stream
     */
    private tasks: ITask<TSubResult>[];

    private innerStream: ParallelStream<TSubResult, TEndResult>;

    /**
     * Resolves the _promise with the given end result
     */
    private resolve: (result: TEndResult) => void;

    /**
     * Rejects the _promise with the given reason
     */
    private reject: (reason: any) => void;

    private next: (subResult: TSubResult, task: number, valuesPerTask: number) => void;

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
    private joiner: (subResults: TSubResult[]) => TEndResult;

    constructor(tasks: ITask<TSubResult>[], join: (subResults: TSubResult[]) => TEndResult) {
        this.tasks = tasks;
        this.joiner = join;
        this.subResults = new Array(tasks.length);
        this.pending = tasks.length;

        this.innerStream = new ParallelStream((next, resolve, reject) => {
            this.next = next;
            this.resolve = resolve;
            this.reject = reject;
        });

        for (const task of tasks) {
            task.then(subResult => this._taskCompleted(subResult, task.definition as IParallelTaskDefinition), reason => this._taskFailed(reason));
        }
    }

    public subscribe(onNext: (subResult: TSubResult, worker: number, valuesPerWorker: number) => void, onError?: (reason: any) => void, onComplete?: (result: TEndResult) => void): IParallelStream<TSubResult, TEndResult> {
        this.innerStream.subscribe(onNext, onError, onComplete);
        return this;
    }

    public then<TResult1, TResult2>(onfulfilled: (value: TEndResult) => (PromiseLike<TResult1>|TResult1), onrejected: (reason: any) => (PromiseLike<TResult2>|TResult2)): Promise<TResult2|TResult1>;
    public then<TResult>(onfulfilled: (value: TEndResult) => (PromiseLike<TResult>|TResult), onrejected: (reason: any) => (PromiseLike<TResult>|TResult)): Promise<TResult>;
    public then<TResult>(onfulfilled: (value: TEndResult) => (PromiseLike<TResult>|TResult)): Promise<TResult>;
    public then<TResult>(onfulfilled?: (value: TEndResult) => (PromiseLike<TResult>|TResult), onrejected?: (reason: any) => (PromiseLike<TResult>|TResult)): Promise<TResult>;
    public then<TResult>(onfulfilled?: (value: TEndResult) => (PromiseLike<TResult>|TResult), onrejected?: (reason: any) => void): Promise<TResult>;
    public then(onfulfilled?: any, onrejected?: any): any {
        return this.innerStream.then(onfulfilled, onrejected);
    }

    public catch<TResult>(onrejected: (reason: any) => (PromiseLike<TResult>|TResult)): Promise<TResult|TEndResult>;
    public catch(onrejected: (reason: any) => (PromiseLike<TEndResult>|TEndResult)): Promise<TEndResult>;
    public catch(onrejected: any): any {
        return this.innerStream.catch(onrejected);
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

        this.next(subResult, taskDefinition.taskIndex, taskDefinition.valuesPerTask);

        if (this.pending === 0) {
            this.resolve(this.joiner.apply(undefined, [this.subResults]));
        }
    }

    private _taskFailed(reason: any): void {
        if (this.failed === true) {
            return;
        }

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
