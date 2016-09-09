import {isStopMesssage} from "../../common/worker/worker-messages";
import {DefaultSlaveState, SlaveState} from "./browser-slave-states";
import {SlaveFunctionCache} from "./slave-function-cache";

declare function postMessage(data: any): void;

/**
 * Worker thread endpoint executed in the web worker thread.
 * Executes the tasks assigned by the thread pool via the {@link BrowserWorkerThread}.
 */
export class BrowserSlave {

    /**
     * The unique id of the slave instance
     */
    public id: number = Number.NaN;

    public functionCache = new SlaveFunctionCache();

    private state: SlaveState = new DefaultSlaveState(this);

    /**
     * Changes the state of the slave to the new state
     * @param state the new state to assign
     */
    public changeState(state: SlaveState): void {
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
