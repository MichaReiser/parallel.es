import parallel from "../src/browser/index";

/*function fibonacci(x: number): number {
    this.info = x;
    if (x < 0) {
        return NaN;
    }

    function recFib(n) {
        if (n === 1) { return 1; }
        if (n === 0) { return 0; }

        return recFib(n - 1) + recFib(n - 2);
    }

    return recFib(x);
} */

/*const data: number[] = [];
 for (let i = 0; i < 40; ++i) {
 data.push(i);
 }

 Parallel.collection(data).map(fibonacci).value().then(result => console.log("Result", result)); */

function busyWait<T>(x: T): T {
    let i = 0;
    for (; i < Math.pow(10,  8); ++i) {
        // nothing
    }
    return x;
}

parallel
    .range(0, 99, 2)
    .map(busyWait)
    .reduce(0, (memo, value) => memo + value)
    .then(result => console.log("Using range: ", result));

parallel
    .times(100, busyWait)
    .result()
    .subscribe((next, index) => console.log(`Subresult ${index} of times`, next))
    .then(result => console.log("Using times", result));

/*console.profile("Sync");
 const results: number[] = [];
 for (let i = 0; i <= 40; ++i) {
 results.push(fibonacci(i));
 }
 console.profileEnd();
 console.log("Sync completed", results); */
/*
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


 */