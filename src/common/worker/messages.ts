import {TaskDefinition} from "../task/task-definition";
import {FunctionDefinition} from "./function-defintion";

export const enum MessageType {
    InitializeWorker,
    ScheduleTask,
    FunctionRequest,
    FunctionResponse,
    WorkerResult,
    FunctionExecutionError,
    Stop
}

export interface WorkerMessage {
    type: MessageType;
}

/**
 * Sent to initialize the worker with a unique worker id
 */
export interface InitializeWorkerMessage extends WorkerMessage {
    /**
     * Unique id that is assigned to the worker
     */
    workerId: number;
}

/**
 * Schedules the given task on the target worker
 */
export interface ScheduleTaskMessage extends WorkerMessage {
    /**
     * Task to execute on the target worker
     */
    task: TaskDefinition;
}

/**
 * Sent by the worker to request the function definition with the given id from.
 */
export interface FunctionRequest extends WorkerMessage {
    /**
     * The id of the requested function
     */
    functionId: number;
}

/**
 * Sent to the worker. Contains all needed function definitions to execute the requested function.
 */
export interface FunctionResponse extends WorkerMessage {
    /**
     * The definition of the needed functions to execute the requested function
     */
    functions: FunctionDefinition[];
}

/**
 * Sent from the worker to report the result of the function.
 */
export interface WorkerResultMessage extends WorkerMessage {
    /**
     * The result of the executed function
     */
    result: any;
}

/**
 * Sent from the worker to report an error during the execution of the function.
 */
export interface FunctionExecutionError extends WorkerMessage {
    /**
     * The occurred error. Not an instance of Error. Error is not cloneable.
     */
    error: any;
}

/**
 * Creates an initialize worker message
 * @param id the id assigned to the worker
 * @returns the initialize worker message
 */
export function initializeWorkerMessage(id: number): InitializeWorkerMessage {
    return { workerId: id, type: MessageType.InitializeWorker };
}

export function scheduleTaskMessage(task: TaskDefinition): ScheduleTaskMessage {
    return { task, type: MessageType.ScheduleTask};
}

export function requestFunctionMessage(functionId: number): FunctionRequest {
    return { functionId, type: MessageType.FunctionRequest };
}

export function functionResponseMessage(functions: FunctionDefinition[]): FunctionResponse {
    return { functions, type: MessageType.FunctionResponse };
}

export function workerResultMessage(result: any): WorkerResultMessage {
    return { result: result, type: MessageType.WorkerResult };
}

export function functionExecutionError(error: Error): FunctionExecutionError {
    let errorObject: {[prop: string]: string} = {};

    for (const prop of Object.getOwnPropertyNames(error)) {
        errorObject[prop] = JSON.stringify((<any>error)[prop]);
    }

    return { error: errorObject, type: MessageType.FunctionExecutionError };
}

export function stopMessage(): WorkerMessage {
    return { type: MessageType.Stop };
}

export function isScheduleTask(message: WorkerMessage): message is ScheduleTaskMessage {
    return message.type === MessageType.ScheduleTask;
}

export function isInitializeMessage(message: WorkerMessage): message is InitializeWorkerMessage {
    return message.type === MessageType.InitializeWorker;
}

export function isFunctionRequest(message: WorkerMessage): message is FunctionRequest {
    return message.type === MessageType.FunctionRequest;
}

export function isFunctionResponse(message: WorkerMessage): message is FunctionResponse {
    return message.type === MessageType.FunctionResponse;
}

export function isWorkerResult(message: WorkerMessage): message is WorkerResultMessage {
    return message.type === MessageType.WorkerResult;
}

export function isFunctionExecutionError(message: WorkerMessage): message is FunctionExecutionError {
    return message.type === MessageType.FunctionExecutionError;
}

export function isStopMesssage(message: WorkerMessage): boolean {
    return message.type === MessageType.Stop;
}