namespace spaMVP {
    "use strict";

    import hidden = spaMVP.Hidden;

    let onApplicationRunAction = function () { };

    let onApplicationRunCustomAction = function () { };

    interface HookList {
        [name: string]: Function[];
    }

    interface SubscriberList {
        [type: string]: { handler: Function, context: any }[];
    }

    interface ModuleList {
        [id: string]: { create: (sb: Sandbox) => Module, instances: ModuleHolders };
    }

    interface ModuleHolders {
        [instanceId: string]: Module;
    }

    function addSubscriber(eventType: string, handler: Function, context?: Object): void {
        this.subscribers[eventType] = this.subscribers[eventType] || [];
        this.subscribers[eventType].push({
            handler: handler,
            context: context
        });
    }

    function removeSubscriber(eventType: string, handler: Function, context?: Object): void {
        let subscribers = this.subscribers[eventType] || [];
        for (let i = 0, len = subscribers.length; i < len; i++) {
            let subscriber = subscribers[i];
            if (subscriber.handler === handler &&
                subscriber.context === context) {
                subscribers[i] = subscribers[len - 1];
                subscribers.length--;
                return;
            }
        }
    }

    function onDomReady(ev: Event): void {
        document.removeEventListener("DOMContentLoaded", onDomReady);
        onApplicationRunCustomAction();
        onApplicationRunAction();
    }

    function runPlugins(hookType: HookType, ...params: any[]): void {
        let plugins = this.hooks[hookType];
        if (!Array.isArray(plugins)) {
            return;
        }

        let argumentsLength = arguments.length;
        let args = new Array(argumentsLength - 1);
        for (let i = 1; i < argumentsLength; i++) {
            args[i - 1] = arguments[i];
        }

        for (let i = 0, len = plugins.length; i < len; i++) {
            try {
                plugins[i].apply(null, args);
            } catch (ex) {
                let argsDetails = args.length > 0 ? args.join(", ") : "none";
                console.error(`Plugin execution failed on hook ${HookType[hookType]}. Arguments: ${argsDetails}. Message: ${ex}`);
            }
        }
    }

    export interface Core {
        Sandbox: SandboxConstructor;

        subscribe(eventTypes: string[], handler: (type: string, data: any) => void, context?: any): this;
        unsubscribe(eventTypes: string[], handler: (type: string, data: any) => void, context?: any): this;
        publish(type: string, data: any): this;

        register(moduleId: string, moduleFactory: (sb: Sandbox) => Module): this;
        start(moduleId: string, options?: Object): this;
        stop(moduleId: string, instanceId?: string): this;
        getModules(): string[];

        hook(hookType: HookType, plugin: Function): this;
        run(action?: Function): this;
    }

    export interface Module {
        init(options?: Object): void;
        destroy(): void;
    }

    export enum HookType {
        SPA_DOMReady = 0,
        SPA_ModuleDestroy,
        SPA_ModuleInit,
        SPA_ModuleRegister,
        SPA_Publish,
        SPA_Subscribe,
        SPA_Unsubscribe,
    }

    export class Core implements Core {
        private subscribers: SubscriberList = {};
        private modules: ModuleList = {};
        private hooks: HookList = {};

        constructor(sandboxType?: SandboxConstructor) {
            this.Sandbox = typeof sandboxType === "function" ? sandboxType : Sandbox;
        }

        /**
         *  Subscribes for given events.
         *  @param {Array} eventTypes - Array of events to subscribe for.
         *  @param {Function} handler - The events' handler.
         *  @param {Object} context - Handler's context.
         */
        subscribe(eventTypes: string[], handler: (type: string, data: any) => void, context?: any): this {
            let errorMsg = "Subscribing failed:";
            hidden.typeGuard("function", handler, `${errorMsg} event handler should be a function.`);
            hidden.typeGuard("array", eventTypes, `${errorMsg} event types should be passed as an array of strings.`);

            runPlugins.call(this, HookType.SPA_Subscribe, eventTypes);
            for (let i = 0, len = eventTypes.length; i < len; i++) {
                addSubscriber.call(this, eventTypes[i], handler, context);
            }

            return this;
        }

        /**
         *  Unsubscribes for specific events.
         *  @param {Array} eventTypes - Array of events to unsubscribe for.
         *  @param {Function} handler - The handler which must be unsubscribed.
         *  @param {Object} context - Handler's context.
         */
        unsubscribe(eventTypes: string[], handler: (type: string, data: any) => void, context?: any): this {
            let errorMsg = "Unsubscribing failed:";
            hidden.typeGuard("function", handler, `${errorMsg} event handler should be a function.`);
            hidden.typeGuard("array", eventTypes, `${errorMsg} event types should be passed as an array of strings.`);

            runPlugins.call(this, HookType.SPA_Unsubscribe, eventTypes);
            for (let i = 0, len = eventTypes.length; i < len; i++) {
                removeSubscriber.call(this, eventTypes[i], handler, context);
            }

            return this;
        }

