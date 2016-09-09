import {ParallelWorkerFunctions} from "./parallel-worker-functions";
import {ISerializedFunctionCall} from "../serialization/serialized-function-call";
import {FunctionCallSerializer} from "../serialization/function-call-serializer";

/**
 * Generator that creates a sequence of values and is capable
 * to distribute the value generations onto various workers
 */
export interface IParallelGenerator {
    /**
     * Total number of elements that this worker return
     */
    length: number;

    /**
     * Serializes the generation of a single slice that can be executed on a worker
     * @param index the slice index (start 0)
     * @param numberOfItems the number of items to include in this slice
     * @param functionCallSerializer the serialized function call
     */
    serializeSlice(index: number, numberOfItems: number, functionCallSerializer: FunctionCallSerializer): ISerializedFunctionCall;
}

/**
 * Generator for arrays
 */
export class ConstCollectionGenerator<T> implements IParallelGenerator {
    constructor(private collection: T[]) {}

    get length(): number {
        return this.collection.length;
    }

    public serializeSlice(index: number, numberOfItems: number, functionCallSerializer: FunctionCallSerializer): ISerializedFunctionCall {
        const start = numberOfItems * index;
        const end = start + numberOfItems;

        return functionCallSerializer.serializeFunctionCall(ParallelWorkerFunctions.toIterator, this.collection.slice(start, end));
    }
}

/**
 * Generator for creating values inside of a range
 */
export class RangeGenerator implements IParallelGenerator {
    public readonly start: number;
    public readonly end: number;
    public readonly step: number;

    constructor(start: number, end: number, step: number) {
        this.start = start;
        this.end = end;
        this.step = step;
    }

    get length(): number {
        return Math.ceil((this.end - this.start) / this.step);
    }

    public serializeSlice(index: number, numberOfItems: number, functionCallSerializer: FunctionCallSerializer): ISerializedFunctionCall {
        const sliceSize = numberOfItems * this.step;
        const sliceStart = this.start + index * sliceSize;
        const sliceEnd = Math.min(sliceStart + sliceSize, this.end);

        return functionCallSerializer.serializeFunctionCall(ParallelWorkerFunctions.range, sliceStart, sliceEnd, this.step);
    }
}

/**
 * Generic generator that calls a passed in function n times to create n values
 */
export class TimesGenerator<T> implements IParallelGenerator {
    public readonly times: number;
    public readonly iteratee: (this: void, time: number, env: any) => T;

    constructor(times: number, iteratee: (this: void, time: number, env: any) => T) {
        this.times = times;
        this.iteratee = iteratee;
    }

    get length(): number { return this.times; }

    public serializeSlice(index: number, numberOfItems: number, functionCallSerializer: FunctionCallSerializer): ISerializedFunctionCall {
        const sliceStart = index * numberOfItems;
        const sliceEnd = Math.min(sliceStart + numberOfItems, this.times);

        const iterateeFunction = functionCallSerializer.serializeFunctionCall(this.iteratee);

        return functionCallSerializer.serializeFunctionCall(ParallelWorkerFunctions.times, sliceStart, sliceEnd, iterateeFunction);
    }
}
