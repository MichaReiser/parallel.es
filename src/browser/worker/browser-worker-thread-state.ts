import {isFunctionRequest, IFunctionRequest, functionResponseMessage, isWorkerResult, isFunctionExecutionError} from "../../common/worker/worker-messages";
import {FunctionRegistry} from "../../common/function/function-registry";

/**
 * State of the browser worker thread
 */
export class BrowserWorkerThreadState {
    constructor(public name: string) { }

    /**
     * Called if the browser worker thread has received a message from the {@link BrowserWorkerSlave}
     * @param event the received message
     */
    public onMessage(event: MessageEvent): void {
        throw new Error(`Browser worker thread in state '${this.name}' cannot handle the received message (${event.data.type}).`);
    }

    /**
     * Called if a fatal error on the {@link BrowserWorkerSlave}. Errors occurring during task execution are specially handled
     * and passed to {@link BrowserWorkerThreadState.onMessage}
     * @param event
     */
    public onError(event: ErrorEvent) {
        console.error("Processing error on worker slave", event.error);
    }
}

/**
 * Browser worker thread is executing a function on the {@link BrowserWorkerSlave}
 */
export class BrowserWorkerThreadExecutingState extends BrowserWorkerThreadState {
    constructor(private callback: (error: any, result: any) => void, private functionRegistry: FunctionRegistry, private worker: Worker) {
        super("executing");
    }

    public onMessage(event: MessageEvent) {
        const message = event.data;
        if (isFunctionRequest(message)) {
            const definitions = (message as IFunctionRequest).functionIds.map(functionId => {
                const definition = this.functionRegistry.getDefinition(functionId);
                if (!definition) {
                    throw Error(`${this} requested unknown function with id ${functionId}`);
                }
                return definition;
            });
            this.worker.postMessage(functionResponseMessage(definitions));
        } else if (isWorkerResult(message)) {
            this.callback(undefined, message.result);
        } else if (isFunctionExecutionError(message)) {
            this.callback(message.error, undefined);
        } else {
            super.onMessage(event);
        }
    }

    public onError(event: ErrorEvent) {
        this.callback(event.error, undefined);
    }
}
