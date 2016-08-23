import WorkerThread from "./worker-thread";

/**
 * Factory that spawns new threads. Abstracts the actual environment (node or browser).
 */
export interface WorkerThreadFactory {
    /**
     * Spawns a new worker thread
     */
    spawn(): WorkerThread;
}