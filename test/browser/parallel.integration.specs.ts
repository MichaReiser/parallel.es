import parallel from "../../src/api/browser";

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
            .then(result => {
                expect(result).toEqual([0, 1, 4, 9, 16, 25, 36, 49, 64, 81]);
                done();
            });
    });

    it("rejects the promise if the function id is not know", function (done) {
        parallel.from([1, 2, 3])
            .map({
                _______isFunctionId: true,
                identifier: "unknown-1"
            })
            .then(() => done.fail())
            .catch((error: any) => {
                expect(error.message).toMatch(/The function ids \[unknown-1] could not be resolved by slave \d\./);
                done();
            });
    });
});
