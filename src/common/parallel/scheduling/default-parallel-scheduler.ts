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
        let maxDegreeOfParallelism: number;

        if (options.maxDegreeOfParallelism) {
            maxDegreeOfParallelism = options.maxDegreeOfParallelism;
        } else {
            maxDegreeOfParallelism = options.maxConcurrencyLevel * 4;
        }

        let itemsPerTask = totalNumberOfValues / maxDegreeOfParallelism;

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
