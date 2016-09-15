/**
 * @module parallel
 */
/** */

import {ISerializedFunctionCall} from "../serialization/serialized-function-call";

/**
 * Definition of a task to execute. A task is uniquely identified by its id.
 */
export interface ITaskDefinition {
    /**
     * The unique identification of the task to execute. Is assigned by the thread pool.
     */
    id?: number;

    /**
     * The main function to execute
     */
    readonly main: ISerializedFunctionCall;

    /**
     * The unique function ids ({@link IFunctionDefinition.id}) of all the functions used in this task.
     * The array always contains the id of the main function to execute but may contain additional function ids, e.g.
     * if the main function accepts a serialized function as parameter.
     */
    readonly usedFunctionIds: number[];
}
