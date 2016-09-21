import {isStopMesssage} from "../../common/worker/worker-messages";
import {DefaultBrowserWorkerSlaveState, BrowserWorkerSlaveState} from "./browser-worker-slave-states";
import {SlaveFunctionLookupTable} from "../../common/function/slave-function-lookup-table";

declare function postMessage(data: any): void;

/**
 * Worker thread endpoint executed in the web worker thread.
 * Executes the tasks assigned by the thread pool via the {@link BrowserWorkerThread}.
 */
export class BrowserWorkerSlave {

    /**
     * The unique id of the slave instance
     */
    public id: number = Number.NaN;

    private state: BrowserWorkerSlaveState = new DefaultBrowserWorkerSlaveState(this);

    constructor(public functionCache: SlaveFunctionLookupTable) {

    }

    /**
     * Changes the state of the slave to the new state
     * @param state the new state to assign
     */
    public changeState(state: BrowserWorkerSlaveState): void {
        this.state = state;
        this.state.enter();
    }

    /**
     * Executed when the slave receives a message from the ui-thread
     * @param event the received message
     */
    public onMessage(event: MessageEvent): void {
        if (isStopMesssage(event.data)) {
            close();
        } else if (!this.state.onMessage(event)) {
            throw new Error(`Message with type ${event.data.type} cannot be handled by slave ${this}`);
        }
    }

    public postMessage(message: any): void {
        postMessage(message);
    }

    public toString(): string {
        return `BrowserSlave { id: ${this.id}, state: '${this.state.name}' }`;
    }
}
