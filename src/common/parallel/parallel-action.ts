import {ISerializedFunctionCall} from "../serialization/serialized-function-call";

export interface IParallelAction {
    readonly iteratee: Function;
    readonly coordinator: Function;
    readonly coordinatorParams: any[];
}

export interface ISerializedParallelAction {
    readonly iteratee: ISerializedFunctionCall;
    readonly coordinator: ISerializedFunctionCall;
}
