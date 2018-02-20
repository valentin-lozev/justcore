import { Core } from "../src/components/Core";
import { Sandbox } from "../src/components/Sandbox";

interface TestsContext {
	core: jc.Core;
	sandbox: jc.Sandbox;
	moduleId: string;
	instanceId: string;
}

describe("Sandbox", () => {

	beforeEach(function (this: TestsContext): void {
		this.moduleId = "testModule";
		this.instanceId = "testModule-1";
		this.core = new Core();
		this.sandbox = new Sandbox(this.core, this.moduleId, this.instanceId);
	});

	it("should expose a module id", function (this: TestsContext) {
		expect(this.sandbox.moduleId).toEqual(this.moduleId);
	});

	it("should expose a module instance id", function (this: TestsContext) {
		expect(this.sandbox.instanceId).toEqual(this.instanceId);
	});

	it("should expose the core", function (this: TestsContext) {
		expect(this.sandbox._extensionsOnlyCore).toBe(this.core);
	});

	it("should delegate to the core when publish", function (this: TestsContext) {
		const spy = spyOn(this.core, "publishAsync");
		const message: jc.Message = { type: "on" };

		this.sandbox.publishAsync(message);

		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith(message);
	});

	it("should delegate to the core when start a module", function (this: TestsContext) {
		const spy = spyOn(this.core, "startModule");
		const options: jc.ModuleStartOptions = {};

		this.sandbox.startModule(this.moduleId, options);

		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith(this.moduleId, options);
	});

	it("should delegate to the core when stop a module", function (this: TestsContext) {
		const spy = spyOn(this.core, "stopModule");
		const instanceId = "instanceId";

		this.sandbox.stopModule(this.moduleId, instanceId);

		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith(this.moduleId, instanceId);
	});
});