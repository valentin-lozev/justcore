import "../polyfills";
import { Sandbox } from "./Sandbox";
import { HooksBehavior } from "./HooksBehavior";
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
	private _hooksBehavior: HooksBehavior = null;
	private _messageBus: MessageBus = null;
	private _extensions: { [name: string]: dcore.Extension; } = Object.create(null);
	private _modules: { [id: string]: ModuleData; } = Object.create(null);

	constructor(hooksBehavior = new HooksBehavior(), messageBus = new MessageBus()) {
		this._hooksBehavior = hooksBehavior;
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
	 *	Installs extensions.
	 * @param extensions
	 */
	use(extensions: dcore.Extension[]): void {
		guard
			.false(this._isInitialized, "use(): extensions must be installed before init")
			.array(extensions, "use(): extensions must be passed as an array");

		extensions.forEach(x => {
			guard
				.object(x, "use(): extension must be an object")
				.nonEmptyString(x.name, "use(): extension name must be a non empty string")
				.function(x.install, `use(): "${x.name}" extension's install must be a function`)
				.false(x.name in this._extensions, `use(): "${x.name}" extension has already been installed`);

			this._extensions[x.name] = x;
		});
	}

	/**
	 *  Creates a pipeline from given method on given hook.
	 */
	createPipeline<T extends dcore.Func>(hook: dcore.LifecycleHook, method: T): T & dcore.FuncWithPipeline {
		return this._hooksBehavior.createPipeline(hook, method);
	}

	/**
	 *  Initializes dcore.
	 */
	init(onInit?: dcore.Func<void>): void {
		guard.false(this._isInitialized, "init(): has already been initialized");

		this._onInit = this.createPipeline("onCoreInit", onInit || function () { });
		this._initHooks();
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
			.nonEmptyString(id, "addModule(): id must be a non empty string")
			.undefined(this._modules[id], `addModule(): "${id}" has already been added`)
			.function(factory, `addModule(): "${id}" factory must be a function`);

		this._modules[id] = {
			factory: factory,
			instances: Object.create(null)
		};
	}

	/**
	 *  Starts an instance of given module and initializes it.
	 */
	startModule(id: string, options: dcore.ModuleStartOptions = {}): void {
		const moduleData = this._modules[id];
		guard
			.true(this._isInitialized, "startModule(): dcore must be initialized first")
			.defined(moduleData, `startModule(): "${id}" not found`);

		const instanceId = options.instanceId || id;
		if (instanceId in moduleData.instances) {
			console.warn(`startModule(): "${id}" "${instanceId}" has already been initialized`);
			return;
		}

		let instance = this._createModule(id, instanceId, moduleData.factory);
		if (!instance) {
			return;
		}

		try {
			this.createPipeline("onModuleInit", instance.init).call(instance, options.props);
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
			this.createPipeline("onModuleDestroy", instance.destroy).call(instance);
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
	onMessage(messageType: string, handler: dcore.MessageHandler): dcore.Unsubscribe {
		return this._messageBus.onMessage(messageType, handler);
	}

	/**
	 *	Publishes a message.
	 * @param message
	 */
	publishAsync<T extends dcore.Message>(message: T): void {
		this._messageBus.publishAsync(message);
	}

	/**
	 *	Lists all installed extensions.
	 */
	listExtensions(): string[] {
		return Object.keys(this._extensions);
	}

	/**
	 *  Lists all added module ids.
	 */
	listModules(): string[] {
		return Object.keys(this._modules);
	}

	/**
	 *  Lists all running module instances by their id.
	 */
	listRunningModules(): { [id: string]: string[]; } {
		return this.listModules()
			.reduce((result, id) => {
				result[id] = Object.keys(this._modules[id].instances);
				return result;
			}, Object.create(null));
	}

	private _initHooks(): void {
		this.addModule = this.createPipeline("onModuleAdd", this.addModule);
		this.startModule = this.createPipeline("onModuleStart", this.startModule);
		this.stopModule = this.createPipeline("onModuleStop", this.stopModule);
		this.onMessage = this.createPipeline("onMessageSubscribe", this.onMessage);
		this.publishAsync = this.createPipeline("onMessagePublish", this.publishAsync);
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
			.forEach(hook =>
				this._hooksBehavior.addPlugin(hook as dcore.LifecycleHook, plugins[hook])
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
				.true(result.sandbox instanceof this.Sandbox, `startModule(): "${id}.sandbox" must be a Sandbox instance`)
				.function(result.init, `startModule(): "${id}" must implement init method`)
				.function(result.destroy, `startModule(): "${id}" must implement destroy method`);
		} catch (err) {
			result = null;
			console.error(err);
		}

		return result;
	}
}