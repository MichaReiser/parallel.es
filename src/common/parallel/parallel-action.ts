import {SerializedFunctionCall} from "../serialization/serialized-function-call";
export interface ParallelAction {
    readonly iteratee: Function;
    readonly coordinator: Function;
    readonly coordinatorParams: any[];
}

export interface SerializedParallelAction {
    readonly iteratee: SerializedFunctionCall;
    readonly coordinator: SerializedFunctionCall;
}