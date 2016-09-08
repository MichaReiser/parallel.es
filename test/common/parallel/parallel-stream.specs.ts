import {Task} from "../../../src/common/task/task";
import {TaskDefinition} from "../../../src/common/task/task-definition";
import {ParallelStreamImpl, ParallelStream} from "../../../src/common/parallel/parallel-stream";

describe("ParallelStream", function () {
    let tasks: FakeTask<string>[];
    let task1: FakeTask<string>;
    let task2: FakeTask<string>;
    let task3: FakeTask<string>;
    let joiner = (values: string[]) => values.join(" ");

    beforeEach(function () {
        tasks = [new FakeTask(), new FakeTask(), new FakeTask()];
        [task1, task2, task3] = tasks;
    });

    describe("subscribe", function () {
        it("calls the onNext handler for every resolved sub result", function (done) {
            // arrange
            const stream: ParallelStream<string, string> = new ParallelStreamImpl(tasks, joiner);
            const onNextSpy = jasmine.createSpy("onNext");
            stream.subscribe(onNextSpy);

            // act
            task1.resolve("Good");
            task2.resolve("Morning");
            task3.resolve("good looking");

            // assert
            setTimeout(function () {
                // wait for next tick
                expect(onNextSpy).toHaveBeenCalledWith("Good", 0);
                expect(onNextSpy).toHaveBeenCalledWith("Morning", 1);
                expect(onNextSpy).toHaveBeenCalledWith("good looking", 2);
                done();
            }, 0);
        });

        it("passes the correct task index even if the tasks are resolved out of order", function (done) {
            // arrange
            const stream: ParallelStream<string, string> = new ParallelStreamImpl(tasks, joiner);
            const onNextSpy = jasmine.createSpy("onNext");
            stream.subscribe(onNextSpy);

            // act
            task1.resolve("Good");
            task3.resolve("good looking");
            task2.resolve("Morning");

            // assert
            setTimeout(function () {
                // wait for next tick
                expect(onNextSpy).toHaveBeenCalledWith("Good", 0);
                expect(onNextSpy).toHaveBeenCalledWith("Morning", 1);
                expect(onNextSpy).toHaveBeenCalledWith("good looking", 2);
                done();
            }, 0);
        });

        it("does not trigger the onNext callback after the first task has failed (fail fast)", function (done) {
            // arrange
            const stream: ParallelStream<string, string> = new ParallelStreamImpl(tasks, joiner);
            const onNextSpy = jasmine.createSpy("onNext");
            stream.subscribe(onNextSpy);

            // act
            task1.resolve("Good");
            task2.reject("Excuse me, it's already afternoon!");
            task3.resolve("Morning");

            // assert
            setTimeout(function () {
                // wait for next tick
                expect(onNextSpy).toHaveBeenCalledTimes(1);
                done();
            }, 0);
        });

        it("multiple onNext handlers can be registered", function (done) {
            // arrange
            const stream: ParallelStream<string, string> = new ParallelStreamImpl(tasks, joiner);
            const onNextSpy = jasmine.createSpy("onNext");
            const onNextSpy2 = jasmine.createSpy("onNext2");
            stream.subscribe(onNextSpy);
            stream.subscribe(onNextSpy2);

            // act
            task1.resolve("Good");
            task2.resolve("morning");
            task3.resolve("good looking");

            // assert
            setTimeout(function () {
                // wait for next tick
                expect(onNextSpy).toHaveBeenCalled();
                expect(onNextSpy2).toHaveBeenCalled();
                done();
            }, 0);
        });

        it("The onError callback is called if a task fails", function (done) {
            // arrange
            const stream: ParallelStream<string, string> = new ParallelStreamImpl(tasks, joiner);
            const onNextSpy = jasmine.createSpy("onNext");
            const onError = jasmine.createSpy("onError");
            stream.subscribe(onNextSpy, onError);

            // act
            task1.reject("Hmm...???");

            // assert
            setTimeout(function () {
                expect(onError).toHaveBeenCalledWith("Hmm...???");
                done();
            });
        });

        it("Calls the onComplete handler if all tasks have been completed", function (done) {
            // arrange
            const stream: ParallelStream<string, string> = new ParallelStreamImpl(tasks, joiner);
            const onNextSpy = jasmine.createSpy("onNext");
            const onError = jasmine.createSpy("onError");
            const onComplete = jasmine.createSpy("onComplete");
            stream.subscribe(onNextSpy, onError, onComplete);

            // act
            task1.resolve("Good");
            task2.resolve("morning");
            task3.resolve("good looking");

            // assert
            setTimeout(function () {
                expect(onComplete).toHaveBeenCalledWith("Good morning good looking");
                expect(onComplete).toHaveBeenCalledTimes(1);
                done();
            });
        });

        describe("then", function () {
            it("calls the onFulfilled handler if all tasks have been completed", function (done) {
                // arrange
                const stream: ParallelStream<string, string> = new ParallelStreamImpl(tasks, joiner);
                const onFulfilled = jasmine.createSpy("onFulfilled");
                const completed = stream.then(onFulfilled);

                // act
                task1.resolve("Good");
                task2.resolve("morning");
                task3.resolve("good looking");

                // assert
                completed.then(function () {
                    expect(onFulfilled).toHaveBeenCalledWith("Good morning good looking");
                    expect(onFulfilled).toHaveBeenCalledTimes(1);
                    done();
                }, function () {
                    done.fail("Promise was rejected");
                });
            });

            it("calls the onRejected handler if any tasks failed", function (done) {
                // arrange
                const stream: ParallelStream<string, string> = new ParallelStreamImpl(tasks, joiner);

                // act
                task1.resolve("Good");
                task2.reject("Excuse me, it's already afternoon!");
                task3.resolve("Morning");

                // assert
                stream.then(function () {
                    done.fail("The computation of task 2 failed, therefore the promise should have been rejected");
                }, function (reason) {
                    expect(reason).toEqual("Excuse me, it's already afternoon!");
                    done();
                });
            });
        });

        describe("catch", function () {
            it("calls the onrejected handler if any task failed", function (done) {
                // arrange
                const stream: ParallelStream<string, string> = new ParallelStreamImpl(tasks, joiner);

                // act
                task1.resolve("Good");
                task2.reject("Excuse me, it's already afternoon!");
                task3.resolve("Morning");

                // assert
                stream.then(function () {
                    done.fail("The computation of task 2 failed, therefore the promise should have been rejected");
                });

                stream.catch(function (reason) {
                    expect(reason).toEqual("Excuse me, it's already afternoon!");
                    done();
                });
            });

            it("cancels all not yet completed tasks", function (done) {
                // arrange
                const stream: ParallelStream<string, string> = new ParallelStreamImpl(tasks, joiner);

                // act
                task1.resolve("Good");
                task2.reject("Excuse me, it's already afternoon!");
                task3.resolve("Morning");

                // assert
                stream.then(function () {
                    done.fail("The computation of task 2 failed, therefore the promise should have been rejected");
                });

                stream.catch(function () {
                    expect(task3.isCancellationRequested).toBe(true);
                    done();
                });
            });
        });
    });

    class FakeTask<T> implements Task<T> {
        taskDefinition: TaskDefinition;
        private promise: Promise<T>;
        isCanceled = false;
        isCancellationRequested = false;

        resolve: (result: T) => void;
        reject: (reason: any) => void;

        constructor() {
            this.promise = new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
            });
        }

        cancel() {
            this.isCancellationRequested = true;
        }

        catch(onrejected?: any): Promise<any> {
            return this.promise.catch(onrejected);
        }

        then(onfulfilled?: any, onrejected?: any): PromiseLike<any> {
            return this.promise.then(onfulfilled, onrejected);
        }
    }
});