import {ParallelWorkerFunctions} from "./parallel-worker-functions";
import {SerializedFunctionCall} from "../serialization/serialized-function-call";
import {FunctionCallSerializer} from "../serialization/function-call-serializer";

/**
 * const Value generator?
 */
export interface ParallelGenerator {
    length: number;
    serializeSlice(index: number, numberOfItems: number, functionCallSerializer: FunctionCallSerializer): SerializedFunctionCall;
}

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

export class RangeGenerator implements ParallelGenerator {
    constructor(private start: number, private end: number, private step: number) {}

    get length(): number {
        return Math.floor((this.end - this.start) / this.step);
    }

    serializeSlice(index: number, numberOfItems: number, functionCallSerializer: FunctionCallSerializer): SerializedFunctionCall {
        const sliceSize = numberOfItems * this.step;
        const sliceStart = this.start + index * sliceSize;
        const sliceEnd = Math.min(sliceStart + sliceSize, this.end);

        return functionCallSerializer.serializeFunctionCall(ParallelWorkerFunctions.range, sliceStart, sliceEnd, this.step);
    }
}

export class TimesGenerator<T> implements ParallelGenerator {

    constructor(private times: number, private iteratee: (time: number) => T) {}

    get length(): number { return this.times; }

    serializeSlice(index: number, numberOfItems: number, functionCallSerializer: FunctionCallSerializer): SerializedFunctionCall {
        const sliceStart = index * numberOfItems;
        const sliceEnd = Math.min(sliceStart + numberOfItems, this.times);

        const iterateeFunction = functionCallSerializer.serializeFunctionCall(this.iteratee);

        return functionCallSerializer.serializeFunctionCall(ParallelWorkerFunctions.times, sliceStart, sliceEnd, iterateeFunction);
    }
}
