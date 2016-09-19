import {FunctionCallDeserializer} from "../function/function-call-deserializer";
import {ISerializedFunctionCall, isSerializedFunctionCall} from "../function/serialized-function-call";
import {staticFunctionRegistry} from "../function/static-function-registry";
import {toArray, toIterator} from "../util/arrays";
import {ISerializedParallelOperation} from "./parallel-operation";
import {IParallelTaskEnvironment, IEmptyParallelEnvironment} from "./parallel-environment";

/**
 * Defines the parallel operation to perform
 */
export interface IParallelProcessParams {
    /**
     * The generator that is used to create the array that is "manipulated" by applying the given actions.
     */
    generator: ISerializedFunctionCall;

    /**
     * The operations to perform on the array elements
     */
    operations: ISerializedParallelOperation[];

    /**
     * The environment. Object hash that is passed to all iteratee functions and allows to access external data
     */
    environment?: ISerializedFunctionCall | IEmptyParallelEnvironment;

    /**
     * The job-relative index of the task
     */
    taskIndex: number;

    /**
     * The number of values processed by each task (at most)
     */
    valuesPerTask: number;
}

function createTaskEnvironment(definition: IParallelProcessParams, functionCallDeserializer: FunctionCallDeserializer): IParallelTaskEnvironment {
    let userDefinedEnvironment: IEmptyParallelEnvironment = {};

    if (definition.environment) {
        if (isSerializedFunctionCall(definition.environment)) {
            const environmentProvider = functionCallDeserializer.deserializeFunctionCall(definition.environment);
            userDefinedEnvironment = environmentProvider();
        } else {
            userDefinedEnvironment = definition.environment;
        }
    }

    return Object.assign({}, { taskIndex: definition.taskIndex, valuesPerTask: definition.valuesPerTask }, userDefinedEnvironment);
}

/**
 * Functions that are executed in the worker slave
 */
export const ParallelWorkerFunctions = {
    /**
     * Main coordination function for any operation performed using {@link IParallel}.
     * @param definition the definition of the operation to performed
     * @param options options passed from the thread pool
     * @param T type of the elements created by the generator
     * @param TResult type of the resulting elements
     * @returns the result of the operation from this worker
     */
    process<T, TResult>(definition: IParallelProcessParams, { functionCallDeserializer }: { functionCallDeserializer: FunctionCallDeserializer }): TResult[] {
        const environment = createTaskEnvironment(definition, functionCallDeserializer);
        const generatorFunction = functionCallDeserializer.deserializeFunctionCall(definition.generator, true);
        let iterator = generatorFunction(environment) as Iterator<T>;

        for (const operation of definition.operations) {
            const iteratorFunction = functionCallDeserializer.deserializeFunctionCall<Iterator<T>>(operation.iterator);
            const iteratee = functionCallDeserializer.deserializeFunctionCall(operation.iteratee);
            iterator = iteratorFunction(iterator, iteratee, environment);
        }

        return toArray<TResult>(iterator as any);
    },

    /**
     * Performs the map operation
     * @param iterator the iterator of the previous step
     * @param iteratee the iteratee to apply to each element in the iterator
     * @param env the environment of the job
     * @param T the type of the input elements
     * @param TResult the type of the returned element of the iteratee
     * @returns a new iterator where each element has been mapped using the iteratee
     */
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

    /**
     * Returns a new iterator that only contains all elements for which the given predicate returns true
     * @param iterator the iterator to filter
     * @param predicate the predicate to use for filtering the elements
     * @param env the environment of the job
     * @param T type of the elements to filter
     * @returns an iterator only containing the elements where the predicate is true
     */
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

    /**
     * Reduces the elements of the given iterator to a single value by applying the given iteratee to each element
     * @param defaultValue a default value that is as accumulator or for the case that the iterator is empty
     * @param iterator the iterator with the values to reduce
     * @param iteratee iteratee that is applied for each element. The iteratee is passed the accumulated value (sum of all previous values)
     * and the current element and has to return a new accumulated value.
     * @param env the environment of the job
     * @param T type of the elements to process
     * @param TResult type of the reduced value
     * @returns an array with a single value, the reduced value
     */
    reduce<T, TResult>(defaultValue: TResult, iterator: Iterator<T>, iteratee: (this: void, accumulatedValue: TResult, value: T | undefined, env: IParallelTaskEnvironment) => TResult, env: IParallelTaskEnvironment): Iterator<TResult> {
        let accumulatedValue = defaultValue;
        let current: IteratorResult<T>;

        /* tslint:disable:no-conditional-assignment */
        while (!(current = iterator.next()).done) {
            accumulatedValue = iteratee(accumulatedValue, current.value, env);
        }

        return toIterator([accumulatedValue]);
    },

    /**
     * Generator function that creates an iterator containing all elements in the range [start, end) with a step size of step.
     * @param start start value of the range (inclusive)
     * @param end end value of the range (exclusive)
     * @param step step size between two values
     * @returns iterator with the values [start, end)
     */
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

    /**
     * Generator that creates an iterator containing end - start elements that are created by calling the iteratee
     * @param start the start value (inclusive)
     * @param end end value (exclusive)
     * @param iteratee that is to be called to create the elements
     * @param env the environment of the job
     * @param TResult type of the created elements by the iteratee
     * @returns iterator for the created elements
     */
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

    /**
     * identity function. Returns the passed in value
     * @param element the value to return
     * @param T type of the element
     */
    identity<T>(element: T): T {
        return element;
    },

    toIterator
};

staticFunctionRegistry.registerStaticFunctions(ParallelWorkerFunctions);
