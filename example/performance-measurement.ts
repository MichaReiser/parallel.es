import * as _ from "lodash";
/* tslint:disable:no-var-requires */
import * as benchmark from "benchmark";
const platform = require("platform");
/* tslint:enable:no-var-requires */

import { createMandelOptions, parallelMandelbrot, syncMandelbrot } from "./mandelbrot";
import { IMonteCarloSimulationOptions, syncMonteCarlo, parallelMonteCarlo, IProject } from "./monte-carlo";
import {syncKnightTours, parallelKnightTours} from "./knights-tour";

let Benchmark = (benchmark as any).runInContext({ _ });
(window as any).Benchmark = Benchmark;

const runButton = document.querySelector("#run") as HTMLInputElement;
const outputTable = document.querySelector("#output-table") as HTMLTableElement;
const jsonOutputField = document.querySelector("#json-output") as HTMLElement;
const knightRunner6x6 = document.querySelector("#knight-runner-6-6") as HTMLInputElement;

type Deferred = { resolve: () => void, reject: () => void };

function addKnightBoardTests(suite: benchmark.Suite) {
    const boardSizes = knightRunner6x6.checked ? [5, 6] : [5];

    for (const boardSize of boardSizes) {
        suite.add(`Knights Tour (${boardSize}x${boardSize}) sync`, function () {
            syncKnightTours({x: 0, y: 0}, boardSize);
        });

        suite.add(`Knights Tour (${boardSize}x${boardSize}) parallel`, function (deferred: Deferred) {
            parallelKnightTours({x: 0, y: 0}, boardSize).then(() => deferred.resolve(), () => deferred.reject());
        }, { defer: true });
    }
}

function addMonteCarloTest(suite: benchmark.Suite, options: IMonteCarloSimulationOptions, numberOfProjects: number) {
    const runOptions = Object.assign(options, {
        projects: createProjects(numberOfProjects)
    });

    suite.add(`Montecarlo ${numberOfProjects} sync`, function () {
        syncMonteCarlo(options);
    });

    suite.add(`Monte carlo ${numberOfProjects} parallel`,
        function (deferred: Deferred) {
            return parallelMonteCarlo(runOptions).then(() => deferred.resolve(), () => deferred.reject());
        }, { defer: true }
    );
}

function addMonteCarloTests(suite: benchmark.Suite) {
    const monteCarloOptions = {
        investmentAmount: 620000,
        numRuns: 10000,
        numYears: 15,
        performance: 0.0340000,
        seed: 10,
        volatility: 0.0896000
    };

    for (const numberOfProjects of  [1, 2, 4, 6, 8, 10, 15]) {
        addMonteCarloTest(suite, monteCarloOptions, numberOfProjects);
    }
}

function addMandelbrotTests(suite: benchmark.Suite) {
    const mandelbrotHeight = parseInt((document.querySelector("#mandelbrot-height") as HTMLInputElement).value, 10);
    const mandelbrotWidth = parseInt((document.querySelector("#mandelbrot-width") as HTMLInputElement).value, 10);
    const mandelbrotIterations = parseInt((document.querySelector("#mandelbrot-iterations") as HTMLInputElement).value, 10);

    const mandelbrotOptions = createMandelOptions(mandelbrotWidth, mandelbrotHeight, mandelbrotIterations);

    suite.add(`Mandelbrot ${mandelbrotWidth}x${mandelbrotHeight}, ${mandelbrotIterations} sync`, function () {
        syncMandelbrot(mandelbrotOptions, () => undefined);
    });

    for (const maxValuesPerTask of [undefined, 1, 75, 150, 300, 600, 1200]) {
        const title = `Mandelbrot ${mandelbrotOptions.imageWidth}x${mandelbrotOptions.imageHeight}, ${mandelbrotOptions.iterations} parallel (${maxValuesPerTask})`;
        suite.add(title, function (deferred: Deferred) {
            return parallelMandelbrot(mandelbrotOptions, { maxValuesPerTask }).then(() => deferred.resolve(), () => deferred.reject());
        }, { defer: true });
    }
}

function measure() {
    const suite = new Benchmark.Suite();

    addMonteCarloTests(suite);
    addMandelbrotTests(suite);
    addKnightBoardTests(suite);

    suite.on("cycle", function (event: benchmark.Event) {
        appendTestResults(event);
    });
    suite.on("complete", function (event: benchmark.Event) {
        const benchmarks = (event.currentTarget as Array<benchmark>).map((benchmark: benchmark & {name: string }) => {
            return {
                info: benchmark.toString,
                name: benchmark.name,
                stats: benchmark.stats,
                times: benchmark.times
            };
        });

        jsonOutputField.textContent = JSON.stringify({ benchmarks, platform}, undefined, "    ");
        runButton.disabled = false;
    });
    suite.on("start", initResultTable);

    suite.run({async: true });
}

runButton.addEventListener("click", function (event: MouseEvent) {
    event.preventDefault();
    runButton.disabled = true;
    measure();
});

function initResultTable(event: benchmark.Event) {
    clearOutputTable();

    function clearOutputTable() {
        while (outputTable.tBodies.length > 0) {
            outputTable.removeChild(outputTable.tBodies[0]);
        }
    }

    const body = outputTable.createTBody();
    (event.currentTarget as Array<benchmark.Options>).forEach(suite => {
        const row = body.insertRow();
        row.insertCell().textContent = suite.name!;
        const columns = (outputTable.tHead.rows[0] as HTMLTableRowElement).cells.length;
        for (let i = 0; i < columns; ++i) {
            row.insertCell();
        }
    });
}

function appendTestResults(event: benchmark.Event) {
    const body = outputTable.tBodies[0] as HTMLTableSectionElement;
    const benchmark = event.target as (benchmark);
    const index = (event.currentTarget as Array<benchmark>).indexOf(benchmark);
    const row = body.rows[index] as HTMLTableRowElement;

    row.cells[1].textContent = benchmark.stats.deviation.toFixed(4);
    row.cells[2].textContent = benchmark.stats.mean.toFixed(4);
    row.cells[3].textContent = benchmark.stats.moe.toFixed(4);
    row.cells[4].textContent = benchmark.stats.rme.toFixed(4);
    row.cells[5].textContent = benchmark.stats.sem.toFixed(4);
    row.cells[6].textContent = benchmark.stats.variance.toFixed(4);
    row.cells[7].textContent = benchmark.stats.sample.length.toFixed(0);
    row.cells[8].textContent = benchmark.hz.toFixed(4);
}

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
