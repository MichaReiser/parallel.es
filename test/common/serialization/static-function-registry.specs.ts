import {staticFunctionRegistry} from "../../../src/common/serialization/static-function-registry";

describe("staticFunctionRegistry", function () {

    let object: { next(): number, revert(): boolean };

    beforeEach(function () {
        object = {
            next() { return 2; },
            revert() { return true; }
        };
    });

    afterEach(function () {
        staticFunctionRegistry.reset();
    });

    describe("registerStaticFunctions", function () {
        it("registers the methods of the passed object", function () {
            // act
            staticFunctionRegistry.registerStaticFunctions(object);

            // assert
            expect(staticFunctionRegistry.has(object.next)).toBe(true);
            expect(staticFunctionRegistry.has(object.revert)).toBe(true);
        });

        it("does not register inherited methods of the object", function () {
            // arrange
            const inheritedObject = Object.create(object, { other() { return 10; } });

            // act
            staticFunctionRegistry.registerStaticFunctions(inheritedObject);

            // assert
            expect(staticFunctionRegistry.has(inheritedObject.next)).toBe(false);
        });

        it("registers not inherited methods", function () {
            // arrange
            const inheritedObject = { other() { return 10; } };
            (inheritedObject as any).prototype = object;

            // act
            staticFunctionRegistry.registerStaticFunctions(inheritedObject);

            // assert
            expect(staticFunctionRegistry.has(inheritedObject.other)).toBe(true);
        });

        it("does not register properties that are not functions", function () {
            // arrange
            const objectWithProperties = {
                next() { return 2; },
                reverse: true
            };

            // act
            staticFunctionRegistry.registerStaticFunctions(objectWithProperties);

            // assert
            expect(staticFunctionRegistry.has(objectWithProperties.reverse as any)).toBe(false);
        });
    });

    describe("registerFunction", function () {
        it("registers the given function", function () {
            // act
            staticFunctionRegistry.registerStaticFunction(object.next);

            // assert
            expect(staticFunctionRegistry.has(object.next)).toBe(true);
        });

        it("does not register the same function twice", function () {
            // arrange
            staticFunctionRegistry.registerStaticFunction(object.next);
            const existingId = staticFunctionRegistry.getId(object.next);

            // act
            staticFunctionRegistry.registerStaticFunction(object.next);

            // assert
            expect(staticFunctionRegistry.getId(object.next)).toEqual(existingId);
        });
    });

    describe("getId", function () {
        it("returns the id of the registered function", function () {
            // arrange
            staticFunctionRegistry.registerStaticFunction(object.next);

            // assert
            expect(staticFunctionRegistry.getId(object.next)).not.toBeUndefined();
        });

        it("throws if the passed function is not registered as static function", function () {
            // assert
            expect(() => staticFunctionRegistry.getId(object.next)).toThrowError(/The passed in function*./);
        });
    });

    describe("getFunction", function () {
        it("throws if the function is not registered", function () {
            // act, assert
            expect(() => staticFunctionRegistry.getFunction(1)).toThrowError("the function with the id 1 is not registered as static function");
        });

        it("returns a reference to the static function if registered", function () {
            // arrange
            staticFunctionRegistry.registerStaticFunction(object.next);
            const id = staticFunctionRegistry.getId(object.next);

            // act, assert
            expect(staticFunctionRegistry.getFunction(id)).toBe(object.next);
        });
    });
});
