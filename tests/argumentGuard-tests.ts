describe("argumentGuard", () => {

    it("mustBeDefined should pass", () => {
        let guard = dcore._private.argumentGuard();
        let tests = [
            () => guard.mustBeDefined(1, ""),
            () => guard.mustBeDefined(false, ""),
            () => guard.mustBeDefined({}, ""),
            () => guard.mustBeDefined([], ""),
            () => guard.mustBeDefined("", ""),
        ];

        tests.forEach(x => expect(x).not.toThrow());
    });

    it("mustBeDefined should throw when not defined", () => {
        let guard = dcore._private.argumentGuard();
        let tests = [
            () => guard.mustBeDefined(undefined, ""),
            () => guard.mustBeDefined(null, ""),
        ];

        tests.forEach(x => expect(x).toThrow());
    });

    it("mustBeUndefined should pass", () => {
        let guard = dcore._private.argumentGuard();
        let tests = [
            () => guard.mustBeUndefined(undefined, ""),
            () => guard.mustBeUndefined(null, ""),
        ];

        tests.forEach(x => expect(x).not.toThrow());
    });

    it("mustBeUndefined should throw when defined", () => {
        let guard = dcore._private.argumentGuard();
        let tests = [
            () => guard.mustBeUndefined(1, ""),
            () => guard.mustBeUndefined(false, ""),
            () => guard.mustBeUndefined({}, ""),
            () => guard.mustBeUndefined([], ""),
            () => guard.mustBeUndefined("", ""),
        ];

        tests.forEach(x => expect(x).toThrow());
    });

    it("mustBeNonEmptyString should pass", () => {
        let guard = dcore._private.argumentGuard();

        expect(() => guard.mustBeNonEmptyString("123", "")).not.toThrow();
    });

    it("mustBeNonEmptyString should throw when empty", () => {
        let guard = dcore._private.argumentGuard();
        let tests = [
            () => guard.mustBeNonEmptyString(<any>1, ""),
            () => guard.mustBeNonEmptyString(<any>false, ""),
            () => guard.mustBeNonEmptyString(<any>{}, ""),
            () => guard.mustBeNonEmptyString(<any>[], ""),
            () => guard.mustBeNonEmptyString("", ""),
        ];

        tests.forEach(x => expect(x).toThrow());
    });

    it("mustBeFunction should pass", () => {
        let guard = dcore._private.argumentGuard();
        let func = function () { };

        expect(() => guard.mustBeFunction(func, "")).not.toThrow();
    });

    it("mustBeFunction should throw when not a function", () => {
        let guard = dcore._private.argumentGuard();

        expect(() => guard.mustBeFunction(<any>1, "")).toThrow();
    });

    it("mustBeArray should pass", () => {
        let guard = dcore._private.argumentGuard();
        let arr = [];

        expect(() => guard.mustBeArray(arr, "")).not.toThrow();
    });

    it("mustBeArray should throw when not an array", () => {
        let guard = dcore._private.argumentGuard();

        expect(() => guard.mustBeArray(<any>1, "")).toThrow();
    });
});