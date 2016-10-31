import {IParallelTaskEnvironment} from "../";
import {AbstractFastIterator} from "../../util/abstract-fast-iterator";
import {IFastIterator} from "../../util/fast-iterator";

class MapIterator<T, TResult> extends AbstractFastIterator<TResult> {
    constructor(private preceding: IFastIterator<T>, private iteratee: (this: void, value: T, env: IParallelTaskEnvironment) => TResult, private env: IParallelTaskEnvironment) {
        super();
    }

    protected computeNext(): TResult | undefined {
        if (this.preceding.hasNext()) {
            return this.iteratee(this.preceding.next(), this.env);
        }

        return this.endOfData();
    }
}

/**
 * Performs the map operation
 * @param iterator the iterator of the previous step
 * @param iteratee the iteratee to apply to each element in the iterator
 * @param env the environment of the job
 * @param T the type of the input elements
 * @param TResult the type of the returned element of the iteratee
 * @returns a new iterator where each element has been mapped using the iteratee
 */
export function mapIterator<T, TResult>(iterator: IFastIterator<T>, iteratee: (this: void, value: T, env: IParallelTaskEnvironment) => TResult, env: IParallelTaskEnvironment): IFastIterator<TResult> {
    return new MapIterator(iterator, iteratee, env);
}
