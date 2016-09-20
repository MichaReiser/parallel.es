import {IParallelGenerator} from "./parallel-generator";
import {FunctionCallSerializer} from "../../function/function-call-serializer";
import {ISerializedFunctionCall} from "../../function/serialized-function-call";
import {ParallelWorkerFunctions} from "../parallel-worker-functions";
/**
 * Generic generator that calls a passed in function n times to create n values
 * @param T type of the values returned by the iteratee function
 */
export class ParallelTimesGenerator<T> implements IParallelGenerator {
    public readonly times: number;
    public readonly iteratee: ((this: void, time: number, env: any) => T) | T;

    constructor(times: number, iteratee: ((this: void, time: number, env: any) => T) | T) {
        this.times = times;
        this.iteratee = iteratee;
    }

    get length(): number { return this.times; }

    public serializeSlice(index: number, numberOfItems: number, functionCallSerializer: FunctionCallSerializer): ISerializedFunctionCall {
        const sliceStart = index * numberOfItems;
        const sliceEnd = Math.min(sliceStart + numberOfItems, this.times);
        let iterateeFunction: ISerializedFunctionCall;

        if (typeof this.iteratee === "function") {
            iterateeFunction = functionCallSerializer.serializeFunctionCall(this.iteratee);
        } else {
            iterateeFunction = functionCallSerializer.serializeFunctionCall(ParallelWorkerFunctions.identity, this.iteratee);
        }

        return functionCallSerializer.serializeFunctionCall(ParallelWorkerFunctions.times, sliceStart, sliceEnd, iterateeFunction);
    }
}
