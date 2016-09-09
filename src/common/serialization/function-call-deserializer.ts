import {FunctionLookupTable} from "./function-lookup-table";
import {ISerializedFunctionCall, isSerializedFunctionCall} from "./serialized-function-call";

export class FunctionCallDeserializer {
    constructor(private functionLookupTable: FunctionLookupTable) {}

    public deserializeFunctionCall<TResult>(functionCall: ISerializedFunctionCall, deserializeParams = false): (...additionalParams: any[]) => TResult {
        const func = this.functionLookupTable.getFunction(functionCall.functionId);
        let params = functionCall.params || [];

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
