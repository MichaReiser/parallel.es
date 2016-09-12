import {ITaskDefinition} from "./task-definition";
/**
 * Represents a running or scheduled task on the thread pool. Behaves like a promise.
 */
export interface ITask<T> extends PromiseLike<T> {

    definition: ITaskDefinition;

    /**
     * Indicator if this task has been canceled.
     */
    isCanceled: boolean;

    /**
     * Indicator if this task should be canceled
     */
    readonly isCancellationRequested: boolean;

    catch<TResult>(onrejected?: (reason: any) => TResult | PromiseLike<TResult>): Promise<TResult>;
    catch(onrejected?: (reason: any) => void): Promise<T>;

    /**
     * Cancels the given task.
     * This has only an effect if the task has not yet been scheduled. Already
     * scheduled tasks cannot be terminated.
     */
    cancel(): void;
}