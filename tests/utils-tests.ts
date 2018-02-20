import {
	guard,
	VERSION,
	uid,
	hasOwnProperty
} from "../src/utils";

describe("utils", () => {
	describe("VERSION", () => {
		it("should be string", () => {
			expect(VERSION).toEqual("1.0.0");
		});
	});

	describe("hasOwnProperty", () => {
		it("should cache Object.prototype.hasOwnProperty", () => {
			expect(hasOwnProperty).toBe(Object.prototype.hasOwnProperty);
		});
	});

	describe("ArgumentGuard", () => {

		it("nonEmptyString() should not throw", () => {
			expect(() => guard.nonEmptyString("123", "m1")).not.toThrowError();
		});

		it("nonEmptyString() should throw when empty", () => {
			const cases = [
				() => guard.nonEmptyString(<any>1, "m1"),
				() => guard.nonEmptyString(<any>false, "m1"),
				() => guard.nonEmptyString(<any>{}, "m1"),
				() => guard.nonEmptyString(<any>[], "m1"),
				() => guard.nonEmptyString("", "m1")
			];

			cases.forEach(x => expect(x).toThrowError());
		});

		it("function() should not throw", () => {
			expect(() => guard.function(() => true, "m1")).not.toThrowError();
		});

		it("function() should throw when not a function", () => {
			expect(() => guard.function(<any>1, "m1")).toThrowError();
		});

		it("array() should not throw", () => {
			expect(() => guard.array([], "m1")).not.toThrowError();
		});

		it("array() should throw when not an array", () => {
			expect(() => guard.array(<any>1, "m1")).toThrowError();
		});

		it("object() should not throw", () => {
			expect(() => guard.object({}, "m1")).not.toThrowError();
		});

		it("object() should throw when not an object", () => {
			expect(() => guard.object(<any>null, "m1")).toThrowError();
		});

		it("should format exception message", () => {
			const param = "test"
			const expectedMsg = `use(): "${param}" install must be a function`;

			expect(() => guard.false(true, "m5", param)).toThrowError(expectedMsg);
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

