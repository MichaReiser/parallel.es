import {IParallelChain} from "./parallel-chain";
import {IParallelStream} from "./parallel-stream";
import {ITaskDefinition} from "../task/task-definition";
import {IParallelGenerator} from "./parallel-generator";
import {IParallelOperation} from "./parallel-operation";
import {IDefaultInitializedParallelOptions} from "./parallel-options";
import {ParallelWorkerFunctions, IParallelProcessParams} from "./parallel-worker-functions";
import {IEmptyParallelEnvironment, IParallelTaskEnvironment} from "./parallel-environment";
import {IParallelTaskDefinition} from "./parallel-task-definition";
import {ParallelStreamImpl} from "./parallel-stream-impl";
import {FunctionCallSerializer} from "../serialization/function-call-serializer";

class EnvironmentProvider {
    constructor(public func: Function, public params: any[]) {
    }
}

type IEnvironment = EnvironmentProvider | IEmptyParallelEnvironment;

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
    private sharedEnvironment?: IEnvironment;
    private operations: IParallelOperation[];

    constructor(generator: IParallelGenerator, options: IDefaultInitializedParallelOptions, sharedEnv?: IEnvironment, operations: IParallelOperation[] = []) {
        this.generator = generator;
        this.options = options;
        this.sharedEnvironment = sharedEnv;
        this.operations = operations;
    }

    public inEnvironment<TEnvNew extends TEnv>(newEnv: Function | IEmptyParallelEnvironment, ...params: any[]): IParallelChain<TIn, TEnvNew, TOut> {
        let env: IEnvironment;
        if (typeof newEnv === "function") {
            env = new EnvironmentProvider(newEnv, params);
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

    public result(): IParallelStream<TOut[], TOut[]> {
        return this._stream<TOut[], TOut[]>((intermediateValue: TOut[][]) => {
            const [head, ...tail] = intermediateValue;
            return Array.prototype.concat.apply(head, tail);
        });
    }

    private _stream<T, TResult>(joiner: (taskResults: T[]) => TResult | PromiseLike<TResult>): IParallelStream<T, TResult> {
        const tasks = this.getTaskDefinitions().map(definition => this.options.threadPool.scheduleTask<T>(definition));

        return new ParallelStreamImpl<T, TResult>(tasks, joiner);
    }

    private getTaskDefinitions(): ITaskDefinition[] {
        const taskDefinitions: ITaskDefinition[] = [];
        const scheduling = this.options.scheduler.getScheduling(this.generator.length, this.options);
        const functionCallSerializer = this.options.threadPool.createFunctionSerializer();

        const serializedOperations = this.operations.map(operation => {
            return {
                iteratee: functionCallSerializer.serializeFunctionCall(operation.iteratee),
                iterator: functionCallSerializer.serializeFunctionCall(operation.iterator, ...operation.iteratorParams)
            };
        });

        const environment = this.serializeEnvironment(functionCallSerializer);
        for (let i = 0; i < scheduling.numberOfTasks; ++i) {
            const generator = this.generator.serializeSlice(i, scheduling.valuesPerTask, functionCallSerializer);

            const processParams: IParallelProcessParams = {
                operations: serializedOperations,
                environment,
                generator,
                taskIndex: i,
                valuesPerTask: scheduling.valuesPerTask
            };

            const taskDefinition: IParallelTaskDefinition = {
                main: functionCallSerializer.serializeFunctionCall(ParallelWorkerFunctions.process, processParams),
                taskIndex: i,
                usedFunctionIds: functionCallSerializer.serializedFunctionIds,
                valuesPerTask: scheduling.valuesPerTask
            };

            taskDefinitions.push(taskDefinition);
        }
        return taskDefinitions;
    }

    private serializeEnvironment(functionCallSerializer: FunctionCallSerializer) {
        if (this.sharedEnvironment) {
            if (this.sharedEnvironment instanceof EnvironmentProvider) {
                return functionCallSerializer.serializeFunctionCall(this.sharedEnvironment.func, ...this.sharedEnvironment.params);
            }
            return this.sharedEnvironment;
        }

        return undefined;
    }

    private _chain<TResult> (func: Function, iteratee: Function, ...params: any[]): ParallelChainImpl<TIn, TEnv, TResult> {
        const operations = { iterator: func, iteratee, iteratorParams: params };
        return new ParallelChainImpl(this.generator, this.options, this.sharedEnvironment, [...this.operations, operations]);
    }
}
