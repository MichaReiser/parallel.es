import {IParallelTaskEnvironment} from "../";
import {IFastIterator} from "../../util/fast-iterator";
import {AbstractFastIterator} from "../../util/abstract-fast-iterator";

class FilterIterator<T> extends AbstractFastIterator<T> {
    constructor(private preceding: IFastIterator<T>, private predicate: (this: void, value: T, env: IParallelTaskEnvironment) => boolean, private env: IParallelTaskEnvironment) {
        super();
    }

    protected computeNext(): any | T {
        while (this.preceding.hasNext()) {
            const current = this.preceding.next();

            if (this.predicate(current, this.env)) {
                return current;
            }
        }

        return this.endOfData();
    }
}

/**
 * Returns a new iterator that only contains all elements for which the given predicate returns true
 * @param iterator the iterator to filter
 * @param predicate the predicate to use for filtering the elements
 * @param env the environment of the job
 * @param T type of the elements to filter
 * @returns an iterator only containing the elements where the predicate is true
 */
export function filterIterator<T>(iterator: IFastIterator<T>, predicate: (this: void, value: T, env: IParallelTaskEnvironment) => boolean, env: IParallelTaskEnvironment): IFastIterator<T> {
    return new FilterIterator(iterator, predicate, env);
}
