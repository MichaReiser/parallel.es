import {FunctionCallDeserializer} from "../serialization/function-call-deserializer";
import {ISerializedFunctionCall} from "../serialization/serialized-function-call";
import {staticFunctionRegistry} from "../serialization/static-function-registry";
import {toArray, toIterator} from "../util/iterator";
import {ISerializedParallelAction} from "./parallel-action";
import {IParallelTaskEnvironment} from "./parallel-environment";

export const ParallelWorkerFunctions = {
    process<T, TResult>(generator: ISerializedFunctionCall, actions: ISerializedParallelAction[], environment: IParallelTaskEnvironment, options: { functionCallDeserializer: FunctionCallDeserializer }): TResult[] {
        const generatorFunction = options.functionCallDeserializer.deserializeFunctionCall(generator, true);
        let iterator = generatorFunction(environment) as Iterator<T>;

        for (const action of actions) {
            const coordinator = options.functionCallDeserializer.deserializeFunctionCall<Iterator<T>>(action.coordinator);
            const iteratee = options.functionCallDeserializer.deserializeFunctionCall(action.iteratee);
            iterator = coordinator(iterator, iteratee, environment);
        }

        return toArray<TResult>(iterator as any);
    },

    map<T, TResult>(iterator: Iterator<T>, iteratee: (this: void, value: T, env: IParallelTaskEnvironment) => TResult, env: IParallelTaskEnvironment): Iterator<TResult> {
        return {
            next(): IteratorResult<TResult> {
                const result = iterator.next();
                if (result.done) {
                    return { done: true } as IteratorResult<TResult>;
                }
                return {
                    done: result.done,
                    value: iteratee(result.value, env)
                };
            }
        };
    },

    filter<T>(iterator: Iterator<T>, predicate: (this: void, value: T, env: IParallelTaskEnvironment) => boolean, env: IParallelTaskEnvironment): Iterator<T> {
        return {
            next() {
                let current: IteratorResult<T>;
                /* tslint:disable:no-conditional-assignment */
                while (!(current = iterator.next()).done) {
                    if (predicate(current.value, env)) {
                        return current;
                    }
                }

                return current;
            }
        };
    },

    reduce<T, TResult>(defaultValue: TResult, iterator: Iterator<T>, iteratee: (this: void, accumulatedValue: TResult, value: T | undefined, env: IParallelTaskEnvironment) => TResult, env: IParallelTaskEnvironment): Iterator<TResult> {
        let accumulatedValue = defaultValue;
        let current: IteratorResult<T>;

        /* tslint:disable:no-conditional-assignment */
        while (!(current = iterator.next()).done) {
            accumulatedValue = iteratee(accumulatedValue, current.value, env);
        }

        return toIterator([accumulatedValue]);
    },

    range(start: number, end: number, step: number): Iterator<number> {
        let next = start;
        return {
            next(): IteratorResult<number> {
                let current = next;
                next = current + step;
                if (current < end) {
                    return { done: false, value: current };
                }
                return { done: true } as IteratorResult<number>;
            }
        };
    },

    times<TResult>(start: number, end: number, iteratee: (this: void, i: number, env: IParallelTaskEnvironment) => TResult, env: IParallelTaskEnvironment): Iterator<TResult> {
        let next = start;
        return {
            next(): IteratorResult<TResult> {
                let current = next;
                next = current + 1;
                if (current < end) {
                    return { done: false, value: iteratee(current, env) };
                }
                return { done: true } as IteratorResult<TResult>;
            }
        };
    },

    identity<T>(element: T): T {
        return element;
    },

    toIterator
};

staticFunctionRegistry.registerStaticFunctions(ParallelWorkerFunctions);
