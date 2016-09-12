import {ITaskDefinition} from "../task/task-definition";
import {IFunctionDefinition} from "./function-defintion";

export const enum WorkerMessageType {
    InitializeWorker,
    ScheduleTask,
    FunctionRequest,
    FunctionResponse,
    WorkerResult,
    FunctionExecutionError,
    Stop
}

export interface IWorkerMessage {
    type: WorkerMessageType;
}

/**
 * Sent to initialize the worker with a unique worker id
 */
export interface IInitializeWorkerMessage extends IWorkerMessage {
    /**
     * Unique id that is assigned to the worker
     */
    workerId: number;
}

/**
 * Schedules the given task on the target worker
 */
export interface IScheduleTaskMessage extends IWorkerMessage {
    /**
     * Task to execute on the target worker
     */
    task: ITaskDefinition;
}

/**
 * Sent by the worker to request the function definition with the given id from.
 */
export interface IFunctionRequest extends IWorkerMessage {
    /**
     * The ids of the requested functions
     */
    functionIds: number[];
}

/**
 * Sent to the worker. Contains all needed function definitions to execute the requested function.
 */
export interface IFunctionResponse extends IWorkerMessage {
    /**
     * The definition of the needed functions to execute the requested function
     */
    functions: IFunctionDefinition[];
}

/**
 * Sent from the worker to report the result of the function.
 */
export interface IWorkerResultMessage extends IWorkerMessage {
    /**
     * The result of the executed function
     */
    result: any;
}

/**
 * Sent from the worker to report an error during the execution of the function.
 */
export interface IFunctionExecutionError extends IWorkerMessage {
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
export function initializeWorkerMessage(id: number): IInitializeWorkerMessage {
    return { type: WorkerMessageType.InitializeWorker, workerId: id };
}

export function scheduleTaskMessage(task: ITaskDefinition): IScheduleTaskMessage {
    return { task, type: WorkerMessageType.ScheduleTask};
}

export function requestFunctionMessage(functionId: number, ...otherFunctionIds: number[]): IFunctionRequest {
    return { functionIds: [functionId, ...otherFunctionIds], type: WorkerMessageType.FunctionRequest };
}

export function functionResponseMessage(functions: IFunctionDefinition[]): IFunctionResponse {
    return { functions, type: WorkerMessageType.FunctionResponse };
}

export function workerResultMessage(result: any): IWorkerResultMessage {
    return { result, type: WorkerMessageType.WorkerResult };
}

export function functionExecutionError(error: Error): IFunctionExecutionError {
    let errorObject: {[prop: string]: string} = {};

    for (const prop of Object.getOwnPropertyNames(error)) {
        errorObject[prop] = JSON.stringify((error as any)[prop]);
    }

    return { error: errorObject, type: WorkerMessageType.FunctionExecutionError };
}

export function stopMessage(): IWorkerMessage {
    return { type: WorkerMessageType.Stop };
}

export function isScheduleTask(message: IWorkerMessage): message is IScheduleTaskMessage {
    return message.type === WorkerMessageType.ScheduleTask;
}

export function isInitializeMessage(message: IWorkerMessage): message is IInitializeWorkerMessage {
    return message.type === WorkerMessageType.InitializeWorker;
}

export function isFunctionRequest(message: IWorkerMessage): message is IFunctionRequest {
    return message.type === WorkerMessageType.FunctionRequest;
}

export function isFunctionResponse(message: IWorkerMessage): message is IFunctionResponse {
    return message.type === WorkerMessageType.FunctionResponse;
}

export function isWorkerResult(message: IWorkerMessage): message is IWorkerResultMessage {
    return message.type === WorkerMessageType.WorkerResult;
}

export function isFunctionExecutionError(message: IWorkerMessage): message is IFunctionExecutionError {
    return message.type === WorkerMessageType.FunctionExecutionError;
}

export function isStopMesssage(message: IWorkerMessage): boolean {
    return message.type === WorkerMessageType.Stop;
}
