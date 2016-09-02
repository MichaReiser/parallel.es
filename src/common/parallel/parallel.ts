import {ParallelChain, toParallelChain} from "./parallel-chain";
import {Configuration} from "../configuration";
import {ConstCollectionGenerator, RangeGenerator, TimesGenerator} from "./parallel-generator";
import {ParallelWorkerFunctions} from "./parallel-worker-functions";
import {ParallelOptions, DefaultInitializedParallelOptions} from "./parallel-options";

export interface Parallel {

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
    times<TResult>(n: number, generator: (n: number) => TResult, options?: ParallelOptions): ParallelChain<TResult, TResult>;
}

export function parallelFactory(configuration: Configuration): Parallel {
    const defaultOptions: ParallelOptions = {
        threadPool: configuration.threadPool,
        maxConcurrencyLevel: configuration.maxConcurrencyLevel
    };

    function initOptions(userOptions?: ParallelOptions): DefaultInitializedParallelOptions {
        return Object.assign({}, defaultOptions, userOptions) as DefaultInitializedParallelOptions;
    }

    return {
        collection<T>(data: T[], options?: ParallelOptions): ParallelChain<T, T> {
            return toParallelChain(new ConstCollectionGenerator<T>(data), initOptions(options));
        },

        range(start: number, end?: number, step?: number, options?: ParallelOptions) {
            if (typeof(end) === "undefined") {
                end = start;
                start = 0;
            }

            if (typeof step === "undefined") {
                step = end < start ? -1 : 1;
            }

            return toParallelChain(new RangeGenerator(start, end, step), initOptions(options));
        },

        times<TResult>(n: number, generator: (n: number) => TResult = ParallelWorkerFunctions.identity, options?: ParallelOptions) {
            return toParallelChain(new TimesGenerator<TResult>(n, generator), initOptions(options));
        }
    };
}