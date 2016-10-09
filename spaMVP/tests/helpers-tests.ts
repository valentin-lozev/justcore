/// <reference path="../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe("Helpers", () => {

    let guard = spaMVP.helpers.typeGuard;

    it("typeGuard should throw with message when expected is invalid", () => {
        let expected = "string";
        let value = null;
        let errorMsg = "Not a string";

        expect(() => guard(expected, value, errorMsg)).toThrowError(errorMsg);
    });

    it("typeGuard should throw when expected is boolean and value is invalid", () => {
        let expected = "boolean";
        let value = null;

        expect(() => guard(expected, value, "")).toThrow();
    });

    it("typeGuard should not throw when expected is boolean and value is valid", () => {
        let expected = "boolean";
        let value = true;

        expect(() => guard(expected, value, "")).not.toThrow();
    });

    it("typeGuard should throw when expected is number and value is invalid", () => {
        let expected = "number";
        let value = null;

        expect(() => guard(expected, value, "")).toThrow();
    });

    it("typeGuard should not throw when expected is number and value is valid", () => {
        let expected = "number";
        let value = 8;

        expect(() => guard(expected, value, "")).not.toThrow();
    });

    it("typeGuard should throw when expected is string and value is invalid", () => {
        let expected = "string";
        let value = null;

        expect(() => guard(expected, value, "")).toThrow();
    });

    it("typeGuard should not throw when expected is string and value is valid", () => {
        let expected = "string";
        let value = "";

        expect(() => guard(expected, value, "")).not.toThrow();
    });

    it("typeGuard should throw when expected is object and value is invalid", () => {
        let expected = "object";
        let value = null;

        expect(() => guard(expected, value, "")).toThrow();
    });

    it("typeGuard should not throw when expected is object and value is valid", () => {
        let expected = "object";
        let value = {};

        expect(() => guard(expected, value, "")).not.toThrow();
    });

    it("typeGuard should throw when expected is array and value is invalid", () => {
        let expected = "array";
        let value = null;

        expect(() => guard(expected, value, "")).toThrow();
    });

    it("typeGuard should not throw when expected is array and value is valid", () => {
        let expected = "array";
        let value = [];

        expect(() => guard(expected, value, "")).not.toThrow();
    });

    it("typeGuard should throw when expected is undefined and value is invalid", () => {
        let expected = "undefined";
        let value = null;

        expect(() => guard(expected, value, "")).toThrow();
    });

    it("typeGuard should not throw when expected is undefined and value is valid", () => {
        let expected = "undefined";
        let value;

        expect(() => guard(expected, value, "")).not.toThrow();
    });
});