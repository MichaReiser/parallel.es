import {IParallelChain, IParallelChainInitializer} from "./parallel-chain";
import {IParallelStream} from "./parallel-stream";
import {IParallelTaskScheduling} from "./parallel-task-scheduling";
import {ITaskDefinition} from "../task/task-definition";
import {IParallelGenerator} from "./parallel-generator";
import {IParallelOperation} from "./parallel-operation";
import {IDefaultInitializedParallelOptions} from "./parallel-options";
import {ParallelWorkerFunctions, IParallelProcessParams} from "./parallel-worker-functions";
import {IEmptyParallelEnvironment, IParallelTaskEnvironment} from "./parallel-environment";
import {IParallelTaskDefinition} from "./parallel-task-definition";
import {ParallelStreamImpl} from "./parallel-stream-impl";

export function createParallelChain<TIn, TOut>(generator: IParallelGenerator, options: IDefaultInitializedParallelOptions, operations?: IParallelOperation[]): ParallelChainImpl<TIn, IEmptyParallelEnvironment, TOut>;
export function createParallelChain<TIn, TEnv extends IEmptyParallelEnvironment, TOut>(generator: IParallelGenerator, options: IDefaultInitializedParallelOptions, sharedEnv: TEnv, operations?: IParallelOperation[]): ParallelChainImpl<TIn, TEnv, TOut>;

export function createParallelChain<TIn, TEnv extends IEmptyParallelEnvironment, TOut>(generator: IParallelGenerator, options: IDefaultInitializedParallelOptions, sharedEnv?: TEnv | IParallelOperation[], operations: IParallelOperation[] = []): ParallelChainImpl<TIn, TEnv, TOut> {
    let environment: TEnv;

    if (!sharedEnv) {
        environment = {} as any;
    } else if (sharedEnv instanceof Array) {
        environment = {} as any;
        operations = sharedEnv;
    } else {
        environment = sharedEnv;
    }

    return new ParallelChainImpl(generator, options, environment, undefined, operations);
}

export class ParallelChainImpl<TIn, TEnv extends IEmptyParallelEnvironment, TOut> implements IParallelChain<TIn, TEnv, TOut> {

    public generator: IParallelGenerator;
    private initializerFunc?: IParallelChainInitializer<TEnv, any>;
    private options: IDefaultInitializedParallelOptions;
    private sharedEnvironment: IEmptyParallelEnvironment;
    private operations: IParallelOperation[];

    constructor(generator: IParallelGenerator, options: IDefaultInitializedParallelOptions, sharedEnv: IEmptyParallelEnvironment, initializerFunc?: IParallelChainInitializer<TEnv, any>, operations: IParallelOperation[] = []) {
        this.generator = generator;
        this.options = options;
        this.sharedEnvironment = sharedEnv;
        this.initializerFunc = initializerFunc;
        this.operations = operations;
    }

    public environment<TEnvNew extends TEnv>(newEnv: TEnvNew): IParallelChain<TIn, TEnvNew, TOut> {
        return new ParallelChainImpl<TIn, TEnvNew, TOut>(this.generator, this.options, newEnv, this.initializerFunc, this.operations);
    }

    public initializer<TEnvAdditional>(initializer: IParallelChainInitializer<TEnv, TEnvAdditional>): IParallelChain<TIn, TEnv & TEnvAdditional, TOut> {
        return new ParallelChainImpl<TIn, TEnv & TEnvAdditional, TOut>(this.generator, this.options, this.sharedEnvironment, initializer, this.operations);
    }

    public map<TResult>(mapper: (this: void, element: TOut, env: TEnv & IParallelTaskEnvironment) => TResult): IParallelChain<TIn, TEnv, TResult> {
        return this._chain<TResult>(ParallelWorkerFunctions.map, mapper);
    }

