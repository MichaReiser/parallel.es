import {FunctionDefinition} from "../worker/function-defintion";
import {SimpleMap} from "../simple-map";

/**
 * Lookup Table that assigns a unique id to dynamically resolved functions.
 */
export class DynamicFunctionLookupTable {
    private ids = new SimpleMap<string, number>();
    private definitions = new SimpleMap<number, FunctionDefinition>();
    private lastId = -1;

    /**
     * Returns the unique id for the passed in function or assigns a new id to this function and returns the newly assigned id
     * @param func the function for which the unique id should be determined
     * @returns {number} the unique id of this function
     */
    getOrSetId(func: Function): number {
        const source = func.toString();
        let id = this.ids.get(source);

        if (typeof (id) === "undefined") {
            id = ++this.lastId;
            this.ids.set(source, id);
            this.initDefinition(func, id);
        }

        return id;
    }

    /**
     * Returns the definition of the function with the given id or undefined, if the id is not assigned to any function definition
     * @param id the id of the function to resolve
     * @returns the resolved function definition or undefined
     */
    getDefinition(id: number): FunctionDefinition | undefined {
        return this.definitions.get(id);
    }

    private initDefinition(func: Function, id: number) {
        const source = func.toString();
        const args = source.substring(source.indexOf("(") + 1, source.indexOf(")")).split(",");
        const body = source.substring(source.indexOf("{") + 1, source.lastIndexOf("}"));

        const definition = { id, argumentNames: args.map(arg => arg.trim()), body: body.trim() };
        this.definitions.set(id, definition);
    }
}