import {DynamicFunctionRegistry} from "../../../src/common/function/dynamic-function-registry";
import {FunctionCallSerializer} from "../../../src/common/function/function-call-serializer";
import {functionId} from "../../../src/common/function/function-id";
describe("FunctionCallSerializer", function () {

    let functionRegistry: DynamicFunctionRegistry;
    let serializer: FunctionCallSerializer;
    function testFunction () {
        return 190;
    }

    beforeEach(function () {
        functionRegistry = new DynamicFunctionRegistry();
        serializer = new FunctionCallSerializer(functionRegistry);
    });

    describe("serializeFunctionCall", function () {
        it("looks up the function id in the function registry and returns the serialized call", function () {
            // arrange
            spyOn(functionRegistry, "getOrSetId").and.returnValue(1);

            // act
            const serialized = serializer.serializeFunctionCall(testFunction);

            // assert
            expect(serialized).not.toBeUndefined();
            expect(serialized.functionId).toBe(1);
            expect(serialized.parameters).toEqual([]);
        });

        it("passes the params in the params array", function () {
            // arrange
            spyOn(functionRegistry, "getOrSetId").and.returnValue(1);

            // act
            const serialized = serializer.serializeFunctionCall(testFunction, 10);

            // assert
            expect(serialized).not.toBeUndefined();
            expect(serialized.parameters).toEqual([10]);
        });
    });

    describe("serializedFunctionIds", function () {
        it("returns an empty array by default", function () {
            expect(serializer.serializedFunctionIds).toEqual([]);
        });

        it("returns the id of all serialized functions", function () {
            // arrange
            const functionIds = [functionId("test", 1), functionId("test", 2)];
            spyOn(functionRegistry, "getOrSetId").and.returnValues(...functionIds);
            function secondFunction() { return 10; }

            serializer.serializeFunctionCall(testFunction);
            serializer.serializeFunctionCall(secondFunction);

            // act, assert
            expect(serializer.serializedFunctionIds).toEqual(functionIds);
        });

        it("only returns unique function ids", function () {
            // arrange
            spyOn(functionRegistry, "getOrSetId").and.returnValue(functionId("test", 1));
            serializer.serializeFunctionCall(testFunction, 10);
            serializer.serializeFunctionCall(testFunction, 20);

            // act, assert
            expect(serializer.serializedFunctionIds).toEqual([functionId("test", 1)]);
        });
    });
});
