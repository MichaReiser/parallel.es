import {IParallelGenerator} from "../../../../src/common/parallel/generator/parallel-generator";
import {ParallelCollectionGenerator} from "../../../../src/common/parallel/generator/parallel-collection-generator";
import {IDefaultInitializedParallelOptions} from "../../../../src/common/parallel";
import {createParallelChain} from "../../../../src/common/parallel/chain/parallel-chain-factory";
import {IParallelChainState} from "../../../../src/common/parallel/chain/parallel-chain-state";
import {IParallelChain} from "../../../../src/common/parallel/chain/parallel-chain";
import {ParallelChainImpl} from "../../../../src/common/parallel/chain/parallel-chain-impl";
import {PendingParallelChainState} from "../../../../src/common/parallel/chain/pending-parallel-chain-state";
import {ParallelWorkerFunctionIds} from "../../../../src/common/parallel/slave/parallel-worker-functions";
import {FunctionCall} from "../../../../src/common/function/function-call";
import {ParallelEnvironmentDefinition} from "../../../../src/common/parallel/parallel-environment-definition";

describe("createParallelChain", function () {
    let generator: IParallelGenerator;
    let options: IDefaultInitializedParallelOptions;

    beforeEach(function () {
        generator = new ParallelCollectionGenerator([1, 2, 3, 4]);
        options = {
            functionCallSerializer: undefined as any,
            maxConcurrencyLevel: 2,
            scheduler: undefined as any,
            threadPool: undefined as any
        };
    });

    it("uses the third parameter as operations if it is an array", function () {
        // arrange
        const operations = [{
            iteratee: (value: number) => value * 2,
            iterator: ParallelWorkerFunctionIds.MAP,
            iteratorParams: []
        }];

        // act
        const chain = createParallelChain(generator, options, operations);
        const state = getChainState(chain);

        // assert
        expect(state).toEqual(jasmine.any(PendingParallelChainState));
        const pendingState = state as PendingParallelChainState<number>;

        expect(pendingState.generator).toEqual(jasmine.any(ParallelCollectionGenerator));
        expect(pendingState.options).toEqual(options);
        expect(pendingState.environment).toEqual(ParallelEnvironmentDefinition.of());
        expect(pendingState.operations).toEqual(operations);
    });

    it("it uses the third parameter as environment if it is not an array", function () {
        // arrange
        const env = ParallelEnvironmentDefinition.of({ test: 10 });

        const operations = [{
            iteratee: FunctionCall.createUnchecked((value: number) => value * 2),
            iterator: FunctionCall.create(ParallelWorkerFunctionIds.MAP)
        }];

        // act
        const chain = createParallelChain(generator, options, { test: 10 }, operations);
        const state = getChainState(chain);

        // assert
        expect(state).toEqual(jasmine.any(PendingParallelChainState));
        const pendingState = state as PendingParallelChainState<number>;

        expect(pendingState.generator).toEqual(jasmine.any(ParallelCollectionGenerator));
        expect(pendingState.options).toEqual(options);
        expect(pendingState.environment).toEqual(env);
        expect(pendingState.operations).toEqual(operations);
    });
});

function getChainState<TIn, TEnv, TOut>(chain: IParallelChain<TIn, TEnv, TOut>): IParallelChainState<TOut> {
    expect(chain).toEqual(jasmine.any(ParallelChainImpl));

    return (chain as ParallelChainImpl<TIn, TEnv, TOut>).state;
}
