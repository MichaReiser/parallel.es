import {ParallelWorkerFunctions} from "../../../src/common/parallel/parallel-worker-functions";
import {toArray, toIterator} from "../../../src/common/util/iterator";
import {FunctionCallDeserializer} from "../../../src/common/serialization/function-call-deserializer";
describe("ParallelWorkerFunctions", function () {

    describe("process", function () {
        let deserializer: FunctionCallDeserializer;

        beforeEach(function () {
            deserializer = new FunctionCallDeserializer(undefined as any);
        });

        it("deserializes the generator", function () {
            // arrange
            const generator = jasmine.createSpy("generator").and.returnValue(toIterator([1, 2, 3]));
            const serializedGenerator = {
                functionId: 1000,
                ______serializedFunctionCall: true,
                params: []
            };
            spyOn(deserializer, "deserializeFunctionCall").and.returnValue(generator);

            // act
            ParallelWorkerFunctions.process(serializedGenerator, [], { functionCallDeserializer: deserializer });

            // assert
            expect(deserializer.deserializeFunctionCall).toHaveBeenCalledWith(serializedGenerator, true);
        });

        it("uses the generator to create the start iterator", function () {
            // arrange
            const generator = jasmine.createSpy("generator").and.returnValue(toIterator([1, 2, 3]));
            spyOn(deserializer, "deserializeFunctionCall").and.returnValue(generator);

            // act
            ParallelWorkerFunctions.process({
                functionId: 1000,
                ______serializedFunctionCall: true,
                params: []
            }, [], { functionCallDeserializer: deserializer });

            // assert
            expect(generator).toHaveBeenCalled();
        });

        it("calls the coordinator with the generator iterator and the deserialized iteratee", function () {
            // arrange
            const iterator = toIterator([1, 2, 3]);
            const generator = jasmine.createSpy("generator").and.returnValue(iterator);
            const coordinator = jasmine.createSpy("coordinator").and.returnValue(toIterator([2, 4]));
            const iteratee = jasmine.createSpy("iteratee");
            spyOn(deserializer, "deserializeFunctionCall").and.returnValues(generator, coordinator, iteratee);

            // act
            ParallelWorkerFunctions.process({
                functionId: 1000,
                ______serializedFunctionCall: true,
                params: []
            }, [{
                coordinator: {
                    functionId: 1001,
                    ______serializedFunctionCall: true,
                    params: []
                },
                iteratee: {
                    functionId: 1002,
                    params: [],
                    ______serializedFunctionCall: true
                }
            }], { functionCallDeserializer: deserializer });

            // assert
            expect(coordinator).toHaveBeenCalledWith(iterator, iteratee);
        });

        it("returns the iterator as array of the last action", function () {
            // arrange
            const iterator = toIterator([1, 2, 3]);
            const generator = jasmine.createSpy("generator").and.returnValue(iterator);
            const coordinator = jasmine.createSpy("coordinator").and.returnValue(toIterator([2, 4]));
            const iteratee = jasmine.createSpy("iteratee");
            spyOn(deserializer, "deserializeFunctionCall").and.returnValues(generator, coordinator, iteratee);

            // act
            const result = ParallelWorkerFunctions.process({
                functionId: 1000,
                ______serializedFunctionCall: true,
                params: []
            }, [{
                coordinator: {
                    functionId: 1001,
                    ______serializedFunctionCall: true,
                    params: []
                },
                iteratee: {
                    functionId: 1002,
                    params: [],
                    ______serializedFunctionCall: true
                }
            }], { functionCallDeserializer: deserializer });

            // assert
            expect(result).toEqual([2, 4]);
        });
    });

    describe("map", function () {
        it("returns an iterator that has mapped all values using the passed iteratee", function () {
            // arrange
            const iterator = toIterator([1, 2, 3, 4]);
            const iteratee = (n: any) => n * 2;

            // act
            const result = ParallelWorkerFunctions.map(iterator, iteratee);

            // assert
            expect(toArray(result)).toEqual([2, 4, 6, 8]);
        });
    });

    describe("filter", function () {
        it("returns an iterator only containing the elements where the predicate returned true", function () {
            // arrange
            const predicate = jasmine.createSpy("predicate").and.returnValues(true, true, false, true);
            const iterator = toIterator([1, 2, 3, 4]);

            // act
            const filtered = ParallelWorkerFunctions.filter(iterator, predicate);

            // assert
            expect(toArray(filtered)).toEqual([1, 2, 4]);
        });
    });

    describe("reduce", function () {
        it("returns the default value if the passed iterator is empty", function () {
            // arrange
            const iterator = toIterator([]);

            // act
            const result = ParallelWorkerFunctions.reduce(100, iterator, (memo, value) => memo + value).next().value;

            // assert
            expect(result).toBe(100);
        });

        it("applies the accumulator for each value of the passed iterator", function () {
            // arrange
            const iterator = toIterator([1, 2, 3, 4]);
            const accumulator = jasmine.createSpy("accumulator");
            accumulator.and.callFake((memo: number, value: number) => memo + value);

            // act
            ParallelWorkerFunctions.reduce(0, iterator, accumulator).next().value;

            // assert
            expect(accumulator).toHaveBeenCalledWith(0, 1);
            expect(accumulator).toHaveBeenCalledWith(1, 2);
            expect(accumulator).toHaveBeenCalledWith(3, 3);
            expect(accumulator).toHaveBeenCalledWith(6, 4);
        });

        it("returns the accumulated value", function () {
            // arrange
            const iterator = toIterator([1, 2, 3, 4]);
            const accumulator = (memo: number, value: number) => memo + value;

            // act
            const result = ParallelWorkerFunctions.reduce(0, iterator, accumulator).next().value;

            // assert
            expect(result).toBe(10);
        });
    });

    describe("range", function () {
        it("returns an iterator containing the elements from start up to end (exclusive) increasing by step", function () {
            // arrange
            const iterator = ParallelWorkerFunctions.range(10, 20, 2);

            // act, assert
            expect(toArray(iterator)).toEqual([10, 12, 14, 16, 18]);
        });
    });

    describe("times", function () {
        it("returns an iterator that generates the elements using the generator function", function () {
            // arrange
            const generatorSpy = jasmine.createSpy("generator");
            const iterator = ParallelWorkerFunctions.times(5, 10, generatorSpy);

            // act
            toArray(iterator);

            // assert
            expect(generatorSpy).toHaveBeenCalledTimes(5);
        });

        it("returns an iterator containing the elements created by the generator", function () {
            // arrange
            const iterator = ParallelWorkerFunctions.times(5, 10, n => n * 2);

            // act, assert
            expect(toArray(iterator)).toEqual([10, 12, 14, 16, 18]);
        });
    });

    describe("identity", function () {
        it("returns the passed in element", function () {
            expect(ParallelWorkerFunctions.identity(10)).toBe(10);
        });
    });
});