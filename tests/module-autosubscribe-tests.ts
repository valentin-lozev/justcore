import { DCore } from "../src/components/DCore";
import { Sandbox } from "../src/components/Sandbox";
import { moduleAutosubscribe } from "../src/extensions/module-autosubscribe";

interface TestsContext {
	dcore: dcore.Core;
	messages: string[];
	moduleId: string;
	module: dcore.Module;
	plugins: Partial<dcore.PluginsMap>;
}

describe("module-autosubscribe", () => {

	beforeEach(function (this: TestsContext): void {
		this.dcore = new DCore();
		this.plugins = moduleAutosubscribe().install(this.dcore);
		this.messages = ["test-message-1", "test-message-2"];
		this.moduleId = "test-module";
		this.module = {
			sandbox: new Sandbox(this.dcore, this.moduleId, this.moduleId),
			init: () => true,
			destroy: () => true,
			handleMessage: () => true
		};
	});

	it("should have name", function (this: TestsContext): void {
		expect(moduleAutosubscribe().name).toEqual("module-autosubscribe");
	});

	it("should use two hooks", function (this: TestsContext): void {
		expect(Object.keys(this.plugins).length).toEqual(2);
	});

	it("should use module init hook", function (this: TestsContext): void {
		expect(typeof this.plugins.onModuleInit).toEqual("function");
	});

	it("should use module destroy hook", function (this: TestsContext): void {
		expect(typeof this.plugins.onModuleDestroy).toEqual("function");
	});

	describe("onModuleInit", () => {

		describe("When 0 messages", () => {

			it("should call next", function (this: TestsContext): void {
				const init = spyOn(this.module, "init");

				this.plugins.onModuleInit.call(this.module, init);

				expect(init).toHaveBeenCalledTimes(1);
			});

			it("should not call subscribe", function (this: TestsContext): void {
				const spy = spyOn(this.dcore, "onMessage");

				this.plugins.onModuleInit.call(this.module, this.module.init);

				expect(spy).toHaveBeenCalledTimes(0);
			});
		});

		describe("When some messages", () => {

			it("should call next when init", function (this: TestsContext): void {
				const init = spyOn(this.module, "init");
				this.module.messages = this.messages;

				this.plugins.onModuleInit.call(this.module, init);

				expect(init).toHaveBeenCalledTimes(1);
			});

			it("should bind handle message to the module", function (this: TestsContext): void {
				this.module.messages = this.messages;
				const initialHandleMessage = this.module.handleMessage;

				this.plugins.onModuleInit.call(this.module, this.module.init);

				expect(initialHandleMessage).not.toEqual(this.module.handleMessage);
				expect(Object.create(initialHandleMessage.prototype)).toEqual(jasmine.any(this.module.handleMessage));
			});

			it("should call subscribe", function (this: TestsContext): void {
				const onMessage = spyOn(this.dcore, "onMessage").and.callThrough();
				this.module.messages = this.messages;

				this.plugins.onModuleInit.call(this.module, this.module.init);

				expect(onMessage).toHaveBeenCalledTimes(this.messages.length);
				expect(Object.keys(this.module.sandbox.unsubscribers).length).toEqual(this.messages.length);

				Object.keys(this.module.sandbox.unsubscribers).forEach(message => {
					expect(typeof this.module.sandbox.unsubscribers[message]).toEqual("function");
				});
				this.messages.forEach(message => {
					expect(onMessage).toHaveBeenCalledWith(message, this.module.handleMessage);
				});
			});

			it("should call next before subscribe", function (this: TestsContext): void {
				this.module.messages = this.messages;
				const callsOrder = [];
				const init = spyOn(this.module, "init")
					.and
					.callFake(() => callsOrder.push("init"));
				const onMessage = spyOn(this.dcore, "onMessage")
					.and
					.callFake(() => callsOrder.push("onMessage"));

				this.plugins.onModuleInit.call(this.module, init);

				expect(callsOrder[0]).toEqual("init");
				expect(callsOrder[1]).toEqual("onMessage");
			});
		});
	});

	describe("onModuleDestroy", () => {

		describe("When 0 messages", () => {
			it("should call next when destroy", function (this: TestsContext): void {
				const destroy = spyOn(this.module, "destroy");

				this.plugins.onModuleDestroy.call(this.module, destroy);

				expect(destroy).toHaveBeenCalledTimes(1);
			});
		});

		describe("When some messages", () => {
			it("should call next when destroy", function (this: TestsContext): void {
				const destroy = spyOn(this.module, "destroy");
				this.module.messages = this.messages;

				this.plugins.onModuleInit.call(this.module, this.module.init);
				this.plugins.onModuleDestroy.call(this.module, destroy);

				expect(destroy).toHaveBeenCalledTimes(1);
			});

			it("should call and delete the unsubscribers when destroy", function (this: TestsContext): void {
				const unsubscribe = spyOn({ spy: () => true }, "spy");
				spyOn(this.dcore, "onMessage").and.returnValue(unsubscribe);
				this.module.messages = this.messages;

				this.plugins.onModuleInit.call(this.module, this.module.init);
				this.plugins.onModuleDestroy.call(this.module, this.module.destroy);

				expect(unsubscribe).toHaveBeenCalledTimes(this.messages.length);
				expect(Object.keys(this.module.sandbox.unsubscribers).length).toEqual(0);
			});

			it("should call unsubscribe before next", function (this: TestsContext): void {
				const callsOrder = [];
				const destroy = spyOn(this.module, "destroy")
					.and
					.callFake(() => callsOrder.push("destroy"));
				const unsubscribe = spyOn({ spy: () => true }, "spy")
					.and
					.callFake(() => callsOrder.push("unsubscribe"));
				spyOn(this.dcore, "onMessage").and.returnValue(unsubscribe);
				this.module.messages = this.messages;

				this.plugins.onModuleInit.call(this.module, this.module.init);
				this.plugins.onModuleDestroy.call(this.module, destroy);

				expect(callsOrder.length).toEqual(this.messages.length + 1);
				this.messages.forEach((x, index) => {
					expect(callsOrder[index]).toEqual("unsubscribe");
				});
				expect(callsOrder[this.messages.length]).toEqual("destroy");
			});
		});
	});
});