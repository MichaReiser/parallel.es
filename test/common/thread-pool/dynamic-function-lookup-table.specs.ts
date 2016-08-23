import {DynamicFunctionLookupTable} from "../../../src/common/thread-pool/dynamic-function-lookup-table";
describe("DynamicFunctionLookupTable", function () {
    function testFunction (x: number, y: number): void {
        console.log(x + y);
    }

    let lookupTable: DynamicFunctionLookupTable;

    beforeEach(function () {
        lookupTable = new DynamicFunctionLookupTable();
    });

    describe("getOrSetId", function () {
        it("returns a new id for a not yet registered function", function () {
            expect(lookupTable.getOrSetId(testFunction)).toBe(0);
        });

        it("returns the same id if the function is already registered", function () {
            // arrange
            const id = lookupTable.getOrSetId(testFunction);

            // act, assert
            expect(lookupTable.getOrSetId(testFunction)).toEqual(id);
        });

        it("returns the same id for the function with the exact same signature and body", function () {
            // arrange
            function testFunction2 (x: number, y: number): void {
                console.log(x + y);
            }

            const testFunctionId = lookupTable.getOrSetId(testFunction);

            // act, assert
            expect(lookupTable.getOrSetId(testFunction2)).toEqual(testFunctionId);
        });
    });

    describe("getDefinition", function () {
        it("returns undefined if the function with the given id is not registered", function () {
            expect(lookupTable.getDefinition(0)).toBeUndefined();
        });

        it("returns the function definition if a function with the given id is registered", function () {
            // arrange
            const id = lookupTable.getOrSetId(testFunction);

            // act
            const definition = lookupTable.getDefinition(id);

            // assert
            if (definition) {
                expect(definition.id).toEqual(id);
                expect(definition.argumentNames).toEqual(["x", "y"]);
                expect(definition.body).toContain("console.log(x + y)"); // Firefox adds a 'use strict' directive, the other browsers don't
            } else {
                fail("Definition not returned");
            }
        });
    });
});