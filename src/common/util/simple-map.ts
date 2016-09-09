/**
 * A very simple implementation of a map. Do not use with complex objects as Key.
 */
export class SimpleMap<K, V> {
    private data: { [key: string]: V } = {};

    public get(key: K): V | undefined {
        const internalKey = this.toInternalKey(key);
        return this.has(key) ? this.data[internalKey] : undefined;
    }

    public has(key: K): boolean {
        return this.hasOwnProperty.call(this.data, this.toInternalKey(key));
    }

    public set(key: K, value: V): void {
        this.data[this.toInternalKey(key)] = value;
    }

    public clear(): void {
        this.data = {};
    }

    private toInternalKey(key: K): string {
        return `@${key}`;
    }
}
