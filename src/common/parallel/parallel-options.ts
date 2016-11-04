/**
 * @module parallel
 */
/** needed, typedoc issue */

import {IThreadPool} from "../thread-pool/thread-pool";
import {IParallelJobScheduler} from "./scheduling/parallel-job-scheduler";
import {FunctionCallSerializer} from "../function/function-call-serializer";

/**
 * Options that affect how a parallel operation is executed.
 */
export interface IParallelOptions {

    /**
     * Serializer used to serialize {@link FunctionCall}s
     */
    functionCallSerializer?: FunctionCallSerializer;

    /**
     * Maximum number of workers that can run in parallel (without blocking each other)
     */
    maxConcurrencyLevel?: number;

    /**
     * The minimum number of values assigned to a single task before the work is split and assigned another task
     */
    minValuesPerTask?: number;

    /**
     * The maximum number of values assigned to a single task. If the number of values exceed the maxValuesPerTask, an additional
     * task is created to process the values (until the values per Task are less then maxValuesPerTask)
     */
    maxValuesPerTask?: number;

    /**
     * The thread pool to use to schedule the tasks
     */
    threadPool?: IThreadPool;

    /**
     * The scheduler that should be used to determine the number of tasks to create.
     */
    scheduler?: IParallelJobScheduler;

    /**
     * Defines the max degree of parallelism to use for a scheduled job. The value defines in how many task the scheduler is allowed
     * to split the task at most relative to the {@link IParallelOptions.maxConcurrency}. If the value is equal to one, at most
     * as many tasks as {@link IParallelOptions.maxConcurrency} are created. If the value is larger than one, than {@link IParallelOptions.maxDegreeOfParallelism} as
     * many tasks are created (at most). Negative values or a value of zero is not allowed. If the value is in between (0, 1) than scheduler
     * guarantees that at least one task is created. If the value is undefined, the scheduler is free to choose the desired
     * degree of parallelism
     * @default undefined / unlimited
     */
    maxDegreeOfParallelism?: number;
}

/**
 * Initialized parallel options
 */
export interface IDefaultInitializedParallelOptions extends IParallelOptions {
    functionCallSerializer: FunctionCallSerializer;
    maxConcurrencyLevel: number;
    threadPool: IThreadPool;
    scheduler: IParallelJobScheduler;
}

const greaterThanZeroOptions = ["maxValuesPerTask", "minValuesPerTask", "maxConcurrencyLevel", "maxDegreeOfParallelism"];
export function validateOptions(options: IParallelOptions) {

    for (const optionName of greaterThanZeroOptions) {
        const optionValue = (options as {[name: string]: number | undefined })[optionName];
        if (typeof (optionValue) !== "undefined" && (typeof(optionValue) !== "number" || optionValue <= 0)) {
            throw new Error(`Illegal parallel options: ${optionName} (${optionValue}) must be number greater than zero`);
        }
    }

    if (typeof (options.minValuesPerTask) !== "undefined" && typeof(options.maxValuesPerTask) !== "undefined" && options.minValuesPerTask > options.maxValuesPerTask) {
        throw new Error(`Illegal parallel options: minValuesPerTask (${options.minValuesPerTask}) must be equal or less than maxValuesPerTask (${options.maxValuesPerTask}).`);
    }
}
