import {ITaskDefinition} from "../task/task-definition";

/**
 * Abstraction of a thread that is used to execute tasks. Abstracts the actual used environment (node, browser...)
 */
export interface IWorkerThread {
    /**
     * Invoked when the task has completed successfully
     * @param result the result returned by the executed function
     */
    oncomplete?: (result: any) => void | undefined;

    /**
     * Invoked when an error occurred during the execution of the function
     * @param error the reported error
     */
    onerror?: (error: any) => void | undefined;

    /**
     * Executes the given task using this worker
     * @param task the task to execute
     */
    run(task: ITaskDefinition): void;

    /**
     * Stops the worker as soon as possible. Does not wait until the current assigned task is processed completely
     */
    stop(): void;
}

export default IWorkerThread;