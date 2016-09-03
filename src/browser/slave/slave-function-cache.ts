import {FunctionLookupTable} from "../../common/serialization/function-lookup-table";
import {FunctionDefinition} from "../../common/worker/function-defintion";
import {staticFunctionRegistry} from "../../common/serialization/static-function-registry";

export class SlaveFunctionCache implements FunctionLookupTable {
    private _cache: { [id: number]: Function} = {};

    getFunction(id: number): Function {
        if (staticFunctionRegistry.has(id)) {
            return staticFunctionRegistry.getFunction(id);
        }
        return this._cache[id];
    }

    registerFunction(definition: FunctionDefinition): Function {
        const f = Function.apply(null, [...definition.argumentNames, definition.body]);
        this._cache[definition.id] = f;
        return f;
    }

    has(id: number) {
        return !!(staticFunctionRegistry.has(id) || this._cache[id]);
    }
}