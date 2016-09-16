import {IDefaultInitializedParallelOptions} from "./parallel-options";
/**
 * Defines how a parallel task should be scheduled on the thread pool
 */
export interface IParallelTaskScheduling {

    /**
     * How many number of tasks should be created to perform the operation
     */
    numberOfTasks: number;

    /**
     * How many values to process by each task (at most)
     */
    valuesPerTask: number;
}

/**
 * Scheduler that defines onto how many task a parallel operation should be scheduled on and how many values to assign
 * to each task.
 */
export interface IParallelScheduler {
    /**
     * Returns the suggested scheduling for the given number of values - while concerning the passed in options.
     * @param totalNumberOfValues the total number of values to be processed by the parallel operation chain
     * @param options the parallel options provided for this operation chain
     */
    getScheduling(totalNumberOfValues: number, options: IDefaultInitializedParallelOptions): IParallelTaskScheduling;
}
