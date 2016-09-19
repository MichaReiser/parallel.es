import {IDefaultInitializedParallelOptions, IEmptyParallelEnvironment} from "../../../../src/common/parallel";
import {IParallelJobScheduler} from "../../../../src/common/parallel/scheduling/parallel-job-scheduler";
import {PendingParallelChainState} from "../../../../src/common/parallel/chain/pending-parallel-chain-state";
import {IParallelGenerator} from "../../../../src/common/parallel/generator/parallel-generator";
import {ParallelCollectionGenerator} from "../../../../src/common/parallel/generator/parallel-collection-generator";
import {ScheduledParallelChainState} from "../../../../src/common/parallel/chain/scheduled-parallel-chain-state";
import {ParallelWorkerFunctions} from "../../../../src/common/parallel/parallel-worker-functions";

describe("PendingParallelChainState", function () {
    let options: IDefaultInitializedParallelOptions;
    let environment: IEmptyParallelEnvironment;
    let scheduler: IParallelJobScheduler;
    let generator: IParallelGenerator;
    let scheduleSpy: jasmine.Spy;
    let state: PendingParallelChainState<number>;

    beforeEach(function () {
        scheduler = jasmine.createSpyObj<IParallelJobScheduler>("scheduler", ["schedule"]);
        scheduleSpy = scheduler.schedule as jasmine.Spy;
        options = {
            maxConcurrencyLevel: 2,
            scheduler,
            threadPool: undefined as any
        };

        environment = { test: 10 };
        generator = new ParallelCollectionGenerator([1, 2, 3, 4]);
        state = new PendingParallelChainState(generator, options, environment, []);
    });

    describe("resolve", function () {
        it("schedules the tasks", function () {
            // arrange
            scheduleSpy.and.returnValue([]);

            // act
            state.resolve();

            // assert
            expect(scheduleSpy).toHaveBeenCalledWith({
                environment,
                generator,
                operations: [],
                options
            });
        });

        it("returns a scheduled parallel chain state", function () {
            // arrange
            scheduleSpy.and.returnValue([]);

            // act
            const scheduledState = state.resolve();

            // assert
            expect(scheduledState).toEqual(new ScheduledParallelChainState(jasmine.anything() as any, options, environment));
        });
    });

    describe("chainOperation", function () {
        it("returns a new state", function () {
            // arrange
            const operation = {
                iteratee: () => undefined,
                iterator: ParallelWorkerFunctions.map,
                iteratorParams: []
            };

            // act
            expect(state.chainOperation(operation)).not.toBe(state);
        });

        it("returns a state containing the chained operation", function () {
            // arrange
            const operation = {
                iteratee: () => undefined,
                iterator: ParallelWorkerFunctions.map,
                iteratorParams: []
            };

            // act
            expect(state.chainOperation(operation)).toEqual(new PendingParallelChainState(generator, options, environment, [operation]));
        });
    });

    describe("changeEnvironment", function () {
        it("returns a new state", function () {
            expect(state.changeEnvironment({ test: 25 })).not.toBe(state);
        });

        it("returns a state containing the chained operation", function () {
            expect(state.changeEnvironment({ test: 25 })).toEqual(new PendingParallelChainState(generator, options, { test: 25 }, []));
        });
    });
});
