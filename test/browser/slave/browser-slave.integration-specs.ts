import {
    scheduleTaskMessage, WorkerMessageType, initializeWorkerMessage,
    functionResponseMessage, isFunctionRequest, isWorkerResult, isFunctionExecutionError
} from "../../../src/common/worker/worker-messages";
import {TaskDefinition} from "../../../src/common/task/task-definition";

declare function require(module: string): any;
const BrowserSlave = require("worker?inline=true!../../../src/browser/slave/index");

describe("BrowserSlave IntegrationTests", function () {
    let slave: Worker;
    let onresponse: (event: MessageEvent) => void;

    beforeEach(function () {
        slave = new BrowserSlave();
        slave.onmessage = onresponse = jasmine.createSpy("onmessage");
        slave.onerror = (error: ErrorEvent) => fail(error);
    });

    afterEach(function () {
        slave.terminate();
    });

    describe("task execution", function () {
        it("requests missing function definitions", function (done) {
            // arrange
            const task: TaskDefinition = { usedFunctionIds: [1000], main: { functionId: 1000, params: [], ______serializedFunctionCall: true }, id: 1};
            slave.postMessage(initializeWorkerMessage(1));

            // act
            slave.postMessage(scheduleTaskMessage(task));

            slave.onmessage = function (event: MessageEvent) {
                // assert
                expect(event.data.type).toBe(WorkerMessageType.FunctionRequest);
                expect(event.data.functionIds).toEqual([1000]);
                done();
            };
        });

        it("it executes the function as soon as the function definition has been retrieved", function (done) {
            // arrange
            const task: TaskDefinition = { usedFunctionIds: [1000], main: { functionId: 1000, params: [10], ______serializedFunctionCall: true }, id: 1};

            let promise = new Promise((resolve, reject) => {
                (onresponse as jasmine.Spy).and.callFake(function (event: MessageEvent) {
                    if (isFunctionRequest(event.data)) {
                        slave.postMessage(functionResponseMessage([{ id: 1000, argumentNames: ["x"], body: "return x;" }]));
                    } else if (isWorkerResult(event.data)) {
                        resolve(event.data.result);
                    } else {
                        reject(`Unexpected message from slave ${event.data}.`);
                    }
                });
            });

            slave.postMessage(initializeWorkerMessage(1));

            // act
            slave.postMessage(scheduleTaskMessage(task));

            // assert
            promise.then(function (result) {
                expect(result).toBe(10);
                done();
            }, function (error) {
                fail(`The worker reported an error ${error}.`);
                done();
            });
        });

        it("does not request the function definition if the slave has executed the function before", function (done) {
            // arrange
            let firstTaskCompleted = new Promise((resolve, reject) => {
                (onresponse as jasmine.Spy).and.callFake(function (event: MessageEvent) {
                    if (isFunctionRequest(event.data)) {
                        slave.postMessage(functionResponseMessage([{ id: 1000, argumentNames: ["x"], body: "return x;" }]));
                    } else if (isWorkerResult(event.data)) {
                        resolve(event.data.result);
                    } else {
                        reject("Unexpected message from slave");
                    }
                });
            });

            const firstTask: TaskDefinition = { usedFunctionIds: [1000], main: { functionId: 1000, params: [10], ______serializedFunctionCall: true }, id: 1};
            slave.postMessage(initializeWorkerMessage(1));
            slave.postMessage(scheduleTaskMessage(firstTask));

            const secondTaskCompleted = firstTaskCompleted.then(function () {
                const promise = new Promise((resolve, reject) => {
                    (onresponse as jasmine.Spy).and.callFake(function (event: MessageEvent) {
                        if (isFunctionRequest(event.data)) {
                            fail("Slave requested function definition for second execution of same function again.");
                        } else if (isWorkerResult(event.data)) {
                            resolve(event.data.result);
                        } else {
                            reject("Unexpected message from slave");
                        }
                    });
                });

                // act
                const secondTask: TaskDefinition = { usedFunctionIds: [1000], main: { functionId: 1000, params: [20], ______serializedFunctionCall: true }, id: 2};
                slave.postMessage(scheduleTaskMessage(secondTask));
                return promise;
            });

            // assert
            secondTaskCompleted.then(function (result) {
                expect(result).toBe(20);
                done();
            }, function (error) {
                fail(error);
            });
        });

        it("reports any errors occurring during the function execution", function (done) {
            // arrange
            const task: TaskDefinition = { usedFunctionIds: [1000], main: { functionId: 1000, params: [10], ______serializedFunctionCall: true }, id: 1};

            let promise = new Promise((resolve, reject) => {
                (onresponse as jasmine.Spy).and.callFake(function (event: MessageEvent) {
                    if (isFunctionRequest(event.data)) {
                        slave.postMessage(functionResponseMessage([{ id: 1000, argumentNames: ["x"], body: "return y;" }]));
                    } else if (isFunctionExecutionError(event.data)) {
                        resolve(event.data.error);
                    } else {
                        reject("Unexpected message from slave");
                    }
                });
            });

            slave.postMessage(initializeWorkerMessage(1));

            // act
            slave.postMessage(scheduleTaskMessage(task));

            // assert
            promise.then(function (error: Error) {
                expect(error.message).toEqual(jasmine.stringMatching("y")); // y is not defined or y is undefined... depends on the browser
                done();
            }, function (error) {
                fail(error);
            });
        });
    });
});