        /**
         *  Publishes an event.
         *  @param {String} type - Type of the event.
         *  @param {*} [data] - Optional data.
         */
        publish(type: string, data: any): this {
            if (!Array.isArray(this.subscribers[type])) {
                return;
            }

            runPlugins.call(this, HookType.SPA_Publish, type, data);
            this.subscribers[type]
                .slice(0)
                .forEach(subscriber => subscriber.handler.call(subscriber.context, type, data));
        }

        /**
         *  Registers a module.
         *  @param {string} moduleId
         *  @param {function} moduleFactory - function which provides an instance of the module.
         */
        register(moduleId: string, moduleFactory: (sb: Sandbox) => Module): this {
            let errorMsg = `${moduleId} registration failed:`;
            hidden.typeGuard("string", moduleId, `${errorMsg} module ID must be a string.`);
            hidden.typeGuard("string", moduleId, `${errorMsg} module ID must be a string.`);
            hidden.typeGuard("undefined", this.modules[moduleId], `${errorMsg} module with such id has been already registered.`);
            let tempModule = moduleFactory(new this.Sandbox(this, moduleId));
            hidden.typeGuard("function", tempModule.init, `${errorMsg} module does not implement init method.`);
            hidden.typeGuard("function", tempModule.destroy, `${errorMsg} module does not implement destroy method.`);

            runPlugins.call(this, HookType.SPA_ModuleRegister, moduleId, moduleFactory);
            this.modules[moduleId] = {
                create: moduleFactory,
                instances: {}
            };
            return this;
        }

        /**
         *  Starts an instance of given module and initializes it.
         *  @param {string} moduleId - Id of the module, which must be started.
         *  @param {object} options
         */
        start(moduleId: string, options?: Object): this {
            let module = this.modules[moduleId];
            options = options || {};

            let errorMsg = `${moduleId} initialization failed:`;
            hidden.typeGuard("object", module, `${errorMsg} module not found.`);
            hidden.typeGuard("object", options, `${errorMsg} module options must be an object.`);

            let instanceId = options["instanceId"] || moduleId;
            if (module.instances.hasOwnProperty(instanceId)) {
                // already initialized
                return this;
            }

            runPlugins.call(this, HookType.SPA_ModuleInit, moduleId, options);

            let instance = module.create(new this.Sandbox(this, instanceId));
            module.instances[instanceId] = instance;
            instance.init(options);
            return this;
        }

        /**
         *  Stops a given module.
         *  @param {string} moduleId - Id of the module, which must be stopped.
         *  @param {string} [instanceId] - Specific module's instance id.
         */
        stop(moduleId: string, instanceId?: string): this {
            let module = this.modules[moduleId];
            let id = instanceId || moduleId;
            if (module && module.instances.hasOwnProperty(id)) {
                runPlugins.call(this, HookType.SPA_ModuleDestroy, moduleId, instanceId);

                module.instances[id].destroy();
                delete module.instances[id];
            }

            return this;
        }

        /**
         *  Get all registered module ids.
         */
        getModules(): string[] {
            return Object.keys(this.modules);
        }

        /**
         *  Hooks a given function to specific hook type.
         *  @param {HookType} hookType - The hook type.
         *  @param {function} plugin - The function needs to hook.
         */
        hook(hookType: HookType, plugin: Function): this {
            let errorMsg = "Hook plugin failed:";
            hidden.typeGuard("number", hookType, `${errorMsg} hook type should be an HookType enum.`);
            hidden.typeGuard("function", plugin, `${errorMsg} plugin should be a function.`);

            if (!Array.isArray(this.hooks[hookType])) {
                this.hooks[hookType] = [];
            }

            this.hooks[hookType].push(plugin);
            return this;
        }

        /**
         *  Start listening for hash change if there are any registered routes.
         *  @param {Function} action Optional action to be executed before core initialization.
         */
        run(action?: () => void): this {
            onApplicationRunCustomAction = typeof action === "function" ? action : onApplicationRunCustomAction;
            onApplicationRunAction = () => {
                runPlugins.call(this, HookType.SPA_DOMReady);
            };

            if (document.readyState === "complete" ||
                document.readyState === "interactive" ||
                document.readyState === "loaded" /* old safari browsers */) {
                onDomReady(null);
            }
            else {
                document.addEventListener("DOMContentLoaded", onDomReady);
            }

            return this;
        }
    }
}