    public reduce<TResult>(defaultValue: TResult, accumulator: (this: void, memo: TResult, value: TOut, env: TEnv & IParallelTaskEnvironment) => TResult, combiner?: (this: void, sub1: TResult, sub2: TResult) => TResult): IParallelStream<TResult[], TResult> {
        const combineOperation: (accumulatedValue: TResult, value: TResult) => TResult = combiner || accumulator as any;
        const stream = this._chain(ParallelWorkerFunctions.reduce, accumulator, defaultValue)._stream((intermediateResults: TResult[][]) => {
            if (intermediateResults.length === 0) {
                return defaultValue;
            }

            const [head, ...tail] = intermediateResults;
            let sum = head[0];

            for (const temp of tail) {
                sum = combineOperation(sum, temp[0]);
            }

            return sum;
        });
        return stream;
    }

    public filter(predicate: (this: void, value: TOut, env: TEnv & IParallelTaskEnvironment) => boolean): IParallelChain<TIn, TEnv, TOut> {
        return this._chain<TOut>(ParallelWorkerFunctions.filter, predicate);
    }

    public result(): IParallelStream<TOut[], TOut[]> {
        return this._stream<TOut[], TOut[]>((intermediateValue: TOut[][]) => {
            if (intermediateValue.length === 0) {
                return [];
            }
            const [head, ...tail] = intermediateValue;
            return Array.prototype.concat.apply(head, tail);
        });
    }

    public getParallelTaskScheduling(totalItems: number): IParallelTaskScheduling {
        let itemsPerTask = totalItems / this.options.maxConcurrencyLevel;

        if (this.options.minValuesPerTask) {
            itemsPerTask = Math.min(Math.max(itemsPerTask, this.options.minValuesPerTask), totalItems);
        }

        if (this.options.maxValuesPerTask) {
            itemsPerTask = Math.min(itemsPerTask, this.options.maxValuesPerTask);
        }

        return {
            numberOfTasks: itemsPerTask === 0 ? 0 : Math.round(totalItems / itemsPerTask),
            valuesPerTask: Math.ceil(itemsPerTask)
        };
    }

    private _stream<T, TResult>(joiner: (taskResults: T[]) => TResult | PromiseLike<TResult>): IParallelStream<T, TResult> {
        const tasks = this.getTaskDefinitions().map(definition => this.options.threadPool.scheduleTask<T>(definition));

        return new ParallelStreamImpl<T, TResult>(tasks, joiner);
    }

    private getTaskDefinitions(): ITaskDefinition[] {
        const taskDefinitions: ITaskDefinition[] = [];
        const scheduling = this.getParallelTaskScheduling(this.generator.length);
        const functionCallSerializer = this.options.threadPool.createFunctionSerializer();

        const serializedOperations = this.operations.map(operation => {
            return {
                iteratee: functionCallSerializer.serializeFunctionCall(operation.iteratee),
                iterator: functionCallSerializer.serializeFunctionCall(operation.iterator, ...operation.iteratorParams)
            };
        });
        const initializer = this.initializerFunc ? functionCallSerializer.serializeFunctionCall(this.initializerFunc) : undefined;

        for (let i = 0; i < scheduling.numberOfTasks; ++i) {
            const environment = Object.assign<IParallelTaskEnvironment, IEmptyParallelEnvironment>({ taskIndex: i, valuesPerTask: scheduling.valuesPerTask }, this.sharedEnvironment);
            const generator = this.generator.serializeSlice(i, scheduling.valuesPerTask, functionCallSerializer);

            const processParams: IParallelProcessParams = {
                operations: serializedOperations,
                environment,
                generator,
                initializer
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

    private _chain<TResult> (func: Function, iteratee: Function, ...params: any[]): ParallelChainImpl<TIn, TEnv, TResult> {
        const operations = { iterator: func, iteratee, iteratorParams: params };
        return new ParallelChainImpl(this.generator, this.options, this.sharedEnvironment, this.initializerFunc, [...this.operations, operations]);
    }
}
