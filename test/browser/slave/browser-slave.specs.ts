import {
    scheduleTaskMessage, MessageType, initializeWorkerMessage,
    functionResponseMessage, isFunctionRequest, isWorkerResult, isFunctionExecutionError
} from "../../../src/common/worker/messages";
declare function require(module: string): any;
const BrowserSlave = require("worker!../../../src/browser/slave/browser-slave");

describe("BrowserSlave", function () {
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
            const task = { id: 1, functionId: 1, params: [] };
            slave.postMessage(initializeWorkerMessage(1));

            // act
            slave.postMessage(scheduleTaskMessage(task));

            slave.onmessage = function (event: MessageEvent) {
                // assert
                expect(event.data.type).toBe(MessageType.FunctionRequest);
                expect(event.data.functionId).toBe(1);
                done();
            };
        });

        it("it executes the function as soon as the function definition has been retrieved", function (done) {
            // arrange
            const task = { id: 1, functionId: 1, params: [10] };

            let promise = new Promise((resolve, reject) => {
                (onresponse as jasmine.Spy).and.callFake(function (event: MessageEvent) {
                    if (isFunctionRequest(event.data)) {
                        slave.postMessage(functionResponseMessage([{ id: 1, argumentNames: ["x"], body: "return x;" }]));
                    } else if (isWorkerResult(event.data)) {
                        resolve(event.data.result);
                    } else {
                        reject("Unexpected message from slave");
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
            }, function () {
                fail();
            });
        });

        it("does not request the function definition if the slave has executed the function before", function (done) {
            // arrange
            let firstTask = new Promise((resolve, reject) => {
                (onresponse as jasmine.Spy).and.callFake(function (event: MessageEvent) {
                    if (isFunctionRequest(event.data)) {
                        slave.postMessage(functionResponseMessage([{ id: 1, argumentNames: ["x"], body: "return x;" }]));
                    } else if (isWorkerResult(event.data)) {
                            resolve(event.data.result);
                    } else {
                        reject("Unexpected message from slave");
                    }
                });
            });

            slave.postMessage(initializeWorkerMessage(1));
            slave.postMessage(scheduleTaskMessage({ id: 1, functionId: 1, params: [10] }));

            const secondTask = firstTask.then(function () {
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
                slave.postMessage(scheduleTaskMessage({ id: 2, functionId: 1, params: [20] }));
                return promise;
            });

            // assert
            secondTask.then(function (result) {
                expect(result).toBe(20);
                done();
            }, function () {
                fail();
            });
        });

        it("reports any errors occurring during the function execution", function (done) {
            // arrange
            const task = { id: 1, functionId: 1, params: [10] };

            let promise = new Promise((resolve, reject) => {
                (onresponse as jasmine.Spy).and.callFake(function (event: MessageEvent) {
                    if (isFunctionRequest(event.data)) {
                        slave.postMessage(functionResponseMessage([{ id: 1, argumentNames: ["x"], body: "return y;" }]));
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
            }, function () {
                fail();
            });
        });
    });
});