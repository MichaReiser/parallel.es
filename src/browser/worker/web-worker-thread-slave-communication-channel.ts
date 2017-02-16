import {IWorkerThreadSlaveCommunicationChannel} from "../../common/worker/worker-thread-slave-communication-channel";
import {IWorkerMessage} from "../../common/worker/worker-messages";

export class WebWorkerThreadSlaveCommunicationChannel implements IWorkerThreadSlaveCommunicationChannel {

    constructor(private worker: Worker) {
    }

    public sendMessage(message: IWorkerMessage): void {
        this.worker.postMessage(message);
    }

    public addEventListener(type: "error" | "message", listener: (ev: Event) => any): void {
        this.worker.addEventListener(type, listener);
    }
}
