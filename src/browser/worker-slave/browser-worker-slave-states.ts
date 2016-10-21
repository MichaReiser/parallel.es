import {FunctionCallDeserializer} from "../../common/function/function-call-deserializer";
import {ITaskDefinition} from "../../common/task/task-definition";
import {IFunctionDefinition} from "../../common/function/function-defintion";
import {
    functionExecutionError, isFunctionResponse, isInitializeMessage, isScheduleTask, requestFunctionMessage,
    workerResultMessage } from "../../common/worker/worker-messages";
import {BrowserWorkerSlave} from "./browser-worker-slave";

/**
 * State of the browser worker slave.
 */
export abstract class BrowserWorkerSlaveState {
    constructor(public name: string, protected slave: BrowserWorkerSlave) {}

    /**
     * Executed when the slave changes its state to this state.
     */
    public enter(): void {
        // intentionally empty
    }

    /**
     * Executed whenever the slave receives a message from the ui-thread while being in this state
     * @param event the received message
     * @returns {boolean} true if the state has handled the message, false otherwise
     */
    public onMessage(event: MessageEvent): boolean { return false; }
}

/**
 * Initial state of a slave. The slave is waiting for the initialization message.
 */
export class DefaultBrowserWorkerSlaveState extends BrowserWorkerSlaveState {
       constructor(slave: BrowserWorkerSlave) {
        super("Default", slave);
    }

    public onMessage(event: MessageEvent): boolean {
        if (isInitializeMessage(event.data)) {
            this.slave.id = event.data.workerId;
            this.slave.changeState(new IdleBrowserWorkerSlaveState(this.slave));
            return true;
        }
        return false;
    }
}

/**
 * The slave is waiting for work from the ui-thread.
 */
export class IdleBrowserWorkerSlaveState extends BrowserWorkerSlaveState {
    constructor(slave: BrowserWorkerSlave) {
        super("Idle", slave);
    }

    public onMessage(event: MessageEvent): boolean {
        if (!isScheduleTask(event.data)) {
            return false;
        }

        const task: ITaskDefinition = event.data.task;
        const missingFunctions = task.usedFunctionIds.filter(id => !this.slave.functionCache.has(id));

        if (missingFunctions.length === 0) {
            this.slave.changeState(new ExecuteFunctionBrowserWorkerSlaveState(this.slave, task));
        } else {
            const [ head, ...tail ] = missingFunctions;
            this.slave.postMessage(requestFunctionMessage(head, ...tail));
            this.slave.changeState(new WaitingForFunctionDefinitionBrowserWorkerSlaveState(this.slave, task));
        }

        return true;
    }
}

/**
 * The slave is waiting for the definition of the requested function that is needed to execute the assigned task.
 */
export class WaitingForFunctionDefinitionBrowserWorkerSlaveState extends BrowserWorkerSlaveState {
    constructor(slave: BrowserWorkerSlave, private task: ITaskDefinition) {
        super("WaitingForFunctionDefinition", slave);
    }

    public onMessage(event: MessageEvent): boolean {
        const message = event.data;
        if (isFunctionResponse(message)) {
            if (message.missingFunctions.length > 0) {
                const identifiers = message.missingFunctions.map(functionId => functionId.identifier).join(", ");
                this.slave.postMessage(functionExecutionError(new Error(`The function ids [${identifiers}] could not be resolved by slave ${this.slave.id}.`)));
                this.slave.changeState(new IdleBrowserWorkerSlaveState(this.slave));
            } else {
                for (const definition of message.functions as IFunctionDefinition[]) {
                    this.slave.functionCache.registerFunction(definition);
                }

                this.slave.changeState(new ExecuteFunctionBrowserWorkerSlaveState(this.slave, this.task));
            }
            return true;
        }
        return false;
    }
}

/**
 * The slave is executing the function
 */
export class ExecuteFunctionBrowserWorkerSlaveState extends BrowserWorkerSlaveState {
    constructor(slave: BrowserWorkerSlave, private task: ITaskDefinition) {
        super("Executing", slave);
    }

    public enter(): void {
        const functionDeserializer = new FunctionCallDeserializer(this.slave.functionCache);

        try {
            const main = functionDeserializer.deserializeFunctionCall(this.task.main);
            const result = main({functionCallDeserializer: functionDeserializer});
            this.slave.postMessage(workerResultMessage(result));
        } catch (error) {
            this.slave.postMessage(functionExecutionError(error));
        }

        this.slave.changeState(new IdleBrowserWorkerSlaveState(this.slave));
    }
}
