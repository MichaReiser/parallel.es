import {ISerializedFunctionCall} from "./serialized-function-call";
import {FunctionRegistry} from "./function-registry";

export class FunctionCallSerializer {
    private serializedFunctionIdsMap: { [id: string]: number } = {};

    constructor(private functionRegistry: FunctionRegistry) {}

    public serializeFunctionCall(func: Function, ...params: any[]): ISerializedFunctionCall {
        const funcId = this.functionRegistry.getOrSetId(func);
        this.serializedFunctionIdsMap[funcId] = funcId;
        return {
            ______serializedFunctionCall: true,
            functionId: funcId,
            params
        };
    }

    get serializedFunctionIds(): number[] {
        return Object.keys(this.serializedFunctionIdsMap).map(key => this.serializedFunctionIdsMap[key]);
    }
}
