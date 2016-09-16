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
    let getSchedulingSpy: jasmine.Spy;
    let threadPool: IThreadPool;

    beforeEach(function () {
        createFunctionSerializerSpy = jasmine.createSpy("createFunctionSerializer");
        scheduleTaskSpy = jasmine.createSpy("scheduleTask");
        threadPool = {
            createFunctionSerializer: createFunctionSerializerSpy,
            schedule: jasmine.createSpy("schedule"),
            scheduleTask: scheduleTaskSpy
        };

        getSchedulingSpy = jasmine.createSpy("getScheduling");

        options = {
            maxConcurrencyLevel: 2,
            scheduler: { getScheduling: getSchedulingSpy },
            threadPool
        };

        generator = new ConstCollectionGenerator([1, 2, 3, 4, 5]);
    });

    describe("result", function () {
        it("schedules the tasks on the thread pool", function () {
            // arrange
            getSchedulingSpy.and.returnValue({ numberOfTasks: 2, valuesPerTask: 3 });
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
            getSchedulingSpy.and.returnValue({ numberOfTasks: 2, valuesPerTask: 3 });
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

        it("serializes the environment", function () {
            // arrange
            getSchedulingSpy.and.returnValue({ numberOfTasks: 1, valuesPerTask: 3 });
            const serializeFunctionCallSpy = jasmine.createSpy("serializeFunction");
            const functionSerializer = {
                serializeFunctionCall: serializeFunctionCallSpy,
                serializedFunctionIds: [1, 2, 3, 4, 5, 9]
            };

            const powerOf = (value: number) => value ** 2;

            createFunctionSerializerSpy.and.returnValue(functionSerializer);

            serializeFunctionCallSpy.and.callFake((func: Function, ...params: any[]): ISerializedFunctionCall => {
                if (func === ParallelWorkerFunctions.process) {
                    return { ______serializedFunctionCall: true, functionId: 1, parameters: params };
                }
                if (func === ParallelWorkerFunctions.map) {
                    return { ______serializedFunctionCall: true, functionId: 2, parameters: params };
                }
                if (func === powerOf) {
                    return { ______serializedFunctionCall: true, functionId: 5, parameters: params };
                }
                throw new Error("Unknown function " + func);
            });

            const task1 = new Promise(() => undefined);
            const task2 = new Promise(() => undefined);

            scheduleTaskSpy.and.returnValues(task1, task2);

            const generatorSlice1 = { ______serializedFunctionCall: true, functionId: 9, parameters: [[1, 2, 3]] };
            spyOn(generator, "serializeSlice").and.returnValue(generatorSlice1);

            // act
            createParallelChain<number, number>(generator, options)
                .inEnvironment({ test: 10 })
                .map(powerOf)
                .result();

            // assert
            // slice 1
            expect(scheduleTaskSpy).toHaveBeenCalledWith({
                main: {
                    ______serializedFunctionCall: true,
                    functionId: 1, // process
                    parameters: [
                        {
                            environment: { test: 10 },
                            generator: generatorSlice1,
                            operations: [
                                {
                                    iteratee: { ______serializedFunctionCall: true, functionId: 5, parameters: [] }, // powerOf
                                    iterator: { ______serializedFunctionCall: true, functionId: 2, parameters: [] } // map
                                }
                            ],
                            taskIndex: 0,
                            valuesPerTask: 3
                        }
                    ]
                },
                taskIndex: 0,
                usedFunctionIds: [1, 2, 3, 4, 5, 9],
                valuesPerTask: 3
            });
        });

        it("serializes the environment provider as serialized function", function () {
            // arrange
            getSchedulingSpy.and.returnValue({ numberOfTasks: 1, valuesPerTask: 3 });
            const serializeFunctionCallSpy = jasmine.createSpy("serializeFunction");
            const functionSerializer = {
                serializeFunctionCall: serializeFunctionCallSpy,
                serializedFunctionIds: [1, 2, 3, 4, 5, 9]
            };

            const powerOf = (value: number) => value ** 2;
            const initializer = (test: number) => { return { abc: "abcdefghijklmnopqrstuvwxyz", test }; };

            createFunctionSerializerSpy.and.returnValue(functionSerializer);

            serializeFunctionCallSpy.and.callFake((func: Function, ...params: any[]): ISerializedFunctionCall => {
                if (func === ParallelWorkerFunctions.process) {
                    return { ______serializedFunctionCall: true, functionId: 1, parameters: params };
                }
                if (func === ParallelWorkerFunctions.map) {
                    return { ______serializedFunctionCall: true, functionId: 2, parameters: params };
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
            spyOn(generator, "serializeSlice").and.returnValue(generatorSlice1);

            // act
            createParallelChain<number, number>(generator, options)
                .inEnvironment(initializer, 10)
                .map(powerOf)
                .result();

            // assert
            // slice 1
            expect(scheduleTaskSpy).toHaveBeenCalledWith({
                main: {
                    ______serializedFunctionCall: true,
                    functionId: 1, // process
                    parameters: [
                        {
                            environment: { ______serializedFunctionCall: true, functionId: 6, parameters: [ 10 ] },
                            generator: generatorSlice1,
                            operations: [
                                {
                                    iteratee: { ______serializedFunctionCall: true, functionId: 5, parameters: [] }, // powerOf
                                    iterator: { ______serializedFunctionCall: true, functionId: 2, parameters: [] } // map
                                }
                            ],
                            taskIndex: 0,
                            valuesPerTask: 3
                        }
                    ]
                },
                taskIndex: 0,
                usedFunctionIds: [1, 2, 3, 4, 5, 9],
                valuesPerTask: 3
            });
        });

        it("schedules a task for each slice according to the scheduling", function () {
            // arrange
            getSchedulingSpy.and.returnValue({ numberOfTasks: 2, valuesPerTask: 3 });
            const serializeFunctionCallSpy = jasmine.createSpy("serializeFunction");
            const functionSerializer = {
                serializeFunctionCall: serializeFunctionCallSpy,
                serializedFunctionIds: [1, 2, 3, 4, 5, 9]
            };

            const powerOf = (value: number) => value ** 2;
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
                if (func === powerOf) {
                    return { ______serializedFunctionCall: true, functionId: 5, parameters: params };
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
                .map(powerOf)
                .result();

            // assert
            // slice 1
            expect(scheduleTaskSpy).toHaveBeenCalledWith({
                main: {
                    ______serializedFunctionCall: true,
                    functionId: 1, // process
                    parameters: [
                        {
                            environment: undefined,
                            generator: generatorSlice1,
                            operations: [
                                {
                                    iteratee: { ______serializedFunctionCall: true, functionId: 5, parameters: [] }, // powerOf
                                    iterator: { ______serializedFunctionCall: true, functionId: 2, parameters: [] } // map
                                }
                            ],
                            taskIndex: 0,
                            valuesPerTask: 3
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
                            environment: undefined,
                            generator: generatorSlice2,
                            operations: [
                                {
                                    iteratee: { ______serializedFunctionCall: true, functionId: 5, parameters: [] }, // powerOf
                                    iterator: { ______serializedFunctionCall: true, functionId: 2, parameters: [] } // map
                                }
                            ],
                            taskIndex: 1,
                            valuesPerTask: 3
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
