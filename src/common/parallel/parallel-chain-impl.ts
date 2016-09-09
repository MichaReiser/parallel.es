import {IParallelChain} from "./parallel-chain";
import {IParallelStream, ParallelStreamImpl} from "./parallel-stream";
import {IParallelTaskScheduling} from "./parallel-task-scheduling";
import {TaskDefinition} from "../task/task-definition";
import {IParallelGenerator} from "./parallel-generator";
import {ParallelAction} from "./parallel-action";
import {DefaultInitializedParallelOptions} from "./parallel-options";
import {ParallelWorkerFunctions} from "./parallel-worker-functions";
export class ParallelChainImpl<TIn, TOut> implements IParallelChain<TIn, TOut> {

    constructor(public generator: IParallelGenerator, private options: DefaultInitializedParallelOptions, private actions: ParallelAction[] = []) {
    }

    public map<TResult>(mapper: (this: void, element: TOut) => TResult): IParallelChain<TIn, TResult> {
        return this._chain<TResult>(ParallelWorkerFunctions.map, mapper);
    }

    public reduce<TResult>(defaultValue: TResult, accumulator: (this: void, memo: TResult, value: TOut) => TResult, combiner?: (this: void, sub1: TResult, sub2: TResult) => TResult): IParallelStream<TResult[], TResult> {
        const stream = this._chain(ParallelWorkerFunctions.reduce, accumulator, defaultValue)._stream((intermediateResults: TResult[][]) => {
            let sum = defaultValue;
            let combineOperation: (accumulatedValue: TResult, value: TResult) => TResult = combiner || accumulator as any;

            for (const temp of intermediateResults) {
                sum = combineOperation(sum, temp[0]);
            }

            return sum;
        });
        return stream;
    }

    public filter(predicate: (this: void, value: TOut) => boolean): IParallelChain<TIn, TOut> {
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
        let itemsPerWorker = totalItems / this.options.maxConcurrencyLevel;

        if (this.options.minValuesPerWorker) {
            itemsPerWorker = Math.min(Math.max(itemsPerWorker, this.options.minValuesPerWorker), totalItems);
        }

        if (this.options.maxValuesPerWorker) {
            itemsPerWorker = Math.min(itemsPerWorker, this.options.maxValuesPerWorker);
        }

        return {
            numberOfWorkers: Math.round(totalItems / itemsPerWorker),
            valuesPerWorker: Math.ceil(itemsPerWorker)
        };
    }

    private _stream<T, TResult>(joiner: (taskResults: T[]) => TResult | PromiseLike<TResult>): IParallelStream<T, TResult> {
        const tasks = this.getTaskDefinitions().map(definition => this.options.threadPool.scheduleTask<T>(definition));

        return new ParallelStreamImpl<T, TResult>(tasks, joiner);
    }

    private getTaskDefinitions(): TaskDefinition[] {
        const functionCallSerializer = this.options.threadPool.createFunctionSerializer();

        const taskDefinitions: TaskDefinition[] = [];
        const scheduling = this.getParallelTaskScheduling(this.generator.length);
        const serializedActions = this.actions.map(action => {
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

    private _chain<TResult> (func: Function, iteratee: Function, ...params: any[]): ParallelChainImpl<TIn, TResult> {
        const action = { coordinator: func, iteratee, coordinatorParams: params };
        return new ParallelChainImpl(this.generator, this.options, [...this.actions, action]);
    }
}
