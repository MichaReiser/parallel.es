import {computeMandelbrotLine, createMandelOptions, IMandelbrotOptions} from "./mandelbrot";
import parallel from "../src/browser/index";
import {
    IMonteCarloSimulationOptions, syncMonteCarlo, parallelMonteCarlo,
    IProject
} from "./monte-carlo";
import {syncKnightTours, parallelKnightTours} from "./knights-tour";
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

interface IPerformanceMeasurement {
    title: string;
    func: () => PromiseLike<number>;
}

function createAsyncMandelbrotMeasurements(mandelbrotOptions: IMandelbrotOptions, ...maxValuesPerWorkers: number[]) {
    const result: IPerformanceMeasurement[] = [];
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

function createMonteCarloMeasurements(options: IMonteCarloSimulationOptions, ...numberOfProjects: number[]) {
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

    const measurements: IPerformanceMeasurement[] = [];

    for (const projectCount of numberOfProjects) {
        measurements.push({
            title: `Montecarlo ${projectCount} sync`,
            func() {
                const runOptions = Object.assign(options, {
                    projects: createProjects(projectCount)
                });

                const start = performance.now();
                syncMonteCarlo(runOptions);
                return Promise.resolve(performance.now() - start);
            }
        }, {
            title: `Monte carlo ${projectCount} parallel`,
            func() {
                const runOptions = Object.assign(options, {
                    projects: createProjects(projectCount)
                });

                const start = performance.now();
                return parallelMonteCarlo(runOptions).then(() => performance.now() - start);
            }
        }
        );
    }

    return measurements;
}

function createKnightBoardMeasurements(boardSize: number, ...maxValuesPerWorker: number[]) {
    const measurements: IPerformanceMeasurement[] = [];

    measurements.push({
        title: `Knights Tour (${boardSize}x${boardSize}) sync`,
        func() {
            const start = performance.now();
            syncKnightTours(boardSize);
            return Promise.resolve(performance.now() - start);
        }
    });

    for (const maxValues of [undefined, ...maxValuesPerWorker]) {
        measurements.push({
            title: `Knights Tour (${boardSize}x${boardSize}, ${maxValues}) async`,
            func() {
                const start = performance.now();
                return parallelKnightTours(boardSize, { maxValuesPerWorker: maxValues })
                    .then(() => performance.now() - start);
            }
        });
    }

    return measurements;
}

function createExamples(): IPerformanceMeasurement[] {
    const mandelbrotHeight = parseInt((document.querySelector("#mandelbrot-height") as HTMLInputElement).value, 10);
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
        ...createAsyncMandelbrotMeasurements(mandelbrotOptions, 1, 75, 150, 300, 600, 1200),
        ...createMonteCarloMeasurements(monteCarloOptions, 1, 2, 4, 6, 8, 10, 15),
        ...createKnightBoardMeasurements(5, 1, 5, 10, 13)
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
