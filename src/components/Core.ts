import { moduleAutosubscribe } from "../extensions/module-autosubscribe";
import "../polyfills";
import { guard, isDocumentReady } from "../utils";
import { HooksSystem } from "./HooksSystem";
import { MessageBus } from "./MessageBus";
import { Sandbox } from "./Sandbox";

interface ModuleData {
    factory: jc.ModuleFactory;
    instances: Record<string, jc.Module>;
}

declare const VERSION: string;

export class Core implements jc.Core {

    public Sandbox: jc.SandboxClass = Sandbox;
    private _isInitialized: boolean = false;
    private _onInit: jc.Func<void> = null;
    private _hooksSystem: HooksSystem = null;
    private _messageBus: MessageBus = null;
    private _extensions: { [name: string]: jc.Extension; } = Object.create(null);
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

    get version(): string {
        return VERSION;
    }

    get extensions(): string[] {
        return Object.keys(this._extensions);
    }

    get modules(): string[] {
        return Object.keys(this._modules);
    }

    get runningModules(): { [id: string]: string[]; } {
        return this.modules
            .reduce((result, id) => {
                result[id] = Object.keys(this._modules[id].instances);
                return result;
            }, Object.create(null));
    }

    public use(extensions: jc.Extension[]): void {
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

    public createHook<T extends jc.Func>(type: jc.HookType, method: T, context?: any): T & jc.HookProps {
        return this._hooksSystem.createHook(type, method, context);
    }

    public init(onInit?: jc.Func<void>): void {
        guard.false(this._isInitialized, "m7");

        this._onInit = this.createHook("onCoreInit", onInit || function() { /* ignored */ }, this);
        this._createHooks();
        this._installExtensions();

        if (isDocumentReady()) {
            setTimeout(this._onDomReady, 0);
        } else {
            document.addEventListener("DOMContentLoaded", this._onDomReady);
        }

        this._isInitialized = true;
    }

    public addModule(id: string, factory: jc.ModuleFactory): void {
        guard
            .nonEmptyString(id, "m8")
            .false(id in this._modules, "m9")
            .function(factory, "m10", id);

        this._modules[id] = {
            factory: factory,
            instances: Object.create(null)
        };
    }

    public startModule(id: string, options: jc.ModuleStartOptions = {}): void {
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

    public stopModule(id: string, instanceId?: string): void {
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

    public onMessage(type: string, handler: jc.MessageHandler): jc.Unsubscribe {
        return this._messageBus.onMessage(type, handler);
    }

    public publishAsync<T extends jc.Message>(message: T): void {
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

    private _install(extension: jc.Extension): void {
        const plugins = extension.install(this) || {};
        Object
            .keys(plugins)
            .forEach(hookType =>
                this._hooksSystem.addPlugin(hookType as jc.HookType, plugins[hookType])
            );
    }

    private _onDomReady(): void {
        document.removeEventListener("DOMContentLoaded", this._onDomReady);
        this._onInit();
    }

    private _createModule(id: string, instanceId: string, factory: jc.ModuleFactory): jc.Module {
        let result: jc.Module = null;
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