import parallel from "../src/browser/index";
import {IParallelOptions} from "../src/common/parallel/parallel-options";

interface IComplexNumber {
    i: number;
    real: number;
}

export interface IMandelbrotOptions {
    imageHeight: number;
    imageWidth: number;
    iterations: number;
    max: IComplexNumber;
    min: IComplexNumber;
    scalingFactor: IComplexNumber;
}

export function createMandelOptions(imageWidth: number, imageHeight: number, iterations: number): IMandelbrotOptions {
    // X axis shows real numbers, y axis imaginary
    const min = { i: -1.2, real: -2.0 };
    const max = { i: 0, real: 1.0 };
    max.i = min.i + (max.real - min.real) * imageHeight / imageWidth;

    const scalingFactor = {
        i: (max.i - min.i) / (imageHeight - 1),
        real: (max.real - min.real) / (imageWidth - 1)
    };

    return {
        imageHeight,
        imageWidth,
        iterations,
        max,
        min,
        scalingFactor
    };
}

export function computeMandelbrotLine(y: number, options: IMandelbrotOptions): Uint8ClampedArray {
    function calculateZ(c: IComplexNumber): { z: IComplexNumber, n: number } {
        const z = { i: c.i, real: c.real };
        let n = 0;

        for (; n < options.iterations; ++n) {
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

    const line = new Uint8ClampedArray(options.imageWidth * 4);
    const cI = options.max.i - y * options.scalingFactor.i;

    for (let x = 0; x < options.imageWidth; ++x) {
        const c = {
            i: cI,
            real: options.min.real + x * options.scalingFactor.real
        };

        const { n } = calculateZ(c);
        const base = x * 4;
        /* tslint:disable:no-bitwise */
        line[base] = n & 0xFF;
        line[base + 1] = n & 0xFF00;
        line[base + 2] = n & 0xFF0000;
        line[base + 3] = 255;
    }
    return line;
}

export function parallelMandelbrot(mandelbrotOptions: IMandelbrotOptions, options?: IParallelOptions) {
    return parallel
        .range(0, mandelbrotOptions.imageHeight, 1, options)
        .inEnvironment(mandelbrotOptions)
        .map(computeMandelbrotLine);
}

export function syncMandelbrot(mandelbrotOptions: IMandelbrotOptions, callback: (line: Uint8ClampedArray, y: number) => void) {
    for (let y = 0; y < mandelbrotOptions.imageHeight; ++y) {
        const line = computeMandelbrotLine(y, mandelbrotOptions);
        callback(line, y);
    }
}
