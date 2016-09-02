import {Parallel, parallelFactory} from "../../../src/common/parallel/parallel";
import {ParallelChainImpl} from "../../../src/common/parallel/parallel-chain";
import {
    ConstCollectionGenerator, RangeGenerator,
    TimesGenerator
} from "../../../src/common/parallel/parallel-generator";

describe("Parallel", function () {
    let parallel: Parallel;

    beforeEach(function () {
        parallel = parallelFactory({
            maxConcurrencyLevel: 2,
            functionLookupTable: undefined as any,
            threadPool: undefined as any
        });
    });

    describe("collection", function () {
        it("returns a parallel chain over the passed array", function () {
            // arrange
            const data = [1, 2, 3, 4, 5];

            // act
            const chain = parallel.collection(data);

            // assert
            expect(chain).toEqual(jasmine.any(ParallelChainImpl));

            const generator = (chain as ParallelChainImpl<number, number>).generator;
            expect(generator).toEqual(jasmine.any(ConstCollectionGenerator));
        });
    });

    describe("range", function () {
        it("creates a new parallel chain with a range generator", function () {
            // act
            const chain = parallel.range(0, 10, 1);

            // assert
            expect(chain).toEqual(jasmine.any(ParallelChainImpl));
            const generator = (chain as ParallelChainImpl<number, number>).generator as RangeGenerator;
            expect(generator.start).toBe(0);
            expect(generator.end).toBe(10);
            expect(generator.step).toBe(1);
        });

        it("initializes the start with 0 and step with 1, if the function is only called with a single, positive value", function () {
            // act
            const chain = parallel.range(10);

            // assert
            const generator = (chain as ParallelChainImpl<number, number>).generator as RangeGenerator;
            expect(generator.start).toBe(0);
            expect(generator.end).toBe(10);
            expect(generator.step).toBe(1);
        });

        it("initializes the start with 0 and step with -1, if the function is only called with a single, negative value", function () {
            // act
            const chain = parallel.range(-10);

            // assert
            const generator = (chain as ParallelChainImpl<number, number>).generator as RangeGenerator;
            expect(generator.start).toBe(0);
            expect(generator.end).toBe(-10);
            expect(generator.step).toBe(-1);
        });

        it("initializes step with 1, if the function is called with two values and start is less then end", function () {
            // act
            const chain = parallel.range(1, 10);

            // assert
            const generator = (chain as ParallelChainImpl<number, number>).generator as RangeGenerator;
            expect(generator.start).toBe(1);
            expect(generator.end).toBe(10);
            expect(generator.step).toBe(1);
        });

        it("initializes step with -1, if the function is called with two arguments and start is larger then end", function () {
            // act
            const chain = parallel.range(10, 1);

            // assert
            const generator = (chain as ParallelChainImpl<number, number>).generator as RangeGenerator;
            expect(generator.start).toBe(10);
            expect(generator.end).toBe(1);
            expect(generator.step).toBe(-1);
        });
    });

    describe("times", function () {
        it("returns a chain with a times generator", function () {
            // act
            const generatorFunc = (n: number) => n;
            const chain = parallel.times(10, generatorFunc);

            // assert
            const generator = (chain as ParallelChainImpl<number, number>).generator as TimesGenerator<number>;
            expect(generator.times).toBe(10);
            expect(generator.iteratee).toBe(generatorFunc);
        });
    });
});