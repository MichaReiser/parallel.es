import {IParallelChain} from "./parallel-chain";
import {IParallelStream} from "./parallel-stream";
import {IParallelGenerator} from "./parallel-generator";
import {IParallelOperation} from "./parallel-operation";
import {IDefaultInitializedParallelOptions} from "./parallel-options";
import {ParallelWorkerFunctions} from "./parallel-worker-functions";
import {IEmptyParallelEnvironment, IParallelTaskEnvironment} from "./parallel-environment";
import {ParallelStreamImpl} from "./parallel-stream-impl";
import {FunctionCall} from "../function/function-call";

type IParallelChainEnvironment = FunctionCall | IEmptyParallelEnvironment;

export function createParallelChain<TIn, TOut>(generator: IParallelGenerator, options: IDefaultInitializedParallelOptions, operations?: IParallelOperation[]): IParallelChain<TIn, IEmptyParallelEnvironment, TOut>;
export function createParallelChain<TIn, TEnv extends IEmptyParallelEnvironment, TOut>(generator: IParallelGenerator, options: IDefaultInitializedParallelOptions, sharedEnv: TEnv, operations?: IParallelOperation[]): IParallelChain<TIn, TEnv, TOut>;
export function createParallelChain<TIn, TEnv extends IEmptyParallelEnvironment, TOut>(generator: IParallelGenerator, options: IDefaultInitializedParallelOptions, sharedEnv?: TEnv | IParallelOperation[], operations: IParallelOperation[] = []): IParallelChain<TIn, TEnv, TOut> {
    let environment: TEnv | undefined;

    if (sharedEnv instanceof Array) {
        environment = undefined;
        operations = sharedEnv;
    } else {
        environment = sharedEnv;
    }

    const chain = new ParallelChainImpl(generator, options, undefined, operations);
    return environment ? chain.inEnvironment(environment) : chain;
}

export class ParallelChainImpl<TIn, TEnv extends IEmptyParallelEnvironment, TOut> implements IParallelChain<TIn, TEnv, TOut> {

    public generator: IParallelGenerator;
    private options: IDefaultInitializedParallelOptions;
    private sharedEnvironment?: IParallelChainEnvironment;
    private operations: IParallelOperation[];

    constructor(generator: IParallelGenerator, options: IDefaultInitializedParallelOptions, sharedEnv?: IParallelChainEnvironment, operations: IParallelOperation[] = []) {
        this.generator = generator;
        this.options = options;
        this.sharedEnvironment = sharedEnv;
        this.operations = operations;
    }

    public inEnvironment<TEnvNew extends TEnv>(newEnv: Function | IEmptyParallelEnvironment, ...params: any[]): IParallelChain<TIn, TEnvNew, TOut> {
        let env: IParallelChainEnvironment | undefined;
        if (typeof newEnv === "function") {
            env = FunctionCall.createUnchecked(newEnv, ...params);
        } else {
            env = newEnv;
        }

        return new ParallelChainImpl<TIn, TEnvNew, TOut>(this.generator, this.options, env, this.operations);
    }

    public map<TResult>(mapper: (this: void, element: TOut, env: TEnv & IParallelTaskEnvironment) => TResult): IParallelChain<TIn, TEnv, TResult> {
        return this._chain<TResult>(ParallelWorkerFunctions.map, mapper);
    }

    public reduce<TResult>(defaultValue: TResult, accumulator: (this: void, memo: TResult, value: TOut, env: TEnv & IParallelTaskEnvironment) => TResult, combiner?: (this: void, sub1: TResult, sub2: TResult) => TResult): IParallelStream<TResult[], TResult> {
        const combineOperation: (accumulatedValue: TResult, value: TResult) => TResult = combiner || accumulator as any;
        return this._chain(ParallelWorkerFunctions.reduce, accumulator, defaultValue)._stream((intermediateResults: TResult[][]) => {
            const [head, ...tail] = intermediateResults;
            let sum = head[0];

            for (const temp of tail) {
                sum = combineOperation(sum, temp[0]);
            }

            return sum;
        });
    }

    public filter(predicate: (this: void, value: TOut, env: TEnv & IParallelTaskEnvironment) => boolean): IParallelChain<TIn, TEnv, TOut> {
        return this._chain<TOut>(ParallelWorkerFunctions.filter, predicate);
    }

    public run(): IParallelStream<TOut[], TOut[]> {
        return this._stream<TOut[], TOut[]>((intermediateValue: TOut[][]) => {
            const [head, ...tail] = intermediateValue;
            return Array.prototype.concat.apply(head, tail);
        });
    }

    private _stream<T, TResult>(joiner: (taskResults: T[]) => TResult | PromiseLike<TResult>): IParallelStream<T, TResult> {
        const tasks = this.options.scheduler.schedule({
            environment: this.sharedEnvironment,
            generator: this.generator,
            operations: this.operations,
            options: this.options
        });

        return new ParallelStreamImpl<T, TResult>(tasks, joiner);
    }

    private _chain<TResult> (func: Function, iteratee: Function, ...params: any[]): ParallelChainImpl<TIn, TEnv, TResult> {
        const operations = { iterator: func, iteratee, iteratorParams: params };
        return new ParallelChainImpl(this.generator, this.options, this.sharedEnvironment, [...this.operations, operations]);
    }
}
