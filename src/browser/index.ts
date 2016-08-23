
import {DefaultThreadPool} from "../common/thread-pool/default-thread-pool";
import {BrowserWorkerThreadFactory} from "./worker/browser-worker-thread-factory";
import {DynamicFunctionLookupTable} from "../common/thread-pool/dynamic-function-lookup-table";
import {ThreadPool} from "../common/thread-pool/thread-pool";

const functionLookupTable = new DynamicFunctionLookupTable();
const concurrencyLimit = (<any>window.navigator)["hardwareConcurrency"] || 4;
const threadPool = new DefaultThreadPool(new BrowserWorkerThreadFactory(functionLookupTable), functionLookupTable, {concurrencyLimit});

function fibonacci(x: number): number {
    this.info = x;
    if (x < 0) {
        return NaN;
    }

    function recFib(n: number): number {
        if (n === 1) { return 1; }
        if (n === 0) { return 0; }

        return recFib(n - 1) + recFib(n - 2);
    }

    return recFib(x);
}

/*console.profile("Sync");
const results: number[] = [];
for (let i = 0; i <= 40; ++i) {
    results.push(fibonacci(i));
}
console.profileEnd();
console.log("Sync completed", results); */

console.profile("Async");
const promises: Promise<number>[] = [];
for (let i = 0; i <= 40; ++i) {
    promises.push((threadPool as ThreadPool).schedule(fibonacci, i).catch(error => console.error("Computation failed", error)));
}

Promise.all(promises).then((results: number[]) => {
    console.profileEnd();
    console.log("All tasks completed");
    console.log(results, threadPool["workers"]);
});



export default threadPool;