import { HooksSystem } from "../src/components/HooksSystem";

interface TestsContext {
	moduleHook: dcore.HookType;
	hooksSystem: HooksSystem;
	module: {
		callsOrder: string[];
		sum: (args: SumArgs) => number;
	};
	plugins: {
		increaseResultBy1: (next: () => number, args: SumArgs) => number;
		multiplyArgumentsBy2: (next: () => number, args: SumArgs) => number;
	};
}

interface SumArgs {
	a: number;
	b: number;
}

describe("HooksSystem", () => {

	const sumName = "sum";
	const increaseResultBy1Name = "increaseResultBy1";
	const multiplyArgumentsBy2Name = "multiplyArgumentsBy2";

	beforeEach(function (this: TestsContext): void {
		class Module {
			callsOrder: string[];

			constructor() {
				this.callsOrder = [];
			}

			sum(args: SumArgs): number {
				this.callsOrder.push(sumName);
				return args.a + args.b;
			}
		}

		this.hooksSystem = new HooksSystem();
		this.moduleHook = "onModuleStart";
		this.module = new Module();
		this.module.sum = this.hooksSystem.createHook(
			this.moduleHook,
			this.module.sum,
			this.module);
		this.plugins = {
			increaseResultBy1: function (this: Module, next: () => number, args: SumArgs): number {
				this.callsOrder.push(increaseResultBy1Name);
				return next() + 1;
			},

			multiplyArgumentsBy2: function (this: Module, next: () => number, args: SumArgs): number {
				this.callsOrder.push(multiplyArgumentsBy2Name);
				args.a *= 2;
				args.b *= 2;
				return next();
			}
		};
	});

	it("should throw on empty hook when create hook", function (this: TestsContext): void {
		expect(() => this.hooksSystem.createHook("" as any, this.module.sum)).toThrowError();
	});

	it("should throw on invalid method when create hook", function (this: TestsContext): void {
		expect(() => this.hooksSystem.createHook("onModuleAdd", null)).toThrowError();
	});

	it("should attach custom attributes when create hook", function (this: TestsContext): void {
		expect((this.module.sum as dcore.Hook)._withPipeline).toEqual(true);
		expect((this.module.sum as dcore.Hook)._hookType).toEqual(this.moduleHook);
	});

	it("should throw on empty hook when add plugin", function (this: TestsContext): void {
		expect(() => this.hooksSystem.addPlugin("" as any, () => true)).toThrowError();
	});

	it("should throw on invalid plugin when add plugin", function (this: TestsContext): void {
		expect(() => this.hooksSystem.addPlugin(this.moduleHook, null)).toThrowError();
	});

	describe("Zero state", () => {
		it("should call original", function (this: TestsContext): void {
			const args: SumArgs = { a: 2, b: 3 };
			const sum = spyOn(this.module, "sum").and.callThrough();

			this.module.sum(args);

			expect(sum).toHaveBeenCalledTimes(1);
			expect(sum).toHaveBeenCalledWith(args);
			expect(sum.calls.first().object).toBe(this.module);
		});

		it("should return correct result", function (this: TestsContext): void {
			const args: SumArgs = { a: 2, b: 3 };
			const expectedSum = args.a + args.b;

			const actualSum = this.module.sum(args);

			expect(actualSum).toEqual(expectedSum);
		});
	});

	describe("Non zero state", () => {
		it("should call original", function (this: TestsContext): void {
			const args: SumArgs = { a: 2, b: 3 };
			const sum = spyOn(this.module, "sum").and.callThrough();
			this.hooksSystem.addPlugin(this.moduleHook, this.plugins.multiplyArgumentsBy2);
			this.hooksSystem.addPlugin(this.moduleHook, this.plugins.increaseResultBy1);

			this.module.sum(args);


			expect(sum).toHaveBeenCalledTimes(1);
			expect(sum).toHaveBeenCalledWith(args);
			expect(sum.calls.first().object).toBe(this.module);
		});

		it("should call plugins", function (this: TestsContext): void {
			const args: SumArgs = { a: 2, b: 3 };
			const multiplyArgumentsBy2 = spyOn(this.plugins, "multiplyArgumentsBy2").and.callThrough();
			const increaseResultBy1 = spyOn(this.plugins, "increaseResultBy1").and.callThrough();
			this.hooksSystem.addPlugin(this.moduleHook, multiplyArgumentsBy2);
			this.hooksSystem.addPlugin(this.moduleHook, increaseResultBy1);

			this.module.sum(args);

			expect(increaseResultBy1).toHaveBeenCalledTimes(1);
			expect(multiplyArgumentsBy2).toHaveBeenCalledTimes(1);

			const multiplyArgs = multiplyArgumentsBy2.calls.first().args;
			expect(multiplyArgs.length).toEqual(2);
			expect(typeof multiplyArgs[0]).toEqual("function");
			expect(multiplyArgs[1]).toBe(args);
			expect(multiplyArgumentsBy2.calls.first().object).toBe(this.module);
		});

		it("should call original and its the plugins in correct order", function (this: TestsContext): void {
			const args: SumArgs = { a: 2, b: 3 };
			this.hooksSystem.addPlugin(this.moduleHook, this.plugins.multiplyArgumentsBy2);
			this.hooksSystem.addPlugin(this.moduleHook, this.plugins.increaseResultBy1);

			this.module.sum(args);

			const calls = this.module.callsOrder
			expect(calls.length).toEqual(3);
			expect(calls[0]).toEqual(multiplyArgumentsBy2Name);
			expect(calls[1]).toEqual(increaseResultBy1Name);
			expect(calls[2]).toEqual(sumName);
		});

		it("should return correct result", function (this: TestsContext): void {
			const args: SumArgs = { a: 2, b: 3 };
			const expectedSum = ((args.a + args.b) * 2) + 1;
			this.hooksSystem.addPlugin(this.moduleHook, this.plugins.multiplyArgumentsBy2);
			this.hooksSystem.addPlugin(this.moduleHook, this.plugins.increaseResultBy1);

			const actualSum = this.module.sum(args);

			expect(actualSum).toEqual(expectedSum);
		});

		it("should break when a plugin throws", function (this: TestsContext): void {
			const args: SumArgs = { a: 2, b: 3 };
			const expectedMessage = "test message";
			const multiplyArgumentsBy2 = spyOn(this.plugins, "multiplyArgumentsBy2").and.throwError(expectedMessage);
			const increaseResultBy1 = spyOn(this.plugins, "increaseResultBy1").and.callThrough();
			this.hooksSystem.addPlugin(this.moduleHook, multiplyArgumentsBy2);
			this.hooksSystem.addPlugin(this.moduleHook, increaseResultBy1);

			expect(() => this.module.sum(args)).toThrowError(expectedMessage);
			expect(increaseResultBy1).not.toHaveBeenCalled();
		});
	});
});