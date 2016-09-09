export function toIterator<T>(data: T[]): Iterator<T> {
    return data[Symbol.iterator]();
}

export function toArray<T>(iterator: Iterator<T>): T[] {
    const result: T[] = [];
    let current: IteratorResult<T>;
    /* tslint:disable:no-conditional-assignment */
    while (!(current = iterator.next()).done) {
        result.push(current.value as T);
    }
    return result;
}
