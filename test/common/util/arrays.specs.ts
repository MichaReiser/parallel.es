import {toIterator, toArray, flattenArray} from "../../../src/common/util/arrays";
describe("arrays", function () {
    describe("toIterator", function () {
        it("returns an iterator with a next method", function () {
            // arrange
            const iterator = toIterator([1, 2]);

            // assert
            expect(typeof iterator.next).toBe("function");
        });

        it("hasNext returns false for the first and any succeeding calls if the array contains no elements", function () {
            // arrange
            const iterator = toIterator([]);

            // assert
            expect(iterator.hasNext()).toBe(false);
            expect(iterator.hasNext()).toBe(false);
        });

        it("next returns the value if the iterator has not reached the end", function () {
            // arrange
            const iterator = toIterator([1, 2, 3]);

            // assert
            const first = iterator.next();
            const second = iterator.next();
            const third = iterator.next();

            expect(first).toBe(1);
            expect(second).toBe(2);
            expect(third).toBe(3);
            expect(iterator.hasNext()).toBe(false);
        });

        it("returns hasNext=false if the iterator has reached the end", function () {
            // arrange
            const iterator = toIterator([1, 2]);

            iterator.next();
            iterator.next();

            // assert
            expect(iterator.hasNext()).toBe(false);
        });
    });

    describe("toArray", function () {
        it("converts an empty iterator to an empty array", function () {
            // arrange
            const iterator = { hasNext() { return false; }, next() { return null; } };

            // assert
            expect(toArray(iterator)).toEqual([]);
        });

        it("converts a non empty iterator to an array containing the elements in the same order", function () {
            // arrange
            let i = 0;
            const iterator: Iterator<number> = {
                hasNext() {
                    return i < 3;
                },
                next() {
                    return ++i;
                }
            };

            // assert
            expect(toArray(iterator)).toEqual([1, 2, 3]);
        });
    });

    describe("flattenArray", function () {
        it("returns an empty array for an empty array", function () {
            expect(flattenArray([])).toEqual([]);
        });

        it("returns the the content of the first sub array if the array has length 1", function () {
            expect(flattenArray([[1, 2]])).toEqual([1, 2]);
        });

        it("returns the sub arrays concatenated", function () {
            expect(flattenArray([[1, 2], [3, 4]])).toEqual([1, 2, 3, 4]);
        });
    });
});
