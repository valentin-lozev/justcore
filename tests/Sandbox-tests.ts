import { DCore } from "../src/components/DCore";
import { Sandbox } from "../src/components/Sandbox";

interface TestsContext {
	dcore: dcore.Core;
	sandbox: dcore.Sandbox;
	moduleId: string;
	instanceId: string;
}

describe("Sandbox", () => {

	beforeEach(function (this: TestsContext): void {
		this.moduleId = "testModule";
		this.instanceId = "testModule-1";
		this.dcore = new DCore();
		this.sandbox = new Sandbox(this.dcore, this.moduleId, this.instanceId);
	});

	it("should expose a module id", function (this: TestsContext) {
		expect(this.sandbox.moduleId).toEqual(this.moduleId);
	});

	it("should expose a module instance id", function (this: TestsContext) {
		expect(this.sandbox.instanceId).toEqual(this.instanceId);
	});

	it("should expose dcore", function (this: TestsContext) {
		expect(this.sandbox._extensionsOnlyCore).toBe(this.dcore);
	});

	it("should delegate to dcore when publish", function (this: TestsContext) {
		const spy = spyOn(this.dcore, "publishAsync");
		const message: dcore.Message = { type: "on" };

		this.sandbox.publishAsync(message);

		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith(message);
	});

	it("should delegate to dcore when start a module", function (this: TestsContext) {
		const spy = spyOn(this.dcore, "startModule");
		const options: dcore.ModuleStartOptions = {};

		this.sandbox.startModule(this.moduleId, options);

		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith(this.moduleId, options);
	});

	it("should delegate to dcore when stop a module", function (this: TestsContext) {
		const spy = spyOn(this.dcore, "stopModule");
		const instanceId = "instanceId";

		this.sandbox.stopModule(this.moduleId, instanceId);

		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith(this.moduleId, instanceId);
	});
});