import {IWorkerMessage} from "./worker-messages";

/**
 * Communication Channel from the Worker Thread to the Slave
 */
export interface IWorkerThreadSlaveCommunicationChannel {
    sendMessage(message: IWorkerMessage): void;
    addEventListener(type: "error", listener: (this: this, ev: ErrorEvent) => any): void;
    addEventListener(type: "message", listener: (this: this, ev: MessageEvent) => any): void;
}
