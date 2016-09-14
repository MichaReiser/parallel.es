import parallel from "../src/browser/index";
import {createMandelOptions, computeMandelbrotLine} from "./mandelbrot";
import {syncMonteCarlo, parallelMonteCarlo, IProjectResult} from "./monte-carlo";
import {syncKnightTours, parallelKnightTours} from "./knights-tour";

/* tslint:disable:no-console */
const mandelbrotCanvas = document.querySelector("#mandelbrot-canvas") as HTMLCanvasElement;
const mandelbrotContext = mandelbrotCanvas.getContext("2d");
const mandelbrotOptions = createMandelOptions(mandelbrotCanvas.width, mandelbrotCanvas.height, 10000);

const monteCarloOptions = {
    investmentAmount: 620000,
    numRuns: 10000,
    numYears: 15,
    performance: 0.0340000,
    projects: [
        {
            startYear: 0,
            totalAmount: 10000
        }, {
            startYear: 1,
            totalAmount: 10000
        }, {
            startYear: 2,
            totalAmount: 10000
        }, {
            startYear: 5,
            totalAmount: 50000
        }, {
            startYear: 15,
            totalAmount: 800000
        }
    ],
    seed: 10,
    volatility: 0.0896000
};
const monteCarloTable = document.querySelector("#montecarlo-table") as HTMLTableElement;

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
        .then(() => console.timeEnd("mandelbrot-async"), reason => console.error(reason));
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

document.querySelector("#montecarlo-run-sync").addEventListener("click", function () {
    console.time("montecarlo-sync");
    const result = syncMonteCarlo(monteCarloOptions);
    console.timeEnd("montecarlo-sync");
    paintMonteCarloResult(result);
    console.log(result);
});

document.querySelector("#montecarlo-run-parallel").addEventListener("click", function () {
    console.time("montecarlo-parallel");
    const chain = parallelMonteCarlo(monteCarloOptions);
    chain.then((result) => {
        console.timeEnd("montecarlo-parallel");
        paintMonteCarloResult(result);
        console.log(result);
    });
    chain.catch(error => console.error(error));
});

function paintMonteCarloResult(results: IProjectResult[]) {
    while (monteCarloTable.rows.length > 1) {
        monteCarloTable.deleteRow(1);
    }

    for (const result of results) {
        const row = monteCarloTable.insertRow();
        row.insertCell().innerText = result.project.startYear.toLocaleString();
        row.insertCell().innerText = result.project.totalAmount.toLocaleString();

        for (const groupName of ["green", "yellow", "gray", "red"]) {
            const group = result.groups.find(g => g.name === groupName);
            row.insertCell().innerText = group ? (group.percentage * 100).toFixed(2) : "-";
        }
    }
}

const knightBoardResult = document.querySelector("#knight-board-result") as HTMLParagraphElement;

document.querySelector("#knight-run-sync").addEventListener("click", function () {
    const boardSize = parseInt((document.querySelector("#knight-board-size")  as HTMLInputElement).value, 10);
    knightBoardResult.innerText = "Calculating...";

    setTimeout(() => {
        console.time("knight-run-sync");
        const solutions = syncKnightTours({ x: 0, y: 0}, boardSize);
        console.timeEnd("knight-run-sync");

        knightBoardResult.innerText = `Found ${solutions} solutions for ${boardSize}x${boardSize} board`;
    }, 0);
});

document.querySelector("#knight-run-parallel").addEventListener("click", function () {
    const boardSize = parseInt((document.querySelector("#knight-board-size")  as HTMLInputElement).value, 10);
    knightBoardResult.innerText = "Calculating...";

    console.time("knight-run-parallel");
    parallelKnightTours({ x: 0, y: 0}, boardSize)
        .then(solutions => {
            console.timeEnd("knight-run-parallel");
            knightBoardResult.innerText = `Found ${solutions} solutions for ${boardSize}x${boardSize} board`;
        }, (reason) => console.log(reason));
});
