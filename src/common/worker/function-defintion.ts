/**
 * Definition of a function
 */
export interface FunctionDefinition {
    /**
     * The unique id of the function
     */
    id: number;

    /**
     * The name of the function (if any)
     */
    name?: string;

    /**
     * The names of the function arguments
     */
    argumentNames: string[];

    /**
     * The body of the function as string
     */
    body: string;
}