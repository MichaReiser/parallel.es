import {BrowserWorkerThread} from "../../../src/browser/worker/browser-worker-thread";
import {FunctionRegistry} from "../../../src/common/serialization/function-registry";
import {
    WorkerMessageType, requestFunctionMessage, workerResultMessage,
    functionExecutionError
} from "../../../src/common/worker/worker-messages";
import {IFunctionDefinition} from "../../../src/common/worker/function-defintion";
import {ITaskDefinition} from "../../../src/common/task/task-definition";

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

    it("is in default state by default", function () {
        expect(browserWorker.state.name).toBe("default");
    });

    describe("initialize", function () {
        it("sends an initialize message to the slave containing the worker id", function () {
            // act
            browserWorker.initialize();

            // assert
            expect(slave.postMessage).toHaveBeenCalledWith({ type: WorkerMessageType.InitializeWorker, workerId: browserWorker.id });
        });

        it("is in idle state thereafter", function () {
            // act
            browserWorker.initialize();

            // assert
            expect(browserWorker.state.name).toBe("idle");
        });

        it("fails if the worker is not in the default state", function () {
            // arrange
            browserWorker.initialize();

            // act, assert
            expect(() => browserWorker.initialize()).toThrowError("The browser worker thread can only be initialized if in state default but actual state is 'idle'.");
        });
    });

    describe("run", function () {
        it("sends the schedule task message to the slave containing the task definition", function () {
            // arrange
            const task: ITaskDefinition = { id: 1, main: { ______serializedFunctionCall: true, functionId: 1, parameters: [] }, usedFunctionIds: [1]};
            browserWorker.initialize();

            // act
            browserWorker.run(task, () => undefined);

            // assert
            expect(slave.postMessage).toHaveBeenCalledWith({ type: WorkerMessageType.ScheduleTask, task });
        });

        it("is in executing state while executing", function () {
            // arrange
            const task: ITaskDefinition = { id: 1, main: { ______serializedFunctionCall: true, functionId: 1, parameters: [] }, usedFunctionIds: [1]};
            browserWorker.initialize();

            // act
            browserWorker.run(task, () => undefined);

            // assert
            expect(browserWorker.state.name).toBe("executing");
        });

        it("sends the function definition to the slave if the definition is requested", function () {
            // arrange
            const task: ITaskDefinition = { id: 1, main: { ______serializedFunctionCall: true, functionId: 1, parameters: [] }, usedFunctionIds: [1] };
            const functionDefinition: IFunctionDefinition = { argumentNames: ["x", "y"], body: "x + y;", id: task.main.functionId };
            spyOn(functionLookupTable, "getDefinition").and.returnValue(functionDefinition);
            browserWorker.initialize();
            browserWorker.run(task, () => undefined);

            // act
            slaveRespond({ data: requestFunctionMessage(task.main.functionId) } as any);

            // assert
            expect(slave.postMessage).toHaveBeenCalledWith({ functions: [functionDefinition], type: WorkerMessageType.FunctionResponse });
        });

        it("invokes the callback with the result received from the worker slave", function () {
            // arrange
            const task: ITaskDefinition = { id: 1, main: {  ______serializedFunctionCall: true, functionId: 1, parameters: [] }, usedFunctionIds: [1] };
            const callback = jasmine.createSpy("callback");
            browserWorker.initialize();

            browserWorker.run(task, callback);

            // act
            slaveRespond({ data: workerResultMessage(10) } as any);

            // assert
            expect(callback).toHaveBeenCalledWith(undefined, 10);
        });

        it("triggers the callback if an error message has been retrieved from the worker", function () {
            // arrange
            const task: ITaskDefinition = { id: 1, main: { ______serializedFunctionCall: true, functionId: 1, parameters: [] }, usedFunctionIds: [1] };
            const callback = jasmine.createSpy("callback");
            browserWorker.initialize();
            browserWorker.run(task, callback);

            // act
            slaveRespond({ data: functionExecutionError(new Error("Failed to execute the function"))} as any);

            // assert
            expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
                message: jasmine.stringMatching("Failed to execute the function")
            }), undefined);
        });

        it("throws an error if the slave sends an unexpected message", function () {
            // act, assert
            expect(() => slaveRespond({ data: { txt: "Unknown message", type: 9999999 } } as any)).toThrowError("Browser worker thread in state 'default' cannot handle the received message (9999999).");
        });

        it("fails if the browser worker thread is not in idle state", function () {
            // arrange
            const task: ITaskDefinition = { id: 1, main: { ______serializedFunctionCall: true, functionId: 1, parameters: [] }, usedFunctionIds: [1] };
            const callback = jasmine.createSpy("callback");

            // act, assert
            expect(() => browserWorker.run(task, callback)).toThrowError("The browser worker thread can only execute a new task if in state idle but actual state is 'default'.");
        });

        it("switches back to idle state if execution has completed", function () {
            // arrange
            const task: ITaskDefinition = { id: 1, main: { ______serializedFunctionCall: true, functionId: 1, parameters: [] }, usedFunctionIds: [1] };
            const callback = jasmine.createSpy("callback");

            browserWorker.initialize();
            browserWorker.run(task, callback);

            // act
            slaveRespond({ data: workerResultMessage(10 )} as any);

            // assert
            expect(browserWorker.state.name).toEqual("idle");
        });

        it("is in stopped state after function completed but when stop was requested", function () {
            // arrange
            const task: ITaskDefinition = { id: 1, main: { ______serializedFunctionCall: true, functionId: 1, parameters: [] }, usedFunctionIds: [1] };
            const callback = jasmine.createSpy("callback");

            browserWorker.initialize();
            browserWorker.run(task, callback);

            // act
            browserWorker.stop();
            slaveRespond({ data: workerResultMessage(10 )} as any);

            // assert
            expect(browserWorker.state.name).toEqual("stopped");
        });
    });

    describe("stop", function () {
        it("sends the stop message to the slave", function () {
            // act
            browserWorker.stop();

            // assert
            expect(slave.postMessage).toHaveBeenCalledWith({ type: WorkerMessageType.Stop });
        });

        it("is in stopped state thereafter", function () {
            // act
            browserWorker.stop();

            // assert
            expect(browserWorker.state.name).toBe("stopped");
        });

        it("does not resent the stop message if already stopped", function () {
            // act
            browserWorker.stop();
            browserWorker.stop();

            // assert
            expect(slave.postMessage).toHaveBeenCalledTimes(1);
        });

        it("is still in executing state if stopped while executing", function () {
            // arrange
            const task: ITaskDefinition = { id: 1, main: { ______serializedFunctionCall: true, functionId: 1, parameters: [] }, usedFunctionIds: [1] };
            const callback = jasmine.createSpy("callback");

            browserWorker.initialize();
            browserWorker.run(task, callback);

            // act
            browserWorker.stop();

            // assert
            expect(browserWorker.state.name).toEqual("executing");
        });
    });
});
