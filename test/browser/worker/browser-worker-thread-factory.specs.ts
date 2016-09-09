import {BrowserWorkerThreadFactory} from "../../../src/browser/worker/browser-worker-thread-factory";
import {FunctionRegistry} from "../../../src/common/serialization/function-registry";
import {WorkerThread} from "../../../src/common/worker/worker-thread";
import {BrowserWorkerThread} from "../../../src/browser/worker/browser-worker-thread";

describe("BrowserWorkerThreadFactory", function () {
    let factory: BrowserWorkerThreadFactory;
    let workers: WorkerThread[];

    beforeEach(function () {
        factory = new BrowserWorkerThreadFactory(new FunctionRegistry());
        workers = [];
    });

    afterEach(function () {
        workers.forEach(worker => worker.stop());
    });

    describe("spawn", function () {
        it("Spawns a new web worker", function () {
            // act
            const worker = factory.spawn();
            workers.push(worker);

            // assert
            expect(worker).toBeDefined();
        });

        it("Assigns a unique id to each created worker", function () {
            // arrange
            const worker1 = factory.spawn() as BrowserWorkerThread;
            const worker2 = factory.spawn() as BrowserWorkerThread;
            workers.push(worker1, worker2);

            // assert
            expect(worker1.id).not.toBe(worker2.id);
        });
    });
});
