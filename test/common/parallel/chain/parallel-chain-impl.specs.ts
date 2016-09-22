import {IParallelGenerator} from "../../../../src/common/parallel/generator/parallel-generator";
import {FunctionCall} from "../../../../src/common/function/function-call";
import {IDefaultInitializedParallelOptions} from "../../../../src/common/parallel";
import {ParallelCollectionGenerator} from "../../../../src/common/parallel/generator/parallel-collection-generator";
import {IParallelChainState} from "../../../../src/common/parallel/chain/parallel-chain-state";
import {ParallelChainImpl} from "../../../../src/common/parallel/chain/parallel-chain-impl";
import {IParallelChain} from "../../../../src/common/parallel/chain/parallel-chain";
import {ParallelStream} from "../../../../src/common/parallel/stream/parallel-stream-impl";
import {ParallelWorkerFunctionIds} from "../../../../src/common/parallel/slave/parallel-worker-functions";

describe("ParallelChainImpl", function () {
    let generator: IParallelGenerator;
    let options: IDefaultInitializedParallelOptions;
    let state: IParallelChainState<number>;
    let stateResolveSpy: jasmine.Spy;
    let chainOperationSpy: jasmine.Spy;
    let changeEnvironmentSpy: jasmine.Spy;

    beforeEach(function () {
        generator = new ParallelCollectionGenerator([1, 2, 3, 4, 5]);
        stateResolveSpy = jasmine.createSpy("state.resolve");
        chainOperationSpy = jasmine.createSpy("state.chainOperation");
        changeEnvironmentSpy = jasmine.createSpy("state.changeEnvironment");

        state = {
            chainOperation: chainOperationSpy,
            changeEnvironment: changeEnvironmentSpy,
            resolve: stateResolveSpy
        } as any;

        options = {
            maxConcurrencyLevel: 2,
            scheduler: undefined as any,
            threadPool: undefined as any
        };
    });

    describe("inEnvironment", function () {
        it("change the environment to the passed object hash", function () {
             // arrange
            const chain = new ParallelChainImpl(state);

            // act
            chain.inEnvironment({ test: 10 });

            // assert
            expect(changeEnvironmentSpy).toHaveBeenCalledWith({ test: 10 });
        });

        it("sets the environment of the chain to the passed in environment provider", function () {
            // arrange
            const chain = new ParallelChainImpl(state);
            const environmentProvider = (value: number) => ({ value });

            // act
            chain.inEnvironment(environmentProvider, 10);

            // assert
            expect(changeEnvironmentSpy).toHaveBeenCalledWith(FunctionCall.create(environmentProvider, 10));
        });
    });

    describe("map", function () {
        it("adds the map operation to the operations to perform", function () {
            // arrange
            const mapper = (value: number) => value * 2;
            const chain = new ParallelChainImpl(state);

            // act
            chain.map(mapper);

            // assert
            expect(chainOperationSpy).toHaveBeenCalledWith({
                iteratee: FunctionCall.createUnchecked(mapper),
                iterator: FunctionCall.create(ParallelWorkerFunctionIds.MAP)
            });
        });

        it("changes the state of the chain to the state returned by chainOperation", function () {
            // arrange
            const newState = {};
            let chain = new ParallelChainImpl(state);
            chainOperationSpy.and.returnValue(newState);

            // act, assert
            const mappedChain = chain.map(value => value * 2);

            // assert
            expect(getChainState(mappedChain)).toEqual(newState);
        });
    });

    describe("filter", function () {
        it("adds the filter operation to the operations to perform", function () {
            // arrange
            const filter = (value: number) => value % 2 === 0;
            let chain = new ParallelChainImpl(state);

            // act
            chain.filter(filter);

            // assert
            expect(chainOperationSpy).toHaveBeenCalledWith({
                iteratee: FunctionCall.createUnchecked(filter),
                iterator: FunctionCall.create(ParallelWorkerFunctionIds.FILTER)
            });
        });

        it("changes the state of the chain to the state returned by chainOperation", function () {
            // arrange
            const newState = {};
            let chain = new ParallelChainImpl(state);
            chainOperationSpy.and.returnValue(newState);

            // act, assert
            const filteredChain = chain.filter(value => value % 2 === 0);

            // assert
            expect(getChainState(filteredChain)).toEqual(newState);
        });
    });

    describe("reduce", function () {
        it("adds the reduce operation to the operations to perform", function () {
            // arrange
            const add = (memo: number, value: number) => memo + value;
            let chain = new ParallelChainImpl(state);

            const reducedStream = jasmine.createSpyObj("reducedStream", [ "then" ]);
            const resolvedState = { stream: reducedStream };
            const reducedState = { resolve: jasmine.createSpy("resolve").and.returnValue(resolvedState) };
            chainOperationSpy.and.returnValue(reducedState);
            spyOn(ParallelStream, "transform");

            // act
            chain.reduce(0, add);

            // assert
            expect(chainOperationSpy).toHaveBeenCalledWith({
                iteratee: FunctionCall.createUnchecked(add),
                iterator: FunctionCall.create(ParallelWorkerFunctionIds.REDUCE, 0)
            });
        });

        it("returns the default value if the tasks returned an empty array", function (done) {
            // arrange
            const add = (memo: number, value: number) => memo + value;
            let chain = new ParallelChainImpl(state);

            const reducedStream = jasmine.createSpyObj("reducedStream", [ "subscribe" ]);
            const resolvedState = { stream: reducedStream };
            const reducedState = { resolve: jasmine.createSpy("resolve").and.returnValue(resolvedState) };
            chainOperationSpy.and.returnValue(reducedState);

            // act, assert
            chain.reduce(55, add).then(result => {
                expect(result).toEqual(55);
                done();
            }, done.fail);

            // call then callback
            reducedStream.subscribe.calls.argsFor(0)[2].apply(undefined, [[]]);
        });

        it("returns the summed up value if the task returns values", function (done) {
            // arrange
            const add = (memo: number, value: number) => memo + value;
            let chain = new ParallelChainImpl(state);

            const reducedStream = jasmine.createSpyObj("reducedStream", [ "subscribe" ]);
            const resolvedState = { stream: reducedStream };
            const reducedState = { resolve: jasmine.createSpy("resolve").and.returnValue(resolvedState) };
            chainOperationSpy.and.returnValue(reducedState);

            // act, assert
            chain.reduce(55, add).then(result => {
                expect(result).toEqual(10 + 15);
                done();
            }, done.fail);

            // call then callback
            reducedStream.subscribe.calls.argsFor(0)[2].apply(undefined, [[10, 15]]);
        });
    });

    describe("then", function () {
        it("resolves the state", function () {
            // arrange
            const chain = new ParallelChainImpl(state);
            const stream = jasmine.createSpyObj("stream", ["then"]);
            stateResolveSpy.and.returnValue({ stream });

            // act
            chain.then(() => undefined);

            // assert
            expect(stateResolveSpy).toHaveBeenCalled();
        });

        it("registers the callbacks", function () {
            // arrange
            const chain = new ParallelChainImpl(state);
            const stream = jasmine.createSpyObj("stream", ["then"]);
            stateResolveSpy.and.returnValue({ stream });

            const success = () => undefined;
            const reject = () => undefined;

            // act
            chain.then(success, reject);

            // assert
            expect(stream.then).toHaveBeenCalledWith(success, reject);
        });
    });

    describe("catch", function () {
        it("resolves the state", function () {
            // arrange
            const chain = new ParallelChainImpl(state);
            const stream = jasmine.createSpyObj("stream", ["catch"]);
            stateResolveSpy.and.returnValue({ stream });

            // act
            chain.catch(() => undefined);

            // assert
            expect(stateResolveSpy).toHaveBeenCalled();
        });

        it("registers the callback", function () {
            // arrange
            const chain = new ParallelChainImpl(state);
            const stream = jasmine.createSpyObj("stream", ["catch"]);
            stateResolveSpy.and.returnValue({ stream });

            const reject = () => undefined;

            // act
            chain.catch(reject);

            // assert
            expect(stream.catch).toHaveBeenCalledWith(reject);
        });
    });

    describe("subscribe", function () {
        it("resolves the state", function () {
            // arrange
            const chain = new ParallelChainImpl(state);
            const stream = jasmine.createSpyObj("stream", ["subscribe"]);
            stateResolveSpy.and.returnValue({ stream });

            // act
            chain.subscribe(() => undefined);

            // assert
            expect(stateResolveSpy).toHaveBeenCalled();
        });

        it("registers the next, error and complete callbacks", function () {
            // arrange
            const chain = new ParallelChainImpl(state);
            const stream = jasmine.createSpyObj("stream", ["subscribe"]);
            stateResolveSpy.and.returnValue({ stream });

            const next = () => undefined;
            const error = () => undefined;
            const complete = () => undefined;

            // act
            chain.subscribe(next, error, complete);

            // assert
            expect(stream.subscribe).toHaveBeenCalledWith(next, error, complete);
        });
    });
});

function getChainState<TIn, TEnv, TOut>(chain: IParallelChain<TIn, TEnv, TOut>): IParallelChainState<TOut> {
    expect(chain).toEqual(jasmine.any(ParallelChainImpl));

    return (chain as ParallelChainImpl<TIn, TEnv, TOut>).state;
}
