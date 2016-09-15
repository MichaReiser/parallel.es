import {
    ConstCollectionGenerator, RangeGenerator,
    TimesGenerator
} from "../../../src/common/parallel/parallel-generator";
import {FunctionCallSerializer} from "../../../src/common/serialization/function-call-serializer";
import {FunctionRegistry} from "../../../src/common/serialization/function-registry";
import {ParallelWorkerFunctions} from "../../../src/common/parallel/parallel-worker-functions";

describe("ParallelGenerators", function () {
    let functionCallSerializer: FunctionCallSerializer;
    let getOrSetIdSpy: jasmine.Spy;

    beforeEach(function () {
        getOrSetIdSpy = jasmine.createSpy("functionRegistry.getOrSetId");
        const functionRegistry: FunctionRegistry = {
            getOrSetId: getOrSetIdSpy
        } as any;

        functionCallSerializer = new FunctionCallSerializer(functionRegistry);
    });

    describe("ConstCollectionGenerator", function () {
        describe("length", function () {
            it("returns 0 for an empty array", function () {
                // arrange
                const generator = new ConstCollectionGenerator([]);

                // act, assert
                expect(generator.length).toBe(0);
            });

            it("returns the length of the array", function() {
                // arrange
                const generator = new ConstCollectionGenerator([1, 2, 3]);

                // act, assert
                expect(generator.length).toBe(3);
            });
        });

        describe("serializeSlice", function () {

            it("returns a serialized toIterator function call", function () {
                // arrange
                const generator = new ConstCollectionGenerator([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                getOrSetIdSpy.and.returnValue(1000);

                // act
                const slice = generator.serializeSlice(0, 4, functionCallSerializer);

                // assert
                expect(slice.functionId).toBe(1000);
                expect(getOrSetIdSpy).toHaveBeenCalledWith(ParallelWorkerFunctions.toIterator);
            });

            it("passes a slice of the array as parameter", function () {
                // arrange
                const generator = new ConstCollectionGenerator([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                getOrSetIdSpy.and.returnValue(1000);

                // act
                const slice = generator.serializeSlice(0, 3, functionCallSerializer);

                // assert
                expect(slice.parameters).toEqual([[0, 1, 2]]);
            });

            it("passes a sub slice not starting at the end of the array", function () {
                // arrange
                const generator = new ConstCollectionGenerator([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                getOrSetIdSpy.and.returnValue(1000);

                // act
                const slice = generator.serializeSlice(1, 3, functionCallSerializer);

                // assert
                expect(slice.parameters).toEqual([[3, 4, 5]]);
            });

            it("reduces the slice size if it goes over the end of the array", function () {
                // arrange
                const generator = new ConstCollectionGenerator([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                getOrSetIdSpy.and.returnValue(1000);

                // act
                const slice = generator.serializeSlice(3, 3, functionCallSerializer);

                // assert
                expect(slice.parameters).toEqual([[9]]);
            });
        });
    });

    describe("RangeGenerator", function () {
        describe("length", function () {
            it("returns 0 for an empty range", function () {
                // arrange
                const generator = new RangeGenerator(0, 0, 1);

                // act, assert
                expect(generator.length).toBe(0);
            });

            it("returns the number of elements in the range", function () {
                // arrange
                const generator = new RangeGenerator(0, 10, 1);

                // act, assert
                expect(generator.length).toBe(10);
            });

            it("rounds the length up if it is not divisible by the step size (the first element is always included)", function () {
                // arrange
                const generator = new RangeGenerator(0, 10, 3);

                // act, assert
                expect(generator.length).toBe(4);
            });
        });

        describe("serializeSlice", function () {
            it("serializes the range functions", function () {
                // arrange
                const generator = new RangeGenerator(0, 10, 1);
                getOrSetIdSpy.and.returnValue(1);

                // act
                const func = generator.serializeSlice(0, 3, functionCallSerializer);

                // assert
                expect(func.functionId).toBe(1);
                expect(getOrSetIdSpy).toHaveBeenCalledWith(ParallelWorkerFunctions.range);
            });

            it("passes the start, end and step of the current slice as parameters", function () {
                // arrange
                const generator = new RangeGenerator(0, 10, 1);
                getOrSetIdSpy.and.returnValue(1);

                // act
                const func = generator.serializeSlice(1, 3, functionCallSerializer);

                // assert
                expect(func.parameters).toEqual([3 /* start */, 6 /* end */, 1 /* step */]);
            });

            it("sets the slice end to end if it is the last slice and adding the full slice sice would exceed the limit", function () {
                // arrange
                const generator = new RangeGenerator(0, 10, 1);
                getOrSetIdSpy.and.returnValue(1);

                // act
                const func = generator.serializeSlice(2, 4, functionCallSerializer);

                // assert
                expect(func.parameters).toEqual([8 /* start */, 10 /* end */, 1 /* step */]);
            });
        });
    });

    describe("TimesGenerator", function () {
        describe("length", function () {
            it("returns n", function () {
                // arrange
                const generator = new TimesGenerator(4, n => n);

                // act, assert
                expect(generator.length).toBe(4);
            });
        });

        describe("serializeSlice", function () {
            it("calls the times function", function () {
                // arrange
                const generator = new TimesGenerator(4, n => n);
                getOrSetIdSpy.and.returnValue(4);

                // act
                const func = generator.serializeSlice(0, 1, functionCallSerializer);

                // assert
                expect(func.functionId).toBe(4);
                expect(getOrSetIdSpy).toHaveBeenCalledWith(ParallelWorkerFunctions.times);
            });

            it("passes n and the serialized 'generator' function", function () {
                // arrange
                const generatorFunction = (n: any) => n;
                const generator = new TimesGenerator(20, generatorFunction);
                getOrSetIdSpy.and.returnValues(1000, 4);

                // act
                const func = generator.serializeSlice(1, 5, functionCallSerializer);

                // assert
                expect(func.parameters).toEqual([5, 10, jasmine.objectContaining({ functionId: 1000 })]);
                expect(getOrSetIdSpy).toHaveBeenCalledWith(ParallelWorkerFunctions.times);
                expect(getOrSetIdSpy).toHaveBeenCalledWith(generatorFunction);
            });

            it("limits the slice end max to n", function () {
                // arrange
                const generatorFunction = (n: any) => n;
                const generator = new TimesGenerator(10, generatorFunction);
                getOrSetIdSpy.and.returnValues(1000, 4);

                // act
                const func = generator.serializeSlice(2, 4, functionCallSerializer);

                // assert
                expect(func.parameters).toEqual([8, 10, jasmine.objectContaining({ functionId: 1000 })]);
            });
        });
    });
});
