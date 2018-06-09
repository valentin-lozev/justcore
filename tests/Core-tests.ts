import { Sandbox } from "../src/components/Sandbox";
import { MessageBus } from "../src/components/MessageBus";
import { HooksSystem } from "../src/components/HooksSystem";
import { Core } from "../src/components/Core";
import { moduleAutosubscribe } from "../src/extensions/module-autosubscribe";

interface TestsContext {
	hooksSystem: HooksSystem;
	messageBus: MessageBus;
	core: jc.Core;
	moduleAutosubscribeExtension: jc.Extension;
	module: {
		id: string;
		sandbox: jc.Sandbox;
		init(options?: jc.ModuleStartOptions): void;
		moduleDidReceiveProps(nextProps: {}): void;
		destroy(): void;
	};
	moduleFactory: jc.ModuleFactory;
	moduleStartOptions: jc.ModuleStartOptions;
}

describe("Core", () => {

	beforeEach(function (this: TestsContext): void {
		this.hooksSystem = new HooksSystem();
		this.messageBus = new MessageBus();
		this.core = new Core(this.hooksSystem, this.messageBus);
		this.moduleAutosubscribeExtension = moduleAutosubscribe();
		this.module = {
			id: "test-module",
			sandbox: null,
			init: () => true,
			moduleDidReceiveProps: (nextProps: {}) => false,
			destroy: () => true,
		};
		this.moduleFactory = (sb: jc.Sandbox) => {
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
		it(`should use project's version as version prop`, function (this: TestsContext) {
			expect(typeof this.core.version).toEqual("string");
			expect(this.core.version.split(".").length).toEqual(3);
		});

		it(`should have module-autosubscribe installed by default`, function (this: TestsContext) {
			const extensions = this.core.extensions;

			expect(extensions.indexOf(this.moduleAutosubscribeExtension.name)).toBeGreaterThanOrEqual(0);
		});

		it("should throw when init in already initialized state", function (this: TestsContext) {
			this.core.init();

			expect(() => this.core.init()).toThrowError();
		});

		it("should execute a callback on init", function (this: TestsContext, done: DoneFn) {
			const onInit = spyOn({ callback: () => true }, "callback");

			this.core.init(onInit);

			setTimeout(() => {
				expect(onInit).toHaveBeenCalledTimes(1);
				done();
			}, 10);
		});

		it("should delegate to hooks system when create hook", function (this: TestsContext) {
			const createHook = spyOn(this.hooksSystem, "createHook").and.callThrough();
			const noop = () => true;
			const result = this.core.createHook("onCoreInit", noop, this.core);

			expect(createHook).toHaveBeenCalledWith("onCoreInit", noop, this.core);
			expect(typeof result).toEqual("function");
			expect(result._withPipeline).toEqual(true);
			expect(result._hookType).toEqual("onCoreInit");
		});

		it("should create hook in onInit callback", function (this: TestsContext, done: DoneFn) {
			const onInit = spyOn({ onInit: () => true }, "onInit");
			const createHook = spyOn(this.core, "createHook").and.callThrough();

			this.core.init(onInit);

			expect(createHook).toHaveBeenCalledWith("onCoreInit", onInit, this.core);
			setTimeout(() => {
				expect(onInit).toHaveBeenCalledTimes(1);
				done();
			}, 10);
		});

		it("should create hook in addModule when init", function (this: TestsContext) {
			const createHook = spyOn(this.core, "createHook").and.callThrough();
			const initialMethod = this.core.addModule;

			this.core.init();

			expect(createHook).toHaveBeenCalledWith("onModuleAdd", initialMethod, this.core);
			expect((this.core.addModule as jc.HookProps & jc.Func<void>)._withPipeline).toEqual(true);
			expect((this.core.addModule as jc.HookProps & jc.Func<void>)._hookType).toEqual("onModuleAdd");
		});

		it("should create hook in startModule when init", function (this: TestsContext) {
			const createHook = spyOn(this.core, "createHook").and.callThrough();
			const initialMethod = this.core.startModule;

			this.core.init();

			expect(createHook).toHaveBeenCalledWith("onModuleStart", initialMethod, this.core);
			expect((this.core.startModule as jc.HookProps & jc.Func<void>)._withPipeline).toEqual(true);
			expect((this.core.startModule as jc.HookProps & jc.Func<void>)._hookType).toEqual("onModuleStart");
		});

		it("should create hook in stopModule when init", function (this: TestsContext) {
			const createHook = spyOn(this.core, "createHook").and.callThrough();
			const initialMethod = this.core.stopModule;

			this.core.init();

			expect(createHook).toHaveBeenCalledWith("onModuleStop", initialMethod, this.core);
			expect((this.core.stopModule as jc.HookProps & jc.Func<void>)._withPipeline).toEqual(true);
			expect((this.core.stopModule as jc.HookProps & jc.Func<void>)._hookType).toEqual("onModuleStop");
		});

		it("should create hook in onMessage when init", function (this: TestsContext) {
			const createHook = spyOn(this.core, "createHook").and.callThrough();
			const initialMethod = this.core.onMessage;

			this.core.init();

			expect(createHook).toHaveBeenCalledWith("onMessageSubscribe", initialMethod, this.core);
			expect((this.core.onMessage as jc.HookProps & jc.Func<jc.Unsubscribe>)._withPipeline).toEqual(true);
			expect((this.core.onMessage as jc.HookProps & jc.Func<jc.Unsubscribe>)._hookType).toEqual("onMessageSubscribe");
		});

		it("should create hook in publish when init", function (this: TestsContext) {
			const createHook = spyOn(this.core, "createHook").and.callThrough();
			const initialMethod = this.core.publishAsync;

			this.core.init();

			expect(createHook).toHaveBeenCalledWith("onMessagePublish", initialMethod, this.core);
			expect((this.core.publishAsync as jc.HookProps & jc.Func<void>)._withPipeline).toEqual(true);
			expect((this.core.publishAsync as jc.HookProps & jc.Func<void>)._hookType).toEqual("onMessagePublish");
		});
	});

	describe("Modules", () => {
		it("should list registered modules as empty array in zero state", function (this: TestsContext) {
			const modules = this.core.modules;

			expect(Array.isArray(modules)).toBeTruthy();
			expect(modules.length).toEqual(0);
		});

		it("should list running modules as empty object in zero state", function (this: TestsContext) {
			const modules = this.core.runningModules;

			expect(typeof modules).toEqual("object");
			expect(Object.keys(modules).length).toEqual(0);
		});

		it("should throw when add a module with invalid arguments", function (this: TestsContext) {
			const cases = [
				() => { this.core.addModule("", this.moduleFactory); },
				() => { this.core.addModule(null, this.moduleFactory); },
				() => { this.core.addModule(undefined, this.moduleFactory); },
				() => { this.core.addModule(this.module.id, null); }
			];

			cases.forEach(test => expect(test).toThrowError());
		});

		it("should add a module", function (this: TestsContext) {
			this.core.addModule(this.module.id, this.moduleFactory);
			const modules = this.core.modules;
			const runningModules = this.core.runningModules;

			expect(modules.length).toEqual(1);
			expect(Object.keys(runningModules).length).toEqual(1);
			expect(runningModules[this.module.id].length).toEqual(0);
			expect(modules[0]).toEqual(this.module.id);
		});

		it("should throw when add an already registered module", function (this: TestsContext) {
			this.core.addModule(this.module.id, this.moduleFactory);

			expect(() => this.core.addModule(this.module.id, this.moduleFactory)).toThrowError();
		});

		it("should throw when start module in not initialized state", function (this: TestsContext) {
			this.core.addModule(this.module.id, this.moduleFactory);

			expect(() => this.core.startModule(this.module.id)).toThrowError();
			expect(Object.keys(this.core.runningModules[this.module.id]).length).toEqual(0);
		});

		it("should throw when start not added module", function (this: TestsContext) {
			this.core.init();

			expect(() => this.core.startModule(this.module.id)).toThrowError();
		});

		it("should start a module", function (this: TestsContext) {
			const init = spyOn(this.module, "init");
			this.core.init();
			this.core.addModule(this.module.id, this.moduleFactory);

			this.core.startModule(this.module.id);

			expect(init).toHaveBeenCalledTimes(1);
			const runningModuls = this.core.runningModules;
			expect(Object.keys(runningModuls).length).toEqual(1);
			expect(runningModuls[this.module.id][0]).toEqual(this.module.id);
		});

		it("should create hook in module init when start a module", function (this: TestsContext) {
			this.core.init();
			this.core.addModule(this.module.id, this.moduleFactory);
			const init = spyOn(this.module, "init");
			const createHook = spyOn(this.core, "createHook").and.callThrough();

			this.core.startModule(this.module.id, this.moduleStartOptions);

			expect(createHook).toHaveBeenCalledTimes(1);
			expect(createHook).toHaveBeenCalledWith("onModuleInit", this.module.init, this.module);
			expect(init).toHaveBeenCalledTimes(1);
			expect(init).toHaveBeenCalledWith(this.moduleStartOptions.props);
			expect(init.calls.first().object).toBe(this.module);
		});

		it("should provide a sandbox in the module factory", function (this: TestsContext) {
			const moduleFactory = spyOn(this, "moduleFactory");
			this.core.init();
			this.core.addModule(this.module.id, this.moduleFactory);

			this.core.startModule(this.module.id, this.moduleStartOptions);

			expect(moduleFactory.calls.first().args[0] instanceof Sandbox).toEqual(true);
		});

		it("should be able to start another module instance", function (this: TestsContext) {
			const init = spyOn(this.module, "init");
			this.core.init();
			this.core.addModule(this.module.id, this.moduleFactory);

			this.core.startModule(this.module.id);
			this.core.startModule(this.module.id, this.moduleStartOptions);

			expect(init).toHaveBeenCalledTimes(2);
		});

		it("should provide custom props to a module when start", function (this: TestsContext) {
			const init = spyOn(this.module, "init");
			this.core.init();
			this.core.addModule(this.module.id, this.moduleFactory);

			this.core.startModule(this.module.id, this.moduleStartOptions);

			expect(init).toHaveBeenCalledWith(this.moduleStartOptions.props);
		});

		it("should provide undefined as custom props when start without props option", function (this: TestsContext) {
			const init = spyOn(this.module, "init");
			this.core.init();
			this.core.addModule(this.module.id, this.moduleFactory);

			this.core.startModule(this.module.id);

			expect(init).toHaveBeenCalledWith(undefined);
		});

		it("should create hook in moduleDidReceiveProps when start an already started module", function (this: TestsContext) {
			this.core.init();
			this.core.addModule(this.module.id, this.moduleFactory);
			this.core.startModule(this.module.id, this.moduleStartOptions);
			const moduleDidReceiveProps = spyOn(this.module, "moduleDidReceiveProps");
			const createHook = spyOn(this.core, "createHook").and.callThrough();

			this.core.startModule(this.module.id, this.moduleStartOptions);

			expect(createHook).toHaveBeenCalledTimes(1);
			expect(createHook).toHaveBeenCalledWith(
				"onModuleReceiveProps",
				this.module.moduleDidReceiveProps,
				this.module);
			expect(moduleDidReceiveProps).toHaveBeenCalledTimes(1);
			expect(moduleDidReceiveProps).toHaveBeenCalledWith(this.moduleStartOptions.props);
			expect(moduleDidReceiveProps.calls.first().object).toBe(this.module);
		});

		it("should not call module init when start an already started module", function (this: TestsContext) {
			this.core.init();
			this.core.addModule(this.module.id, this.moduleFactory);
			this.core.startModule(this.module.id);
			const init = spyOn(this.module, "init");

			this.core.startModule(this.module.id, this.moduleStartOptions.props);

			expect(init).toHaveBeenCalledTimes(0);
		});

		it("should not call moduleDidReceiveProps when start an already started module and hook is not defined", function (this: TestsContext) {
			this.core.init();
			this.core.addModule(this.module.id, this.moduleFactory);
			this.core.startModule(this.module.id);
			const createHook = spyOn(this.core, "createHook");
			this.module.moduleDidReceiveProps = null;

			this.core.startModule(this.module.id, this.moduleStartOptions.props);

			expect(createHook).toHaveBeenCalledTimes(0);
		});

		it("should not throw when start a module and its factory throws", function (this: TestsContext) {
			const moduleFactory = spyOn(this, "moduleFactory").and.throwError("");
			const init = spyOn(this.module, "init");
			this.core.init();
			this.core.addModule(this.module.id, this.moduleFactory);

			expect(() => this.core.startModule(this.module.id)).not.toThrowError();
			expect(moduleFactory).toHaveBeenCalledTimes(1);
			expect(init).toHaveBeenCalledTimes(0);
			expect(Object.keys(this.core.runningModules[this.module.id]).length).toEqual(0);
		});

		it("should not throw when start a module and its initialization throws", function (this: TestsContext) {
			const init = spyOn(this.module, "init").and.throwError("");
			this.core.init();
			this.core.addModule(this.module.id, this.moduleFactory);

			expect(() => this.core.startModule(this.module.id)).not.toThrowError();
			expect(init).toHaveBeenCalledTimes(1);
			expect(Object.keys(this.core.runningModules[this.module.id]).length).toEqual(0);
		});

		it("should not throw when stop a not registered module", function (this: TestsContext) {
			expect(() => this.core.stopModule(this.module.id)).not.toThrowError();
		});

		it("should not throw when stop a not running module", function (this: TestsContext) {
			this.core.addModule(this.module.id, this.moduleFactory);

			expect(() => this.core.stopModule(this.module.id)).not.toThrowError();
		});

		it("should stop a module", function (this: TestsContext) {
			const destroy = spyOn(this.module, "destroy");
			this.core.init();
			this.core.addModule(this.module.id, this.moduleFactory);
			this.core.startModule(this.module.id);

			this.core.stopModule(this.module.id);

			expect(destroy).toHaveBeenCalledTimes(1);
		});

		it("should stop a module with more than one running instance", function (this: TestsContext) {
			const destroy = spyOn(this.module, "destroy");
			this.core.init();
			this.core.addModule(this.module.id, this.moduleFactory);
			this.core.startModule(this.module.id);
			this.core.startModule(this.module.id, this.moduleStartOptions);

			this.core.stopModule(this.module.id, this.moduleStartOptions.instanceId);

			expect(destroy).toHaveBeenCalledTimes(1);
			expect
		});

		it("should create hook in module destroy when stop a module", function (this: TestsContext) {
			this.core.init();
			this.core.addModule(this.module.id, this.moduleFactory);
			this.core.startModule(this.module.id, this.moduleStartOptions);
			const destroy = spyOn(this.module, "destroy");
			const createHook = spyOn(this.core, "createHook").and.callThrough();

			this.core.stopModule(this.module.id, this.moduleStartOptions.instanceId);

			expect(createHook).toHaveBeenCalledTimes(1);
			expect(createHook).toHaveBeenCalledWith("onModuleDestroy", this.module.destroy, this.module);
			expect(destroy).toHaveBeenCalledTimes(1);
			expect(destroy.calls.first().object).toBe(this.module);
		});

		it("should not throw when stop a module and its destroy throws", function (this: TestsContext) {
			const destroy = spyOn(this.module, "destroy").and.throwError("");
			this.core.init();
			this.core.addModule(this.module.id, this.moduleFactory);
			this.core.startModule(this.module.id);

			expect(() => this.core.stopModule(this.module.id)).not.toThrowError();
			expect(destroy).toHaveBeenCalledTimes(1);
			expect(Object.keys(this.core.runningModules).length).toEqual(1);
			expect(this.core.runningModules[this.module.id][0]).toEqual(this.module.id);
		});
	});

	describe("MessageBus", () => {
		it("should delegate to message bus when subscribe", function (this: TestsContext) {
			const onMessage = spyOn(this.messageBus, "onMessage").and.callThrough();
			const message = "message";
			const handler = () => true;

			const returnValue = this.core.onMessage(message, handler);

			expect(onMessage).toHaveBeenCalledTimes(1);
			expect(onMessage).toHaveBeenCalledWith(message, handler);
			expect(typeof returnValue).toEqual("function");
		});

		it("should delegate to message bus when publish", function (this: TestsContext) {
			const publish = spyOn(this.messageBus, "publishAsync");
			const message: jc.Message = { type: "message" };

			this.core.publishAsync(message);

			expect(publish).toHaveBeenCalledTimes(1);
			expect(publish).toHaveBeenCalledWith(message);
		});
	});

	describe("Extensions", () => {
		it("should throw when extensions are not an array", function (this: TestsContext) {
			expect(() => this.core.use(null)).toThrowError();
		});

		it("should throw when use an extension after init", function (this: TestsContext) {
			this.core.init();

			expect(() => this.core.use([])).toThrowError();
		});

		it("should throw when extension is not an object", function (this: TestsContext) {
			expect(() => this.core.use([null])).toThrowError();
		});

		it("should not throw when extension install doesn't return plugins", function (this: TestsContext) {
			const extension: jc.Extension = {
				name: "test",
				install: () => undefined
			};
			const install = spyOn(extension, "install");

			this.core.use([extension]);
			this.core.init();

			expect(install).toHaveBeenCalledTimes(1);
		});

		it("should throw when extension name is empty", function (this: TestsContext) {
			const extension: jc.Extension = {
				name: "",
				install: () => undefined
			};
			expect(() => this.core.use([extension])).toThrowError();
		});

		it("should throw when extension install is not a function", function (this: TestsContext) {
			const extension: jc.Extension = {
				name: "test-extension",
				install: null
			};
			expect(() => this.core.use([extension])).toThrowError();
		});

		it("should throw when extension has already been installed", function (this: TestsContext) {
			const extension: jc.Extension = {
				name: this.moduleAutosubscribeExtension.name,
				install: () => undefined
			};
			expect(() => this.core.use([extension])).toThrowError();
		});

		it("should pass itself to extension's install", function (this: TestsContext) {
			const extension: jc.Extension = {
				name: "test",
				install: () => undefined
			};
			const install = spyOn(extension, "install");

			this.core.use([extension]);
			this.core.init();

			const args = install.calls.argsFor(0);
			expect(args.length).toEqual(1);
			expect(args[0]).toBe(this.core);
		});

		it("should delegate to hooks system when add plugin", function (this: TestsContext) {
			const addPlugin = spyOn(this.hooksSystem, "addPlugin");
			const plugins = {
				onModuleInit: () => true,
				onModuleDestroy: () => true
			};
			const hooks = Object.keys(plugins);
			const extension: jc.Extension = {
				name: "test",
				install: () => plugins
			};

			this.core.use([extension]);
			this.core.init();

			expect(hooks.length).toEqual(2);
			hooks.forEach(hook => {
				expect(addPlugin).toHaveBeenCalledWith(hook, plugins[hook]);
			});
		});
	});
});