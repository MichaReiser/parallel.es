import {SimpleMap} from "../util/simple-map";

export const staticFunctionRegistry = function () {
    let lastId = 0;
    const staticFunctions = new SimpleMap<number, StaticFunction>();

    return {
        registerStaticFunctions(object: Object): void {
            Object.keys(object)
                .map(key => (object as any)[key])
                .filter(value => typeof value === "function")
                .forEach(func => this.registerStaticFunction(func));
        },

        registerStaticFunction(func: Function): void {
            if (this.has(func)) {
                return;
            }

            const staticFunc = func as StaticFunction;
            staticFunc._____id = lastId++;
            staticFunctions.set(staticFunc._____id, staticFunc);
        },

        getId(func: Function) {
            if (isStaticFunction(func)) {
                return func._____id;
            }
            throw new Error(`The passed in function ${func} is not a static function and therefore is not part of this registry`);
        },

        has(func: Function|number): boolean {
            if (typeof func === "number") {
                return staticFunctions.has(func);
            }

            return isStaticFunction(func);
        },

        getFunction(id: number): Function {
            const func = staticFunctions.get(id);
            if (!func) {
                throw new Error(`the function with the id ${id} is not registered as static function`);
            }
            return func;
        },

        reset(): void {
            staticFunctions.clear();
            lastId = 0;
        }
    };
}();

interface StaticFunction extends Function {
    _____id: number;
}

function isStaticFunction(func: any): func is StaticFunction {
    return typeof(func) === "function" && typeof(func._____id) !== "undefined";
}