import {BrowserWorkerThread} from "../../../src/browser/worker/browser-worker-thread";
import {FunctionRegistry} from "../../../src/common/serialization/function-registry";
import {
    WorkerMessageType, requestFunctionMessage, workerResultMessage,
    functionExecutionError
} from "../../../src/common/worker/worker-messages";
import {FunctionDefinition} from "../../../src/common/worker/function-defintion";
import {TaskDefinition} from "../../../src/common/task/task-definition";

describe("BrowserWorkerThread", function () {
    let slave: { postMessage: jasmine.Spy, addEventListener(event: string, handler: (event: MessageEvent) => void): void };
    let browserWorker: BrowserWorkerThread;
    let functionLookupTable: FunctionRegistry;
    let slaveRespond: (event: MessageEvent) => void;

    beforeEach(function () {
        slave = {
            postMessage: jasmine.createSpy("postMessage"),
            addEventListener(event: string, handler: (event: MessageEvent) => void): void {
                if (event === "message") {
                    slaveRespond = handler;
                }
            }
        };
        functionLookupTable = new FunctionRegistry();
        browserWorker = new BrowserWorkerThread(slave as any, functionLookupTable);
    });

    describe("initialize", function () {
        it("sends an initialize message to the slave containing the worker id", function () {
            // act
            browserWorker.initialize();

            // assert
            expect(slave.postMessage).toHaveBeenCalledWith({ type: WorkerMessageType.InitializeWorker, workerId: browserWorker.id });
        });
    });

    describe("run", function () {
        it("sends the schedule task message to the slave containing the task definition", function () {
            // arrange
            const task: TaskDefinition = { usedFunctionIds: [1], main: { functionId: 1, params: [], ______serializedFunctionCall: true }, id: 1};

            // act
            browserWorker.run(task);

            // assert
            expect(slave.postMessage).toHaveBeenCalledWith({ type: WorkerMessageType.ScheduleTask, task });
        });

        it("sends the function definition to the slave if the definition is requested", function () {
            // arrange
            const task: TaskDefinition = { usedFunctionIds: [1], main: { functionId: 1, params: [], ______serializedFunctionCall: true }, id: 1};
            const functionDefinition: FunctionDefinition = { id: task.main.functionId, argumentNames: ["x", "y"], body: "x + y;" };
            spyOn(functionLookupTable, "getDefinition").and.returnValue(functionDefinition);
            browserWorker.initialize();
            browserWorker.run(task);

            // act
            slaveRespond({ data: requestFunctionMessage(task.main.functionId) } as any);

            // assert
            expect(slave.postMessage).toHaveBeenCalledWith({ type: WorkerMessageType.FunctionResponse, functions: [functionDefinition]});
        });

        it("invokes the oncomplete handler if the slave has sent the result", function () {
            // arrange
            const task: TaskDefinition = { usedFunctionIds: [1], main: { functionId: 1, params: [], ______serializedFunctionCall: true }, id: 1};

            browserWorker.run(task);
            const completeSpy = browserWorker.oncomplete = jasmine.createSpy("completeSpy");

            // act
            slaveRespond({ data: workerResultMessage(10) } as any);

            // assert
            expect(completeSpy).toHaveBeenCalledWith(10);
        });

        it("does not fail if no oncomplete handler is registered and the result is received from the slave", function () {
            // arrange
            const task: TaskDefinition = { usedFunctionIds: [1], main: { functionId: 1, params: [], ______serializedFunctionCall: true }, id: 1};
            browserWorker.run(task);

            // act, assert
            slaveRespond({ data: workerResultMessage(10) } as any);
        });
    });

    describe("stop", function () {
        it("sends the stop message to the slave", function () {
            // act
            browserWorker.stop();

            // assert
            expect(slave.postMessage).toHaveBeenCalledWith({ type: WorkerMessageType.Stop });
        });
    });

    describe("onmessage", function () {
        it("triggers the onerror handler if an error message has been retrieved from the worker", function () {
            // arrange
            const errorHandler = browserWorker.onerror = jasmine.createSpy("onerror");
            const task: TaskDefinition = { usedFunctionIds: [1], main: { functionId: 1, params: [], ______serializedFunctionCall: true }, id: 1};
            browserWorker.run(task);

            // act
            slaveRespond({ data: functionExecutionError(new Error("Failed to execute the function"))} as any);

            // assert
            expect(errorHandler).toHaveBeenCalledWith(jasmine.objectContaining({
                message: jasmine.stringMatching("Failed to execute the function")
            }));
        });

        it("throws an error if the slave sends an unexpected message", function () {
            // act, assert
            expect(() => slaveRespond({ data: { type: 9999999, txt: "Unknown message" } } as any)).toThrowError("Message from worker cannot be processed 9999999");
        });
    });
});