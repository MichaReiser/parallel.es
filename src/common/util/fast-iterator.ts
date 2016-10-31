/**
 * Alternative Iterator interface that is designed with focus on performance.
 * Fast Iterators tend to be 90% faster than ES6-Standard iterators. Probably mostly by the reduced number
 * of created objects.
 * https://jsperf.com/iterator-vs-fast-iterator-v2
 * @param T Type of the elements
 */
export interface IFastIterator<T> {
    /**
     * Indicator if the iterator has a next result
     * @returns true if the iterator contains a next element
     */
    hasNext(): boolean;

    /**
     * Returns the next element and moves the current position in the iterator one position forward.
     * @returns the next element
     * @throws if the iterator has no further elements
     */
    next(): T;
}
