import {SimpleMap} from "../util/simple-map";

/**
 * Function registry that stores the statically registered functions.
 * A function that is statically registered does not need to be transmitted from the worker thread to the worker slave
 * as the function is available on the worker slave. The registry ensures that the worker thread and worker slave
 * use consistent ids for the same functions
 */
class StaticFunctionRegistryImpl {
    private lastId = 0;
    private staticFunctions = new SimpleMap<number, IStaticFunction>();

    /**
     * Registers all methods of the given object has static functions
     * @param object the object of which the functions should be registered
     */
    public registerStaticFunctions(object: Object): void {
        Object.keys(object)
            .map(key => (object as any)[key])
            .filter(value => typeof value === "function")
            .forEach(func => this.registerStaticFunction(func));
    }

    /**
     * Registers the given function as static function
     * @param func the function to register
     */
    public registerStaticFunction(func: Function): void {
        if (this.has(func)) {
            return;
        }

        const staticFunc = func as IStaticFunction;
        staticFunc._____id = this.lastId++;
        this.staticFunctions.set(staticFunc._____id, staticFunc);
    }

    /**
     * Returns the id of the static function
     * @param func the function for which the id should be retrieved
     * @returns the id of the function
     * @throws if the given function is not a statically registered function
     */
    public getId(func: Function) {
        if (isStaticFunction(func)) {
            return func._____id;
        }

        throw new Error(`The passed in function ${func} is not a static function and therefore is not part of this registry`);
    }

    /**
     * Tests if the registry contains a function with the given id
     * @param functionId the id of the function
     * @returns true if the registry contains a function with the given id
     */
    public has(functionId: number): boolean;

    /**
     * Tests if the given function is registered in the registry
     * @param func the function to test
     * @returns true if the function is registered in the registry
     */
    public has(func: Function): boolean;

    public has(func: Function|number): boolean {
        if (typeof func === "number") {
            return this.staticFunctions.has(func);
        }

        return isStaticFunction(func);
    }

    /**
     * Returns the function with the given id
     * @param id the id of the function
     * @returns the function
     * @throws if the registry does not contain a function with the given id
     */
    public getFunction(id: number): Function {
        const func = this.staticFunctions.get(id);
        if (!func) {
            throw new Error(`the function with the id ${id} is not registered as static function`);
        }
        return func;
    }

    /**
     * Removes all registrations from the registry
     */
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
