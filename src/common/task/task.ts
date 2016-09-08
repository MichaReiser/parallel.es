import {TaskDefinition} from "./task-definition";
/**
 * Represents a running or scheduled task on the thread pool. Behaves like a promise.
 */
export interface Task<T> extends PromiseLike<T> {

    taskDefinition: TaskDefinition;

    catch<TResult>(onrejected?: (reason: any) => TResult | PromiseLike<TResult>): Promise<TResult>;
    catch(onrejected?: (reason: any) => void): Promise<T>;
}