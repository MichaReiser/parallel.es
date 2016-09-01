/**
 * A very simple implementation of a map. Do not use with complex objects as Key.
 */
export class SimpleMap<K, V> {
    private data: { [key: string]: V } = {};

    get(key: K): V | undefined {
        const internalKey = this.toInternalKey(key);
        return this.has(key) ? this.data[internalKey] : undefined;
    }

    has(key: K): boolean {
        return this.hasOwnProperty.call(this.data, this.toInternalKey(key));
    }

    set(key: K, value: V): void {
        this.data[this.toInternalKey(key)] = value;
    }

    clear(): void {
        this.data = {};
    }

    private toInternalKey(key: K): string {
        return `@${key}`;
    }
}