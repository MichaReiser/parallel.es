import {PendingParallelChainState} from "./pending-parallel-chain-state";
import {ParallelChainImpl} from "./parallel-chain-impl";
import {IEmptyParallelEnvironment, IDefaultInitializedParallelOptions, IParallelOperation} from "../";
import {IParallelGenerator} from "../generator/parallel-generator";
import {IParallelChain} from "./parallel-chain";

/**
 * Creates a new parallel chain
 * @param generator the generator to use to generate the input data and split the work
 * @param options the options to use
 * @param operations the operations to perform
 */
export function createParallelChain<TIn, TOut>(generator: IParallelGenerator, options: IDefaultInitializedParallelOptions, operations?: IParallelOperation[]): IParallelChain<TIn, IEmptyParallelEnvironment, TOut>;

/**
 * @param sharedEnv the available environment in the job
 */
export function createParallelChain<TIn, TEnv extends IEmptyParallelEnvironment, TOut>(generator: IParallelGenerator, options: IDefaultInitializedParallelOptions, sharedEnv: TEnv, operations?: IParallelOperation[]): IParallelChain<TIn, TEnv, TOut>;
export function createParallelChain<TIn, TEnv extends IEmptyParallelEnvironment, TOut>(generator: IParallelGenerator, options: IDefaultInitializedParallelOptions, sharedEnv?: TEnv | IParallelOperation[], operations: IParallelOperation[] = []): IParallelChain<TIn, TEnv, TOut> {
    let environment: TEnv | undefined;

    if (sharedEnv instanceof Array) {
        environment = undefined;
        operations = sharedEnv;
    } else {
        environment = sharedEnv;
    }

    const chain = new ParallelChainImpl(new PendingParallelChainState(generator, options, undefined, operations));
    return environment ? chain.inEnvironment(environment) : chain;
}
