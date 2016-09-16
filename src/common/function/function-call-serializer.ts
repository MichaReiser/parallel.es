/**
 * @module parallel
 */
/** */

import {ISerializedFunctionCall} from "./serialized-function-call";
import {FunctionRegistry} from "./function-registry";

/**
 * Serializer for function calls
 */
export class FunctionCallSerializer {
    private serializedFunctionIdsMap: { [id: string]: number } = {};

    /**
     * Creates a new instances that uses the given function registry to lookup the unique id of a function
     * @param functionRegistry the registry for function lookup
     */
    constructor(private functionRegistry: FunctionRegistry) {}

    /**
     * Serializes a call to the given function and using the passed parameters
     * @param func the function to call
     * @param parameters the parameters to pass when the function is called
     * @returns a serialized representation of a call to the passed function using the given parameters
     */
    public serializeFunctionCall(func: Function, ...parameters: any[]): ISerializedFunctionCall {
        const funcId = this.functionRegistry.getOrSetId(func);
        this.serializedFunctionIdsMap[funcId] = funcId;
        return {
            ______serializedFunctionCall: true,
            functionId: funcId,
            parameters
        };
    }

    /**
     * Returns the ids of all functions serialized by this instance.
     * @returns array with the ids of the serialized functions
     */
    get serializedFunctionIds(): number[] {
        return Object.keys(this.serializedFunctionIdsMap).map(key => this.serializedFunctionIdsMap[key]);
    }
}
