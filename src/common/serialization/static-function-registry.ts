import {SimpleMap} from "../util/simple-map";

class StaticFunctionRegistryImpl {
    private lastId = 0;
    private staticFunctions = new SimpleMap<number, IStaticFunction>();

    public registerStaticFunctions(object: Object): void {
        Object.keys(object)
            .map(key => (object as any)[key])
            .filter(value => typeof value === "function")
            .forEach(func => this.registerStaticFunction(func));
    }

    public registerStaticFunction(func: Function): void {
        if (this.has(func)) {
            return;
        }

        const staticFunc = func as IStaticFunction;
        staticFunc._____id = this.lastId++;
        this.staticFunctions.set(staticFunc._____id, staticFunc);
    }

    public getId(func: Function) {
        if (isStaticFunction(func)) {
            return func._____id;
        }

        throw new Error(`The passed in function ${func} is not a static function and therefore is not part of this registry`);
    }

    public has(func: Function|number): boolean {
        if (typeof func === "number") {
            return this.staticFunctions.has(func);
        }

        return isStaticFunction(func);
    }

    public getFunction(id: number): Function {
        const func = this.staticFunctions.get(id);
        if (!func) {
            throw new Error(`the function with the id ${id} is not registered as static function`);
        }
        return func;
    }

    public reset(): void {
        this.staticFunctions.clear();
        this.lastId = 0;
    }
}

export const staticFunctionRegistry = new StaticFunctionRegistryImpl();

interface IStaticFunction extends Function {
    _____id: number;
}

function isStaticFunction(func: any): func is IStaticFunction {
    return typeof(func) === "function" && typeof(func._____id) !== "undefined";
}
