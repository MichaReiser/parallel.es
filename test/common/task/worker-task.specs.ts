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

        it("rejects the promise when the task fails (onerror handler is invoked)", function () {
            // arrange
            runSpy.and.callFake(function () {
                if (worker.onerror) {
                    worker.onerror("error");
                }
            });

            // act
            workerTask.runOn(worker);

            // assert
            workerTask.catch(error => {
                expect(error).toEqual("error");
                return 10;
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