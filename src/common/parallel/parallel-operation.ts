import {ISerializedFunctionCall} from "../function/serialized-function-call";
import {IFunctionId} from "../function/function-id";

/**
 * Single parallel operation to perform
 */
export interface IParallelOperation {
    /**
     * Iteratee that should be invoked for each element
     */
    readonly iteratee: Function;

    /**
     * Iterator function that applies the iteratee to each element and creates a new iterator
     */
    readonly iterator: IFunctionId;

    /**
     * Parameters that should be passed to the iterator function
     */
    readonly iteratorParams: any[];
}

/**
 * Serialized representation of a parallel operation
 */
export interface ISerializedParallelOperation {
    /**
     * The iteratee function that should be called for each element
     */
    readonly iteratee: ISerializedFunctionCall;

    /**
     * The iterator that applies the iteratee for each element and creates a new iterator
     */
    readonly iterator: ISerializedFunctionCall;
}
