import {IParallelStream} from "./parallel-stream";
import {IEmptyParallelEnvironment, IParallelTaskEnvironment} from "./parallel-environment";

export interface IParallelChain<TIn, TEnv extends IEmptyParallelEnvironment, TOut> {
    environment(): TEnv;
    environment<TEnvNew extends TEnv>(newEnv: TEnvNew): IParallelChain<TIn, TEnvNew, TOut>;

    map<TResult>(mapper: (this: void, element: TOut, env: TEnv & IParallelTaskEnvironment) => TResult): IParallelChain<TIn, TEnv, TResult>;

    reduce(defaultValue: TOut, accumulator: (this: void, memo: TOut, value: TOut, env?: TEnv & IParallelTaskEnvironment) => TOut): IParallelStream<TOut[], TOut>;
    reduce<TResult>(defaultValue: TResult, accumulator: (this: void, memo: TResult, value: TOut, env: TEnv & IParallelTaskEnvironment) => TResult, combiner: (this: void, subResult1: TResult, subResult2: TResult) => TResult): IParallelStream<TResult[], TResult>;

    filter(predicate: (this: void, value: TOut, env: TEnv & IParallelTaskEnvironment) => boolean): IParallelChain<TIn, TEnv, TOut>;
    // sortBy?

    result(): IParallelStream<TOut[], TOut[]>;
}
