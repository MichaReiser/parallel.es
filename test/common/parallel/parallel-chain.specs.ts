import {DefaultInitializedParallelOptions} from "../../../src/common/parallel/parallel-options";
import {ThreadPool} from "../../../src/common/thread-pool/thread-pool";
import {ParallelChainImpl} from "../../../src/common/parallel/parallel-chain";
import {IParallelGenerator, ConstCollectionGenerator} from "../../../src/common/parallel/parallel-generator";

describe("ParallelChainImpl", function () {
    let options: DefaultInitializedParallelOptions;
    let generator: IParallelGenerator;
    let threadPool: ThreadPool;

    beforeEach(function () {
        threadPool = jasmine.createSpyObj("threadPool", ["scheduleTask", "createFunctionSerializer"]) as ThreadPool;
        options = {
            maxConcurrencyLevel: 2,
            threadPool
        };

        generator = new ConstCollectionGenerator([1, 2, 3, 4, 5]);
    });

    describe("getParallelTaskScheduling", function () {
        it("returns the options.maxConcurrencyLevel as numberOfWorkers by default", function () {
            // arrange
            const chain = new ParallelChainImpl(generator, [], options);

            // act
            const scheduling = chain.getParallelTaskScheduling(10);

            // assert
            expect(scheduling.numberOfWorkers).toBe(options.maxConcurrencyLevel);
        });

        it("uses options.maxValuesPerWorker as upper items limit", function () {
            // arrange
            options.maxValuesPerWorker = 2;
            const chain = new ParallelChainImpl(generator, [], options);

            // act
            const scheduling = chain.getParallelTaskScheduling(10);

            // assert
            expect(scheduling.valuesPerWorker).toBe(2);
            expect(scheduling.numberOfWorkers).toBe(5);
        });

        it("ignores maxValuesPerWorker if the calculated count is less then maxValuesPerWorker", function () {
            // arrange
            options.maxValuesPerWorker = 6;
            const chain = new ParallelChainImpl(generator, [], options);

            // act
            const scheduling = chain.getParallelTaskScheduling(10);

            // assert
            expect(scheduling.valuesPerWorker).toBe(5);
            expect(scheduling.numberOfWorkers).toBe(2);
        });

        it("assigns at least minValuesPerWorker for each worker if the value is set", function () {
            // arrange
            options.minValuesPerWorker = 5;
            const chain = new ParallelChainImpl(generator, [], options);

            // act
            const scheduling = chain.getParallelTaskScheduling(8);

            // assert
            expect(scheduling.valuesPerWorker).toBe(5);
            expect(scheduling.numberOfWorkers).toBe(2);
        });

        it("limits the number of items to the total items even if minValuesPerWorker is set", function () {
            // arrange
            options.minValuesPerWorker = 10;
            const chain = new ParallelChainImpl(generator, [], options);

            // act
            const scheduling = chain.getParallelTaskScheduling(5);

            // assert
            expect(scheduling.valuesPerWorker).toBe(5);
            expect(scheduling.numberOfWorkers).toBe(1);
        });
    });
});
