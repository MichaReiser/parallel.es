import {ParallelChain, toParallelChain} from "./parallel-chain";
import {Configuration} from "../configuration";
import {ConstCollectionGenerator, RangeGenerator, TimesGenerator} from "./parallel-generator";
import {ParallelWorkerFunctions} from "./parallel-worker-functions";
import {ParallelOptions, DefaultInitializedParallelOptions} from "./parallel-options";

export interface Parallel {

    /**
     * Returns a copy of the default options
     * @returns the current default options
     */
    defaultOptions(): DefaultInitializedParallelOptions;

    /**
     * Sets the default options for the parallel instance
     * @param options the default options. The options are merged with the existing default options.
     * To unset a value, explicitly assign undefined (not allowed for the mandatory values threadPool and maxConcurrencyLevel).
     * @returns the current default options
     */
    defaultOptions(options: ParallelOptions): DefaultInitializedParallelOptions;

    /**
     * Creates a new parallel chain for the given array
     * @param data the array with the elements
     * @param options options configuring the computation behaviour
     */
    collection<T>(data: T[], options?: ParallelOptions): ParallelChain<T, T>;

    /**
     * Creates an array containing the elements in the range from start (inclusive) to end (exclusive) with the step size of step.
     * @param start the start of the range or the end, if the function is called with a single argument
     * @param end the end of the range
     * @param step the step size
     * @param options options configuring the computation behaviour
     */
    range(start: number, end?: number, step?: number, options?: ParallelOptions): ParallelChain<number, number>;

    /**
     * Creates a new array through calling the generator n times
     * @param n how many elements should be created using the provided generator
     * @param generator the generator used to create the array elements
     * @param options options configuring the computation behaviou
     */
    times<TResult>(n: number, generator: (this: void, n: number) => TResult, options?: ParallelOptions): ParallelChain<TResult, TResult>;
}

export function parallelFactory(configuration: Configuration): Parallel {
    let defaultOptions: DefaultInitializedParallelOptions = {
        threadPool: configuration.threadPool,
        maxConcurrencyLevel: configuration.maxConcurrencyLevel
    };

    function mergeOptions(userOptions?: ParallelOptions): DefaultInitializedParallelOptions {
        if (userOptions) {
            if (userOptions.hasOwnProperty("threadPool") && typeof(userOptions.threadPool) === "undefined") {
                throw new Error("The thread pool is mandatory and cannot be unset");
            }

            if (userOptions.hasOwnProperty("maxConcurrencyLevel") && typeof(userOptions.maxConcurrencyLevel) !== "number") {
                throw new Error("The maxConcurrencyLevel is mandatory and has to be a number");
            }
        }

        return Object.assign({}, defaultOptions, userOptions) as DefaultInitializedParallelOptions;
    }

    return {
        defaultOptions(options?: ParallelOptions): DefaultInitializedParallelOptions {
            if (options) {
                defaultOptions = mergeOptions(options);
            }

            return Object.assign({}, defaultOptions);
        },

        collection<T>(collection: T[], options?: ParallelOptions): ParallelChain<T, T> {
            return toParallelChain(new ConstCollectionGenerator<T>(collection), mergeOptions(options));
        },

        range(start: number, end?: number, step?: number, options?: ParallelOptions) {
            if (typeof(end) === "undefined") {
                end = start;
                start = 0;
            }

            if (typeof step === "undefined") {
                step = end < start ? -1 : 1;
            }

            return toParallelChain(new RangeGenerator(start, end, step), mergeOptions(options));
        },

        times<TResult>(n: number, generator: (this: void, n: number) => TResult = ParallelWorkerFunctions.identity, options?: ParallelOptions) {
            return toParallelChain(new TimesGenerator<TResult>(n, generator), mergeOptions(options));
        }
    };
}