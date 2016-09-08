import parallel from "../../src/browser/index";

describe("ParallelIntegration", function () {
     it("reduce waits for the result to be computed on the workers and returns the reduced value", function (done) {
         parallel
             .range(100)
             .reduce(0, (memo: number, value: number) => memo + value)
             .then(result => {
                 expect(result).toBe(4950);
                 done();
             });
     }, 10000);

    it("maps an input array to an output array", function (done) {
        const data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        parallel.from(data)
            .map(value => value ** 2)
            .result()
            .then(result => {
                expect(result).toEqual([0, 1, 4, 9, 16, 25, 36, 49, 64, 81]);
                done();
            });
    });
});