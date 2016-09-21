import {SlaveFunctionLookupTable} from "../../../src/common/function/slave-function-lookup-table";
import {functionId} from "../../../src/common/function/function-id";

describe("SlaveFunctionLookupTable", function () {
    let cache: SlaveFunctionLookupTable;

    beforeEach(function () {
        cache = new SlaveFunctionLookupTable();
    });

    describe("getFunction", function () {
        it("returns undefined if the function is not registered", function () {
            expect(cache.getFunction(functionId("test", 1000))).toBeUndefined();
        });

        it("returns the reference to the dynamic function registered in the cache, if the function is not a static one", function () {
            // arrange
            cache.registerFunction({
                argumentNames: ["x"],
                body: "return x;",
                id: functionId("test", 1000)
            });

            // act
            const func = cache.getFunction(functionId("test", 1000));

            // assert
            expect(func).toBeDefined();
            expect(func!(10)).toEqual(10);
        });
    });

    describe("registerFunction", function () {
        it("registers the given function definition", function () {
            // act
            cache.registerFunction({
                argumentNames: ["x"],
                body: "return x;",
                id: functionId("test", 1000)
            });

            // assert
            expect(cache.has(functionId("test", 1000))).toBe(true);
        });
    });
});
