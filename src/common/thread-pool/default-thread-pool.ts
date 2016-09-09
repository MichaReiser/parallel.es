import {ThreadPool} from "./thread-pool";
import {WorkerThread} from "../worker/worker-thread";
import {TaskDefinition} from "../task/task-definition";
import {FunctionRegistry} from "../serialization/function-registry";
import {WorkerThreadFactory} from "../worker/worker-thread-factory";
import {WorkerTask} from "../task/worker-task";
import {Task} from "../task/task";
import {FunctionCallSerializer} from "../serialization/function-call-serializer";

/**
 * Default thread pool implementation that processes the scheduled functions in FIFO order.
 */
export class DefaultThreadPool implements ThreadPool {
    private workers: WorkerThread[] = [];
    private idleWorkers: WorkerThread[] = [];
    private queue: WorkerTask<any>[] = [];
    private lastTaskId = -1;
    private concurrencyLimit: number;

    constructor(private workerThreadFactory: WorkerThreadFactory, private functionLookupTable: FunctionRegistry, options: { maxConcurrencyLevel: number }) {
        this.concurrencyLimit = options.maxConcurrencyLevel;
    }

    public schedule<TResult>(func: (this: void, ...params: any[]) => TResult, ...params: any[]): Task<TResult> {
        const serializer = this.createFunctionSerializer();
        const serializedFunc = serializer.serializeFunctionCall(func, ...params);
        const taskDefinition: TaskDefinition = { main: serializedFunc, usedFunctionIds: serializer.serializedFunctionIds };
        return this.scheduleTask(taskDefinition);
    }

    public scheduleTask<TResult>(taskDefinition: TaskDefinition): Task<TResult> {
        taskDefinition.id = ++this.lastTaskId;
        const task = new WorkerTask<TResult>(taskDefinition);

        task.always(() => this._releaseWorker(task));

        this.queue.unshift(task);
        this._schedulePendingTasks();

        return task;
    }

    public createFunctionSerializer(): FunctionCallSerializer {
        return new FunctionCallSerializer(this.functionLookupTable);
    }

    private _releaseWorker(task: WorkerTask<any>): void {
        const worker = task.releaseWorker();
        this.idleWorkers.push(worker);

        this._schedulePendingTasks();
    }

    private _schedulePendingTasks(): void {
        while (this.queue.length) {
            let worker: WorkerThread | undefined;
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
            task.runOn(worker);
        }
    }
}
