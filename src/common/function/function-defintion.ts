/**
 * @module parallel
 */
/** */

/**
 * Serialized representation of a function.
 */
export interface IFunctionDefinition {
    /**
     * Unique identification of the function
     */
    id: number;

    /**
     * The names of the function arguments
     */
    argumentNames: string[];

    /**
     * The body of the function as string
     */
    body: string;
}
