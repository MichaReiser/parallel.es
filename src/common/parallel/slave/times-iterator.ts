import {IParallelTaskEnvironment} from "../";
import {AbstractFastIterator} from "../../util/abstract-fast-iterator";
import {IFastIterator} from "../../util/fast-iterator";

class TimesIterator<T> extends AbstractFastIterator<T> {
    private nextIndex: number;

    constructor(start: number, private end: number, private iteratee: (this: void, i: number, env: IParallelTaskEnvironment) => T, private env: IParallelTaskEnvironment) {
        super();
        this.nextIndex = start;
    }

    protected computeNext(): T | undefined {
        const current = this.nextIndex++;

        if (current < this.end) {
            return this.iteratee(current, this.env);
        }
        return this.endOfData();
    }
}

/**
 * Generator that creates an iterator containing end - start elements that are created by calling the iteratee
 * @param start the start value (inclusive)
 * @param end end value (exclusive)
 * @param iteratee that is to be called to create the elements
 * @param env the environment of the job
 * @param TResult type of the created elements by the iteratee
 * @returns iterator for the created elements
 */
export function timesIterator<TResult>(start: number, end: number, iteratee: (this: void, i: number, env: IParallelTaskEnvironment) => TResult, env: IParallelTaskEnvironment): IFastIterator<TResult> {
    return new TimesIterator(start, end, iteratee, env);
}
