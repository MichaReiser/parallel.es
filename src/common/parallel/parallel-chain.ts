import {IParallelStream} from "./parallel-stream";
import {IEmptyParallelEnvironment, IParallelTaskEnvironment} from "./parallel-environment";

export interface IParallelChainInitializer<TEnv, TEnvAdditional> {
    (this: void, env: TEnv & IParallelTaskEnvironment): TEnvAdditional;
}

export interface IParallelChain<TIn, TEnv extends IEmptyParallelEnvironment, TOut> {
    environment<TEnvNew extends TEnv>(newEnv: TEnvNew): IParallelChain<TIn, TEnvNew, TOut>;

    initializer<TEnvAdditional>(initializer: IParallelChainInitializer<TEnv, TEnvAdditional>): IParallelChain<TIn, TEnv & TEnvAdditional, TOut>;

    map<TResult>(mapper: { (this: void, element: TOut, env: TEnv & IParallelTaskEnvironment): TResult }): IParallelChain<TIn, TEnv, TResult>;

    reduce(defaultValue: TOut, accumulator: { (this: void, memo: TOut, value: TOut, env?: TEnv & IParallelTaskEnvironment): TOut }): IParallelStream<TOut[], TOut>;
    reduce<TResult>(defaultValue: TResult, accumulator: { (this: void, memo: TResult, value: TOut, env: TEnv & IParallelTaskEnvironment): TResult }, combiner: { (this: void, subResult1: TResult, subResult2: TResult): TResult }): IParallelStream<TResult[], TResult>;

    filter(predicate: { (this: void, value: TOut, env: TEnv & IParallelTaskEnvironment): boolean }): IParallelChain<TIn, TEnv, TOut>;

    // sortBy?
    // split? Allows to reuse the same intermediate result for multiple succeeding calls.

    result(): IParallelStream<TOut[], TOut[]>;
}
