import parallel from "../src/browser/index";

/* tslint:disable:no-console */

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

function mandelbrot(imageWidth: number, imageHeight: number, iterations: number, callback: (slice: ImageData, yStart: number) => void) {
    interface ComplexNumber {
        real: number;
        i: number;
    }

    // X axis shows real numbers, y axis imaginary
    const min = { real: -2.0, i: -1.2 };
    const max = { real: 1.0, i: 0 };
    max.i = min.i + (max.real - min.real) * imageHeight / imageWidth;

    const scalingFactor = {
        real: (max.real - min.real) / (imageWidth - 1),
        i: (max.i - min.i) / (imageHeight - 1)
    };

    function coordinateToComplex({ x, y }: { x: number, y: number }): ComplexNumber {
        return {
            real: min.real + x * scalingFactor.real,
            i: max.i - y * scalingFactor.i
        };
    }

    function calculateZ(c: ComplexNumber): { z: ComplexNumber, n: number } {
        const z = { real: c.real, i: c.i };
        let n = 0;

        for (; n < iterations; ++n) {
            if (z.real ** 2 + z.i ** 2 > 4) {
                break;
            }

            // z ** 2 + c
            const zI = z.i;
            z.i = 2 * z.real * z.i + c.i;
            z.real = z.real ** 2 - zI ** 2 + c.real;
        }

        return { z, n };
    }

    function fill(x: number, y: number, n: number, imageData: Uint8ClampedArray) {
        const base = (y * imageWidth + x) * 4;
        imageData[base] = n & 0xFF;
        imageData[base + 1] = n & 0xFF00;
        imageData[base + 2] = n & 0xFF0000;
        imageData[base + 3] = 255;
    }

    function calculateArea(yStart: number, yEnd: number): Uint8ClampedArray {
        const area = new Uint8ClampedArray(imageWidth * (yEnd - yStart) * 4);

        for (let y = yStart; y < yEnd; ++y) {
            for (let x = 0; x < imageWidth; ++x) {
                const c = coordinateToComplex({ x, y: y });
                const { n } = calculateZ(c);

                fill(x, y - yStart, n, area);
            }
        }

        return area;
    }

    const blocks = 10;
    const blockSize = Math.ceil(imageHeight / blocks);

    for (let block = 0; block < blocks; ++block) {
        const yStart = block * blockSize;
        const yEnd = Math.min(yStart + blockSize, imageHeight);

        const data = calculateArea(yStart, yEnd);
        const imageData = new ImageData(data, imageWidth, yEnd - yStart);

        callback(imageData, yStart);
    }
}


document.querySelector("#mandelbrot-run-async").addEventListener("click", function () {
    const canvas = document.querySelector("#mandelbrot-canvas") as HTMLCanvasElement;
    const context = canvas.getContext("2d");

    context!.putImageData(context!.createImageData(canvas.width, canvas.height), 0, 0);

    parallel
        .times(10, i => {
            return { yStart: i * 102, yEnd: (i + 1) * 102 };
        })
        .map(block => {

            // needs parameter support.
        });

    setTimeout(() => {
        mandelbrot(canvas.width, canvas.height, 30000, (slice, yStart) => context!.putImageData(slice, 0, yStart));
    }, 0);

});

document.querySelector("#mandelbrot-run-sync").addEventListener("click", function () {
    const canvas = document.querySelector("#mandelbrot-canvas") as HTMLCanvasElement;
    const context = canvas.getContext("2d");

   context!.putImageData(context!.createImageData(canvas.width, canvas.height), 0, 0);

    setTimeout(() => {
        mandelbrot(canvas.width, canvas.height, 30000, (slice, yStart) => context!.putImageData(slice, 0, yStart));
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
