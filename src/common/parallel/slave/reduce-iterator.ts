import {IParallelTaskEnvironment} from "../";
import {toIterator} from "../../util/arrays";
import {IFastIterator} from "../../util/fast-iterator";

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
export function reduceIterator<T, TResult>(defaultValue: TResult, iterator: IFastIterator<T>, iteratee: (this: void, accumulatedValue: TResult, value: T | undefined, env: IParallelTaskEnvironment) => TResult, env: IParallelTaskEnvironment): IFastIterator<TResult> {
    let accumulatedValue = defaultValue;

    /* tslint:disable:no-conditional-assignment */
    while (iterator.hasNext()) {
        accumulatedValue = iteratee(accumulatedValue, iterator.next(), env);
    }

    return toIterator([accumulatedValue]);
}
