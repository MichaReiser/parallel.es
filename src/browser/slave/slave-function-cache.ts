import {FunctionLookupTable} from "../../common/serialization/function-lookup-table";
import {staticFunctionRegistry} from "../../common/serialization/static-function-registry";
import {FunctionDefinition} from "../../common/worker/function-defintion";

export class SlaveFunctionCache implements FunctionLookupTable {
    private cache: { [id: number]: Function} = {};

    public getFunction(id: number): Function {
        if (staticFunctionRegistry.has(id)) {
            return staticFunctionRegistry.getFunction(id);
        }
        return this.cache[id];
    }

    public registerFunction(definition: FunctionDefinition): Function {
        const f = Function.apply(null, [...definition.argumentNames, definition.body]);
        this.cache[definition.id] = f;
        return f;
    }

    public has(id: number) {
        return !!(staticFunctionRegistry.has(id) || this.cache[id]);
    }
}
