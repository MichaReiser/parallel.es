
export function assign<T, S1>(target: T, source1: S1): T & S1;
export function assign<T, S1, S2>(target: T, source1: S1, source2: S2): T & S1 & S2;

/**
 * Polyfill for Object.assign
 * @param target target object
 * @param sources source object to copy into targetk
 */
export function assign<T>(target: T, ...sources: any[]): T {
    if (target == null) {
        throw new TypeError("Cannot convert undefined or null to object");
    }

    target = Object(target);
    for (let index = 1; index < arguments.length; index++) {
        const source = arguments[index];
        if (source != null) {
            for (const key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    (target as any)[key] = source[key];
                }
            }
        }
    }
    return target;
}
