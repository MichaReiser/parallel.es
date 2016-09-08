import {ParallelAction} from "./parallel-action";
import {TaskDefinition} from "../task/task-definition";
import {ParallelGenerator} from "./parallel-generator";
import {ParallelWorkerFunctions} from "./parallel-worker-functions";
import {DefaultInitializedParallelOptions} from "./parallel-options";

export interface ParallelTaskScheduling {
    numberOfWorkers: number;
    valuesPerWorker: number;
}

export interface ParallelChain<TIn, TOut> {
    map<TResult>(mapper: (this: void, element: TOut, index: number) => TResult): ParallelChain<TIn, TResult>;

    reduce(defaultValue: TOut, accumulator: (this: void, memo: TOut, value: TOut, index: number) => TOut): Promise<TOut>;
    reduce<TResult>(defaultValue: TResult, accumulator: (this: void, memo: TResult, value: TOut, index: number) => TResult, combiner: (this: void, subResult1: TResult, subResult2: TResult) => TResult): Promise<TResult>;

    filter(predicate: (this: void, value: TOut, index: number) => boolean): ParallelChain<TIn, TOut>;

    // sortBy?

    value(): Promise<TOut[]>;
}

export function toParallelChain<T>(generator: ParallelGenerator, options: DefaultInitializedParallelOptions, actions: ParallelAction[] = []): ParallelChain<T, T> {
    return new ParallelChainImpl<T, T>(generator, actions, options);
}

export class ParallelChainImpl<TIn, TOut> implements ParallelChain<TIn, TOut> {

    constructor(public generator: ParallelGenerator, private __actions: ParallelAction[] = [], private options: DefaultInitializedParallelOptions) {
    }

    map<TResult>(mapper: (this: void, element: TOut) => TResult): ParallelChain<TIn, TResult> {
        return this._chain<TResult>(ParallelWorkerFunctions.map, mapper);
    }

    reduce<TResult>(defaultValue: TResult, accumulator: (this: void, memo: TResult, value: TOut) => TResult, combiner?: (this: void, sub1: TResult, sub2: TResult) => TResult): Promise<TResult> {
        return this._chain(ParallelWorkerFunctions.reduce, accumulator, defaultValue)._schedule((intermediateResults: TResult[][]) => {
            let sum = defaultValue;
            let combineOperation: (accumulatedValue: TResult, value: TResult) => TResult = combiner || accumulator as any;

            for (const temp of intermediateResults) {
                sum = combineOperation(sum, temp[0]);
            }

            return sum;
        });
    }

    filter(predicate: (this: void, value: TOut) => boolean): ParallelChain<TIn, TOut> {
        return this._chain<TOut>(ParallelWorkerFunctions.filter, predicate);
    }

    value(): Promise<TOut[]> {
        return this._schedule((intermediateValue: TOut[][]) => {
            if (intermediateValue.length === 0) {
                return [];
            }
            const [head, ...tail] = intermediateValue;
            return Array.prototype.concat.apply(head, tail);
        });
    }

    private _schedule<T, TResult>(joiner: (taskResults: T[]) => TResult | PromiseLike<TResult>): Promise<TResult> {
        const tasks = this.getTaskDefinitions().map(definition => this.options.threadPool.scheduleTask<T>(definition));

        return Promise.all(tasks).then(joiner);
    }

    private getTaskDefinitions(): TaskDefinition[] {
        const functionCallSerializer = this.options.threadPool.createFunctionSerializer();

        const taskDefinitions: TaskDefinition[] = [];
        const scheduling = this.getParallelTaskScheduling(this.generator.length);
        const serializedActions = this.__actions.map(action => {
            return {
                coordinator: functionCallSerializer.serializeFunctionCall(action.coordinator, ...action.coordinatorParams),
                iteratee: functionCallSerializer.serializeFunctionCall(action.iteratee)
            };
        });

        for (let i = 0; i < scheduling.numberOfWorkers; ++i) {
            const generator = this.generator.serializeSlice(i, scheduling.valuesPerWorker, functionCallSerializer);
            const taskDefinition = {
                main: functionCallSerializer.serializeFunctionCall(ParallelWorkerFunctions.process, generator, serializedActions),
                usedFunctionIds: functionCallSerializer.serializedFunctionIds
            };

            taskDefinitions.push(taskDefinition);
        }
        return taskDefinitions;
    }

    getParallelTaskScheduling(totalItems: number): ParallelTaskScheduling {
        let itemsPerWorker = totalItems / this.options.maxConcurrencyLevel;

        if (this.options.minValuesPerWorker) {
            itemsPerWorker = Math.min(Math.max(itemsPerWorker, this.options.minValuesPerWorker), totalItems);
        }

        if (this.options.maxValuesPerWorker) {
            itemsPerWorker = Math.min(itemsPerWorker, this.options.maxValuesPerWorker);
        }

        return {
            valuesPerWorker: Math.ceil(itemsPerWorker),
            numberOfWorkers: Math.round(totalItems / itemsPerWorker)
        };
    }

    private _chain<TResult> (func: Function, iteratee: Function, ...params: any[]): ParallelChainImpl<TIn, TResult> {
        const action = { coordinator: func, iteratee, coordinatorParams: params };
        return new ParallelChainImpl(this.generator, [...this.__actions, action], this.options);
    }
}