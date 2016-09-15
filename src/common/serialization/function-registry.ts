import {IFunctionDefinition} from "../worker/function-defintion";
import {SimpleMap} from "../util/simple-map";
import {staticFunctionRegistry} from "./static-function-registry";

/**
 * Lookup table for resolving the unique id of a function.
 */
export class FunctionRegistry {
    private ids = new SimpleMap<string, number>();
    private definitions = new SimpleMap<number, IFunctionDefinition>();
    private lastId = 999;

    /**
     * Returns the unique id for the passed in function or assigns a new id to the given function and returns the newly assigned id
     * @param func the function for which the unique id should be determined
     * @returns {number} the unique id of this function
     */
    public getOrSetId(func: Function): number {
        if (staticFunctionRegistry.has(func)) {
            return staticFunctionRegistry.getId(func);
        }
        return this._getOrSetIdForDynamicFunction(func);
    }

    /**
     * Returns the definition of the function with the given id or undefined, if the id is not assigned to any function definition
     * @param id the id of the function to resolve
     * @returns the resolved function definition or undefined
     * @throws if the function is a static function and therefore no definition exists.
     */
    public getDefinition(id: number): IFunctionDefinition | undefined {
        if (staticFunctionRegistry.has(id)) {
            throw new Error("The definition of a static function is not available");
        }

        return this.definitions.get(id);
    }

    private _getOrSetIdForDynamicFunction(func: Function): number {
        const source = func.toString();
        let id = this.ids.get(source);

        if (typeof (id) === "undefined") {
            id = ++this.lastId;
            this.ids.set(source, id);
            this.initDefinition(func, id);
        }

        return id;
    }

    private initDefinition(func: Function, id: number) {
        const source = func.toString();
        const name = source.substring(source.indexOf("function") + 9, source.indexOf("(")).trim();
        const args = source.substring(source.indexOf("(") + 1, source.indexOf(")")).split(",");
        const body = source.substring(source.indexOf("{") + 1, source.lastIndexOf("}")).trim();

        const definition = {
            argumentNames: args.map(arg => arg.trim()),
            body,
            id,
            name: name !== "anonymous" ? name : undefined
        };
        this.definitions.set(id, definition);
    }
}
