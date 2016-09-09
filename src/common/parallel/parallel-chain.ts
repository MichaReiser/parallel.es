import {IParallelStream} from "./parallel-stream";

export interface IParallelChain<TIn, TOut> {
    map<TResult>(mapper: (this: void, element: TOut, index: number) => TResult): IParallelChain<TIn, TResult>;

    reduce(defaultValue: TOut, accumulator: (this: void, memo: TOut, value: TOut, index: number) => TOut): IParallelStream<TOut[], TOut>;
    reduce<TResult>(defaultValue: TResult, accumulator: (this: void, memo: TResult, value: TOut, index: number) => TResult, combiner: (this: void, subResult1: TResult, subResult2: TResult) => TResult): IParallelStream<TResult[], TResult>;

    filter(predicate: (this: void, value: TOut, index: number) => boolean): IParallelChain<TIn, TOut>;

    // sortBy?

    result(): IParallelStream<TOut[], TOut[]>;
}
