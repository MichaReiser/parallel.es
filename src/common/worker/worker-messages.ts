import {TaskDefinition} from "../task/task-definition";
import {FunctionDefinition} from "./function-defintion";

export const enum WorkerMessageType {
    InitializeWorker,
    ScheduleTask,
    FunctionRequest,
    FunctionResponse,
    WorkerResult,
    FunctionExecutionError,
    Stop
}

export interface WorkerMessage {
    type: WorkerMessageType;
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
     * The ids of the requested functions
     */
    functionIds: number[];
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
    return { workerId: id, type: WorkerMessageType.InitializeWorker };
}

export function scheduleTaskMessage(task: TaskDefinition): ScheduleTaskMessage {
    return { task, type: WorkerMessageType.ScheduleTask};
}

export function requestFunctionMessage(functionId: number, ...otherFunctionIds: number[]): FunctionRequest {
    return { functionIds: [functionId, ...otherFunctionIds], type: WorkerMessageType.FunctionRequest };
}

export function functionResponseMessage(functions: FunctionDefinition[]): FunctionResponse {
    return { functions, type: WorkerMessageType.FunctionResponse };
}

export function workerResultMessage(result: any): WorkerResultMessage {
    return { result: result, type: WorkerMessageType.WorkerResult };
}

export function functionExecutionError(error: Error): FunctionExecutionError {
    let errorObject: {[prop: string]: string} = {};

    for (const prop of Object.getOwnPropertyNames(error)) {
        errorObject[prop] = JSON.stringify((<any>error)[prop]);
    }

    return { error: errorObject, type: WorkerMessageType.FunctionExecutionError };
}

export function stopMessage(): WorkerMessage {
    return { type: WorkerMessageType.Stop };
}

export function isScheduleTask(message: WorkerMessage): message is ScheduleTaskMessage {
    return message.type === WorkerMessageType.ScheduleTask;
}

export function isInitializeMessage(message: WorkerMessage): message is InitializeWorkerMessage {
    return message.type === WorkerMessageType.InitializeWorker;
}

export function isFunctionRequest(message: WorkerMessage): message is FunctionRequest {
    return message.type === WorkerMessageType.FunctionRequest;
}

export function isFunctionResponse(message: WorkerMessage): message is FunctionResponse {
    return message.type === WorkerMessageType.FunctionResponse;
}

export function isWorkerResult(message: WorkerMessage): message is WorkerResultMessage {
    return message.type === WorkerMessageType.WorkerResult;
}

export function isFunctionExecutionError(message: WorkerMessage): message is FunctionExecutionError {
    return message.type === WorkerMessageType.FunctionExecutionError;
}

export function isStopMesssage(message: WorkerMessage): boolean {
    return message.type === WorkerMessageType.Stop;
}