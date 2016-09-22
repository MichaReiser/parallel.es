/**
 * @module parallel
 */
/** needed, typedoc issue */

import {ITask} from "../task/task";
import {ITaskDefinition} from "../task/task-definition";
import {FunctionCallSerializer} from "../function/function-call-serializer";
import {IFunctionId} from "../function/function-id";

/**
 * The thread pool is responsible for distributing the scheduled tasks onto different workers. The thread pool defines how the
 * queued tasks are scheduled onto the available workers and how many workers are created.
 */
export interface IThreadPool {

    /**
     * Schedules the passed in function on an available worker. If no worker is available, then the
     * function is queued until another task completes and therefore a worker is released.
     * @param func the function to execute on the worker. The function is executed in the context of a worker (no shared memory) and
     * therefore as limited access to global variables and the dom.
     * @param TResult the type of the result returned by the scheduled function
     * @returns the scheduled task.
     */
    schedule<TResult>(func: (this: void) => TResult): ITask<TResult>;

    /**
     * @param param1 sole parameter that is passed to the function
     * @param TParam1 type of the parameter passed to the function
     */
    schedule<TParam1, TResult>(func: (this: void, param1: TParam1) => TResult, param1: TParam1): ITask<TResult>;

    /**
     * @param param1 the first parameter that is passed to the scheduled function
     * @param TParam1 type of the first parameter
     * @param param2 the second parameter that is passed to the scheduled function
     * @param TParam2 type of the second function parameter
     */
    schedule<TParam1, TParam2, TResult>(func: (this: void, param1: TParam1, param2: TParam2) => TResult, param1: TParam1, param2: TParam2): ITask<TResult>;

    /**
     * @param param1 the first parameter that is passed to the scheduled function
     * @param TParam1 type of the first parameter
     * @param param2 the second parameter that is passed to the scheduled function
     * @param TParam2 type of the second function parameter
     * @param param3 the third parameter that is passed to the scheduled function
     * @param TParam3 type of the third function parameter
     */
    schedule<TParam1, TParam2, TParam3, TResult>(func: (this: void, param1: TParam1, param2: TParam2, param3: TParam3) => TResult, param1: TParam1, param2: TParam2, param3: TParam3): ITask<TResult>;

    /**
     * @param param1 the first parameter that is passed to the scheduled function
     * @param TParam1 type of the first parameter
     * @param param2 the second parameter that is passed to the scheduled function
     * @param TParam2 type of the second function parameter
     * @param param3 the third parameter that is passed to the scheduled function
     * @param TParam3 type of the third function parameter
     * @param param4 the fourth parameter that is passed to the scheduled function
     * @param TParam4 type of the fourth function parameter
     */
    schedule<TParam1, TParam2, TParam3, TParam4, TResult>(func: (this: void, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4) => TResult, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4): ITask<TResult>;

    /**
     * @param param1 the first parameter that is passed to the scheduled function
     * @param TParam1 type of the first parameter
     * @param param2 the second parameter that is passed to the scheduled function
     * @param TParam2 type of the second function parameter
     * @param param3 the third parameter that is passed to the scheduled function
     * @param TParam3 type of the third function parameter
     * @param param4 the fourth parameter that is passed to the scheduled function
     * @param TParam4 type of the fourth function parameter
     * @param param5 the fifth parameter that is passed to the scheduled function
     * @param TParam5 type of the fifth function parameter
     */
    schedule<TParam1, TParam2, TParam3, TParam4, TParam5, TResult>(func: (this: void, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5) => TResult, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5): ITask<TResult>;

    /**
     * @param param1 the first parameter that is passed to the scheduled function
     * @param TParam1 type of the first parameter
     * @param param2 the second parameter that is passed to the scheduled function
     * @param TParam2 type of the second function parameter
     * @param param3 the third parameter that is passed to the scheduled function
     * @param TParam3 type of the third function parameter
     * @param param4 the fourth parameter that is passed to the scheduled function
     * @param TParam4 type of the fourth function parameter
     * @param param5 the fifth parameter that is passed to the scheduled function
     * @param TParam5 type of the fifth function parameter
     * @param param6 the sixth parameter that is passed to the scheduled function
     * @param TParam6 type of the sixth function parameter
     */
    schedule<TParam1, TParam2, TParam3, TParam4, TParam5, TParam6, TResult>(func: (this: void, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5, param6: TParam6) => TResult, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5, param6: TParam6): ITask<TResult>;

    /**
     * @param param1 the first parameter that is passed to the scheduled function
     * @param TParam1 type of the first parameter
     * @param param2 the second parameter that is passed to the scheduled function
     * @param TParam2 type of the second function parameter
     * @param param3 the third parameter that is passed to the scheduled function
     * @param TParam3 type of the third function parameter
     * @param param4 the fourth parameter that is passed to the scheduled function
     * @param TParam4 type of the fourth function parameter
     * @param param5 the fifth parameter that is passed to the scheduled function
     * @param TParam5 type of the fifth function parameter
     * @param param6 the sixth parameter that is passed to the scheduled function
     * @param TParam6 type of the sixth function parameter
     * @param furtherParams further params that are passed to the scheduled function
     */
    schedule<TParam1, TParam2, TParam3, TParam4, TParam5, TParam6, TResult>(func: (this: void, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5, param6: TParam6, ...furtherParams: any[]) => TResult, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5, param6: TParam6, ...furtherParams: any[]): ITask<TResult>;

    /**
     * Schedules the function with the given id
     * @param func the id of the function
     * @param params the params to pass to the function
     */
    schedule<TResult>(func: IFunctionId, ...params: any[]): ITask<TResult>;

    /**
     * Schedules the passed in task definition onto an available worker or enqueues the task to be scheduled as soon as a worker gets available.
     * @param task the task to schedule
     */
    scheduleTask<TResult>(task: ITaskDefinition): ITask<TResult>;

    /**
     * returns the function serializer that can be used to serialize function calls.
     * @returns a new function serializer
     */
    getFunctionSerializer(): FunctionCallSerializer;
}
