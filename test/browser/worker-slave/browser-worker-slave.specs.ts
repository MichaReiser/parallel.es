import {initializeWorkerMessage} from "../../../src/common/worker/worker-messages";
import {BrowserWorkerSlave} from "../../../src/browser/worker-slave/browser-worker-slave";
import {IdleBrowserWorkerSlaveState} from "../../../src/browser/worker-slave/browser-worker-slave-states";
import {SlaveFunctionLookupTable} from "../../../src/common/function/slave-function-lookup-table";

describe("BrowserWorkerSlave", function () {
    let slave: BrowserWorkerSlave;
    let functionLookupTable: SlaveFunctionLookupTable;

    beforeEach(function () {
        functionLookupTable = new SlaveFunctionLookupTable();
        slave = new BrowserWorkerSlave(functionLookupTable);
    });

    describe("changeState", function () {
        it("calls enter on the passed state", function () {
            // arrange
            const state = new IdleBrowserWorkerSlaveState(slave);
            const enterSpy = spyOn(state, "enter");

            // act
            slave.changeState(state);

            // assert
            expect(enterSpy).toHaveBeenCalled();
        });
    });

    describe("onMessage", function () {
        it("calls onMessage of the current state", function () {
            // arrange
            const state = new IdleBrowserWorkerSlaveState(slave);
            spyOn(state, "enter");
            const onMessageSpy = spyOn(state, "onMessage").and.returnValue(true);
            const message = initializeWorkerMessage(10);
            slave.changeState(state);

            // act
            slave.onMessage({ data: message } as any);

            // assert
            expect(onMessageSpy).toHaveBeenCalledWith(jasmine.objectContaining({ data: message }));
        });

        it("throws an error if the state cannot handle the given message", function () {
            // arrange
            const state = new IdleBrowserWorkerSlaveState(slave);
            spyOn(state, "enter");
            spyOn(state, "onMessage").and.returnValue(false);
            const message = initializeWorkerMessage(10);
            slave.changeState(state);

            // act, assert
            expect(() => slave.onMessage({ data: message } as any)).toThrowError(`Message with type 0 cannot be handled by slave BrowserSlave { id: NaN, state: 'Idle' }`);
        });
    });
});
