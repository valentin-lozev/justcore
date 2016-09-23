/// <reference path="../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />
describe("Helpers", function () {
    var guard = spaMVP.Hidden.typeGuard;
    it("typeGuard should throw with message when expected is invalid", function () {
        var expected = "string";
        var value = null;
        var errorMsg = "Not a string";
        expect(function () { return guard(expected, value, errorMsg); }).toThrowError(errorMsg);
    });
    it("typeGuard should throw when expected is boolean and value is invalid", function () {
        var expected = "boolean";
        var value = null;
        expect(function () { return guard(expected, value, ""); }).toThrow();
    });
    it("typeGuard should not throw when expected is boolean and value is valid", function () {
        var expected = "boolean";
        var value = true;
        expect(function () { return guard(expected, value, ""); }).not.toThrow();
    });
    it("typeGuard should throw when expected is number and value is invalid", function () {
        var expected = "number";
        var value = null;
        expect(function () { return guard(expected, value, ""); }).toThrow();
    });
    it("typeGuard should not throw when expected is number and value is valid", function () {
        var expected = "number";
        var value = 8;
        expect(function () { return guard(expected, value, ""); }).not.toThrow();
    });
    it("typeGuard should throw when expected is string and value is invalid", function () {
        var expected = "string";
        var value = null;
        expect(function () { return guard(expected, value, ""); }).toThrow();
    });
    it("typeGuard should not throw when expected is string and value is valid", function () {
        var expected = "string";
        var value = "";
        expect(function () { return guard(expected, value, ""); }).not.toThrow();
    });
    it("typeGuard should throw when expected is object and value is invalid", function () {
        var expected = "object";
        var value = null;
        expect(function () { return guard(expected, value, ""); }).toThrow();
    });
    it("typeGuard should not throw when expected is object and value is valid", function () {
        var expected = "object";
        var value = {};
        expect(function () { return guard(expected, value, ""); }).not.toThrow();
    });
    it("typeGuard should throw when expected is array and value is invalid", function () {
        var expected = "array";
        var value = null;
        expect(function () { return guard(expected, value, ""); }).toThrow();
    });
    it("typeGuard should not throw when expected is array and value is valid", function () {
        var expected = "array";
        var value = [];
        expect(function () { return guard(expected, value, ""); }).not.toThrow();
    });
    it("typeGuard should throw when expected is undefined and value is invalid", function () {
        var expected = "undefined";
        var value = null;
        expect(function () { return guard(expected, value, ""); }).toThrow();
    });
    it("typeGuard should not throw when expected is undefined and value is valid", function () {
        var expected = "undefined";
        var value;
        expect(function () { return guard(expected, value, ""); }).not.toThrow();
    });
});
//# sourceMappingURL=helpers-tests.js.map