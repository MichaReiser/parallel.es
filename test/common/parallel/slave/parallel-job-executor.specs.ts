import {FunctionCallDeserializer} from "../../../../src/common/function/function-call-deserializer";
import {toIterator} from "../../../../src/common/util/arrays";
import {parallelJobExecutor} from "../../../../src/common/parallel/slave/parallel-job-executor";
import {functionId} from "../../../../src/common/function/function-id";

describe("parallelJobExecutor", function () {
    let deserializer: FunctionCallDeserializer;

    beforeEach(function () {
        deserializer = new FunctionCallDeserializer(undefined as any);
    });

    it("deserializes the generator", function () {
        // arrange
        const generator = jasmine.createSpy("generator").and.returnValue(toIterator([1, 2, 3]));
        const serializedGenerator = {
            ______serializedFunctionCall: true,
            functionId: functionId("test", 1000),
            parameters: []
        };
        spyOn(deserializer, "deserializeFunctionCall").and.returnValue(generator);

        // act
        parallelJobExecutor({
            generator: serializedGenerator,
            operations: [],
            taskIndex: 0,
            valuesPerTask: 2
        }, { functionCallDeserializer: deserializer });

        // assert
        expect(deserializer.deserializeFunctionCall).toHaveBeenCalledWith(serializedGenerator, true);
    });

    it("uses the generator to create the start iterator", function () {
        // arrange
        const generator = jasmine.createSpy("generator").and.returnValue(toIterator([1, 2, 3]));
        spyOn(deserializer, "deserializeFunctionCall").and.returnValue(generator);

        // act
        parallelJobExecutor({
            generator: {
                ______serializedFunctionCall: true,
                functionId: functionId("test", 1000),
                parameters: []
            },
            operations: [],
            taskIndex: 0,
            valuesPerTask: 2
        }, { functionCallDeserializer: deserializer });

        // assert
        expect(generator).toHaveBeenCalledWith({ taskIndex: 0, valuesPerTask: 2 });
    });

    it("calls the coordinator with the generator iterator, the deserialized iteratee and the environment", function () {
        // arrange
        const iterator = toIterator([1, 2, 3]);
        const generator = jasmine.createSpy("generator").and.returnValue(iterator);
        const coordinator = jasmine.createSpy("coordinator").and.returnValue(toIterator([2, 4]));
        const iteratee = jasmine.createSpy("iteratee");
        let userEnvironment = { test: 10 };
        spyOn(deserializer, "deserializeFunctionCall").and.returnValues(generator, coordinator, iteratee);

        // act
        parallelJobExecutor({
            environment: userEnvironment,
            generator: {
                ______serializedFunctionCall: true,
                functionId: functionId("test", 1000),
                parameters: []
            },
            operations: [{
                iteratee: {
                    ______serializedFunctionCall: true,
                    functionId: functionId("test", 1002),
                    parameters: []
                },
                iterator: {
                    ______serializedFunctionCall: true,
                    functionId: functionId("test", 1001),
                    parameters: []
                }
            }],
            taskIndex: 0,
            valuesPerTask: 2
        }, { functionCallDeserializer: deserializer });

        // assert
        expect(coordinator).toHaveBeenCalledWith(iterator, iteratee, { taskIndex: 0, test: 10, valuesPerTask: 2 });
    });

    it("deserializes the environment and invokes the function to create the environment if the environment is a serialized function call", function () {
        // arrange
        const iterator = toIterator([1, 2, 3]);
        const environmentProvider = jasmine.createSpy("environmentProvider").and.returnValue({ test: 10 });
        const generator = jasmine.createSpy("generator").and.returnValue(iterator);
        const coordinator = jasmine.createSpy("coordinator").and.returnValue(toIterator([2, 4]));
        const iteratee = jasmine.createSpy("iteratee");
        spyOn(deserializer, "deserializeFunctionCall").and.returnValues(environmentProvider, generator, coordinator, iteratee);

        // act
        parallelJobExecutor({
            environment: {
                ______serializedFunctionCall: true,
                functionId: functionId("test", 1003),
                parameters: []
            },
            generator: {
                ______serializedFunctionCall: true,
                functionId: functionId("test", 1000),
                parameters: []
            },
            operations: [{
                iteratee: {
                    ______serializedFunctionCall: true,
                    functionId: functionId("test", 1002),
                    parameters: []
                },
                iterator: {
                    ______serializedFunctionCall: true,
                    functionId: functionId("test", 1001),
                    parameters: []
                }
            }],
            taskIndex: 0,
            valuesPerTask: 2
        }, { functionCallDeserializer: deserializer });

        // assert
        expect(coordinator).toHaveBeenCalledWith(iterator, iteratee, { taskIndex: 0, test: 10, valuesPerTask: 2 });
    });

    it("returns the iterator as array of the last action", function () {
        // arrange
        const iterator = toIterator([1, 2, 3]);
        const generator = jasmine.createSpy("generator").and.returnValue(iterator);
        const coordinator = jasmine.createSpy("coordinator").and.returnValue(toIterator([2, 4]));
        const iteratee = jasmine.createSpy("iteratee");
        spyOn(deserializer, "deserializeFunctionCall").and.returnValues(generator, coordinator, iteratee);

        // act
        const result = parallelJobExecutor({
            generator: {
                ______serializedFunctionCall: true,
                functionId: functionId("test", 1000),
                parameters: []
            },
            operations: [{
                iteratee: {
                    ______serializedFunctionCall: true,
                    functionId: functionId("test", 1002),
                    parameters: []
                },
                iterator: {
                    ______serializedFunctionCall: true,
                    functionId: functionId("test", 1001),
                    parameters: []
                }
            }],
            taskIndex: 0,
            valuesPerTask: 2
        }, { functionCallDeserializer: deserializer });

        // assert
        expect(result).toEqual([2, 4]);
    });
});
