import "../polyfills";
import { Sandbox } from "./Sandbox";
import { HooksSystem } from "./HooksSystem";
import { MessageBus } from "./MessageBus";
import { moduleAutosubscribe } from "../extensions/module-autosubscribe";
import {
	guard,
	isDocumentReady,
	VERSION
} from "../utils";

interface ModuleData {
	factory: dcore.ModuleFactory;
	instances: { [instanceId: string]: dcore.Module; };
}

/**
 *  A mediator between the modules.
 */
export class DCore implements dcore.Core {

	public Sandbox: dcore.SandboxClass = Sandbox;
	private _isInitialized: boolean = false;
	private _onInit: dcore.Func<void> = null;
	private _hooksSystem: HooksSystem = null;
	private _messageBus: MessageBus = null;
	private _extensions: { [name: string]: dcore.Extension; } = Object.create(null);
	private _modules: { [id: string]: ModuleData; } = Object.create(null);

	constructor(hooksSystem = new HooksSystem(), messageBus = new MessageBus()) {
		this._hooksSystem = hooksSystem;
		this._messageBus = messageBus;
		this._onDomReady = this._onDomReady.bind(this);
		this.use([
			// built-in extensions
			moduleAutosubscribe()
		]);
	}

	/**
	 *	Returns current dcore version.
	 */
	get version(): string {
		return VERSION;
	}

	/**
	 *	Lists all installed extensions.
	 */
	get extensions(): string[] {
		return Object.keys(this._extensions);
	}

	/**
	 *  Lists all added module ids.
	 */
	get modules(): string[] {
		return Object.keys(this._modules);
	}

	/**
	 *  Lists all running module instances by their id.
	 */
	get runningModules(): { [id: string]: string[]; } {
		return this.modules
			.reduce((result, id) => {
				result[id] = Object.keys(this._modules[id].instances);
				return result;
			}, Object.create(null));
	}

	/**
	 *	Installs extensions.
	 * @param extensions
	 */
	use(extensions: dcore.Extension[]): void {
		guard
			.false(this._isInitialized, "m1")
			.array(extensions, "m2");

		extensions.forEach(x => {
			guard
				.object(x, "m3")
				.nonEmptyString(x.name, "m4")
				.function(x.install, "m5", x.name)
				.false(x.name in this._extensions, "m6", x.name);

			this._extensions[x.name] = x;
		});
	}

	/**
	 *  Creates a hook from given method.
	 */
	createHook<T extends dcore.Func>(type: dcore.HookType, method: T, context?: any): T & dcore.Hook {
		return this._hooksSystem.createHook(type, method, context);
	}

	/**
	 *  Initializes dcore.
	 */
	init(onInit?: dcore.Func<void>): void {
		guard.false(this._isInitialized, "m7");

		this._onInit = this.createHook("onCoreInit", onInit || function () { }, this);
		this._createHooks();
		this._installExtensions();

		if (isDocumentReady()) {
			setTimeout(this._onDomReady, 0);
		} else {
			document.addEventListener("DOMContentLoaded", this._onDomReady);
		}

		this._isInitialized = true;
	}

	/**
	 *  Adds a module.
	 */
	addModule(id: string, factory: dcore.ModuleFactory): void {
		guard
			.nonEmptyString(id, "m8")
			.false(id in this._modules, "m9")
			.function(factory, "m10", id);

		this._modules[id] = {
			factory: factory,
			instances: Object.create(null)
		};
	}

	/**
	 *  Starts an instance of given module and initializes it.
	 */
	startModule(id: string, options: dcore.ModuleStartOptions = {}): void {
		guard.true(this._isInitialized, "m11")
			.true(id in this._modules, "m12", id);

		const moduleData = this._modules[id];
		const instanceId = options.instanceId || id;
		let instance = moduleData.instances[instanceId];
		if (instance) {
			if (typeof instance.moduleDidReceiveProps === "function") {
				this.createHook(
					"onModuleReceiveProps",
					instance.moduleDidReceiveProps,
					instance)(options.props);
			}
			return;
		}

		instance = this._createModule(id, instanceId, moduleData.factory);
		if (!instance) {
			return;
		}

		try {
			this.createHook(
				"onModuleInit",
				instance.init,
				instance)(options.props);
			moduleData.instances[instanceId] = instance;
		} catch (err) {
			console.error(`startModule(): "${id}" init failed`);
			console.error(err);
		}
	}

	/**
	 *  Stops a given module instance.
	 */
	stopModule(id: string, instanceId?: string): void {
		const moduleData = this._modules[id];
		if (!moduleData) {
			console.warn(`stopModule(): "${id}" not found`);
			return;
		}

		instanceId = instanceId || id;
		if (!(instanceId in moduleData.instances)) {
			console.warn(`stopModule(): "${id}"'s "${instanceId}" instance is not running`);
			return;
		}

		try {
			const instance = moduleData.instances[instanceId];
			this.createHook("onModuleDestroy", instance.destroy, instance)();
			delete moduleData.instances[instanceId];
		} catch (err) {
			console.error(`stopModule(): "${id}" destroy failed`);
			console.error(err);
		}
	}

	/**
	 *	Subscribes for messages of given type.
	 * @param messageType
	 * @param handler
	 */
	onMessage(type: string, handler: dcore.MessageHandler): dcore.Unsubscribe {
		return this._messageBus.onMessage(type, handler);
	}

	/**
	 *	Publishes a message.
	 * @param message
	 */
	publishAsync<T extends dcore.Message>(message: T): void {
		this._messageBus.publishAsync(message);
	}

	private _createHooks(): void {
		this.addModule = this.createHook("onModuleAdd", this.addModule, this);
		this.startModule = this.createHook("onModuleStart", this.startModule, this);
		this.stopModule = this.createHook("onModuleStop", this.stopModule, this);
		this.onMessage = this.createHook("onMessageSubscribe", this.onMessage, this);
		this.publishAsync = this.createHook("onMessagePublish", this.publishAsync, this);
	}

	private _installExtensions(): void {
		Object
			.keys(this._extensions)
			.forEach(name => this._install(this._extensions[name]));
	}

	private _install(extension: dcore.Extension): void {
		const plugins = extension.install(this) || {};
		Object
			.keys(plugins)
			.forEach(hookType =>
				this._hooksSystem.addPlugin(hookType as dcore.HookType, plugins[hookType])
			);
	}

	private _onDomReady(): void {
		document.removeEventListener("DOMContentLoaded", this._onDomReady);
		this._onInit();
	}

	private _createModule(id: string, instanceId: string, factory: dcore.ModuleFactory): dcore.Module {
		let result: dcore.Module = null;
		try {
			result = factory(new this.Sandbox(this, id, instanceId));
			guard
				.true(result.sandbox instanceof this.Sandbox, "m13", id)
				.function(result.init, "m14", id)
				.function(result.destroy, "m15", id);
		} catch (err) {
			result = null;
			console.error(err);
		}

		return result;
	}
}