import {toArray} from "../../../../src/common/util/arrays";
import {rangeIterator} from "../../../../src/common/parallel/slave/range-iterator";

describe("rangeIterator", function () {
    it("returns an iterator containing the elements from start up to end (exclusive) increasing by step", function () {
        // arrange
        const iterator = rangeIterator(10, 20, 2);

        // act, assert
        expect(toArray(iterator)).toEqual([10, 12, 14, 16, 18]);
    });
});
