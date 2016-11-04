import {IDefaultInitializedParallelOptions} from "../parallel-options";
import {AbstractParallelScheduler, IParallelTaskScheduling} from "./abstract-parallel-scheduler";

/**
 * Default implementation of a parallel scheduler.
 * By default, creates 4 times as many tasks as the hardware concurrency allows ({@link IParallelOptions.maxConcurrencyLevel}).
 *
 * If the options define {@link IParallelOptions.maxValuesPerTask} or {@link IParallelOptions.minValuesPerTask}, then the
 * values are adjusted accordingly.
 */
export class DefaultParallelScheduler extends AbstractParallelScheduler {

    public getScheduling(totalNumberOfValues: number, options: IDefaultInitializedParallelOptions): IParallelTaskScheduling {
        let maxNumberOfTasks: number;

        if (options.maxDegreeOfParallelism) {
            maxNumberOfTasks = Math.ceil(options.maxConcurrencyLevel * options.maxDegreeOfParallelism);
        } else {
            maxNumberOfTasks = options.maxConcurrencyLevel * 4;
        }

        let itemsPerTask = totalNumberOfValues / maxNumberOfTasks;

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
