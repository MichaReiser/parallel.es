/**
 * @module parallel
 */
/** */

import {IFunctionId} from "./function-id";

/**
 * Serialized representation of a function.
 */
export interface IFunctionDefinition {
    /**
     * Unique identification of the function
     */
    id: IFunctionId;

    /**
     * The names of the function arguments
     */
    argumentNames: string[];

    /**
     * The body of the function as string
     */
    body: string;
}
