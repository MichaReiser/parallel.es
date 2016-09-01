import {SlaveFunctionCache} from "../../../src/browser/slave/slave-function-cache";
import {staticFunctionRegistry} from "../../../src/common/serialization/static-function-registry";

describe("SlaveFunctionCache", function () {
    let cache: SlaveFunctionCache;

    beforeEach(function () {
        cache = new SlaveFunctionCache();
    });

    describe("getFunction", function () {
        it("returns undefined if the function is not registered", function () {
            expect(cache.getFunction(1000)).toBeUndefined();
        });

        it("returns the reference to the static function with the given id", function () {
            // arrange
            function func() {}

            spyOn(staticFunctionRegistry, "has").and.returnValue(true);
            spyOn(staticFunctionRegistry, "getFunction").and.returnValue(func);

            // act, assert
            expect(cache.getFunction(0)).toBe(func);
        });

        it("returns the reference to the dynamic function registered in the cache, if the function is not a static one", function () {
            // arrange
            spyOn(staticFunctionRegistry, "has").and.returnValue(false);

            cache.registerFunction({
                body: "return x;",
                argumentNames: ["x"],
                id: 1
            });

            // act
            const func = cache.getFunction(1);

            // assert
            expect(func).toBeDefined();
            expect(func(10)).toEqual(10);
        });
    });

    describe("registerFunction", function () {
        it("registers the given function definition", function () {
            // act
            cache.registerFunction({
                body: "return x;",
                argumentNames: ["x"],
                id: 1
            });

            // assert
            expect(cache.has(1)).toBe(true);
        });

        it("assigns the function a name if the definition defines a name", function () {
            // act
            cache.registerFunction({
                body: "return x;",
                argumentNames: ["x"],
                id: 1,
                name: "test"
            });

            // assert
            expect((cache.getFunction(1) as any).name).toEqual("test");
        });
    });
});