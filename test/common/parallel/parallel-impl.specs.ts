import {IParallel} from "../../../src/common/parallel/parallel";
import {parallelFactory} from "../../../src/common/parallel/parallel-impl";
import {ParallelTimesGenerator} from "../../../src/common/parallel/generator/parallel-times-generator";
import {ParallelRangeGenerator} from "../../../src/common/parallel/generator/parallel-range-generator";
import {ParallelCollectionGenerator} from "../../../src/common/parallel/generator/parallel-collection-generator";
import * as ParallelChainFactoryModule from "../../../src/common/parallel/chain/parallel-chain-factory";
import {IDefaultInitializedParallelOptions} from "../../../src/common/parallel";
import {IThreadPool} from "../../../src/common/thread-pool/thread-pool";
import {FunctionCall} from "../../../src/common/function/function-call";
import {functionId} from "../../../src/common/function/function-id";

describe("Parallel", function () {
    let parallel: IParallel;
    let threadPool: IThreadPool;
    let scheduleSpy: jasmine.Spy;
    const maxConcurrencyLevel = 2;
    let createParallelChainSpy: jasmine.Spy;
    let options: IDefaultInitializedParallelOptions;

    beforeEach(function () {
        createParallelChainSpy = spyOn(ParallelChainFactoryModule, "createParallelChain");
        scheduleSpy = jasmine.createSpy("schedule");
        threadPool = { schedule: scheduleSpy } as any;
        options = {
            maxConcurrencyLevel,
            threadPool,
            scheduler: undefined as any
        };
        parallel = parallelFactory(options);
    });

    describe("defaultOptions", function () {
        it("returns the default configuration", function () {
            // act
            const defaultOptions = parallel.defaultOptions();

            // assert
            expect(defaultOptions).toBeDefined();
        });

        it("initializes the maxConcurrencyLevel from the configuration by default", function () {
            // act
            const defaultOptions = parallel.defaultOptions();

            // assert
            expect(defaultOptions.maxConcurrencyLevel).toBe(maxConcurrencyLevel);
        });

        it("initializes the thread pool to the thread pool from the configuration by default", function () {
            // act
            const defaultOptions = parallel.defaultOptions();

            // assert
            expect(defaultOptions.threadPool).toBe(threadPool);
        });

        it("applies the user options as new default options", function () {
            // act
            parallel.defaultOptions({
                maxConcurrencyLevel: 8,
                minValuesPerTask: 1000
            });

            // assert
            const defaultOptions = parallel.defaultOptions();

            expect(defaultOptions.maxConcurrencyLevel).toBe(8);
            expect(defaultOptions.minValuesPerTask).toBe(1000);
        });

        it("merges the given options with the existing options", function () {
            // act
            parallel.defaultOptions({
                maxConcurrencyLevel: 8,
                minValuesPerTask: 1000
            });

            // assert
            const defaultOptions = parallel.defaultOptions();
            expect(defaultOptions.threadPool).toBe(threadPool);
        });

        it("unsets values if undefined is passed as option value", function () {
            // arrange
            parallel.defaultOptions({
                minValuesPerTask: 1000
            });

            // act
            parallel.defaultOptions({
                minValuesPerTask: undefined
            });

            // assert
            const defaultOptions = parallel.defaultOptions();
            expect(defaultOptions.minValuesPerTask).toBeUndefined();
        });

        it("throws if maxConcurrencyLevel is not a number", function () {
            // act, assert
            expect(() => parallel.defaultOptions({ maxConcurrencyLevel: "test" } as any)).toThrowError("The maxConcurrencyLevel is mandatory and has to be a number");
        });

        it("throws if maxConcurrencyLevel is set to undefined", function () {
            // act, assert
            expect(() => parallel.defaultOptions({ maxConcurrencyLevel: undefined } as any)).toThrowError("The maxConcurrencyLevel is mandatory and has to be a number");
        });

        it("throws if the thread pool is set to undefined", function () {
            // act, assert
            expect(() => parallel.defaultOptions({ threadPool: undefined } as any)).toThrowError("The thread pool is mandatory and cannot be unset");
        });
    });

    describe("from", function () {
        it("creates a chain with a parallel collection generator over the passed in array", function () {
            // arrange
            const data = [1, 2, 3, 4, 5];

            // act
            parallel.from(data);

            // assert
            expect(createParallelChainSpy).toHaveBeenCalledWith(jasmine.any(ParallelCollectionGenerator), options);
            expect((createParallelChainSpy.calls.argsFor(0)[0] as ParallelCollectionGenerator<number>).collection).toEqual(data);
        });

        it("merges the options with the default options", function () {
            parallel.from([1, 2, 3, 4], { maxValuesPerTask: 2 });

            expect(createParallelChainSpy).toHaveBeenCalledWith(jasmine.any(ParallelCollectionGenerator), {
                maxConcurrencyLevel,
                maxValuesPerTask: 2,
                threadPool,
                scheduler: undefined
            });
        });
    });

    describe("range", function () {
        it("creates a new parallel chain with a range generator", function () {
            // act
            parallel.range(0, 10, 1);

            // assert
            expect(createParallelChainSpy).toHaveBeenCalledWith(jasmine.any(ParallelRangeGenerator), options);
            const generator = createParallelChainSpy.calls.argsFor(0)[0] as ParallelRangeGenerator;
            expect(generator.start).toBe(0);
            expect(generator.end).toBe(10);
            expect(generator.step).toBe(1);
        });

        it("merges the options with the default options", function () {
            parallel.range(0, 10, 1, { maxValuesPerTask: 2 });

            expect(createParallelChainSpy).toHaveBeenCalledWith(jasmine.any(ParallelRangeGenerator), {
                maxConcurrencyLevel,
                maxValuesPerTask: 2,
                threadPool,
                scheduler: undefined
            });
        });
    });

    describe("times", function () {
        it("creates a chain with a times generator", function () {
            // arrange
            const generatorFunc = (n: number) => n;

            // act
            parallel.times(10, generatorFunc);

            // assert
            expect(createParallelChainSpy).toHaveBeenCalledWith(jasmine.any(ParallelTimesGenerator), options);
            const generator = createParallelChainSpy.calls.argsFor(0)[0] as ParallelTimesGenerator;
            expect(generator.times).toBe(10);
            expect(generator.iteratee).toEqual(FunctionCall.createUnchecked(generatorFunc));
        });

        it("merges the options with the default options", function () {
            parallel.times(2, () => 3, {}, { maxValuesPerTask: 2 });

            expect(createParallelChainSpy).toHaveBeenCalledWith(jasmine.any(ParallelTimesGenerator), {
                maxConcurrencyLevel,
                maxValuesPerTask: 2,
                threadPool,
                scheduler: undefined
            }, {});
        });
    });

    describe("schedules", function () {
        it("schedules the function on the thread pool", function () {
            // arrange
            const func = jasmine.createSpy("func");

            // act
            parallel.schedule(func, { test: 123 });

            // assert
            expect(scheduleSpy).toHaveBeenCalledWith(func, { test: 123 });
        });

        it("schedules the function with the given id on the thread pool", function () {
            // arrange
            const funcId = functionId("test", 0);

            // act
            parallel.schedule(funcId, { test: 123 });

            // assert
            expect(scheduleSpy).toHaveBeenCalledWith(funcId, { test: 123 });
        });
    });
});
