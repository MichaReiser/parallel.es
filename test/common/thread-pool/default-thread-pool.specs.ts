import {DefaultThreadPool} from "../../../src/common/thread-pool/default-thread-pool";
import {FunctionRegistry} from "../../../src/common/serialization/function-registry";
import {WorkerThread} from "../../../src/common/worker/worker-thread";

describe("DefaultThreadPool", function () {
    let spawn: jasmine.Spy;
    let functionLookupTable: FunctionRegistry;
    let threadPool: DefaultThreadPool;

    beforeEach(function () {
        spawn = jasmine.createSpy("spawn");

        const workerThreadFactory = { spawn };
        functionLookupTable = new FunctionRegistry();
        threadPool = new DefaultThreadPool(workerThreadFactory, functionLookupTable, { maxConcurrencyLevel: 2 });
    });

    describe("schedule", function () {
        it("registers the function in the function lookup table", function () {
            // arrange
            const func = function () {};
            const getOrSetIdSpy = spyOn(functionLookupTable, "getOrSetId");

            // act
            threadPool.schedule(func);

            // assert
            expect(getOrSetIdSpy).toHaveBeenCalledWith(func);
        });

        it("spawns a new worker until the concurrency limit is reached", function () {
            // arrange
            const func = function () {};

            // act
            threadPool.schedule(func);
            threadPool.schedule(func);
            threadPool.schedule(func);

            // assert
            expect(spawn).toHaveBeenCalledTimes(2);
        });

        it("executes the task in a worker thread", function () {
            // arrange
            const func = function () {};
            spyOn(functionLookupTable, "getOrSetId").and.returnValue(1);

            const worker = { run: jasmine.createSpy("run") };
            spawn.and.returnValue(worker);

            // act
            threadPool.schedule(func);

            // assert
            expect(worker.run).toHaveBeenCalledWith({ main: jasmine.objectContaining({ functionId: 1, params: [] }), usedFunctionIds: [ 1 ], id: 0 });
        });

        it("enqueues the task if no worker thread is available", function () {
            // arrange
            const func = function () {};

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

        it("schedules queued tasks when a worker gets available", function (done) {
            // arrange
            const func = function () {};
            const func2 = function add(x: number, y: number): number { return x + y; };

            const worker1 = { run: jasmine.createSpy("run1"), stop: jasmine.createSpy("stop") };
            const worker2 = { run: jasmine.createSpy("run2"), stop: jasmine.createSpy("stop") };
            spawn.and.returnValues(worker1, worker2);

            // schedule worker until no worker is available...
            const task1 = threadPool.schedule(func);
            threadPool.schedule(func);
            threadPool.schedule(func2); // queue third function

            // act
            completeTaskOfWorker(worker1); // complete first task, third task should now be scheduled

            // assert
            task1.then(() => {
                expect(worker1.run).toHaveBeenCalledTimes(2);
                expect(worker2.run).toHaveBeenCalledTimes(1);
                done();
            });
        });

        it("reuses an idle worker if available", function (done) {
            // arrange
            const worker1 = { run: jasmine.createSpy("run1"), stop: jasmine.createSpy("stop") };
            const worker2 = { run: jasmine.createSpy("run2"), stop: jasmine.createSpy("stop") };
            spawn.and.returnValues(worker1, worker2);

            // spawn all workers by scheduling tasks up to concurrency limit
            const func = function () {};
            const task1 = threadPool.schedule(func);
            threadPool.schedule(func);

            completeTaskOfWorker(worker1); // complete first task, third task should now be scheduled

            // assert
            task1.then(() => {
                // act
                threadPool.schedule(func);
                expect(worker1.run).toHaveBeenCalledTimes(2);
                expect(worker2.run).toHaveBeenCalledTimes(1);
                done();
            });
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

    function completeTaskOfWorker(worker: WorkerThread, result?: any) {
        if (worker.oncomplete) {
            worker.oncomplete(result);
        }
    }
});