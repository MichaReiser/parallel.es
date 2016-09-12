import parallel from "../src/browser/index";
import {createMandelOptions, computeMandelbrotLine} from "./mandelbrot";

/* tslint:disable:no-console */
const mandelbrotCanvas = document.querySelector("#mandelbrot-canvas") as HTMLCanvasElement;
const mandelbrotContext = mandelbrotCanvas.getContext("2d");
const mandelbrotOptions = createMandelOptions(mandelbrotCanvas.width, mandelbrotCanvas.height, 10000);

function busyWait<T>(x: T): T {
    let i = 0;
    for (; i < 10 ** 8; ++i) {
        // nothing, just consume some cpu time and shorten your battery life.
    }
    return x;
}

const examples = {
    times() {
        console.log("times started");
        parallel.times(100, busyWait).result().then(result => console.log("Using times", result));
    }
};

document.querySelector("#mandelbrot-run-async").addEventListener("click", function (event) {
    event.preventDefault();

    mandelbrotContext!.putImageData(mandelbrotContext!.createImageData(mandelbrotCanvas.width, mandelbrotCanvas.height), 0, 0);
    const maxValuesPerWorker = parseInt((document.querySelector("#mandelbrot-values-per-task") as HTMLInputElement).value, 10);

    console.time("mandelbrot-async");
    parallel
        .range(0, mandelbrotOptions.imageHeight, 1, { maxValuesPerWorker })
        .environment(mandelbrotOptions)
        .map(computeMandelbrotLine)
        .result()
        .subscribe((lines, index, blockSize) => {
            for (let i = 0; i < lines.length; ++i) {
                mandelbrotContext!.putImageData(new ImageData(lines[i], mandelbrotOptions.imageWidth, 1), 0, index * blockSize + i);
            }
        })
        .then(() => console.timeEnd("mandelbrot-async"));
});

document.querySelector("#mandelbrot-run-sync").addEventListener("click", function () {
    const canvas = document.querySelector("#mandelbrot-canvas") as HTMLCanvasElement;
    const context = canvas.getContext("2d");

    context!.putImageData(context!.createImageData(canvas.width, canvas.height), 0, 0);

    setTimeout(() => {
        console.time("mandelbrot-sync");
        for (let y = 0; y < mandelbrotOptions.imageHeight; ++y) {
            const line = computeMandelbrotLine(y, mandelbrotOptions);
            context!.putImageData(new ImageData(line, mandelbrotOptions.imageWidth, 1), 0, y);
        }
        console.timeEnd("mandelbrot-sync");
    }, 0);

});

document.querySelector("#times-run").addEventListener("click", function () {
    examples.times();
});

document.querySelector("#all-run").addEventListener("click", function () {
    Object.keys(examples).forEach(example => (examples as any)[example]());
});

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
