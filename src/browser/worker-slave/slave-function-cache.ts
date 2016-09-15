import {IFunctionLookupTable} from "../../common/serialization/function-lookup-table";
import {staticFunctionRegistry} from "../../common/serialization/static-function-registry";
import {IFunctionDefinition} from "../../common/worker/function-defintion";

/**
 * Cache used by each {@link BrowserWorkerSlave} to cache the received functions.
 * Caching the functions has the advantage that function only is serialized, transmitted and deserialized once. This also
 * has the advantage, that the function instance stays the same and therefore can be optimized by the runtime system.
 */
export class SlaveFunctionCache implements IFunctionLookupTable {
    private cache: { [id: number]: Function} = {};

    /**
     * Resolves the funciton with the givne id
     * @param id the id of the function to resolve
     * @returns the resolved function or undefined if not known
     */
    public getFunction(id: number): Function | undefined {
        if (staticFunctionRegistry.has(id)) {
            return staticFunctionRegistry.getFunction(id);
        }
        return this.cache[id];
    }

    /**
     * Registers a new function in the cache
     * @param definition the definition of the function to register
     * @returns the registered function
     */
    public registerFunction(definition: IFunctionDefinition): Function {
        const f = Function.apply(null, [...definition.argumentNames, definition.body]);
        this.cache[definition.id] = f;
        return f;
    }

    /**
     * Tests if the cache contains a function with the given id
     * @param id the id of the function to test for existence
     * @returns true if the cache contains a function with the given id
     */
    public has(id: number) {
        return !!(staticFunctionRegistry.has(id) || this.cache[id]);
    }
}
