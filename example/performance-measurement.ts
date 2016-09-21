import { createMandelOptions, IMandelbrotOptions, parallelMandelbrot, syncMandelbrot } from "./mandelbrot";
import { IMonteCarloSimulationOptions, syncMonteCarlo, parallelMonteCarlo, IProject } from "./monte-carlo";
import {syncKnightTours, parallelKnightTours} from "./knights-tour";
const runButton = document.querySelector("#run") as HTMLInputElement;
const outputTable = document.querySelector("#output-table") as HTMLTableElement;
const numberOfRunsField = document.querySelector("#number-of-runs") as HTMLInputElement;
const jsonOutputField = document.querySelector("#json-output") as HTMLElement;
const knightRunner6x6 = document.querySelector("#knight-runner-6-6") as HTMLInputElement;

interface IPerformanceMeasurement {
    title: string;
    func: () => PromiseLike<number>;
}

function createParallelMandelbrotMeasurements(mandelbrotOptions: IMandelbrotOptions, ...maxValuesPerTasks: number[]) {
    const result: IPerformanceMeasurement[] = [];
    for (const maxValuesPerTask of [undefined, ...maxValuesPerTasks]) {
        result.push({
            title: `Mandelbrot ${mandelbrotOptions.imageWidth}x${mandelbrotOptions.imageHeight}, ${mandelbrotOptions.iterations} parallel (${maxValuesPerTask})`,
            func() {
                const start = performance.now();
                return parallelMandelbrot(mandelbrotOptions, { maxValuesPerTask }).then(() => {
                        const end = performance.now();
                        return end - start;
                    });
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

function createKnightBoardMeasurements(...boardSizes: number[]) {
    const measurements: IPerformanceMeasurement[] = [];
    for (const boardSize of boardSizes) {
        measurements.push({
            title: `Knights Tour (${boardSize}x${boardSize}) sync`,
            func() {
                const start = performance.now();
                syncKnightTours({x: 0, y: 0}, boardSize);
                return Promise.resolve(performance.now() - start);
            }
        });

        measurements.push({
            title: `Knights Tour (${boardSize}x${boardSize}) parallel`,
            func() {
                const start = performance.now();
                return parallelKnightTours({x: 0, y: 0}, boardSize)
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

                syncMandelbrot(mandelbrotOptions, () => undefined);

                const end = performance.now();
                return Promise.resolve(end - start);
            }
        }
    ];

    const nightRunner = knightRunner6x6.checked ? [5, 6] : [5];

    return [
        ...result,
        ...createParallelMandelbrotMeasurements(mandelbrotOptions, 1, 75, 150, 300, 600, 1200),
        ...createMonteCarloMeasurements(monteCarloOptions, 1, 2, 4, 6, 8, 10, 15),
        ...createKnightBoardMeasurements(...nightRunner)
    ];
}

function measure() {
    const numberOfRuns = parseInt(numberOfRunsField.value, 10) || 10;

    function clearOutputTable() {
        while (outputTable.rows.length > 0) {
            outputTable.deleteRow(0);
        }
    }

    function createTableHeader () {
        const thead = outputTable.createTHead();
        const headerRow = thead.insertRow();

        const title = document.createElement("th");
        title.innerText = "Example / Round";
        headerRow.appendChild(title);

        for (let run = 0; run < numberOfRuns; ++run) {
            const runTitle = document.createElement("th");
            runTitle.innerText = run + 1 + "";
            headerRow.appendChild(runTitle);
        }

        const averageTitle = document.createElement("th");
        averageTitle.innerText = "average";
        headerRow.appendChild(averageTitle);
    }

    let resolve: { (): void } | undefined = undefined;
    let chain: PromiseLike<number> = new Promise((res) => {
        resolve = res;
    } );

    const results: any = {};

    clearOutputTable();
    createTableHeader();

    const body = outputTable.createTBody();
    const examples = createExamples();
    for (let i = 0; i < examples.length; ++i) {
        const example = examples[i];
        results[example.title] = [];
        const row = body.insertRow();
        row.insertCell().textContent = example.title;

        let total = 0;

        for (let run = 0; run < numberOfRuns; ++run) {
            chain = chain.then(() => {
                return example.func();
            }).then(time => {
                row.insertCell().textContent = time.toFixed(4);
                total += time;
                results[example.title].push(time);
                return time;
            });
        }

        chain = chain.then(() => {
            const average = total / numberOfRuns;
            row.insertCell().textContent = average.toFixed(4);
            return average;
        });
    }

    chain.then(() => {
        jsonOutputField.innerText = JSON.stringify(results, undefined, "  ");
    });

    // race!
    resolve!();
}

runButton.addEventListener("click", function (event: MouseEvent) {
    event.preventDefault();
    measure();
});
