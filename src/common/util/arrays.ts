import {IFastIterator} from "./fast-iterator";
/**
 * Creates an iterator that iterates over the given array
 * @param data the array
 * @param T element type
 * @returns the iterator
 */
export function toIterator<T>(data: T[]): IFastIterator<T> {
    let index = 0;
    return {
        hasNext() {
            return index < data.length;
        },

        next() {
            if (index >= data.length) {
                throw new Error("Iterator has reached the end");
            }
            return data[index++];
        }
    };
}

/**
 * Converts the given iterator to an array
 * @param iterator the iterator that is to be converted into an array
 * @param T element type
 * @returns {T[]} the array representation of the given iterator
 */
export function toArray<T>(iterator: IFastIterator<T>): T[] {
    const result: T[] = [];

    while (iterator.hasNext()) {
        result.push(iterator.next());
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
