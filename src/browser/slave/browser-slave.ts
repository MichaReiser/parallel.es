import {isStopMesssage} from "../../common/worker/worker-messages";
import {SlaveFunctionCache} from "./slave-function-cache";
import {SlaveState, DefaultSlaveState} from "./browser-slave-states";

declare function postMessage(data: any): void;


/**
 * Worker thread endpoint executed in the web worker thread.
 * Executes the tasks assigned by the thread pool via the {@link BrowserWorkerThread}.
 */
export class BrowserSlave {

    private state: SlaveState = new DefaultSlaveState(this);

    /**
     * The unique id of the slave instance
     */
    id: number = Number.NaN;

    functionCache = new SlaveFunctionCache();

    /**
     * Changes the state of the slave to the new state
     * @param state the new state to assign
     */
    changeState(state: SlaveState): void {
        this.state = state;
        this.state.enter();
    }

    /**
     * Executed when the slave receives a message from the ui-thread
     * @param event the received message
     */
    onMessage(event: MessageEvent): void {
        if (isStopMesssage(event.data)) {
            close();
        } else if (!this.state.onMessage(event)) {
            throw new Error(`Message with type ${event.data.type} cannot be handled by slave ${this}`);
        }
    }

    postMessage(message: any): void {
        postMessage(message);
    }

    toString(): string {
        return `BrowserSlave { id: ${this.id}, state: '${this.state.name}' }`;
    }
}