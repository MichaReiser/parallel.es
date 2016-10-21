import {BrowserWorkerSlave} from "../../../src/browser/worker-slave/browser-worker-slave";
import {
    initializeWorkerMessage, scheduleTaskMessage,
    functionResponseMessage
} from "../../../src/common/worker/worker-messages";
import {
    IdleBrowserWorkerSlaveState, DefaultBrowserWorkerSlaveState, BrowserWorkerSlaveState,
    WaitingForFunctionDefinitionBrowserWorkerSlaveState, ExecuteFunctionBrowserWorkerSlaveState
} from "../../../src/browser/worker-slave/browser-worker-slave-states";
import {ITaskDefinition} from "../../../src/common/task/task-definition";
import {FunctionCallDeserializer} from "../../../src/common/function/function-call-deserializer";
import {SlaveFunctionLookupTable} from "../../../src/common/function/slave-function-lookup-table";
import {functionId} from "../../../src/common/function/function-id";

describe("BrowserWorkerSlaveStates", function () {
    let slave: BrowserWorkerSlave;
    let state: BrowserWorkerSlaveState;
    let functionLookupTable: SlaveFunctionLookupTable;

    beforeEach(function () {
        functionLookupTable = new SlaveFunctionLookupTable();
        slave = new BrowserWorkerSlave(functionLookupTable);
    });

    describe("DefaultBrowserWorkerSlaveState", function () {

        beforeEach(function () {
            state = new DefaultBrowserWorkerSlaveState(slave);
        });

        it("assigns the worker id if the initialize message is retrieved", function () {
            // arrange
            slave.changeState(state);

            // act
            state.onMessage(createMessage(initializeWorkerMessage(10)));

            // assert
            expect(slave.id).toBe(10);
        });

        it("changes to the Idle State after initializing the slave", function () {
            // arrange
            slave.changeState(state);
            const changeStateSpy = spyOn(slave, "changeState");

            // act
            state.onMessage(createMessage(initializeWorkerMessage(10)));

            // assert
            expect(changeStateSpy).toHaveBeenCalledWith(jasmine.any(IdleBrowserWorkerSlaveState));
        });
    });

    describe("IdleBrowserWorkerSlaveState", function () {
        beforeEach(function () {
            state = new IdleBrowserWorkerSlaveState(slave);
        });

        it("requests the definitions of the functions used in the task definition but yet missing in the slave cache", function () {
            // arrange
            const task: ITaskDefinition = {
                id: 1,
                main: {
                    ______serializedFunctionCall: true,
                    functionId: functionId("test", 0),
                    parameters: []
                },
                usedFunctionIds: [functionId("test", 0), functionId("test", 1), functionId("test", 2)]
            };

            spyOn(functionLookupTable, "has").and.returnValues(false, true, false);
            const changeStateSpy = spyOn(slave, "changeState");
            const slavePostMessageSpy = spyOn(slave, "postMessage");

            // act
            state.onMessage(createMessage(scheduleTaskMessage(task)));

            // assert
            expect(changeStateSpy).toHaveBeenCalledWith(jasmine.any(WaitingForFunctionDefinitionBrowserWorkerSlaveState));
            expect(slavePostMessageSpy).toHaveBeenCalledWith(jasmine.objectContaining({ functionIds: [functionId("test", 0), functionId("test", 2)] }));
        });

        it("changes to the execution state if the slave already has all functions cached", function () {
            // arrange
            const task: ITaskDefinition = {
                id: 1,
                main: {
                    ______serializedFunctionCall: true,
                    functionId: functionId("test", 0),
                    parameters: []
                },
                usedFunctionIds: [functionId("test", 0), functionId("test", 1), functionId("test", 2)]
            };

            spyOn(slave.functionCache, "has").and.returnValue(true);
            const changeStateSpy = spyOn(slave, "changeState");

            // act
            state.onMessage(createMessage(scheduleTaskMessage(task)));

            // assert
            expect(changeStateSpy).toHaveBeenCalledWith(jasmine.any(ExecuteFunctionBrowserWorkerSlaveState));
        });
    });

    describe("WaitingForFunctionDefinitionBrowserWorkerState", function () {
        beforeEach(function () {
            const task: ITaskDefinition = {
                id: 1,
                main: {
                    ______serializedFunctionCall: true,
                    functionId: functionId("test", 0),
                    parameters: []
                },
                usedFunctionIds: [functionId("test", 0), functionId("test", 1), functionId("test", 2)]
            };

            state = new WaitingForFunctionDefinitionBrowserWorkerSlaveState(slave, task);
        });

        it("changes to the execute state as soon as the function definitions have arrived", function () {
            // arrange
            const changeStateSpy = spyOn(slave, "changeState");

            // act
            state.onMessage(createMessage(functionResponseMessage([{
                argumentNames: ["x"],
                body: "return x;",
                id: functionId("test", 0)
            }])));

            // assert
            expect(changeStateSpy).toHaveBeenCalledWith(jasmine.any(ExecuteFunctionBrowserWorkerSlaveState));
        });

        it("changes to idle state if some function definitions are missing", function () {
            // arrange
            const changeStateSpy = spyOn(slave, "changeState");
            spyOn(slave, "postMessage");

            // act
            state.onMessage(createMessage(functionResponseMessage([{
                argumentNames: ["x"],
                body: "return x;",
                id: functionId("test", 0)
            }], functionId("test", 0))));

            // assert
            expect(changeStateSpy).toHaveBeenCalledWith(jasmine.any(IdleBrowserWorkerSlaveState));
        });

        it("reports an error if some function definitions are missing", function () {
            // arrange
            const slavePostMessage = spyOn(slave, "postMessage");
            // act
            state.onMessage(createMessage(functionResponseMessage([{
                argumentNames: ["x"],
                body: "return x;",
                id: functionId("test", 0)
            }], functionId("missing", 1), functionId("missing", 2))));

            // assert
            expect(slavePostMessage).toHaveBeenCalledWith(jasmine.objectContaining({ error: jasmine.objectContaining({ message: `"The function ids [missing-1, missing-2] could not be resolved by slave NaN."` })}));
        });

        it("registers the retrieved functions in the slave cache", function () {
            // arrange
            spyOn(slave, "changeState");
            const registerFunctionSpy = spyOn(slave.functionCache, "registerFunction");

            const def1 = {
                argumentNames: ["x"],
                body: "return x;",
                id: functionId("test", 0)
            };

            const def2 = {
                argumentNames: ["x"],
                body: "return x;",
                id: functionId("test", 1)
            };

            // act
            state.onMessage(createMessage(functionResponseMessage([def1, def2])));

            // assert
            expect(registerFunctionSpy).toHaveBeenCalledWith(def1);
            expect(registerFunctionSpy).toHaveBeenCalledWith(def2);
        });
    });

    describe("ExecuteFunctionBrowserWorkerState", function () {
        beforeEach(function () {
            const task: ITaskDefinition = {
                id: 1,
                main: {
                    ______serializedFunctionCall: true,
                    functionId: functionId("test", 0),
                    parameters: []
                },
                usedFunctionIds: [functionId("test", 0)]
            };

            state = new ExecuteFunctionBrowserWorkerSlaveState(slave, task);
        });

        it("calls the deserialized function", function () {
            // arrange
            const deserializedFunction = jasmine.createSpy("deserialized function");
            spyOn(slave, "postMessage");
            spyOn(FunctionCallDeserializer.prototype, "deserializeFunctionCall").and.returnValue(deserializedFunction);

            // act
            state.enter();

            // assert
            expect(deserializedFunction).toHaveBeenCalled();
        });

        it("sends the result to the worker thread", function () {
            // arrange
            const deserializedFunction = jasmine.createSpy("deserialized function").and.returnValue(10);
            const slavePostMessage = spyOn(slave, "postMessage");
            spyOn(FunctionCallDeserializer.prototype, "deserializeFunctionCall").and.returnValue(deserializedFunction);

            // act
            state.enter();

            // assert
            expect(slavePostMessage).toHaveBeenCalledWith(jasmine.objectContaining({ result: 10 }));
        });

        it("changes to the idle state after execution", function () {
            // arrange
            const deserializedFunction = jasmine.createSpy("deserialized function").and.returnValue(10);
            spyOn(slave, "postMessage");
            const slaveChangeState = spyOn(slave, "changeState");

            spyOn(FunctionCallDeserializer.prototype, "deserializeFunctionCall").and.returnValue(deserializedFunction);

            // act
            state.enter();

            // assert
            expect(slaveChangeState).toHaveBeenCalledWith(jasmine.any(IdleBrowserWorkerSlaveState));
        });

        it("sends the error to the worker thread if the function execution failed", function () {
            // arrange
            const deserializedFunction = jasmine.createSpy("deserialized function").and.throwError("execution failed");
            const slavePostMessage = spyOn(slave, "postMessage");
            spyOn(FunctionCallDeserializer.prototype, "deserializeFunctionCall").and.returnValue(deserializedFunction);

            // act
            state.enter();

            // assert
            expect(slavePostMessage).toHaveBeenCalledWith(jasmine.objectContaining({ error: jasmine.objectContaining({ message: `"execution failed"` })}));
        });

        it("changes to the idle state after function execution has failed", function () {
            // arrange
            const deserializedFunction = jasmine.createSpy("deserialized function").and.throwError("execution failed");
            spyOn(slave, "postMessage");
            const slaveChangeState = spyOn(slave, "changeState");

            spyOn(FunctionCallDeserializer.prototype, "deserializeFunctionCall").and.returnValue(deserializedFunction);

            // act
            state.enter();

            // assert
            expect(slaveChangeState).toHaveBeenCalledWith(jasmine.any(IdleBrowserWorkerSlaveState));
        });
    });

    function createMessage(data: any): MessageEvent {
        return { data } as any;
    }
});
