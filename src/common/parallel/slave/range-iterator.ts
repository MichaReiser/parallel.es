import {AbstractFastIterator} from "../../util/abstract-fast-iterator";
import {IFastIterator} from "../../util/fast-iterator";

class RangeIterator extends AbstractFastIterator<number> {
    private nextValue: number;
    private length: number;

    constructor(start: number, end: number, private step: number) {
        super();
        const distance = end - start;
        this.length = Math.max(Math.floor(distance / (step || 1)), 0);
        this.nextValue = start;
    }

    protected computeNext(): number | undefined {
        if (this.length-- <= 0) {
            return this.endOfData();
        }

        const current = this.nextValue;
        this.nextValue = current + this.step;
        return current;
    }
}

/**
 * Generator function that creates an iterator containing all elements in the range [start, end) with a step size of step.
 * @param start start value of the range (inclusive)
 * @param end end value of the range (exclusive)
 * @param step step size between two values
 * @returns iterator with the values [start, end)
 */
export function rangeIterator(start: number, end: number, step: number): IFastIterator<number> {
    return new RangeIterator(start, end, step);
}
