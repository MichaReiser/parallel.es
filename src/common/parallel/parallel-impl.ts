import {IParallel} from "./parallel";
import {IDefaultInitializedParallelOptions, IParallelOptions, validateOptions} from "./parallel-options";
import {IParallelChain} from "./chain/parallel-chain";
import {IParallelTaskEnvironment} from "./parallel-environment";
import {ParallelCollectionGenerator} from "./generator/parallel-collection-generator";
import {ParallelRangeGenerator} from "./generator/parallel-range-generator";
import {ParallelTimesGenerator} from "./generator/parallel-times-generator";
import {createParallelChain} from "./chain/parallel-chain-factory";
import {ITask} from "../task/task";
import {IFunctionId, isFunctionId} from "../function/function-id";
import {FunctionCall} from "../function/function-call";
import {assign} from "../util/assign";

export function parallelFactory(defaultOptions: IDefaultInitializedParallelOptions): IParallel {
    function mergeOptions(userOptions?: IParallelOptions): IDefaultInitializedParallelOptions {
        if (userOptions) {
            if (userOptions.hasOwnProperty("threadPool") && typeof(userOptions.threadPool) === "undefined") {
                throw new Error("The thread pool is mandatory and cannot be unset");
            }

            if (userOptions.hasOwnProperty("functionCallSerializer") && typeof(userOptions.functionCallSerializer) === "undefined") {
                throw new Error("The function call serializer is mandatory and cannot be unset");
            }

            validateOptions(userOptions);
        }

        return assign({}, defaultOptions, userOptions) as IDefaultInitializedParallelOptions;
    }

    return {
        defaultOptions(options?: IParallelOptions): any {
            if (options) {
                defaultOptions = mergeOptions(options);
            } else {
                return assign({}, defaultOptions);
            }
        },

        from<T>(collection: T[], options?: IParallelOptions): IParallelChain<T, {}, T> {
            return createParallelChain(new ParallelCollectionGenerator<T>(collection), mergeOptions(options));
        },

        range(start: number, end?: number, step?: number, options?: IParallelOptions) {
            const generator = ParallelRangeGenerator.create(start, end, step);
            return createParallelChain(generator, mergeOptions(options));
        },

        times<TEnv, TResult>(n: number, generator: ((this: void, n: number, env: TEnv & IParallelTaskEnvironment) => TResult) | TResult | IFunctionId, env?: TEnv, options?: IParallelOptions) {
            if (env) {
                return createParallelChain(ParallelTimesGenerator.create(n, generator), mergeOptions(options), env);
            }
            return createParallelChain(ParallelTimesGenerator.create(n, generator), mergeOptions(options));
        },

        run<TResult>(func: ((this: void, ...params: any[]) => TResult) | IFunctionId, ...params: any[]): ITask<TResult> {
            let functionCall: FunctionCall;

            if (isFunctionId(func)) {
                functionCall = FunctionCall.create(func, params);
            } else {
                functionCall = FunctionCall.create(func, params);
            }

            const serializedCall = defaultOptions.functionCallSerializer.serializeFunctionCall(functionCall);
            const task = {
                main: serializedCall,
                usedFunctionIds: [serializedCall.functionId]
            };

            return defaultOptions.threadPool.run(task);
        }
    };
}
