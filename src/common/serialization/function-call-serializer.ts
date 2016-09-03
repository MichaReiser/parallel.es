import {SerializedFunctionCall} from "./serialized-function-call";
import {FunctionRegistry} from "./function-registry";

export class FunctionCallSerializer {
    private _serializedFunctionIds: { [id: string]: number } = {};

    constructor(private functionRegistry: FunctionRegistry) {}

    serializeFunctionCall(func: Function, ...params: any[]): SerializedFunctionCall {
        const funcId = this.functionRegistry.getOrSetId(func);
        this._serializedFunctionIds[funcId] = funcId;
        return {
            functionId: funcId,
            params: params,
            ______serializedFunctionCall: true,
            name: (func as any).name
        };
    }

    get serializedFunctionIds(): number[] {
        return Object.keys(this._serializedFunctionIds).map(key => this._serializedFunctionIds[key]);
    }
}