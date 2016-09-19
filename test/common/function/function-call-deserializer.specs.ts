import {FunctionCallDeserializer} from "../../../src/common/function/function-call-deserializer";
import {ISerializedFunctionCall} from "../../../src/common/function/serialized-function-call";
describe("FunctionCallDeserializer", function () {

    let getFunctionSpy: jasmine.Spy;
    let deserializer: FunctionCallDeserializer;

    beforeEach(function () {
        getFunctionSpy = jasmine.createSpy("functionLookupTable.getFunction");
        deserializer = new FunctionCallDeserializer({ getFunction: getFunctionSpy } as any);
    });

    describe("deserializeFunctionCall", function () {
        it("returns a function", function () {
            // arrange
            const serializedCall: ISerializedFunctionCall = {
                ______serializedFunctionCall: true,
                functionId: 1,
                parameters: []
            };

            getFunctionSpy.and.returnValue(function () { return 2; });

            // act
            const func = deserializer.deserializeFunctionCall(serializedCall);

            // assert
            expect(typeof func).toBe("function");
        });

        it("throws if the function is not in the registry", function () {
            // arrange
            const serializedCall: ISerializedFunctionCall = {
                ______serializedFunctionCall: true,
                functionId: 1,
                parameters: []
            };

            getFunctionSpy.and.returnValue(undefined);

            // act, assert
            expect(() => deserializer.deserializeFunctionCall(serializedCall)).toThrowError("The function with the id 1 could not be retrieved while deserializing the function call. Is the function correctly registered?");
        });

        it("the returned function calls the deserialized function and passes the serialized params", function () {
            // arrange
            const serializedCall: ISerializedFunctionCall = {
                ______serializedFunctionCall: true,
                functionId: 1,
                parameters: [2]
            };

            getFunctionSpy.and.returnValue(function (x: number) { return x; });

            // act
            const func = deserializer.deserializeFunctionCall(serializedCall);

            // assert
            expect(func()).toBe(2);
        });

        it("passes the additional parameters to the deserialized function", function () {
            // arrange
            const serializedCall: ISerializedFunctionCall = {
                ______serializedFunctionCall: true,
                functionId: 1,
                parameters: [2]
            };

            getFunctionSpy.and.returnValue(function (x: number, y: number) { return x + y; });

            // act
            const func = deserializer.deserializeFunctionCall(serializedCall);

            // assert
            expect(func(5)).toBe(7);
        });

        it("deserializes the serialized function calls in the params, if deserializeParams is true", function () {
            // arrange
            const serializedParam: ISerializedFunctionCall = {
                ______serializedFunctionCall: true,
                functionId: 1,
                parameters: [2]
            };

            const serializedCall: ISerializedFunctionCall = {
                ______serializedFunctionCall: true,
                functionId: 2,
                parameters: [serializedParam]
            };

            getFunctionSpy.and.callFake(function (funcId: number): Function | undefined {
                if (funcId === 1) {
                    return (x: number) => x;
                } else if (funcId === 2) {
                    return (x: Function) => x();
                }
                return undefined;
            });

            // act
            const func = deserializer.deserializeFunctionCall(serializedCall, true);

            // assert
            expect(func()).toBe(2);
        });
    });
});
