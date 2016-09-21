import {IFunctionLookupTable} from "./function-lookup-table";
import {ISerializedFunctionCall, isSerializedFunctionCall} from "./serialized-function-call";

/**
 * Deserializer for a {@link ISerializedFunctionCall}.
 */
export class FunctionCallDeserializer {
    /**
     * Creates a new deserializer that uses the given function lookup table to retrieve the function for a given id
     * @param functionLookupTable the lookup table to use
     */
    constructor(private functionLookupTable: IFunctionLookupTable) {}

    /**
     * Deserializes the function call into a function
     * @param functionCall the function call to deserialize
     * @param deserializeParams indicator if the parameters passed to the serialized function should be deserailized too
     * @returns a function that can be called with additional parameters (the params from the serialized function calls are prepended to the passed parameters)
     */
    public deserializeFunctionCall<TResult>(functionCall: ISerializedFunctionCall, deserializeParams = false): (...additionalParams: any[]) => TResult {
        const func = this.functionLookupTable.getFunction(functionCall.functionId);
        if (!func) {
            throw new Error(`The function with the id ${functionCall.functionId.identifier} could not be retrieved while deserializing the function call. Is the function correctly registered?`);
        }

        let params = functionCall.parameters || [];

        if (deserializeParams) {
            params = params.map(param => {
                if (isSerializedFunctionCall(param)) {
                    return this.deserializeFunctionCall(param);
                }
                return param;
            });
        }

        return function (...additionalParams: any[]) {
            return func.apply(undefined, params.concat(additionalParams)) as TResult;
        };
    }
}
