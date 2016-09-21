import {DefaultThreadPool} from "../../../src/common/thread-pool/default-thread-pool";
import {DynamicFunctionRegistry} from "../../../src/common/function/dynamic-function-registry";
import {WorkerTask} from "../../../src/common/task/worker-task";
import {functionId} from "../../../src/common/function/function-id";

describe("DefaultThreadPool", function () {
    let spawn: jasmine.Spy;
    let functionLookupTable: DynamicFunctionRegistry;
    let threadPool: DefaultThreadPool;

    beforeEach(function () {
        spawn = jasmine.createSpy("spawn");

        const workerThreadFactory = { spawn };
        functionLookupTable = new DynamicFunctionRegistry();
        threadPool = new DefaultThreadPool(workerThreadFactory, functionLookupTable, { maxConcurrencyLevel: 2 });
    });

    describe("schedule", function () {
        it("registers the function in the function lookup table", function () {
            // arrange
            const func = function () { /* ignore */ };
            const getOrSetIdSpy = spyOn(functionLookupTable, "getOrSetId").and.returnValue(functionId("test", 0));

            // act
            threadPool.schedule(func);

            // assert
            expect(getOrSetIdSpy).toHaveBeenCalledWith(func);
        });

        it("spawns a new worker until the concurrency limit is reached", function () {
            // arrange
            const func = function () { /* ignore */ };

            // act
            threadPool.schedule(func);
            threadPool.schedule(func);
            threadPool.schedule(func);

            // assert
            expect(spawn).toHaveBeenCalledTimes(2);
        });

        it("executes the task in a worker thread", function () {
            // arrange
            const func = function () { /* ignore */ };
            spyOn(functionLookupTable, "getOrSetId").and.returnValue(1);
            const runOnSpy = spyOn(WorkerTask.prototype, "runOn");

            const worker = { run: jasmine.createSpy("run") };
            spawn.and.returnValue(worker);

            // act
            threadPool.schedule(func);

            // assert
            expect(runOnSpy).toHaveBeenCalledWith(worker);
        });

        it("enqueues the task if no worker thread is available", function () {
            // arrange
            const func = function () { /* ignore */ };

            const worker1 = { run: jasmine.createSpy("run1"), stop: jasmine.createSpy("stop") };
            const worker2 = { run: jasmine.createSpy("run2"), stop: jasmine.createSpy("stop") };
            spawn.and.returnValues(worker1, worker2);

            // schedule worker until no worker is available...
            threadPool.schedule(func);
            threadPool.schedule(func);

            // act, should be queued.
            threadPool.schedule(func);

            // assert
            expect(worker1.run).toHaveBeenCalled();
            expect(worker2.run).toHaveBeenCalled();
        });

        it("schedules queued tasks when a worker gets available", function () {
            // arrange
            const func = function () { /* ignore */ };
            const func2 = function add(x: number, y: number): number { return x + y; };

            const worker1 = { run: jasmine.createSpy("run1"), stop: jasmine.createSpy("stop") };
            const worker2 = { run: jasmine.createSpy("run2"), stop: jasmine.createSpy("stop") };
            const runOnSpy = spyOn(WorkerTask.prototype, "runOn");
            const alwaysSpy = spyOn(WorkerTask.prototype, "always");
            spyOn(WorkerTask.prototype, "releaseWorker").and.returnValue(worker1);

            spawn.and.returnValues(worker1, worker2);

            // schedule worker until no worker is available...
            threadPool.schedule(func);
            threadPool.schedule(func);
            threadPool.schedule(func2); // queue third function

            // act
            // complete task of first worker so that the third task is scheduled on worker 1
            alwaysSpy.calls.argsFor(0)[0].call(undefined, 10);

            // assert
            expect(runOnSpy.calls.count()).toEqual(3);
            expect(runOnSpy.calls.argsFor(0)).toEqual([worker1]);
            expect(runOnSpy.calls.argsFor(1)).toEqual([worker2]);
            expect(runOnSpy.calls.argsFor(2)).toEqual([worker1]);
        });

        it("reuses an idle worker if available", function () {
            // arrange
            const worker1 = { run: jasmine.createSpy("run1"), stop: jasmine.createSpy("stop") };
            const worker2 = { run: jasmine.createSpy("run2"), stop: jasmine.createSpy("stop") };
            spawn.and.returnValues(worker1, worker2);

            const runOnSpy = spyOn(WorkerTask.prototype, "runOn");
            const alwaysSpy = spyOn(WorkerTask.prototype, "always");
            spyOn(WorkerTask.prototype, "releaseWorker").and.returnValues(worker1, worker2);

            // spawn all workers by scheduling tasks up to concurrency limit
            const func = function () { /* ignore */ };
            threadPool.schedule(func);
            threadPool.schedule(func);

            // complete first task, third task can now be scheduled on worker1 as this worker is idle
            alwaysSpy.calls.argsFor(0)[0].call(undefined, 10);

            // act
            threadPool.schedule(func);

            expect(runOnSpy).toHaveBeenCalledTimes(3);
            expect(runOnSpy.calls.argsFor(0)).toEqual([ worker1 ]);
            expect(runOnSpy.calls.argsFor(1)).toEqual([ worker2]);
            expect(runOnSpy.calls.argsFor(0)).toEqual([ worker1 ]);
        });
    });

    describe("createFunctionSerializer", function () {
        it("returns a new serializer instance", function () {
            // arrange
            const serializer = threadPool.createFunctionSerializer();

            // assert
            expect(serializer).not.toBeUndefined();
            expect(threadPool.createFunctionSerializer()).not.toBe(serializer);
        });
    });
});
