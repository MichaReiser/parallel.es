import {TaskDefinition} from "../../common/task/task-definition";
import {
    isInitializeMessage, isScheduleTask, requestFunctionMessage, isFunctionResponse,
    workerResultMessage, functionExecutionError, isStopMesssage
} from "../../common/worker/messages";
import {FunctionDefinition} from "../../common/worker/function-defintion";

abstract class SlaveState {
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
class DefaultSlaveState extends SlaveState {
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
class IdleSlaveState extends SlaveState {
    constructor(slave: BrowserSlave) {
        super("Idle", slave);
    }

    onMessage(event: MessageEvent): boolean {
        if (!isScheduleTask(event.data)) {
            return false;
        }

        const task = event.data.task;

        // console.log(`run task ${event.data.task}`, this);

        if (this.slave.functions[task.functionId]) {
            this.slave.changeState(new ExecuteFunctionState(this.slave, task));
        } else {
            this.slave.changeState(new WaitingForFunctionDefinitionState(this.slave, task));
        }
        return true;
    }
}

/**
 * The slave is waiting for the definition of the requested function that is needed to execute the assigned task.
 */
class WaitingForFunctionDefinitionState extends SlaveState {
    constructor(slave: BrowserSlave, private task: TaskDefinition) {
        super("WaitingForFunctionDefinition", slave);
    }

    enter(): void {
        postMessage(requestFunctionMessage(this.task.functionId));
    }

    onMessage(event: MessageEvent): boolean {
        const message = event.data;
        if (isFunctionResponse(message)) {
            for (const definition of message.functions as FunctionDefinition[]) {
                this.slave.functions[definition.id] = Function.apply(null, [...definition.argumentNames, definition.body]);
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
class ExecuteFunctionState extends SlaveState {
    name = "Executing";
    constructor(slave: BrowserSlave, private task: TaskDefinition) {
        super("Executing", slave);
    }

    enter(): void {
        const func = this.slave.functions[this.task.functionId];

        try {
            const result = func.apply(null, this.task.params);
            postMessage(workerResultMessage(result));
        } catch (error) {
            postMessage(functionExecutionError(error));
        }

        this.slave.changeState(new IdleSlaveState(this.slave));
    }
}

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

    /**
     * Map that stores the known function of this slave.
     * The function id is used as key, the value is the function.
     */
    functions: { [functionId: number]: Function} = {};

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

    toString(): string {
        return `BrowserSlave { id: ${this.id}, state: '${this.state.name}' }`;
    }
}

const slave = new BrowserSlave();
onmessage = slave.onMessage.bind(slave);