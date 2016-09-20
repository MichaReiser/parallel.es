import {IWorkerThread} from "../../../src/common/worker/worker-thread";
import {WorkerTask} from "../../../src/common/task/worker-task";
import {ITaskDefinition} from "../../../src/common/task/task-definition";

describe("WorkerTask", function () {
    let worker: IWorkerThread;
    let runSpy: jasmine.Spy;
    let workerTask: WorkerTask<number>;
    let taskDefinition: ITaskDefinition = {
        id: 1,
        main: {
            ______serializedFunctionCall: true,
            functionId: 2,
            parameters: [5, 10]
        },
        usedFunctionIds: [2]
    };

    beforeEach(function () {
        runSpy = jasmine.createSpy("run");
        worker = {
            run: runSpy,
            stop: jasmine.createSpy("stop")
        };

        workerTask = new WorkerTask<number>(taskDefinition);
    });

    describe("isCanceled", function () {
        it("is false by default", function () {
            expect(workerTask.isCanceled).toBe(false);
        });

        it("is true if the task has not been scheduled because cancellation was requested", function () {
            // arrange
            workerTask.cancel();

            // act
            workerTask.runOn(worker);

            // assert
            expect(workerTask.isCanceled).toBe(true);
        });
    });

    describe("isCancellationRequested", function () {
        it("is false by default", function () {
            expect(workerTask.isCancellationRequested).toBe(false);
        });

        it("is true if the user requested cancellation", function () {
            // act
            workerTask.cancel();

            // assert
            expect(workerTask.isCancellationRequested).toBe(true);
        });
    });

    describe("runOn", function () {
        it("invokes the run method of the worker and passes the task definition", function () {
            // act
            workerTask.runOn(worker);

            // assert
            expect(runSpy).toHaveBeenCalledWith(taskDefinition, jasmine.any(Function));
        });

        it("resolves the promise when the task has completed (oncomplete handler is invoked)", function (done) {
            // arrange
            runSpy.and.callFake(function (task: any, callback: (error: any, result: any) => void) {
                callback(undefined, 10);
            });

            // act
            workerTask.runOn(worker);

            // assert
            workerTask.then(result => {
                // assert
                expect(result).toEqual(10);
                done();
            });
        });

        it("rejects the promise when the task fails (onerror handler is invoked)", function (done) {
            // arrange
            runSpy.and.callFake(function (task: any, callback: (error: any, result: any) => void) {
                callback("error reason", undefined);
            });

            // act
            workerTask.runOn(worker);

            // assert
            workerTask.then(() => done.fail("Worker should have failed"), error => {
                expect(error).toEqual("error reason");
                done();
            });
        });

        it("rejects the promise when the task has been canceled by the user", function (done) {
             // arrange
            workerTask.cancel();

            // act
            workerTask.runOn(worker);

            // assert
            workerTask.then(function () {
                done.fail("task has been canceled, therefore promise should have been rejected");
            }, function (reason) {
                expect(reason).toEqual("Task has been canceled");
                done();
            });
        });

        it("does not execute the task on the worker if the task has been canceled", function () {
            // arrange
            workerTask.cancel();

            // act
            workerTask.runOn(worker);

            // assert
            expect(runSpy).not.toHaveBeenCalled();
        });

        it("rejects the promise when the worker has completed the computation but the task has been canceled in the meantime", function (done) {
            // arrange
            workerTask.runOn(worker);

            // act
            workerTask.cancel();
            runSpy.calls.argsFor(0)[1].call(undefined, undefined, 10);

            // asset
            workerTask.then(function () {
                done.fail("Task has been canceled in the meantime, therefore promise should have been rejected");
            }, function (reason) {
                expect(reason).toEqual("Task has been canceled");
                done();
            });
        });
    });

    describe("releaseWorker", function () {
        it("returns the worker used to execute the task", function () {
            // arrange
            workerTask.runOn(worker);

            // act, assert
            expect(workerTask.releaseWorker()).toEqual(worker);
        });

        it("throws when the task has not been scheduled on a worker", function () {
            // act, assert
            expect(() => workerTask.releaseWorker()).toThrowError("Cannot release a worker task that has no assigned worker thread.");
        });
    });

    describe("catch", function () {
        let doneFn: DoneFn;
        let unhandledRejctionHandler: () => void;

        beforeEach(function () {
            unhandledRejctionHandler = function () {
                doneFn.fail("Promise has rejection handler and therefore global unrejected handler should not be called");
            };

            window.addEventListener("unhandledrejection", unhandledRejctionHandler);
        });

        afterEach(function () {
            window.removeEventListener("unhandledrejection", unhandledRejctionHandler);
        });

        it("does not trigger 'unhandled exception in promise' if catch handler is registered", function (done) {
            // arrange
            doneFn = done;
            workerTask.runOn(worker);
            workerTask.catch(() => done());

            // act
            runSpy.calls.argsFor(0)[1].call(undefined, "Error occurred", undefined); // call error callback
        });
    });
});
