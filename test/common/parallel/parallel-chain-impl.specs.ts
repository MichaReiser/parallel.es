import {IDefaultInitializedParallelOptions} from "../../../src/common/parallel/parallel-options";
import {IThreadPool} from "../../../src/common/thread-pool/thread-pool";
import {createParallelChain} from "../../../src/common/parallel/parallel-chain-impl";
import {IParallelGenerator, ConstCollectionGenerator} from "../../../src/common/parallel/parallel-generator";
import {FunctionCallSerializer} from "../../../src/common/serialization/function-call-serializer";
import {ParallelWorkerFunctions} from "../../../src/common/parallel/parallel-worker-functions";
import {ISerializedFunctionCall} from "../../../src/common/serialization/serialized-function-call";

describe("ParallelChainImpl", function () {
    let options: IDefaultInitializedParallelOptions;
    let generator: IParallelGenerator;
    let createFunctionSerializerSpy: jasmine.Spy;
    let scheduleTaskSpy: jasmine.Spy;
    let threadPool: IThreadPool;

    beforeEach(function () {
        createFunctionSerializerSpy = jasmine.createSpy("createFunctionSerializer");
        scheduleTaskSpy = jasmine.createSpy("scheduleTask");
        threadPool = {
            createFunctionSerializer: createFunctionSerializerSpy,
            schedule: jasmine.createSpy("schedule"),
            scheduleTask: scheduleTaskSpy
        };
        options = {
            maxConcurrencyLevel: 2,
            threadPool
        };

        generator = new ConstCollectionGenerator([1, 2, 3, 4, 5]);
    });

    describe("getParallelTaskScheduling", function () {
        it("returns the options.maxConcurrencyLevel as numberOfTasks by default", function () {
            // arrange
            const chain = createParallelChain(generator, options);

            // act
            const scheduling = chain.getParallelTaskScheduling(10);

            // assert
            expect(scheduling.numberOfTasks).toBe(options.maxConcurrencyLevel);
        });

        it("uses options.maxvaluesPerTask as upper items limit", function () {
            // arrange
            options.maxValuesPerTask = 2;
            const chain = createParallelChain(generator, options);

            // act
            const scheduling = chain.getParallelTaskScheduling(10);

            // assert
            expect(scheduling.valuesPerTask).toBe(2);
            expect(scheduling.numberOfTasks).toBe(5);
        });

        it("ignores maxValuesPerTask if the calculated count is less then maxvaluesPerTask", function () {
            // arrange
            options.maxValuesPerTask = 6;
            const chain = createParallelChain(generator, options);

            // act
            const scheduling = chain.getParallelTaskScheduling(10);

            // assert
            expect(scheduling.valuesPerTask).toBe(5);
            expect(scheduling.numberOfTasks).toBe(2);
        });

        it("assigns at least minValuesPerTask for each worker if the value is set", function () {
            // arrange
            options.minValuesPerTask = 5;
            const chain = createParallelChain(generator, options);

            // act
            const scheduling = chain.getParallelTaskScheduling(8);

            // assert
            expect(scheduling.valuesPerTask).toBe(5);
            expect(scheduling.numberOfTasks).toBe(2);
        });

        it("limits the number of items to the total items even if minValuesPerTask is set", function () {
            // arrange
            options.minValuesPerTask = 10;
            const chain = createParallelChain(generator, options);

            // act
            const scheduling = chain.getParallelTaskScheduling(5);

            // assert
            expect(scheduling.valuesPerTask).toBe(5);
            expect(scheduling.numberOfTasks).toBe(1);
        });

        it("sets valuesPerTask and numberOfTasks to 0 if the generator does not return any values", function () {
            // arrange
            const chain = createParallelChain(new ConstCollectionGenerator([]), options);

            // act
            const scheduling = chain.getParallelTaskScheduling(0);

            // assert
            expect(scheduling.valuesPerTask).toBe(0);
            expect(scheduling.numberOfTasks).toBe(0);
        });
    });

    describe("result", function () {
        it("schedules the tasks on the thread pool", function () {
            // arrange
            const functionSerializer = new FunctionCallSerializer(undefined as any);
            createFunctionSerializerSpy.and.returnValue(functionSerializer);

            spyOn(functionSerializer, "serializeFunctionCall");

            const task1 = new Promise(() => undefined);
            const task2 = new Promise(() => undefined);

            scheduleTaskSpy.and.returnValues(task1, task2);

            spyOn(generator, "serializeSlice");

            // act
            createParallelChain(generator, options).result();

            // assert
            expect(scheduleTaskSpy).toHaveBeenCalledTimes(2);
        });

        it("calls serializeSlice for each slice", function () {
            // arrange
            const functionSerializer = new FunctionCallSerializer(undefined as any);
            createFunctionSerializerSpy.and.returnValue(functionSerializer);

            spyOn(functionSerializer, "serializeFunctionCall");

            const task1 = new Promise(() => undefined);
            const task2 = new Promise(() => undefined);

            scheduleTaskSpy.and.returnValues(task1, task2);

            const serializeSliceSpy = spyOn(generator, "serializeSlice");

            // act
            createParallelChain(generator, options).result();

            // assert
            expect(serializeSliceSpy).toHaveBeenCalledWith(0, 3, functionSerializer);
            expect(serializeSliceSpy).toHaveBeenCalledWith(1, 3, functionSerializer);
        });

        it("serializes the actions and environment", function () {
            // arrange
            const serializeFunctionCallSpy = jasmine.createSpy("serializeFunction");
            const functionSerializer = {
                serializeFunctionCall: serializeFunctionCallSpy,
                serializedFunctionIds: [1, 2, 3, 4, 5, 9]
            };

            const powerOf = (value: number) => value ** 2;
            const even = (value: number) => value % 2 === 0;
            const initializer = () => { return { abc: "abcdefghijklmnopqrstuvwxyz" }; };

            createFunctionSerializerSpy.and.returnValue(functionSerializer);

            serializeFunctionCallSpy.and.callFake((func: Function, ...params: any[]): ISerializedFunctionCall => {
                if (func === ParallelWorkerFunctions.process) {
                    return { ______serializedFunctionCall: true, functionId: 1, parameters: params };
                }
                if (func === ParallelWorkerFunctions.map) {
                    return { ______serializedFunctionCall: true, functionId: 2, parameters: params };
                }
                if (func === ParallelWorkerFunctions.filter) {
                    return { ______serializedFunctionCall: true, functionId: 3, parameters: params };
                }
                if (func === even) {
                    return { ______serializedFunctionCall: true, functionId: 4, parameters: params };
                }
                if (func === powerOf) {
                    return { ______serializedFunctionCall: true, functionId: 5, parameters: params };
                }
                if (func === initializer) {
                    return { ______serializedFunctionCall: true, functionId: 6, parameters: params };
                }
                throw new Error("Unknown function " + func);
            });

            const task1 = new Promise(() => undefined);
            const task2 = new Promise(() => undefined);

            scheduleTaskSpy.and.returnValues(task1, task2);

            const generatorSlice1 = { ______serializedFunctionCall: true, functionId: 9, parameters: [[1, 2, 3]] };
            const generatorSlice2 = { ______serializedFunctionCall: true, functionId: 9, parameters: [[4, 5]] };
            spyOn(generator, "serializeSlice").and.returnValues(generatorSlice1, generatorSlice2);

            // act
            createParallelChain<number, number>(generator, options)
                .environment({ test: 10 })
                .initializer(initializer)
                .map(powerOf)
                .filter(even)
                .result();

            // assert
            // slice 1
            expect(scheduleTaskSpy).toHaveBeenCalledWith({
                main: {
                    ______serializedFunctionCall: true,
                    functionId: 1, // process
                    parameters: [
                        {
                            environment: { taskIndex: 0, test: 10, valuesPerTask: 3 },
                            generator: generatorSlice1,
                            initializer: { ______serializedFunctionCall: true, functionId: 6, parameters: [] },
                            operations: [
                                {
                                    iteratee: { ______serializedFunctionCall: true, functionId: 5, parameters: [] }, // powerOf
                                    iterator: { ______serializedFunctionCall: true, functionId: 2, parameters: [] } // map
                                },
                                {
                                    iteratee: { ______serializedFunctionCall: true, functionId: 4, parameters: [] }, // even callback
                                    iterator: { ______serializedFunctionCall: true, functionId: 3, parameters: [] } // filter
                                }
                            ]
                        }
                    ]
                },
                taskIndex: 0,
                usedFunctionIds: [1, 2, 3, 4, 5, 9],
                valuesPerTask: 3
            });

            // slice 2
            expect(scheduleTaskSpy).toHaveBeenCalledWith({
                main: {
                    ______serializedFunctionCall: true,
                    functionId: 1, // process
                    parameters: [
                        {
                            environment: { taskIndex: 1, test: 10, valuesPerTask: 3 },
                            generator: generatorSlice2,
                            initializer: { ______serializedFunctionCall: true, functionId: 6, parameters: [] },
                            operations: [
                                {
                                    iteratee: { ______serializedFunctionCall: true, functionId: 5, parameters: [] }, // powerOf
                                    iterator: { ______serializedFunctionCall: true, functionId: 2, parameters: [] } // map
                                },
                                {
                                    iteratee: { ______serializedFunctionCall: true, functionId: 4, parameters: [] }, // even callback
                                    iterator: { ______serializedFunctionCall: true, functionId: 3, parameters: [] } // filter
                                }
                            ]
                        }
                    ]
                },
                taskIndex: 1,
                usedFunctionIds: [1, 2, 3, 4, 5, 9],
                valuesPerTask: 3
            });
        });
    });
});
