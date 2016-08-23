import {Task} from "../task/task";

/**
 * The thread pool is responsible for scheduling the work onto different workers. The thread pool defines
 * the used scheduling strategy.
 */
export interface ThreadPool {

    /**
     * Schedules the passed in function to be processed on an available worker. If no worker is available, then the
     * function is queued until another function completes and a worker is released.
     * @param func the function to execute on the worker. The function is executed in the context of a worker (no shared memory) and
     * therefore as limited access to global variables and the dom.
     */
    schedule<TResult>(func: (this: void) => TResult): Task<TResult>;
    schedule<TParam1, TResult>(func: (this: void, param1: TParam1) => TResult, param1: TParam1): Task<TResult>;
    schedule<TParam1, TParam2, TResult>(func: (this: void, param1: TParam1, param2: TParam2) => TResult, param1: TParam1, param2: TParam2): Task<TResult>;
    schedule<TParam1, TParam2, TParam3, TResult>(func: (this: void, param1: TParam1, param2: TParam2, param3: TParam3) => TResult, param1: TParam1, param2: TParam2, param3: TParam3): Task<TResult>;
    schedule<TParam1, TParam2, TParam3, TParam4, TResult>(func: (this: void, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4) => TResult, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4): Task<TResult>;
    schedule<TParam1, TParam2, TParam3, TParam4, TParam5, TResult>(func: (this: void, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5) => TResult, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5): Task<TResult>;
    schedule<TParam1, TParam2, TParam3, TParam4, TParam5, TParam6, TResult>(func: (this: void, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5, param6: TParam6) => TResult, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5, param6: TParam6): Task<TResult>;
    schedule<TParam1, TParam2, TParam3, TParam4, TParam5, TParam6, TParam7, TResult>(func: (this: void, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5, param6: TParam6, param7: TParam7) => TResult, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5, param6: TParam6, param7: TParam7): Task<TResult>;
    schedule<TParam1, TParam2, TParam3, TParam4, TParam5, TParam6, TParam7, TParam8, TResult>(func: (this: void, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5, param6: TParam6, param7: TParam7, param8: TParam8) => TResult, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5, param6: TParam6, param7: TParam7, param8: TParam8): Task<TResult>;
    schedule<TParam1, TParam2, TParam3, TParam4, TParam5, TParam6, TParam7, TParam8, TParam9, TResult>(func: (this: void, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5, param6: TParam6, param7: TParam7, param8: TParam8, param9: TParam9) => TResult, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5, param6: TParam6, param7: TParam7, param8: TParam8, param9: TParam9): Task<TResult>;
    schedule<TParam1, TParam2, TParam3, TParam4, TParam5, TParam6, TParam7, TParam8, TParam9, TParam10, TResult>(func: (this: void, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5, param6: TParam6, param7: TParam7, param8: TParam8, param9: TParam9, param10: TParam10) => TResult, param1: TParam1, param2: TParam2, param3: TParam3, param4: TParam4, param5: TParam5, param6: TParam6, param7: TParam7, param8: TParam8, param9: TParam9, param10: TParam10): Task<TResult>;
}