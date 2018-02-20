import { Core } from "../src/components/Core";
import { Sandbox } from "../src/components/Sandbox";
import { moduleAutosubscribe } from "../src/extensions/module-autosubscribe";

interface TestsContext {
	core: jc.Core;
	messages: string[];
	moduleId: string;
	module: jc.Module;
	plugins: Partial<jc.PluginsMap>;
}

describe("module-autosubscribe", () => {

	beforeEach(function (this: TestsContext): void {
		this.core = new Core();
		this.plugins = moduleAutosubscribe().install(this.core);
		this.messages = ["test-message-1", "test-message-2"];
		this.moduleId = "test-module";
		this.module = {
			sandbox: new Sandbox(this.core, this.moduleId, this.moduleId),
			init: () => true,
			destroy: () => true,
			moduleDidReceiveMessage: () => true
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
				const spy = spyOn(this.core, "onMessage");

				this.plugins.onModuleInit.call(this.module, this.module.init);

				expect(spy).toHaveBeenCalledTimes(0);
			});
		});

		describe("When some messages", () => {

			it("should call next when init", function (this: TestsContext): void {
				const init = spyOn(this.module, "init");
				this.module.moduleWillSubscribe = () => this.messages;

				this.plugins.onModuleInit.call(this.module, init);

				expect(init).toHaveBeenCalledTimes(1);
			});

			it("should throw when moduleDidReceiveMessage hook is not defined", function (this: TestsContext): void {
				this.module.moduleWillSubscribe = () => this.messages;
				this.module.moduleDidReceiveMessage = null;

				expect(() => this.plugins.onModuleInit.call(this.module, this.module.init)).toThrowError();
			});

			it("should call moduleWillSubscribe when subscribe", function (this: TestsContext): void {
				this.module.moduleWillSubscribe = () => this.messages;
				const moduleWillSubscribe = spyOn(this.module, "moduleWillSubscribe").and.callThrough();
				const createHook = spyOn(this.core, "createHook").and.callThrough();

				this.plugins.onModuleInit.call(this.module, this.module.init);

				expect(createHook).toHaveBeenCalledTimes(2);
				expect(createHook).toHaveBeenCalledWith(
					"onModuleSubscribe",
					this.module.moduleWillSubscribe,
					this.module);
				expect(moduleWillSubscribe).toHaveBeenCalledTimes(1);
				expect(moduleWillSubscribe.calls.first().object).toBe(this.module);
			});

			it("should call moduleDidReceiveMessage with module as context", function (this: TestsContext): void {
				const createHook = spyOn(this.core, "createHook").and.callThrough();
				this.module.moduleWillSubscribe = () => this.messages;

				this.plugins.onModuleInit.call(this.module, this.module.init);

				expect(createHook).toHaveBeenCalledTimes(2);
				const args = createHook.calls.argsFor(1);
				const hookType = args[0];
				const method = args[1];
				const context = args[2];
				expect(hookType).toEqual("onModuleReceiveMessage");
				expect(method).toBe(this.module.moduleDidReceiveMessage);
				expect(context).toBe(this.module);
			});

			it("should call subscribe for each message", function (this: TestsContext): void {
				const onMessage = spyOn(this.core, "onMessage").and.callThrough();
				this.module.moduleWillSubscribe = () => this.messages;

				this.plugins.onModuleInit.call(this.module, this.module.init);

				expect(onMessage).toHaveBeenCalledTimes(this.messages.length);
				expect(Object.keys(this.module.sandbox.unsubscribers).length).toEqual(this.messages.length);
				Object.keys(this.module.sandbox.unsubscribers).forEach(message => {
					expect(typeof this.module.sandbox.unsubscribers[message]).toEqual("function");
				});
			});

			it("should pass moduleDidReceiveMessage hook as handler for each message", function (this: TestsContext): void {
				const onMessage = spyOn(this.core, "onMessage").and.callThrough();
				this.module.moduleWillSubscribe = () => this.messages;

				this.plugins.onModuleInit.call(this.module, this.module.init);

				this.messages.forEach((message, index) => {
					const args = onMessage.calls.argsFor(index);
					const type = args[0];
					const handler = args[1] as jc.Hook;

					expect(args.length).toEqual(2);
					expect(type).toEqual(message);
					expect(typeof handler).toEqual("function");
					expect(handler._withPipeline).toEqual(true);
					expect(handler._hookType).toEqual("onModuleReceiveMessage");
				});
			});

			it("should call next before subscribe", function (this: TestsContext): void {
				this.module.moduleWillSubscribe = () => this.messages;
				const callsOrder = [];
				const init = spyOn(this.module, "init")
					.and
					.callFake(() => callsOrder.push("init"));
				const onMessage = spyOn(this.core, "onMessage")
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
				this.module.moduleWillSubscribe = () => this.messages;

				this.plugins.onModuleInit.call(this.module, this.module.init);
				this.plugins.onModuleDestroy.call(this.module, destroy);

				expect(destroy).toHaveBeenCalledTimes(1);
			});

			it("should call and delete the unsubscribers when destroy", function (this: TestsContext): void {
				const unsubscribe = spyOn({ spy: () => true }, "spy");
				spyOn(this.core, "onMessage").and.returnValue(unsubscribe);
				this.module.moduleWillSubscribe = () => this.messages;

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
				spyOn(this.core, "onMessage").and.returnValue(unsubscribe);
				this.module.moduleWillSubscribe = () => this.messages;

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