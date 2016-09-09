import {FunctionRegistry} from "../../../src/common/serialization/function-registry";
import {staticFunctionRegistry} from "../../../src/common/serialization/static-function-registry";

/* tslint:disable:no-console */

describe("FunctionRegistry", function () {
    function testFunction (x: number, y: number): void {
        console.log(x + y);
    }

    let functionRegistry: FunctionRegistry;

    beforeEach(function () {
        functionRegistry = new FunctionRegistry();
    });

    describe("getOrSetId", function () {
        it("returns a new id for a not yet registered function", function () {
            expect(functionRegistry.getOrSetId(testFunction)).toBe(1000);
        });

        it("returns the same id if the function is already registered", function () {
            // arrange
            const id = functionRegistry.getOrSetId(testFunction);

            // act, assert
            expect(functionRegistry.getOrSetId(testFunction)).toEqual(id);
        });

        it("returns a new id for a function with a different signature or name", function () {
            // arrange
            function testFunction2 (x: number, y: number): void {
                console.log(x + y);
            }

            const testFunctionId = functionRegistry.getOrSetId(testFunction);

            // act, assert
            expect(functionRegistry.getOrSetId(testFunction2)).not.toEqual(testFunctionId);
        });

        it("returns the id of the static registered function if the passed function is contained in the static function registry", function () {
            // arrange
            const hasSpy = spyOn(staticFunctionRegistry, "has").and.returnValue(true);
            const getIdSpy = spyOn(staticFunctionRegistry, "getId").and.returnValue(1);

            // assert
            expect(functionRegistry.getOrSetId(testFunction)).toEqual(1);
            expect(hasSpy).toHaveBeenCalledWith(testFunction);
            expect(getIdSpy).toHaveBeenCalledWith(testFunction);
        });
    });

    describe("getDefinition", function () {
        it("returns undefined if the function with the given id is not registered", function () {
            expect(functionRegistry.getDefinition(1000)).toBeUndefined();
        });

        it("returns the function definition if a function with the given id is registered", function () {
            // arrange
            const id = functionRegistry.getOrSetId(testFunction);

            // act
            const definition = functionRegistry.getDefinition(id);

            // assert
            if (definition) {
                expect(definition.id).toEqual(id);
                expect(definition.argumentNames).toEqual(["x", "y"]);
                expect(definition.body).toContain("console.log(x + y)"); // Firefox adds a 'use strict' directive, the other browsers don't
            } else {
                fail("Definition not returned");
            }
        });

        it("throws an error if the definition of a static function is queried", function () {
            // arrange
            spyOn(staticFunctionRegistry, "has").and.returnValue(true);

            // assert
            expect(() => functionRegistry.getDefinition(1)).toThrowError("The definition of a static function is not available");
        });
    });
});
