import {IDefaultInitializedParallelOptions} from "../../../../src/common/parallel/parallel-options";
import {DefaultParallelScheduler} from "../../../../src/common/parallel/scheduling/default-parallel-scheduler";

describe("DefaultParallelScheduler", function () {
    let scheduler: DefaultParallelScheduler;
    let options: IDefaultInitializedParallelOptions;

    beforeEach(function () {
        scheduler = new DefaultParallelScheduler();
        options = {
            functionCallSerializer: undefined as any,
            maxConcurrencyLevel: 2,
            oversubscribe: true,
            scheduler,
            threadPool: undefined as any
        };
    });

    describe("getScheduling", function () {
        it("returns the options.maxConcurrencyLevel * 4 as numberOfTasks by default", function () {
            // act
            const scheduling = scheduler.getScheduling(10, options);

            // assert
            expect(scheduling.numberOfTasks).toBe(options.maxConcurrencyLevel * 4);
        });

        it("uses options.maxValuesPerTask as upper items limit", function () {
            // arrange
            options.maxValuesPerTask = 1;

            // act
            const scheduling = scheduler.getScheduling(10, options);

            // assert
            expect(scheduling.valuesPerTask).toBe(1);
            expect(scheduling.numberOfTasks).toBe(10);
        });

        it("ignores maxValuesPerTask if the calculated count is less then maxValuesPerTask", function () {
            // arrange
            options.maxValuesPerTask = 6;

            // act
            const scheduling = scheduler.getScheduling(10, options);

            // assert
            expect(scheduling.valuesPerTask).toBe(2);
            expect(scheduling.numberOfTasks).toBe(8);
        });

        it("assigns at least minValuesPerTask for each worker if the value is set", function () {
            // arrange
            options.minValuesPerTask = 5;

            // act
            const scheduling = scheduler.getScheduling(8, options);

            // assert
            expect(scheduling.valuesPerTask).toBe(5);
            expect(scheduling.numberOfTasks).toBe(2);
        });

        it("limits the number of items to the total items even if minValuesPerTask is set", function () {
            // arrange
            options.minValuesPerTask = 10;

            // act
            const scheduling = scheduler.getScheduling(5, options);

            // assert
            expect(scheduling.valuesPerTask).toBe(5);
            expect(scheduling.numberOfTasks).toBe(1);
        });

        it("sets valuesPerTask and numberOfTasks to 0 if the generator does not return any values", function () {
            // act
            const scheduling = scheduler.getScheduling(0, options);

            // assert
            expect(scheduling.valuesPerTask).toBe(0);
            expect(scheduling.numberOfTasks).toBe(0);
        });

        it("sets valuesPerTask not larger than options.maxConcurrencyLevel if oversubscribe is false", function () {
            // arrange
            options.oversubscribe = false;

            // act
            const scheduling = scheduler.getScheduling(20, options);

            // assert
            expect(scheduling.numberOfTasks).toBe(2);
            expect(scheduling.valuesPerTask).toBe(10);
        });
    });
});
