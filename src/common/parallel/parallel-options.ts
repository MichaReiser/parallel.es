import {IThreadPool} from "../thread-pool/thread-pool";

export interface IParallelOptions {
    /**
     * Maximum number of workers that can run in parallel (without blocking each other)
     */
    maxConcurrencyLevel?: number;

    /**
     * The thread pool to use
     */
    threadPool?: IThreadPool;

    /**
     * The minimum number of values assigned to a single worker before another worker is created.
     */
    minValuesPerWorker?: number;

    /**
     * The maximum number of values assigned to a single worker
     */
    maxValuesPerWorker?: number;
}

export interface IDefaultInitializedParallelOptions extends IParallelOptions {
    maxConcurrencyLevel: number;
    threadPool: IThreadPool;
}
