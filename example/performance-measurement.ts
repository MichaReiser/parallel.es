import {computeMandelbrotLine, createMandelOptions, IMandelbrotOptions} from "./mandelbrot";
import parallel from "../src/browser/index";
import {
    IMonteCarloSimulationOptions, syncMonteCarlo, parallelMonteCarlo,
    IProject
} from "./monte-carlo";
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

function createMontecarloExamples(options: IMonteCarloSimulationOptions, ...numberOfProjects: number[]) {
    function createProjects(count: number): IProject[] {
        const projects: IProject[] = [];

        for (let i = 0; i < count; ++i) {
            projects.push({
                startYear: Math.round(Math.random() * 15),
                totalAmount: Math.round(Math.random() * 100000)
            });
        }

        return projects;
    }

    const examples: IExample[] = [];

    for (const projectCount of numberOfProjects) {
        const runOptions = Object.assign(options, {
            projects: createProjects(projectCount)
        });
        examples.push({
            title: `Montecarlo ${projectCount} sync`,
            func() {
                const start = performance.now();
                syncMonteCarlo(runOptions);
                return Promise.resolve(performance.now() - start);
            }
        }, {
            title: `Monte carlo ${projectCount} parallel`,
            func() {
                const start = performance.now();
                return parallelMonteCarlo(runOptions).then(complet => performance.now() - start);
            }
        }
        );
    }

    return examples;
}

function createExamples(): IExample[] {
    const mandelbrotHeight = parseInt((document.querySelector("#mandelbrot-height") as HTMLInputElement).value, 10)
    const mandelbrotWidth = parseInt((document.querySelector("#mandelbrot-width") as HTMLInputElement).value, 10);
    const mandelbrotIterations = parseInt((document.querySelector("#mandelbrot-iterations") as HTMLInputElement).value, 10);

    const mandelbrotOptions = createMandelOptions(mandelbrotWidth, mandelbrotHeight, mandelbrotIterations);

    const monteCarloOptions = {
        investmentAmount: 620000,
        numRuns: 10000,
        numYears: 15,
        performance: 0.0340000,
        seed: 10,
        volatility: 0.0896000
    };

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

    return [
        ...result,
        ...createAsyncMandelbrotTasks(mandelbrotOptions, 1, 75, 150, 300, 600, 1200),
        ...createMontecarloExamples(monteCarloOptions, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    ];
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
