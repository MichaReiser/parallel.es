import {WorkerThread} from "../../../src/common/worker/worker-thread";
import {WorkerTask} from "../../../src/common/task/worker-task";
import {TaskDefinition} from "../../../src/common/task/task-definition";

describe("WorkerTask", function () {
    let worker: WorkerThread;
    let runSpy: jasmine.Spy;
    let workerTask: WorkerTask<number>;
    let taskDefinition: TaskDefinition = {
        id: 1,
        main: {
            functionId: 2,
            params: [5, 10],
            ______serializedFunctionCall: true
        },
        usedFunctionIds: [2]
    };

    beforeEach(function () {
        runSpy = jasmine.createSpy("run");
        worker = {
            oncomplete: undefined,
            onerror: undefined,
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
            expect(runSpy).toHaveBeenCalledWith(taskDefinition);
        });

        it("resolves the promise when the task has completed (oncomplete handler is invoked)", function (done) {
            // arrange
            runSpy.and.callFake(function () {
                if (worker.oncomplete) {
                    worker.oncomplete(10);
                }
                else {
                    fail("The worker thread has not registered to the oncomplete event");
                }
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
            runSpy.and.callFake(function () {
                if (worker.onerror) {
                    worker.onerror("error");
                }
            });

            // act
            workerTask.runOn(worker);

            // assert
            workerTask.then(() => done.fail("Worker should have failed"), error => {
                expect(error).toEqual("error");
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
            worker!.oncomplete!.call(undefined, 10);

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
        it("unregistered the onerror and oncomplete handlers", function () {
            // arrange
            workerTask.runOn(worker);

            // act
            workerTask.releaseWorker();

            // assert
            expect(worker.oncomplete).toBeUndefined();
            expect(worker.onerror).toBeUndefined();
        });

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
});