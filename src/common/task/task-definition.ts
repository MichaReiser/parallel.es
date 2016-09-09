import {ISerializedFunctionCall} from "../serialization/serialized-function-call";
/**
 * Definition of a task to execute. A task is uniquely identified by an id.
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
     * IDs of functions used
     */
    readonly usedFunctionIds: number[];
}