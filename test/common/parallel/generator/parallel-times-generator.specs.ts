import {ParallelWorkerFunctions} from "../../../../src/common/parallel/parallel-worker-functions";
import {FunctionCallSerializer} from "../../../../src/common/function/function-call-serializer";
import {FunctionRegistry} from "../../../../src/common/function/function-registry";
import {ParallelTimesGenerator} from "../../../../src/common/parallel/generator/parallel-times-generator";

describe("ParallelTimesGenerator", function () {
    let functionCallSerializer: FunctionCallSerializer;
    let getOrSetIdSpy: jasmine.Spy;

    beforeEach(function () {
        getOrSetIdSpy = jasmine.createSpy("functionRegistry.getOrSetId");
        const functionRegistry: FunctionRegistry = {
            getOrSetId: getOrSetIdSpy
        } as any;

        functionCallSerializer = new FunctionCallSerializer(functionRegistry);
    });

    describe("length", function () {
        it("returns n", function () {
            // arrange
            const generator = new ParallelTimesGenerator(4, n => n);

            // act, assert
            expect(generator.length).toBe(4);
        });
    });

    describe("serializeSlice", function () {
        it("calls the times function", function () {
            // arrange
            const generator = new ParallelTimesGenerator(4, n => n);
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
            const generator = new ParallelTimesGenerator(20, generatorFunction);
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
            const generator = new ParallelTimesGenerator(10, generatorFunction);
            getOrSetIdSpy.and.returnValues(1000, 4);

            // act
            const func = generator.serializeSlice(2, 4, functionCallSerializer);

            // assert
            expect(func.parameters).toEqual([8, 10, jasmine.objectContaining({ functionId: 1000 })]);
        });
    });
});
