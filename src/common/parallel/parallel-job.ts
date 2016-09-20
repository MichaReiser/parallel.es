/**
 * @module parallel
 */
/** needed, typedoc issue */

import {IParallelOperation, IEmptyParallelEnvironment, IDefaultInitializedParallelOptions} from "./";
import {FunctionCall} from "../function/function-call";
import {IParallelGenerator} from "./generator/parallel-generator";

/**
 * A parallel job that is to be scheduled
 */
export interface IParallelJob {
    /**
     * The generator that creates the initial sequence to process
     */
    generator: IParallelGenerator;

    /**
     * The operations to perform on the sequence elements
     */
    operations: IParallelOperation[];

    /**
     * The environment in which the operations are performed
     */
    environment?: FunctionCall | IEmptyParallelEnvironment;

    /**
     * The options defining how the job is to be scheduled.
     */
    options: IDefaultInitializedParallelOptions;
}
