import {IParallel} from "./parallel";
import {IDefaultInitializedParallelOptions, IParallelOptions} from "./parallel-options";
import {IParallelChain} from "./parallel-chain";
import {ConstCollectionGenerator, RangeGenerator, TimesGenerator} from "./parallel-generator";
import {IParallelTaskEnvironment} from "./parallel-environment";
import {ParallelWorkerFunctions} from "./parallel-worker-functions";
import {createParallelChain} from "./parallel-chain-impl";

export function parallelFactory(defaultOptions: IDefaultInitializedParallelOptions): IParallel {
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
