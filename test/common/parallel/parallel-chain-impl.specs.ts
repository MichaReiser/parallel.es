import {IDefaultInitializedParallelOptions, IParallelJobScheduler} from "../../../src/common/parallel";
import {IParallelGenerator, ConstCollectionGenerator} from "../../../src/common/parallel/parallel-generator";
import {createParallelChain} from "../../../src/common/parallel/parallel-chain-impl";
import {FunctionCall} from "../../../src/common/function/function-call";
import {ParallelWorkerFunctions} from "../../../src/common/parallel/parallel-worker-functions";

describe("ParallelChainImpl", function () {
    let generator: IParallelGenerator;
    let options: IDefaultInitializedParallelOptions;
    let scheduler: IParallelJobScheduler;
    let scheduleSpy: jasmine.Spy;

    beforeEach(function () {
        generator = new ConstCollectionGenerator([1, 2, 3, 4, 5]);
        scheduleSpy = jasmine.createSpy("schedule");
        scheduler = { schedule: scheduleSpy };
        options = {
            maxConcurrencyLevel: 2,
            scheduler,
            threadPool: undefined as any
        };
    });

    describe("createParallelChain", function () {
        it("uses the third parameter as operations if it is an array", function () {
            // arrange
            scheduleSpy.and.returnValues([]);
            const mapper = (value: number) => value * 2;
            const operations = [{
                iteratee: mapper,
                iterator: ParallelWorkerFunctions.map,
                iteratorParams: []
            }];

            const chain = createParallelChain(generator, options, operations);

            // act
            chain.result();

            // assert
            expect(scheduler.schedule).toHaveBeenCalledWith({
                environment: undefined,
                generator,
                operations,
                options
            });
        });

        it("it uses the third parameter as environment if it is not an array", function () {
            // arrange
            scheduleSpy.and.returnValues([]);
            const env = { test: 10 };

            const chain = createParallelChain(generator, options, env);

            // act
            chain.result();

            // assert
            expect(scheduler.schedule).toHaveBeenCalledWith({
                environment: env,
                generator,
                operations: [],
                options
            });
        });
    });

    describe("inEnvironment", function () {
        it("sets the environment of the chain to the passed object hash", function () {
             // arrange
            scheduleSpy.and.returnValues([]);
            const chain = createParallelChain(generator, options);

            // act
            chain
                .inEnvironment({ test: 10 })
                .result();

            // assert
            expect(scheduler.schedule).toHaveBeenCalledWith({
                environment: { test: 10 },
                generator,
                operations: [],
                options
            });
        });

        it("sets the environment of the chain to the passed in environment provider", function () {
            // arrange
            scheduleSpy.and.returnValues([]);
            const chain = createParallelChain(generator, options);
            const environmentProvider = (value: number) => ({ value });

            // act
            chain
                .inEnvironment(environmentProvider, 10)
                .result();

            // assert
            expect(scheduler.schedule).toHaveBeenCalledWith({
                environment: FunctionCall.create(environmentProvider, 10),
                generator,
                operations: [],
                options
            });
        });
    });

    describe("map", function () {
        it("adds the map operation to the operations to perform", function () {
            // arrange
            const mapper = (value: number) => value * 2;
            const chain = createParallelChain(generator, options).map(mapper);
            scheduleSpy.and.returnValue([]);

            // act
            chain.result();

            // assert
            expect(scheduler.schedule).toHaveBeenCalledWith({
                environment: undefined,
                generator,
                operations: [{
                    iteratee: mapper,
                    iterator: ParallelWorkerFunctions.map,
                    iteratorParams: []
                }],
                options
            });
        });
    });

    describe("filter", function () {
        it("adds the filter operation to the operations to perform", function () {
            // arrange
            const filter = (value: number) => value % 2 === 0;
            const chain = createParallelChain(generator, options).filter(filter);
            scheduleSpy.and.returnValue([]);

            // act
            chain.result();

            // assert
            expect(scheduler.schedule).toHaveBeenCalledWith({
                environment: undefined,
                generator,
                operations: [{
                    iteratee: filter,
                    iterator: ParallelWorkerFunctions.filter,
                    iteratorParams: []
                }],
                options
            });
        });
    });

    describe("reduce", function () {
        it("adds the reduce operation to the operations to perform", function () {
            // arrange
            const add = (memo: number, value: number) => memo + value;
            scheduleSpy.and.returnValue([]);

            // act
            createParallelChain(generator, options).reduce(0, add);

            // assert
            expect(scheduler.schedule).toHaveBeenCalledWith({
                environment: undefined,
                generator,
                operations: [ {
                    iteratee: add,
                    iterator: ParallelWorkerFunctions.reduce,
                    iteratorParams: [ 0 ]
                }],
                options
            });
        });
    });
});
