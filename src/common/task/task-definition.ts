/**
 * Definition of a task to execute. A task is uniquely identified by an id.
 */
export interface TaskDefinition {
    /**
     * The unique identification of the task to execute
     */
    id: number;

    /**
     * The id of the function to execute
     */
    functionId: number;

    /**
     * Array with the parameters that are passed to the executed function.
     */
    params: any[];
}