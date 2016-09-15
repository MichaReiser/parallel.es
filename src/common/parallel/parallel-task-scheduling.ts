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
