import {ThreadPool} from "./thread-pool";
import {WorkerThread} from "../worker/worker-thread";
import {TaskDefinition} from "../task/task-definition";
import {DynamicFunctionLookupTable} from "./dynamic-function-lookup-table";
import {WorkerThreadFactory} from "../worker/worker-thread-factory";
import {WorkerTask} from "../task/worker-task";
import {Task} from "../task/task";

/**
 * Default thread pool implementation that processes the scheduled functions in FIFO order.
 */
export class DefaultThreadPool implements ThreadPool {
    private workers: WorkerThread[] = [];
    private idleWorkers: WorkerThread[] = [];
    private queue: WorkerTask<any>[] = [];
    private lastTaskId = -1;
    private concurrencyLimit: number;

    constructor(private workerThreadFactory: WorkerThreadFactory, private functionLookupTable: DynamicFunctionLookupTable, options: { concurrencyLimit: number }) {
        this.concurrencyLimit = options.concurrencyLimit;
    }

    schedule<TResult>(func: (this: void, ...params: any[]) => TResult, ...params: any[]): Task<TResult> {
        const funcId = this.functionLookupTable.getOrSetId(func);
        const taskDefinition: TaskDefinition = { id: ++this.lastTaskId, functionId: funcId, params };
        const task = new WorkerTask<TResult>(taskDefinition);

        task.always(() => this._releaseWorker(task));

        this.queue.unshift(task);
        this._schedulePendingTasks();

        return task;
    }

    _releaseWorker(task: WorkerTask<any>): void {
        const worker = task.releaseWorker();
        this.idleWorkers.push(worker);

        this._schedulePendingTasks();
    }

    _schedulePendingTasks(): void {
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