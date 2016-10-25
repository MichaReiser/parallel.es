import {IThreadPool} from "./thread-pool";
import {IWorkerThread} from "../worker/worker-thread";
import {ITaskDefinition} from "../task/task-definition";
import {IWorkerThreadFactory} from "../worker/worker-thread-factory";
import {WorkerTask} from "../task/worker-task";
import {ITask} from "../task/task";
import {FunctionCallSerializer} from "../function/function-call-serializer";
import {FunctionCall} from "../function/function-call";
import {IFunctionId} from "../function/function-id";

/**
 * Default thread pool implementation that processes the scheduled functions in FIFO order.
 */
export class DefaultThreadPool implements IThreadPool {
    private workers: IWorkerThread[] = [];
    private idleWorkers: IWorkerThread[] = [];
    private queue: WorkerTask<any>[] = [];
    private concurrencyLimit: number;

    constructor(private workerThreadFactory: IWorkerThreadFactory, private functionCallSerializer: FunctionCallSerializer, options: { maxConcurrencyLevel: number }) {
        this.concurrencyLimit = options.maxConcurrencyLevel;
    }

    public schedule<TResult>(func: ((this: void, ...params: any[]) => TResult) | IFunctionId, ...params: any[]): ITask<TResult> {
        const serializedFunc = this.functionCallSerializer.serializeFunctionCall(FunctionCall.createUnchecked(func, ...params));
        const taskDefinition: ITaskDefinition = { main: serializedFunc, usedFunctionIds: [ serializedFunc.functionId ] };
        return this.scheduleTask(taskDefinition);
    }

    public scheduleTask<TResult>(taskDefinition: ITaskDefinition): ITask<TResult> {
        const task = new WorkerTask<TResult>(taskDefinition);

        this.queue.unshift(task);
        this.schedulePendingTasks();

        return task;
    }

    public getFunctionSerializer(): FunctionCallSerializer {
        return this.functionCallSerializer;
    }

    /**
     * Schedules the tasks in the queue onto the available workers.
     * A new worker is spawned when no more idle workers are available and the number of workers has not yet reached the concurrency limit.
     * If no more idle workers are available and the concurrency limit has been reached then the tasks are left in queue.
     */
    private schedulePendingTasks(): void {
        while (this.queue.length) {
            let worker: IWorkerThread | undefined;
            if (this.idleWorkers.length === 0 && this.workers.length < this.concurrencyLimit) {
                worker = this.workerThreadFactory.spawn();
                this.workers.push(worker);
            } else if (this.idleWorkers.length > 0) {
                worker = this.idleWorkers.pop();
            }

            if (!worker) {
                return;
            }

            const task = <WorkerTask<any>> this.queue.pop();
            this.runTaskOnWorker(task, worker);
        }
    }

    /**
     * Starts the given task on the given worker. Resolves the task when the computation succeeds, rejects it otherwise.
     * The task is resolved when the computation has succeeded or is rejected if the computation failed
     * @param task the task to run on the given worker
     * @param worker the worker to use to execute the task
     */
    private runTaskOnWorker(task: WorkerTask<any>, worker: IWorkerThread): void {
        if (task.isCancellationRequested) {
            task.resolveCancelled();
            this.releaseWorker(worker);
        } else {
            worker.run(task.definition, (error, result) => {
                if (error) {
                    task.reject(error);
                } else {
                    task.resolve(result);
                }
                this.releaseWorker(worker);
            });
        }
    }

    private releaseWorker(worker: IWorkerThread): void {
        this.idleWorkers.push(worker);

        this.schedulePendingTasks();
    }
}
