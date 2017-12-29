import {
	guard,
	VERSION,
	uid,
	hasOwnProperty
} from "../src/utils";

describe("utils", () => {
	describe("VERSION", () => {
		it("should be string", () => {
			expect(typeof VERSION).toEqual("string");
		});
	});

	describe("hasOwnProperty", () => {
		it("should cache Object.prototype.hasOwnProperty", () => {
			expect(hasOwnProperty).toBe(Object.prototype.hasOwnProperty);
		});
	});

	describe("ArgumentGuard", () => {

		it("defined() should not throw", () => {
			const cases = [
				() => guard.defined(1, ""),
				() => guard.defined(false, ""),
				() => guard.defined({}, ""),
				() => guard.defined([], ""),
				() => guard.defined("", ""),
			];

			cases.forEach(x => expect(x).not.toThrowError());
		});

		it("defined() should throw when not defined", () => {
			const cases = [
				() => guard.defined(undefined, ""),
				() => guard.defined(null, ""),
			];

			cases.forEach(x => expect(x).toThrowError());
		});

		it("undefined() should not throw", () => {
			const cases = [
				() => guard.undefined(undefined, ""),
				() => guard.undefined(null, ""),
			];

			cases.forEach(x => expect(x).not.toThrowError());
		});

		it("undefined() should throw when defined", () => {
			const cases = [
				() => guard.undefined(1, ""),
				() => guard.undefined(false, ""),
				() => guard.undefined({}, ""),
				() => guard.undefined([], ""),
				() => guard.undefined("", ""),
			];

			cases.forEach(x => expect(x).toThrowError());
		});

		it("nonEmptyString() should not throw", () => {
			expect(() => guard.nonEmptyString("123", "")).not.toThrowError();
		});

		it("nonEmptyString() should throw when empty", () => {
			const cases = [
				() => guard.nonEmptyString(<any>1, ""),
				() => guard.nonEmptyString(<any>false, ""),
				() => guard.nonEmptyString(<any>{}, ""),
				() => guard.nonEmptyString(<any>[], ""),
				() => guard.nonEmptyString("", ""),
			];

			cases.forEach(x => expect(x).toThrowError());
		});

		it("function() should not throw", () => {
			expect(() => guard.function(() => true, "")).not.toThrowError();
		});

		it("function() should throw when not a function", () => {
			expect(() => guard.function(<any>1, "")).toThrowError();
		});

		it("array() should not throw", () => {
			expect(() => guard.array([], "")).not.toThrowError();
		});

		it("array() should throw when not an array", () => {
			expect(() => guard.array(<any>1, "")).toThrowError();
		});

		it("object() should not throw", () => {
			expect(() => guard.object({}, "")).not.toThrowError();
		});

		it("object() should throw when not an object", () => {
			expect(() => guard.object(<any>null, "")).toThrowError();
		});
	});

	describe("uid", () => {
		it("should return unique number on each call", () => {
			const cases = 100;
			const ids: { [key: number]: boolean; } = Object.create(null);

			for (let i = 0; i < cases; i++) {
				ids[uid()] = true;
			}

			expect(Object.keys(ids).length).toEqual(cases);
			expect(cases).toBeGreaterThanOrEqual(100);
		});
	});
});

