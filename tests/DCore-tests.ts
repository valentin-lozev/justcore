import { VERSION } from "../src/utils";
import { Sandbox } from "../src/components/Sandbox";
import { MessageBus } from "../src/components/MessageBus";
import { HooksBehavior } from "../src/components/HooksBehavior";
import { DCore } from "../src/components/DCore";
import { moduleAutosubscribe } from "../src/extensions/module-autosubscribe";

interface TestsContext {
	hooksBehavior: HooksBehavior;
	messageBus: MessageBus;
	dcore: dcore.Core;
	moduleAutosubscribeExtension: dcore.Extension;
	module: {
		id: string;
		sandbox: dcore.Sandbox;
		init(options?: dcore.ModuleStartOptions): void;
		moduleDidReceiveProps(nextProps: {}): void;
		destroy(): void;
	};
	moduleFactory: dcore.ModuleFactory;
	moduleStartOptions: dcore.ModuleStartOptions;
}

describe("DCore", () => {

	beforeEach(function (this: TestsContext): void {
		this.hooksBehavior = new HooksBehavior();
		this.messageBus = new MessageBus();
		this.dcore = new DCore(this.hooksBehavior, this.messageBus);
		this.moduleAutosubscribeExtension = moduleAutosubscribe();
		this.module = {
			id: "test-module",
			sandbox: null,
			init: () => true,
			moduleDidReceiveProps: (nextProps: {}) => false,
			destroy: () => true,
		};
		this.moduleFactory = (sb: dcore.Sandbox) => {
			this.module.sandbox = sb;
			return this.module;
		};
		this.moduleStartOptions = {
			instanceId: "test-instance",
			props: {
				today: new Date().getMilliseconds()
			}
		};
	});

	describe("Initialization", () => {
		it(`should have ${VERSION} as version prop`, function (this: TestsContext) {
			expect(this.dcore.version).toEqual(VERSION);
		});

		it(`should have module-autosubscribe installed by default`, function (this: TestsContext) {
			const extensions = this.dcore.extensions;

			expect(extensions.indexOf(this.moduleAutosubscribeExtension.name)).toBeGreaterThanOrEqual(0);
		});

		it("should throw when init in already initialized state", function (this: TestsContext) {
			this.dcore.init();

			expect(() => this.dcore.init()).toThrowError();
		});

		it("should execute a callback on init", function (this: TestsContext, done: DoneFn) {
			const onInit = spyOn({ callback: () => true }, "callback");

			this.dcore.init(onInit);

			setTimeout(() => {
				expect(onInit).toHaveBeenCalledTimes(1);
				done();
			}, 10);
		});

		it("should delegate to hooks behavior when create hook", function (this: TestsContext) {
			const createHook = spyOn(this.hooksBehavior, "createHook").and.callThrough();
			const noop = () => true;
			const result = this.dcore.createHook("onCoreInit", noop);

			expect(createHook).toHaveBeenCalledWith("onCoreInit", noop);
			expect(typeof result).toEqual("function");
			expect(result._withPipeline).toEqual(true);
		});

		it("should create hook in onInit callback", function (this: TestsContext, done: DoneFn) {
			const onInit = spyOn({ onInit: () => true }, "onInit");
			const createHook = spyOn(this.dcore, "createHook").and.callThrough();

			this.dcore.init(onInit);

			expect(createHook).toHaveBeenCalledWith("onCoreInit", onInit);

			setTimeout(() => {
				expect(onInit).toHaveBeenCalledTimes(1);
				done();
			}, 10);
		});

		it("should create hook in addModule when init", function (this: TestsContext) {
			const createHook = spyOn(this.dcore, "createHook").and.callThrough();
			const initialMethod = this.dcore.addModule;

			this.dcore.init();

			expect(createHook).toHaveBeenCalledWith("onModuleAdd", initialMethod);
			expect((this.dcore.addModule as dcore.Hook)._withPipeline).toEqual(true);
			expect((this.dcore.addModule as dcore.Hook)._hookType).toEqual("onModuleAdd");
		});

		it("should create hook in startModule when init", function (this: TestsContext) {
			const createHook = spyOn(this.dcore, "createHook").and.callThrough();
			const initialMethod = this.dcore.startModule;

			this.dcore.init();

			expect(createHook).toHaveBeenCalledWith("onModuleStart", initialMethod);
			expect((this.dcore.startModule as dcore.Hook)._withPipeline).toEqual(true);
			expect((this.dcore.startModule as dcore.Hook)._hookType).toEqual("onModuleStart");
		});

		it("should create hook in stopModule when init", function (this: TestsContext) {
			const createHook = spyOn(this.dcore, "createHook").and.callThrough();
			const initialMethod = this.dcore.stopModule;

			this.dcore.init();

			expect(createHook).toHaveBeenCalledWith("onModuleStop", initialMethod);
			expect((this.dcore.stopModule as dcore.Hook)._withPipeline).toEqual(true);
			expect((this.dcore.stopModule as dcore.Hook)._hookType).toEqual("onModuleStop");
		});

		it("should create hook in onMessage when init", function (this: TestsContext) {
			const createHook = spyOn(this.dcore, "createHook").and.callThrough();
			const initialMethod = this.dcore.onMessage;

			this.dcore.init();

			expect(createHook).toHaveBeenCalledWith("onMessageSubscribe", initialMethod);
			expect((this.dcore.onMessage as dcore.Hook)._withPipeline).toEqual(true);
			expect((this.dcore.onMessage as dcore.Hook)._hookType).toEqual("onMessageSubscribe");
		});

		it("should create hook in publish when init", function (this: TestsContext) {
			const createHook = spyOn(this.dcore, "createHook").and.callThrough();
			const initialMethod = this.dcore.publishAsync;

			this.dcore.init();

			expect(createHook).toHaveBeenCalledWith("onMessagePublish", initialMethod);
			expect((this.dcore.publishAsync as dcore.Hook)._withPipeline).toEqual(true);
			expect((this.dcore.publishAsync as dcore.Hook)._hookType).toEqual("onMessagePublish");
		});
	});

	describe("Modules", () => {
		it("should list registered modules as empty array in zero state", function (this: TestsContext) {
			const modules = this.dcore.modules;

			expect(Array.isArray(modules)).toBeTruthy();
			expect(modules.length).toEqual(0);
		});

		it("should list running modules as empty object in zero state", function (this: TestsContext) {
			const modules = this.dcore.runningModules;

			expect(typeof modules).toEqual("object");
			expect(Object.keys(modules).length).toEqual(0);
		});

		it("should throw when add a module with invalid arguments", function (this: TestsContext) {
			const cases = [
				() => { this.dcore.addModule("", this.moduleFactory); },
				() => { this.dcore.addModule(null, this.moduleFactory); },
				() => { this.dcore.addModule(undefined, this.moduleFactory); },
				() => { this.dcore.addModule(this.module.id, null); }
			];

			cases.forEach(test => expect(test).toThrowError());
		});

		it("should add a module", function (this: TestsContext) {
			this.dcore.addModule(this.module.id, this.moduleFactory);
			const modules = this.dcore.modules;
			const runningModules = this.dcore.runningModules;

			expect(modules.length).toEqual(1);
			expect(Object.keys(runningModules).length).toEqual(1);
			expect(runningModules[this.module.id].length).toEqual(0);
			expect(modules[0]).toEqual(this.module.id);
		});

		it("should throw when add an already registered module", function (this: TestsContext) {
			this.dcore.addModule(this.module.id, this.moduleFactory);

			expect(() => this.dcore.addModule(this.module.id, this.moduleFactory)).toThrowError();
		});

		it("should throw when start module in not initialized state", function (this: TestsContext) {
			this.dcore.addModule(this.module.id, this.moduleFactory);

			expect(() => this.dcore.startModule(this.module.id)).toThrowError();
			expect(Object.keys(this.dcore.runningModules[this.module.id]).length).toEqual(0);
		});

		it("should throw when start not added module", function (this: TestsContext) {
			this.dcore.init();

			expect(() => this.dcore.startModule(this.module.id)).toThrowError();
		});

		it("should start a module", function (this: TestsContext) {
			const init = spyOn(this.module, "init");
			this.dcore.init();
			this.dcore.addModule(this.module.id, this.moduleFactory);

			this.dcore.startModule(this.module.id);

			expect(init).toHaveBeenCalledTimes(1);
			const runningModuls = this.dcore.runningModules;
			expect(Object.keys(runningModuls).length).toEqual(1);
			expect(runningModuls[this.module.id][0]).toEqual(this.module.id);
		});

		it("should create hook in module init when start a module", function (this: TestsContext) {
			this.dcore.init();
			this.dcore.addModule(this.module.id, this.moduleFactory);
			const fakePipeline = spyOn({ init: () => true }, "init");
			const createHook = spyOn(this.dcore, "createHook").and.returnValue(fakePipeline);

			this.dcore.startModule(this.module.id, this.moduleStartOptions);

			expect(createHook).toHaveBeenCalledTimes(1);
			expect(createHook).toHaveBeenCalledWith("onModuleInit", this.module.init);
			expect(fakePipeline).toHaveBeenCalledTimes(1);
			expect(fakePipeline).toHaveBeenCalledWith(this.moduleStartOptions.props);
			expect(fakePipeline.calls.first().object).toBe(this.module);
		});

		it("should provide a sandbox in the module factory", function (this: TestsContext) {
			const moduleFactory = spyOn(this, "moduleFactory");
			this.dcore.init();
			this.dcore.addModule(this.module.id, this.moduleFactory);

			this.dcore.startModule(this.module.id, this.moduleStartOptions);

			expect(moduleFactory.calls.first().args[0] instanceof Sandbox).toEqual(true);
		});

		it("should be able to start another module instance", function (this: TestsContext) {
			const init = spyOn(this.module, "init");
			this.dcore.init();
			this.dcore.addModule(this.module.id, this.moduleFactory);

			this.dcore.startModule(this.module.id);
			this.dcore.startModule(this.module.id, this.moduleStartOptions);

			expect(init).toHaveBeenCalledTimes(2);
		});

		it("should provide custom props to a module when start", function (this: TestsContext) {
			const init = spyOn(this.module, "init");
			this.dcore.init();
			this.dcore.addModule(this.module.id, this.moduleFactory);

			this.dcore.startModule(this.module.id, this.moduleStartOptions);

			expect(init).toHaveBeenCalledWith(this.moduleStartOptions.props);
		});

		it("should provide undefined as custom props when start without props option", function (this: TestsContext) {
			const init = spyOn(this.module, "init");
			this.dcore.init();
			this.dcore.addModule(this.module.id, this.moduleFactory);

			this.dcore.startModule(this.module.id);

			expect(init).toHaveBeenCalledWith(undefined);
		});

		it("should create hook in moduleDidReceiveProps when start an already started module", function (this: TestsContext) {
			this.dcore.init();
			this.dcore.addModule(this.module.id, this.moduleFactory);
			this.dcore.startModule(this.module.id, this.moduleStartOptions);
			const fakePipeline = spyOn(this.module, "moduleDidReceiveProps");
			const createHook = spyOn(this.dcore, "createHook").and.returnValue(fakePipeline);

			this.dcore.startModule(this.module.id, this.moduleStartOptions);

			expect(createHook).toHaveBeenCalledTimes(1);
			expect(createHook).toHaveBeenCalledWith("onModuleReceiveProps", this.module.moduleDidReceiveProps);
			expect(fakePipeline).toHaveBeenCalledTimes(1);
			expect(fakePipeline).toHaveBeenCalledWith(this.moduleStartOptions.props);
			expect(fakePipeline.calls.first().object).toBe(this.module);
		});

		it("should not call module init when start an already started module", function (this: TestsContext) {
			this.dcore.init();
			this.dcore.addModule(this.module.id, this.moduleFactory);
			this.dcore.startModule(this.module.id);
			const init = spyOn(this.module, "init");

			this.dcore.startModule(this.module.id, this.moduleStartOptions.props);

			expect(init).toHaveBeenCalledTimes(0);
		});

		it("should not call moduleDidReceiveProps when start an already started module and hook is not defined", function (this: TestsContext) {
			this.dcore.init();
			this.dcore.addModule(this.module.id, this.moduleFactory);
			this.dcore.startModule(this.module.id);
			const createHook = spyOn(this.dcore, "createHook");
			this.module.moduleDidReceiveProps = null;

			this.dcore.startModule(this.module.id, this.moduleStartOptions.props);

			expect(createHook).toHaveBeenCalledTimes(0);
		});

		it("should not throw when start a module and its factory throws", function (this: TestsContext) {
			const moduleFactory = spyOn(this, "moduleFactory").and.throwError("");
			const init = spyOn(this.module, "init");
			this.dcore.init();
			this.dcore.addModule(this.module.id, this.moduleFactory);

			expect(() => this.dcore.startModule(this.module.id)).not.toThrowError();
			expect(moduleFactory).toHaveBeenCalledTimes(1);
			expect(init).toHaveBeenCalledTimes(0);
			expect(Object.keys(this.dcore.runningModules[this.module.id]).length).toEqual(0);
		});

		it("should not throw when start a module and its initialization throws", function (this: TestsContext) {
			const init = spyOn(this.module, "init").and.throwError("");
			this.dcore.init();
			this.dcore.addModule(this.module.id, this.moduleFactory);

			expect(() => this.dcore.startModule(this.module.id)).not.toThrowError();
			expect(init).toHaveBeenCalledTimes(1);
			expect(Object.keys(this.dcore.runningModules[this.module.id]).length).toEqual(0);
		});

		it("should not throw when stop a not registered module", function (this: TestsContext) {
			expect(() => this.dcore.stopModule(this.module.id)).not.toThrowError();
		});

		it("should not throw when stop a not running module", function (this: TestsContext) {
			this.dcore.addModule(this.module.id, this.moduleFactory);

			expect(() => this.dcore.stopModule(this.module.id)).not.toThrowError();
		});

		it("should stop a module", function (this: TestsContext) {
			const destroy = spyOn(this.module, "destroy");
			this.dcore.init();
			this.dcore.addModule(this.module.id, this.moduleFactory);
			this.dcore.startModule(this.module.id);

			this.dcore.stopModule(this.module.id);

			expect(destroy).toHaveBeenCalledTimes(1);
		});

		it("should stop a module with more than one running instance", function (this: TestsContext) {
			const destroy = spyOn(this.module, "destroy");
			this.dcore.init();
			this.dcore.addModule(this.module.id, this.moduleFactory);
			this.dcore.startModule(this.module.id);
			this.dcore.startModule(this.module.id, this.moduleStartOptions);

			this.dcore.stopModule(this.module.id, this.moduleStartOptions.instanceId);

			expect(destroy).toHaveBeenCalledTimes(1);
			expect
		});

		it("should create hook in module destroy when stop a module", function (this: TestsContext) {
			this.dcore.init();
			this.dcore.addModule(this.module.id, this.moduleFactory);
			this.dcore.startModule(this.module.id, this.moduleStartOptions);
			const fakePipeline = spyOn({ destroy: () => true }, "destroy");
			const createHook = spyOn(this.dcore, "createHook").and.returnValue(fakePipeline);

			this.dcore.stopModule(this.module.id, this.moduleStartOptions.instanceId);

			expect(createHook).toHaveBeenCalledTimes(1);
			expect(createHook).toHaveBeenCalledWith("onModuleDestroy", this.module.destroy);
			expect(fakePipeline).toHaveBeenCalledTimes(1);
			expect(fakePipeline.calls.first().object).toBe(this.module);
		});

		it("should not throw when stop a module and its destroy throws", function (this: TestsContext) {
			const destroy = spyOn(this.module, "destroy").and.throwError("");
			this.dcore.init();
			this.dcore.addModule(this.module.id, this.moduleFactory);
			this.dcore.startModule(this.module.id);

			expect(() => this.dcore.stopModule(this.module.id)).not.toThrowError();
			expect(destroy).toHaveBeenCalledTimes(1);
			expect(Object.keys(this.dcore.runningModules).length).toEqual(1);
			expect(this.dcore.runningModules[this.module.id][0]).toEqual(this.module.id);
		});
	});

	describe("MessageBus", () => {
		it("should delegate to message bus when subscribe", function (this: TestsContext) {
			const onMessage = spyOn(this.messageBus, "onMessage").and.callThrough();
			const message = "message";
			const handler = () => true;

			const returnValue = this.dcore.onMessage(message, handler);

			expect(onMessage).toHaveBeenCalledTimes(1);
			expect(onMessage).toHaveBeenCalledWith(message, handler);
			expect(typeof returnValue).toEqual("function");
		});

		it("should delegate to message bus when publish", function (this: TestsContext) {
			const publish = spyOn(this.messageBus, "publishAsync");
			const message: dcore.Message = { type: "message" };

			this.dcore.publishAsync(message);

			expect(publish).toHaveBeenCalledTimes(1);
			expect(publish).toHaveBeenCalledWith(message);
		});
	});

	describe("Extensions", () => {
		it("should throw when extensions are not an array", function (this: TestsContext) {
			expect(() => this.dcore.use(null)).toThrowError();
		});

		it("should throw when use an extension after init", function (this: TestsContext) {
			this.dcore.init();

			expect(() => this.dcore.use([])).toThrowError();
		});

		it("should throw when extension is not an object", function (this: TestsContext) {
			expect(() => this.dcore.use([null])).toThrowError();
		});

		it("should not throw when extension install doesn't return plugins", function (this: TestsContext) {
			const extension: dcore.Extension = {
				name: "test",
				install: () => undefined
			};
			const install = spyOn(extension, "install");

			this.dcore.use([extension]);
			this.dcore.init();

			expect(install).toHaveBeenCalledTimes(1);
		});

		it("should throw when extension name is empty", function (this: TestsContext) {
			const extension: dcore.Extension = {
				name: "",
				install: () => undefined
			};
			expect(() => this.dcore.use([extension])).toThrowError();
		});

		it("should throw when extension install is not a function", function (this: TestsContext) {
			const extension: dcore.Extension = {
				name: "test-extension",
				install: null
			};
			expect(() => this.dcore.use([extension])).toThrowError();
		});

		it("should throw when extension has already been installed", function (this: TestsContext) {
			const extension: dcore.Extension = {
				name: this.moduleAutosubscribeExtension.name,
				install: () => undefined
			};
			expect(() => this.dcore.use([extension])).toThrowError();
		});

		it("should pass itself to extension's install", function (this: TestsContext) {
			const extension: dcore.Extension = {
				name: "test",
				install: () => undefined
			};
			const install = spyOn(extension, "install");

			this.dcore.use([extension]);
			this.dcore.init();

			const args = install.calls.argsFor(0);
			expect(args.length).toEqual(1);
			expect(args[0]).toBe(this.dcore);
		});

		it("should delegate to hooks behavior when add plugin", function (this: TestsContext) {
			const addPlugin = spyOn(this.hooksBehavior, "addPlugin");
			const plugins = {
				onModuleInit: () => true,
				onModuleDestroy: () => true
			};
			const hooks = Object.keys(plugins);
			const extension: dcore.Extension = {
				name: "test",
				install: () => plugins
			};

			this.dcore.use([extension]);
			this.dcore.init();

			expect(hooks.length).toEqual(2);
			hooks.forEach(hook => {
				expect(addPlugin).toHaveBeenCalledWith(hook, plugins[hook]);
			});
		});
	});
});