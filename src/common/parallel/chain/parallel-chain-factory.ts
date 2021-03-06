import {PendingParallelChainState} from "./pending-parallel-chain-state";
import {ParallelChainImpl} from "./parallel-chain-impl";
import {IParallelEnvironment, IDefaultInitializedParallelOptions, IParallelOperation} from "../";
import {IParallelGenerator} from "../generator/parallel-generator";
import {IParallelChain} from "./parallel-chain";
import {ParallelEnvironmentDefinition} from "../parallel-environment-definition";

/**
 * Creates a new parallel chain
 * @param generator the generator to use to generate the input data and split the work
 * @param options the options to use
 * @param operations the operations to perform
 * @param TIn type of the elements generated by the generator
 * @param TOut type of the elements resulting from this parallel chain
 */
export function createParallelChain<TIn, TOut>(generator: IParallelGenerator, options: IDefaultInitializedParallelOptions, operations?: IParallelOperation[]): IParallelChain<TIn, IParallelEnvironment, TOut>;

/**
 * @param sharedEnv the available environment in the job
 */
export function createParallelChain<TIn, TEnv extends IParallelEnvironment, TOut>(generator: IParallelGenerator, options: IDefaultInitializedParallelOptions, sharedEnv: TEnv, operations?: IParallelOperation[]): IParallelChain<TIn, TEnv, TOut>;
export function createParallelChain<TIn, TEnv extends IParallelEnvironment, TOut>(generator: IParallelGenerator, options: IDefaultInitializedParallelOptions, sharedEnv?: TEnv | IParallelOperation[], operations: IParallelOperation[] = []): IParallelChain<TIn, TEnv, TOut> {
    let environment: TEnv | undefined;

    if (sharedEnv instanceof Array) {
        environment = undefined;
        operations = sharedEnv;
    } else {
        environment = sharedEnv;
    }

    const chain = new ParallelChainImpl(new PendingParallelChainState(generator, options, ParallelEnvironmentDefinition.of(), operations));
    return environment ? chain.inEnvironment(environment) : chain;
}
