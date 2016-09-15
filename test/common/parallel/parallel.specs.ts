import {IParallel} from "../../../src/common/parallel/parallel";
import {parallelFactory} from "../../../src/common/parallel/parallel-impl";
import {ParallelChainImpl} from "../../../src/common/parallel/parallel-chain-impl";
import {
    ConstCollectionGenerator, RangeGenerator,
    TimesGenerator
} from "../../../src/common/parallel/parallel-generator";

describe("Parallel", function () {
    let parallel: IParallel;
    let threadPool: any = {};
    const maxConcurrencyLevel = 2;

    beforeEach(function () {
        parallel = parallelFactory({
            functionLookupTable: undefined as any,
            maxConcurrencyLevel,
            threadPool
        });
    });

    describe("defaultOptions", function () {
        it("returns the default configuration", function () {
            // act
            const options = parallel.defaultOptions();

            // assert
            expect(options).toBeDefined();
        });

        it("initializes the maxConcurrencyLevel from the configuration by default", function () {
            // act
            const options = parallel.defaultOptions();

            // assert
            expect(options.maxConcurrencyLevel).toBe(maxConcurrencyLevel);
        });

        it("initializes the thread pool to the thread pool from the configuration by default", function () {
            // act
            const options = parallel.defaultOptions();

            // assert
            expect(options.threadPool).toBe(threadPool);
        });

        it("applies the user options as new default options", function () {
            // act
            parallel.defaultOptions({
                maxConcurrencyLevel: 8,
                minValuesPerWorker: 1000
            });

            // assert
            const options = parallel.defaultOptions();

            expect(options.maxConcurrencyLevel).toBe(8);
            expect(options.minValuesPerWorker).toBe(1000);
        });

        it("merges the given options with the existing options", function () {
            // act
            parallel.defaultOptions({
                maxConcurrencyLevel: 8,
                minValuesPerWorker: 1000
            });

            // assert
            const options = parallel.defaultOptions();
            expect(options.threadPool).toBe(threadPool);
        });

        it("unsets values if undefined is passed as option value", function () {
            // arrange
            parallel.defaultOptions({
                minValuesPerWorker: 1000
            });

            // act
            parallel.defaultOptions({
                minValuesPerWorker: undefined
            });

            // assert
            const options = parallel.defaultOptions();
            expect(options.minValuesPerWorker).toBeUndefined();
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
        it("returns a parallel chain over the passed array", function () {
            // arrange
            const data = [1, 2, 3, 4, 5];

            // act
            const chain = parallel.from(data);

            // assert
            expect(chain).toEqual(jasmine.any(ParallelChainImpl));

            const generator = (chain as ParallelChainImpl<number, {}, number>).generator;
            expect(generator).toEqual(jasmine.any(ConstCollectionGenerator));
        });
    });

    describe("range", function () {
        it("creates a new parallel chain with a range generator", function () {
            // act
            const chain = parallel.range(0, 10, 1);

            // assert
            expect(chain).toEqual(jasmine.any(ParallelChainImpl));
            const generator = (chain as ParallelChainImpl<number, {}, number>).generator as RangeGenerator;
            expect(generator.start).toBe(0);
            expect(generator.end).toBe(10);
            expect(generator.step).toBe(1);
        });

        it("initializes the start with 0 and step with 1, if the function is only called with a single, positive value", function () {
            // act
            const chain = parallel.range(10);

            // assert
            const generator = (chain as ParallelChainImpl<number, {}, number>).generator as RangeGenerator;
            expect(generator.start).toBe(0);
            expect(generator.end).toBe(10);
            expect(generator.step).toBe(1);
        });

        it("initializes the start with 0 and step with -1, if the function is only called with a single, negative value", function () {
            // act
            const chain = parallel.range(-10);

            // assert
            const generator = (chain as ParallelChainImpl<number, {}, number>).generator as RangeGenerator;
            expect(generator.start).toBe(0);
            expect(generator.end).toBe(-10);
            expect(generator.step).toBe(-1);
        });

        it("initializes step with 1, if the function is called with two values and start is less then end", function () {
            // act
            const chain = parallel.range(1, 10);

            // assert
            const generator = (chain as ParallelChainImpl<number, {}, number>).generator as RangeGenerator;
            expect(generator.start).toBe(1);
            expect(generator.end).toBe(10);
            expect(generator.step).toBe(1);
        });

        it("initializes step with -1, if the function is called with two arguments and start is larger then end", function () {
            // act
            const chain = parallel.range(10, 1);

            // assert
            const generator = (chain as ParallelChainImpl<number, {}, number>).generator as RangeGenerator;
            expect(generator.start).toBe(10);
            expect(generator.end).toBe(1);
            expect(generator.step).toBe(-1);
        });
    });

    describe("times", function () {
        it("returns a chain with a times generator", function () {
            // arrange
            const generatorFunc = (n: number) => n;

            // act
            const chain = parallel.times(10, generatorFunc);

            // assert
            const generator = (chain as ParallelChainImpl<number, {}, number>).generator as TimesGenerator<number>;
            expect(generator.times).toBe(10);
            expect(generator.iteratee).toBe(generatorFunc);
        });
    });
});
