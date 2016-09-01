import {SerializedFunctionCall} from "../serialization/serialized-function-call";
export interface ParallelAction {
    iteratee: Function;
    coordinator: Function;
    coordinatorParams: any[];
}

export interface SerializedParallelAction {
    iteratee: SerializedFunctionCall;
    coordinator: SerializedFunctionCall;
}