import {ISerializedFunctionCall} from "../serialization/serialized-function-call";
export interface ParallelAction {
    readonly iteratee: Function;
    readonly coordinator: Function;
    readonly coordinatorParams: any[];
}

export interface SerializedParallelAction {
    readonly iteratee: ISerializedFunctionCall;
    readonly coordinator: ISerializedFunctionCall;
}