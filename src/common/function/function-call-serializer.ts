/**
 * @module parallel
 */
/** */

import {ISerializedFunctionCall} from "./serialized-function-call";
import {DynamicFunctionRegistry} from "./dynamic-function-registry";
import {IFunctionId} from "./function-id";

/**
 * Serializer for function calls
 */
export class FunctionCallSerializer {
    private serializedFunctionIdsMap: { [id: string]: IFunctionId } = {};

    /**
     * Creates a new instances that uses the given function registry to lookup the unique id of a function
     * @param functionRegistry the registry for function lookup
     */
    constructor(private functionRegistry: DynamicFunctionRegistry) {}

    /**
     * Serializes a call to the given function and using the passed parameters
     * @param func the function to call
     * @param parameters the parameters to pass when the function is called
     * @returns a serialized representation of a call to the passed function using the given parameters
     */
    public serializeFunctionCall(func: Function | IFunctionId, ...parameters: any[]): ISerializedFunctionCall {
        const funcId = this.functionRegistry.getOrSetId(func);
        this.serializedFunctionIdsMap[funcId.identifier] = funcId;
        return {
            ______serializedFunctionCall: true,
            functionId: funcId,
            parameters
        };
    }

    /**
     * Returns the ids of all functions serialized by this instance.
     * @returns array with the ids of theO serialized functions
     */
    get serializedFunctionIds(): IFunctionId[] {
        return Object.keys(this.serializedFunctionIdsMap).map(key => this.serializedFunctionIdsMap[key]);
    }
}
