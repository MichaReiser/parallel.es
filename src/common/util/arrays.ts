/**
 * Creates an iterator that iterates over the given array
 * @param data the array
 * @param T element type
 * @returns the iterator
 */
export function toIterator<T>(data: T[]): Iterator<T> {
    return data[Symbol.iterator]();
}

/**
 * Converts the given iterator to an array
 * @param iterator the iterator that is to be converted into an array
 * @param T element type
 * @returns {T[]} the array representation of the given iterator
 */
export function toArray<T>(iterator: Iterator<T>): T[] {
    const result: T[] = [];
    let current: IteratorResult<T>;
    /* tslint:disable:no-conditional-assignment */
    while (!(current = iterator.next()).done) {
        result.push(current.value as T);
    }
    return result;
}

/**
 * Flattens the given array.
 * @param deepArray the array to flatten
 * @param type of the array elements
 * @returns returns an array containing all the values contained in the sub arrays of deep array.
 */
export function flattenArray<T>(deepArray: T[][]): T[] {
    if (deepArray.length === 0) {
        return [];
    }

    const [head, ...tail] = deepArray;
    return Array.prototype.concat.apply(head, tail);
}
