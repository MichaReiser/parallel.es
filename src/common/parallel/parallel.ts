import {IParallelChain} from "./parallel-chain";
import {IConfiguration} from "../configuration";
import {ConstCollectionGenerator, RangeGenerator, TimesGenerator} from "./parallel-generator";
import {ParallelWorkerFunctions} from "./parallel-worker-functions";
import {IParallelOptions, IDefaultInitializedParallelOptions} from "./parallel-options";
import {createParallelChain} from "./parallel-chain-impl";
import {IParallelTaskEnvironment, IEmptyParallelEnvironment} from "./parallel-environment";

/**
 * Main facade used to start parallel tasks.
 * Uses a chaining api. A new parallel task is created using a generator function like `from`, `range` or `times`.
 * This returns an {@link IParallelChain} that is used to define the operations to perform on the elements.
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
     * Creates a new array through calling the generator n times
     * TODO: Add parallel.times overload that accepts a value instead of a generator #15
     * @param n how many elements should be created using the provided generator
     * @param generator the generator used to create the array elements
     * @param options options configuring the computation behaviou
     */
    times<TResult>(n: number, generator: (this: void, n: number, env: IParallelTaskEnvironment) => TResult): IParallelChain<TResult, IEmptyParallelEnvironment, TResult>;
    times<TEnv extends IEmptyParallelEnvironment, TResult>(n: number, generator: (this: void, n: number, env: TEnv & IParallelTaskEnvironment) => TResult, env: TEnv, options?: IParallelOptions): IParallelChain<TResult, TEnv, TResult>;
}

export function parallelFactory(configuration: IConfiguration): IParallel {
    let defaultOptions: IDefaultInitializedParallelOptions = {
        maxConcurrencyLevel: configuration.maxConcurrencyLevel,
        threadPool: configuration.threadPool
    };

    function mergeOptions(userOptions?: IParallelOptions): IDefaultInitializedParallelOptions {
        if (userOptions) {
            if (userOptions.hasOwnProperty("threadPool") && typeof(userOptions.threadPool) === "undefined") {
                throw new Error("The thread pool is mandatory and cannot be unset");
            }

            if (userOptions.hasOwnProperty("maxConcurrencyLevel") && typeof(userOptions.maxConcurrencyLevel) !== "number") {
                throw new Error("The maxConcurrencyLevel is mandatory and has to be a number");
            }
        }

        return Object.assign({}, defaultOptions, userOptions) as IDefaultInitializedParallelOptions;
    }

    return {
        defaultOptions(options?: IParallelOptions): any {
            if (options) {
                defaultOptions = mergeOptions(options);
            } else {
                return Object.assign({}, defaultOptions);
            }
        },

        from<T>(collection: T[], options?: IParallelOptions): IParallelChain<T, {}, T> {
            return createParallelChain(new ConstCollectionGenerator<T>(collection), mergeOptions(options));
        },

        range(start: number, end?: number, step?: number, options?: IParallelOptions) {
            if (typeof(end) === "undefined") {
                end = start;
                start = 0;
            }

            if (typeof step === "undefined") {
                step = end < start ? -1 : 1;
            }

            return createParallelChain(new RangeGenerator(start, end, step), mergeOptions(options));
        },

        times<TEnv, TResult>(n: number, generator: (this: void, n: number, env: TEnv & IParallelTaskEnvironment) => TResult = ParallelWorkerFunctions.identity, env?: TEnv, options?: IParallelOptions) {
            if (env) {
                return createParallelChain(new TimesGenerator<TResult>(n, generator), mergeOptions(options), env);
            }
            return createParallelChain(new TimesGenerator<TResult>(n, generator), mergeOptions(options));
        }
    };
}
