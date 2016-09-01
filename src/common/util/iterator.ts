export interface IteratorResult<T> {
    done: boolean;
    value?: T;
}

export interface Iterator<T> {
    next(value?: any): IteratorResult<T>;
}

export function toIterator<T>(data: T[]): Iterator<T> {
    let i = 0;
    return {
        next() {
            if (i < data.length) {
                return {
                    done: false,
                    value: data[i++]
                };
            }  else {
                return { done: true };
            }
        }
    };
}

export function toArray<T>(iterator: Iterator<T>): T[] {
    const result: T[] = [];
    let current: IteratorResult<T>;
    while (!(current = iterator.next()).done) {
        result.push(<T>current.value);
    }
    return result;
}