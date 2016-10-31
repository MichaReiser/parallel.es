import {IFastIterator} from "./fast-iterator";

export const enum IteratorState {
    /**
     * Next element has been computed and is ready to be returned
     */
    READY,

    /**
     * NExt element has not yet been computed
     */
    NOT_READY,

    /**
     * Iterator has reached its end
     */
    DONE,

    /**
     * Computation of next element has failed
     */
    FAILED
}

/**
 * Basic Skeleton for a fast iterator inspired by https://github.com/google/guava/blob/master/guava/src/com/google/common/collect/AbstractIterator.java
 */
export abstract class AbstractFastIterator<T> implements IFastIterator<T> {
    private nextElement: T | undefined;
    private state: IteratorState = IteratorState.NOT_READY;

    public hasNext(): boolean {
        switch (this.state) {
            case IteratorState.DONE:
                return false;
            case IteratorState.READY:
                return true;
            default:
                return this.tryComputeNext();
        }
    }

    public next(): T {
        if (!this.hasNext()) {
            throw new Error("No such element");
        }

        this.state = IteratorState.NOT_READY;
        const result = this.nextElement!;
        this.nextElement = undefined;
        return result;
    }

    protected abstract computeNext(): T | undefined;

    protected endOfData(): undefined {
        this.state = IteratorState.DONE;
        return undefined;
    }

    private tryComputeNext(): boolean {
        this.state = IteratorState.FAILED as IteratorState; // hmm otherwise TS complains that failed cannot be compared to done... what ever
        this.nextElement = this.computeNext();

        if (this.state === IteratorState.DONE) {
            return false;
        }

        this.state = IteratorState.READY;
        return true;
    }
}
