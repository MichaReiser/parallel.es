import {computeMandelbrotLine, createMandelOptions, IMandelbrotOptions} from "./mandelbrot";
import parallel from "../src/browser/index";
const runButton = document.querySelector("#run") as HTMLInputElement;
const outputTable = document.querySelector("#output-table") as HTMLTableElement;

const iterations = 10;

function measureAsyncMandelbrot(options: IMandelbrotOptions, maxValuesPerWorker?: number) {
    const start = performance.now();
    return parallel
        .range(0, options.imageHeight, 1, { maxValuesPerWorker })
        .environment(options)
        .map(computeMandelbrotLine)
        .result()
        .then(() => {
            const end = performance.now();
            return end - start;
        });
}

interface IExample {
    title: string;
    func: () => PromiseLike<number>;
}

function createAsyncMandelbrotTasks(mandelbrotOptions: IMandelbrotOptions, ...maxValuesPerWorkers: number[]) {
    const result: IExample[] = [];
    for (const maxValuesPerWorker of [undefined, ...maxValuesPerWorkers]) {
        result.push({
            title: `Mandelbrot ${mandelbrotOptions.imageWidth}x${mandelbrotOptions.imageHeight}, ${mandelbrotOptions.iterations} async (${maxValuesPerWorker})`,
            func() {
                return measureAsyncMandelbrot(mandelbrotOptions, maxValuesPerWorker);
            }
        });
    }

    return result;
}

function createExamples(): IExample[] {
    const mandelbrotHeight = (document.querySelector("#mandelbrot-height") as HTMLInputElement).valueAsNumber;
    const mandelbrotWidth = (document.querySelector("#mandelbrot-width") as HTMLInputElement).valueAsNumber;
    const mandelbrotIterations = (document.querySelector("#mandelbrot-iterations") as HTMLInputElement).valueAsNumber;

    const mandelbrotOptions = createMandelOptions(mandelbrotWidth, mandelbrotHeight, mandelbrotIterations);

    const result = [
        {
            title: `Mandelbrot ${mandelbrotWidth}x${mandelbrotHeight}, ${mandelbrotIterations} sync`,
            func(): PromiseLike<number> {
                const start = performance.now();

                for (let y = 0; y < mandelbrotOptions.imageHeight; ++y) {
                    computeMandelbrotLine(y, mandelbrotOptions);
                }

                const end = performance.now();
                return Promise.resolve(end - start);
            }
        }
    ];

    return [...result, ...createAsyncMandelbrotTasks(mandelbrotOptions, 1, 75, 150, 300, 600, 1200)];
}

function measure() {
    let resolve: { (): void } | undefined = undefined;
    let chain: PromiseLike<number> = new Promise((res) => {
        resolve = res;
    } );

    while (outputTable.rows.length > 1) {
        outputTable.deleteRow(1);
    }

    const examples = createExamples();
    for (let i = 0; i < examples.length; ++i) {
        const example = examples[i];
        const row = outputTable.insertRow();
        row.insertCell().textContent = example.title;

        let total = 0;

        for (let run = 0; run < iterations; ++run) {
            chain = chain.then(() => {
                return example.func();
            }).then(time => {
                row.insertCell().textContent = time.toFixed(4);
                total += time;
                return time;
            });
        }

        chain = chain.then(() => {
            const average = total / iterations;
            row.insertCell().textContent = average.toFixed(4);
            return average;
        });
    }

    // race!
    resolve!();
}

runButton.addEventListener("click", measure);
