export interface ISerializedFunctionCall {
    functionId: number;
    readonly params: any[];
    readonly ______serializedFunctionCall: boolean;
}

export function isSerializedFunctionCall(potentialFunc: any): potentialFunc is ISerializedFunctionCall {
    return potentialFunc.______serializedFunctionCall === true;
}
