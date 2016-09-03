import {FunctionDefinition} from "../../common/worker/function-defintion";
import {FunctionCallDeserializer} from "../../common/serialization/function-call-deserializer";
import {TaskDefinition} from "../../common/task/task-definition";
import {BrowserSlave} from "./browser-slave";
import {
    isFunctionResponse, workerResultMessage, functionExecutionError,
    isInitializeMessage, isScheduleTask, requestFunctionMessage
} from "../../common/worker/worker-messages";

export abstract class SlaveState {
    constructor(public name: string, protected slave: BrowserSlave) {}

    /**
     * Executed when the slave changes its state to this state.
     */
    enter(): void {}

    /**
     * Executed whenever the slave receives a message from the ui-thread while being in this state
     * @param event the received message
     * @returns {boolean} true if the state has handled the message, false otherwise
     */
    onMessage(event: MessageEvent): boolean { return false; }
}

/**
 * Initial state of a slave. The slave is waiting for the initialization message.
 */
export class DefaultSlaveState extends SlaveState {
    constructor(slave: BrowserSlave) {
        super("Default", slave);
    }

    onMessage(event: MessageEvent): boolean {
        if (isInitializeMessage(event.data)) {
            this.slave.id = event.data.workerId;
            this.slave.changeState(new IdleSlaveState(this.slave));
            return true;
        }
        return false;
    }
}

/**
 * The slave is waiting for work from the ui-thread.
 */
export class IdleSlaveState extends SlaveState {
    constructor(slave: BrowserSlave) {
        super("Idle", slave);
    }

    onMessage(event: MessageEvent): boolean {
        if (!isScheduleTask(event.data)) {
            return false;
        }

        const task: TaskDefinition = event.data.task;
        const missingFunctions = task.usedFunctionIds.filter(id => !this.slave.functionCache.has(id));

        if (missingFunctions.length === 0) {
            this.slave.changeState(new ExecuteFunctionState(this.slave, task));
        } else {
            const [ head, ...tail ] = missingFunctions;
            this.slave.postMessage(requestFunctionMessage(head, ...tail));
            this.slave.changeState(new WaitingForFunctionDefinitionState(this.slave, task));
        }

        return true;
    }
}

/**
 * The slave is waiting for the definition of the requested function that is needed to execute the assigned task.
 */
export class WaitingForFunctionDefinitionState extends SlaveState {
    constructor(slave: BrowserSlave, private task: TaskDefinition) {
        super("WaitingForFunctionDefinition", slave);
    }

    onMessage(event: MessageEvent): boolean {
        const message = event.data;
        if (isFunctionResponse(message)) {
            for (const definition of message.functions as FunctionDefinition[]) {
                this.slave.functionCache.registerFunction(definition);
            }

            this.slave.changeState(new ExecuteFunctionState(this.slave, this.task));
            return true;
        }
        return false;
    }
}

/**
 * The slave is executing the function
 */
export class ExecuteFunctionState extends SlaveState {
    name = "Executing";
    constructor(slave: BrowserSlave, private task: TaskDefinition) {
        super("Executing", slave);
    }

    enter(): void {
        const functionDeserializer = new FunctionCallDeserializer(this.slave.functionCache);

        try {
            const main = functionDeserializer.deserializeFunctionCall(this.task.main);
            const result = main({functionCallDeserializer: functionDeserializer});
            this.slave.postMessage(workerResultMessage(result));
        } catch (error) {
            this.slave.postMessage(functionExecutionError(error));
        }

        this.slave.changeState(new IdleSlaveState(this.slave));
    }
}