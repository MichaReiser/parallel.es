import {DefaultThreadPool} from "../../../src/common/thread-pool/default-thread-pool";
import {FunctionCall} from "../../../src/common/function/function-call";
import {ITaskDefinition} from "../../../src/common/task/task-definition";
import {IWorkerThread} from "../../../src/common/worker/worker-thread";

describe("DefaultThreadPool", function () {
    let spawn: jasmine.Spy;
    let serializeCallSpy: jasmine.Spy;
    let threadPool: DefaultThreadPool;

    beforeEach(function () {
        spawn = jasmine.createSpy("spawn");

        const workerThreadFactory = { spawn };
        serializeCallSpy = jasmine.createSpy("serializeCall");
        threadPool = new DefaultThreadPool(workerThreadFactory, { serializeFunctionCall: serializeCallSpy } as any, { maxConcurrencyLevel: 2 });
    });

    describe("run", function () {
        it("registers the function in the function lookup table", function () {
            // arrange
            const func = function () { /* ignore */
            };
            serializeCallSpy.and.returnValue({functionId: "test-1"});

            // act
            threadPool.run(func);

            // assert
            expect(serializeCallSpy).toHaveBeenCalledWith(FunctionCall.create(func));
        });

        it("spawns a new worker until the concurrency limit is reached", function () {
            // arrange
            const func = function () { /* ignore */
            };
            serializeCallSpy.and.returnValue({functionId: "test-1"});

            // act
            threadPool.run(func);
            threadPool.run(func);
            threadPool.run(func);

            // assert
            expect(spawn).toHaveBeenCalledTimes(2);
        });

        it("creates a task definition from the given task and runs it onto the worker thread", function () {
            // arrange
            const runSpy = jasmine.createSpy("run");
            const workerThread = {run: runSpy};
            spawn.and.returnValue(workerThread);

            const func = function (value: number) {
                return value;
            };
            const serializedFunc = {functionId: "test-1"};
            serializeCallSpy.and.returnValue(serializedFunc);

            // act
            threadPool.run(func, 10);

            // assert
            expect(runSpy).toHaveBeenCalledWith({
                main: serializedFunc,
                usedFunctionIds: ["test-1"]
            }, jasmine.any(Function));
        });
    });

    describe("runTask", function () {
        let task: ITaskDefinition;
        let worker1RunSpy: jasmine.Spy;
        let worker1: IWorkerThread;

        beforeEach(function () {
            task = {
                main: { functionId: "test-1" },
                usedFunctionIds: [ "test-1" ]
            } as any;

            worker1RunSpy = jasmine.createSpy("run");
            worker1 = {run: worker1RunSpy} as any;
            spawn.and.returnValue(worker1);
        });

        it("runs the task on an available worker thread", function () {
            threadPool.runTask(task);

            // assert
            expect(worker1RunSpy).toHaveBeenCalledWith(task, jasmine.any(Function));
        });

        it("enqueues the task if no worker thread is available", function () {
            // arrange
            const worker2 = { run: jasmine.createSpy("run2"), stop: jasmine.createSpy("stop") };
            spawn.and.returnValues(worker1, worker2);

            // schedule worker until no worker is available...
            threadPool.runTask(task);
            threadPool.runTask(task);

            // act, should be queued.
            threadPool.runTask(task);

            // assert
            expect(worker1RunSpy).toHaveBeenCalledWith(task, jasmine.any(Function));
            expect(worker2.run).toHaveBeenCalledWith(task, jasmine.any(Function));
        });

        it("runs queued tasks when a worker gets available", function () {
            // arrange
            const task2 = Object.create(task);
            const task3 = Object.create(task);

            const worker2 = { run: jasmine.createSpy("run2"), stop: jasmine.createSpy("stop") };
            spawn.and.returnValues(worker1, worker2);

            // schedule worker until no worker is available...
            threadPool.runTask(task);
            threadPool.runTask(task2);
            threadPool.runTask(task3); // queue third task

            // act
            // complete task of first worker so that the third task is scheduled on worker 1
            worker1RunSpy.calls.argsFor(0)[1].call(undefined, undefined, 10);

            // assert
            // task 1 and 3 is executed on worker 1
            expect(worker1RunSpy.calls.count()).toEqual(2);
            expect(worker1RunSpy).toHaveBeenCalledWith(task, jasmine.any(Function));
            expect(worker1RunSpy).toHaveBeenCalledWith(task3, jasmine.any(Function));

            // worker 2 only executes task 2
            expect(worker2.run.calls.count()).toEqual(1);
            expect(worker2.run).toHaveBeenCalledWith(task2, jasmine.any(Function));
        });

        it("reuses an idle worker if available", function () {
            // arrange
            const task2 = Object.create(task);
            const task3 = Object.create(task);

            const worker2 = { run: jasmine.createSpy("run2"), stop: jasmine.createSpy("stop") };
            spawn.and.returnValues(worker1, worker2);

            // spawn all workers by scheduling tasks up to concurrency limit
            threadPool.runTask(task);
            threadPool.runTask(task2);

            // complete first task, third task can now be scheduled on worker1 as this worker is idle
            worker1RunSpy.calls.argsFor(0)[1].call(undefined, undefined, 10);

            // act
            threadPool.runTask(task3);

            expect(worker1RunSpy).toHaveBeenCalledTimes(2);
            expect(worker1RunSpy).toHaveBeenCalledWith(task, jasmine.any(Function));
            expect(worker1RunSpy).toHaveBeenCalledWith(task3, jasmine.any(Function));
        });

        it("resolves the task as canceled if cancellation is requested before the task has been scheduled", function () {
            // arrange
            const canceledTaskDefinition = Object.create(task);

            // schedule tasks to fill queue
            threadPool.runTask(task);
            threadPool.runTask(task);
            const canceledTask = threadPool.runTask(canceledTaskDefinition);
            const resolvedCancelledSpy = spyOn(canceledTask, "resolveCancelled");

            canceledTask.cancel();

            // act
            // complete first task to schedule canceled task
            worker1RunSpy.calls.argsFor(0)[1].call(undefined, undefined, 10);

            // assert
            expect(resolvedCancelledSpy).toHaveBeenCalled();
            expect(worker1RunSpy).not.toHaveBeenCalledWith(canceledTaskDefinition, jasmine.any(Function));
        });

        it("runs the next queued task if a task has been cancelled", function () {
            // arrange
            const canceledTaskDefinition = Object.create(task);
            const nextTask = Object.create(task);

            // schedule tasks to fill queue
            threadPool.runTask(task);
            threadPool.runTask(task);
            const canceledTask = threadPool.runTask(canceledTaskDefinition);

            // act
            canceledTask.cancel();
            // complete first task, canceled task is now scheduled on worker 1
            worker1RunSpy.calls.argsFor(0)[1].call(undefined, undefined, 10);

            // assert
            expect(worker1RunSpy).not.toHaveBeenCalledWith(nextTask, jasmine.any(Function));
        });

        it("resolves the task if the computation has completed", function () {
            // arrange
            const scheduledTask = threadPool.runTask(task);
            const resolveSpy = spyOn(scheduledTask, "resolve");

            // act
            // complete task
            worker1RunSpy.calls.argsFor(0)[1].call(undefined, undefined, 10);

            // assert
            expect(resolveSpy).toHaveBeenCalledWith(10);
        });

        it("rejects the task if the computation has failed", function () {
            // arrange
            const scheduledTask = threadPool.runTask(task);
            const rejectSpy = spyOn(scheduledTask, "reject");

            // act
            // complete task
            worker1RunSpy.calls.argsFor(0)[1].call(undefined, "error");

            // assert
            expect(rejectSpy).toHaveBeenCalledWith("error");
        });
    });

    describe("getFunctionSerializer", function () {
        it("returns the instance", function () {
            // arrange
            const serializer = threadPool.getFunctionSerializer();

            // assert
            expect(serializer).not.toBeUndefined();
        });
    });
});
