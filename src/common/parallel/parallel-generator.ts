import {ParallelWorkerFunctions} from "./parallel-worker-functions";
import {SerializedFunctionCall} from "../serialization/serialized-function-call";
import {FunctionCallSerializer} from "../serialization/function-call-serializer";

/**
 * Generator that creates a sequence of values and is capable
 * to distribute the value generations onto various workers
 */
export interface ParallelGenerator {
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
    serializeSlice(index: number, numberOfItems: number, functionCallSerializer: FunctionCallSerializer): SerializedFunctionCall;
}

/**
 * Generator for arrays
 */
export class ConstCollectionGenerator<T> implements ParallelGenerator {
    constructor(private __value: T[]) {}

    get length(): number {
        return this.__value.length;
    }

    serializeSlice(index: number, numberOfItems: number, functionCallSerializer: FunctionCallSerializer): SerializedFunctionCall {
        const start = numberOfItems * index;
        const end = start + numberOfItems;

        return functionCallSerializer.serializeFunctionCall(ParallelWorkerFunctions.toIterator, this.__value.slice(start, end));
    }
}

/**
 * Generator for creating values inside of a range
 */
export class RangeGenerator implements ParallelGenerator {
    readonly start: number;
    readonly end: number;
    readonly step: number;

    constructor(start: number, end: number, step: number) {
        this.start = start;
        this.end = end;
        this.step = step;
    }

    get length(): number {
        return Math.ceil((this.end - this.start) / this.step);
    }

    serializeSlice(index: number, numberOfItems: number, functionCallSerializer: FunctionCallSerializer): SerializedFunctionCall {
        const sliceSize = numberOfItems * this.step;
        const sliceStart = this.start + index * sliceSize;
        const sliceEnd = Math.min(sliceStart + sliceSize, this.end);

        return functionCallSerializer.serializeFunctionCall(ParallelWorkerFunctions.range, sliceStart, sliceEnd, this.step);
    }
}

/**
 * Generic generator that calls a passed in function n times to create n values
 */
export class TimesGenerator<T> implements ParallelGenerator {
    readonly times: number;
    readonly iteratee: (time: number) => T;

    constructor(times: number, iteratee: (time: number) => T) {
        this.times = times;
        this.iteratee = iteratee;
    }

    get length(): number { return this.times; }

    serializeSlice(index: number, numberOfItems: number, functionCallSerializer: FunctionCallSerializer): SerializedFunctionCall {
        const sliceStart = index * numberOfItems;
        const sliceEnd = Math.min(sliceStart + numberOfItems, this.times);

        const iterateeFunction = functionCallSerializer.serializeFunctionCall(this.iteratee);

        return functionCallSerializer.serializeFunctionCall(ParallelWorkerFunctions.times, sliceStart, sliceEnd, iterateeFunction);
    }
}
