export interface SerializedFunctionCall {
    functionId: number;
    params: any[];
    ______serializedFunctionCall: boolean;
    name?: string;
}

export function isSerializedFunctionCall(potentialFunc: any): potentialFunc is SerializedFunctionCall {
    return potentialFunc.______serializedFunctionCall === true;
}