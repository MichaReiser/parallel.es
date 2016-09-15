/**
 * @module parallel
 */
/** needed, typedoc issue */

import {IParallelStream} from "./parallel-stream";
import {IEmptyParallelEnvironment, IParallelTaskEnvironment} from "./parallel-environment";

export interface IParallelChainInitializer<TEnv, TEnvAdditional> {
    /**
     * Initializes the environment for a single task
     * @param env the current environment
     * @param TEnvAdditional the returned environment of the initializer that is merged with the current environment
     */
    (this: void, env: TEnv & IParallelTaskEnvironment): TEnvAdditional;
}

/**
 * The parallel chain allows to chain multiple operations before they are executed on a worker.
 * @param TIn the input values created by a generator function
 * @param TOut the type of the resulting elements
 * @param TEnv the type of the environment
 */
export interface IParallelChain<TIn, TEnv extends IEmptyParallelEnvironment, TOut> {
    /**
     * Defines the environment that should be provided to all the iteratee or generator functions.
     * Functions cannot be passed to iteratee functions.
     * @param newEnv the environment that should be provided to the iteratee function
     */
    environment<TEnvNew extends TEnv>(newEnv: TEnvNew): IParallelChain<TIn, TEnvNew, TOut>;

    /**
     * Sets an initializer function that is executed for every task before any generator or other operation is executed.
     * Can be used to initialize the environment with large object structures that are too expensive to provide using {@link IParallelChain.environment}
     * @param initializer the initializer to call
     * @param TEnvAdditional Type of the object returned by the initializer
     */
    initializer<TEnvAdditional>(initializer: IParallelChainInitializer<TEnv, TEnvAdditional>): IParallelChain<TIn, TEnv & TEnvAdditional, TOut>;

    /**
     * Maps all input values to an output value using the given mapper. The mapper is applied for each input element
     * @param mapper the mapper to apply for each element
     * @param TResult the type of the resulting elements
     */
    map<TResult>(mapper: { (this: void, element: TOut, env: TEnv & IParallelTaskEnvironment): TResult }): IParallelChain<TIn, TEnv, TResult>;

    /**
     * Reduces the elements to a single value using the givne accumulator. The accumulator is invoked with the - up to now - accumulated value
     * and the current element and returns the sum of the accumulated value and the current value.
     * @param defaultValue default value to use to initialize the accumulator
     * @param accumulator the accumulator function
     * @returns parallel stream that allows to query the end result
     */
    reduce(defaultValue: TOut, accumulator: { (this: void, memo: TOut, value: TOut, env?: TEnv & IParallelTaskEnvironment): TOut }): IParallelStream<TOut[], TOut>;

    /**
     * Reduces the elements to a single value using the givne accumulator. The accumulator is invoked with the - up to now - accumulated value
     * and the current element and returns the sum of the accumulated value and the current value.
     * @param defaultValue default value to use to initialize the accumulator
     * @param accumulator the accumulator function
     * @param joiner joiner that is used to accumulate the sub results created by each task.
     * @param TResult type of the end result
     * @returns parallel stream that allows to query the end result
     */
    reduce<TResult>(defaultValue: TResult, accumulator: { (this: void, memo: TResult, value: TOut, env: TEnv & IParallelTaskEnvironment): TResult }, combiner: { (this: void, subResult1: TResult, subResult2: TResult): TResult }): IParallelStream<TResult[], TResult>;

    /**
     * Filters the input elements using the given predicate
     * @param predicate the predicate to use to filter the elements
     */
    filter(predicate: { (this: void, value: TOut, env: TEnv & IParallelTaskEnvironment): boolean }): IParallelChain<TIn, TEnv, TOut>;

    // sortBy?
    // split? Allows to reuse the same intermediate result for multiple succeeding calls.

    /**
     * Returns the result of the defined chain.
     * @returns a stream that can be used to access the result
     */
    result(): IParallelStream<TOut[], TOut[]>;
}
