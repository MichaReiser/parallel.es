/**
 * @module parallel
 */
/** needed, typedoc issue */

import {IParallelChain} from "./chain/parallel-chain";
import {IParallelOptions, IDefaultInitializedParallelOptions} from "./parallel-options";
import {IParallelTaskEnvironment, IEmptyParallelEnvironment} from "./parallel-environment";
import {ITask} from "../task/task";

/**
 * Main facade used to start parallel tasks.
 * Uses a chaining api. A new parallel task is created using a generator function like `from`, `range` or `times`.
 * This returns an {@link IParallelChain} that is used to define the operations to perform on the elements. The parallel job
 * is scheduled onto the thread pool as soon as a terminating function ({@link IParallelChain.then}, {@link IParallelChain.catch},
 * {@link IParallelChain.subscribe} or {@link IParallelChain.reduce}) is called.
 */
export interface IParallel {

    /**
     * Returns a copy of the default options
     * @returns the current default options
     */
    defaultOptions(): IDefaultInitializedParallelOptions;

    /**
     * Sets the default options used whenever a parallel task is started
     * @param options the default options. The options are merged with the existing default options.
     * To unset a value, explicitly assign undefined (not allowed for the mandatory values threadPool and maxConcurrencyLevel).
     * @returns the current default options
     */
    defaultOptions(options: IParallelOptions): void;

    /**
     * Creates a new parallel chain that transforms the given array. The elements processed are distributed onto different
     * workers.
     * @param data the array with the elements
     * @param options options options overriding the default options.
     * @param T type of the array elements
     */
    from<T>(data: T[], options?: IParallelOptions): IParallelChain<T, {}, T>;

    /**
     * Creates an array containing the elements in the range from start (inclusive) to end (exclusive) with the step size of step.
     * @param start the start of the range or the end, if the function is called with a single argument
     * @param end the end of the range
     * @param step the step size
     * @param options options configuring the computation behaviour
     */
    range(start: number, end?: number, step?: number, options?: IParallelOptions): IParallelChain<number, {}, number>;

    /**
     * Creates a new array containing the given value n times.
     * @param n how many time should the value be repeated
     * @param value the value to repeat
     * @param TValue type of the value
     */
    times<TValue>(n: number, value: TValue): IParallelChain<TValue, IEmptyParallelEnvironment, TValue>;

    /**
     * Creates a new array through calling the generator n times
     * @param n how many elements should be created using the provided generator
     * @param generator the generator used to create the array elements
     * @param TResult type of the elements returned by the generator
     */
    times<TResult>(n: number, generator: (this: void, n: number, env: IParallelTaskEnvironment) => TResult): IParallelChain<TResult, IEmptyParallelEnvironment, TResult>;

    /**
     * @param env environment that is provided to the iteratee function
     * @param options options configuring the computation behaviour
     * @param TEnv type of the environment
     */
    times<TEnv extends IEmptyParallelEnvironment, TResult>(n: number, generator: (this: void, n: number, env: TEnv & IParallelTaskEnvironment) => TResult, env: TEnv, options?: IParallelOptions): IParallelChain<TResult, TEnv, TResult>;

    /**
     * Schedules a single task to be executed on a background thread. The function is executed synchronously, only taking adventage of not blocking the ui thread.
     * Whenever, try to use other generator function as those offer better scheduling.
     * @param func the function to execute
     * @param env the environment passed to the function
     * @param options options defining how the function is scheduled
     * @returns a promise that is resolved when the computation is done or rejected if the computation has failed.
     */
    schedule<TEnv extends IEmptyParallelEnvironment, TResult>(func: (this: void, env: TEnv & IParallelTaskEnvironment) => TResult, env?: TEnv, options?: IParallelOptions): ITask<TResult>;
}
