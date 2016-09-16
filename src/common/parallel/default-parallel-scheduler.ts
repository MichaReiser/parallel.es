import {IParallelScheduler, IParallelTaskScheduling} from "./parallel-scheduler";
import {IDefaultInitializedParallelOptions} from "./parallel-options";

/**
 * Default implementation of a parallel scheduler.
 * By default, creates as many tasks as the hardware concurrency allows ({@link IParallelOptions.maxConcurrencyLevel}).
 *
 * If the options define {@link IParallelOptions.maxValuesPerTask} or {@link IParallelOptions.minValuesPerTask}, then the
 * values are adjusted accordingly.
 */
export class DefaultParallelScheduler implements IParallelScheduler {

    public getScheduling(totalNumberOfValues: number, options: IDefaultInitializedParallelOptions): IParallelTaskScheduling {
        let itemsPerTask = totalNumberOfValues / options.maxConcurrencyLevel;

        if (options.minValuesPerTask) {
            itemsPerTask = Math.min(Math.max(itemsPerTask, options.minValuesPerTask), totalNumberOfValues);
        }

        if (options.maxValuesPerTask) {
            itemsPerTask = Math.min(itemsPerTask, options.maxValuesPerTask);
        }

        return {
            numberOfTasks: itemsPerTask === 0 ? 0 : Math.round(totalNumberOfValues / itemsPerTask),
            valuesPerTask: Math.ceil(itemsPerTask)
        };
    }
}