/** 
 *  @license dcore - v1.0.1
 *  Copyright © 2016 Valentin Lozev 
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *  Source code: http://github.com/valentin-lozev/dcore
 */
interface DSandboxConstructor {
    new (core: DCore, moduleInstanceId: string): DSandbox;
}

interface DSandbox {
    moduleInstanceId: string;

    subscribe(topics: string[], handler: (topic: string, data: any) => void): DSubscriptionToken;
    publish(topic: string, data: any): this;

    start(moduleId: string, options?: Object): this;
    stop(moduleId: string, instanceId?: string): this;
}

namespace dcore {
    "use strict";

    /**
     *  @class Sandbox - Connects all modules to the outside world.
     *  @property {String} moduleInstanceId - Id of the module it serves for.
     */
    export class DefaultSandbox implements DSandbox {
        private core: DCore;
        public moduleInstanceId: string;

        constructor(core: DCore, moduleInstanceId: string) {
            if (!core || !moduleInstanceId) {
                throw new Error("DefaultSandbox: Missing core or module instance ID");
            }

            this.core = core;
            this.moduleInstanceId = moduleInstanceId;
        }

        /**
         *  Subscribes for given topics.
         *  @param {Array} topics Array of topics to subscribe for.
         *  @param {Function} handler The message handler.
         *  @returns {Object}
         */
        subscribe(topics: string[], handler: (topic: string, data: any) => void): DSubscriptionToken {
            return this.core.subscribe(topics, handler);
        }

        /**
         *  Publishes a message.
         *  @param {String} topic The topic of the message.
         *  @param {*} [data] Optional data.
         */
        publish(topic: string, data: any): this {
            this.core.publish(topic, data);
            return this;
        }

        /**
         *  Starts an instance of given module and initializes it.
         *  @param {string} moduleId Id of the module which must be started.
         *  @param {object} [options] Optional options.
         */
        start(moduleId: string, options?: Object): this {
            this.core.start(moduleId, options);
            return this;
        }

        /**
         *  Stops a given module.
         *  @param {string} moduleId Id of the module which must be stopped.
         *  @param {string} [instanceId] Optional. Specific module's instance id.
         */
        stop(moduleId: string, instanceId?: string): this {
            this.core.stop(moduleId, instanceId);
            return this;
        }
    }
}
interface DCore {
    Sandbox: DSandboxConstructor;
    state: DCoreState;

    subscribe(topics: string[], handler: (topic: string, data: any) => void): DSubscriptionToken;
    publish(topic: string, data: any): this;

    register(moduleId: string, moduleFactory: (sb: DSandbox) => DModule): this;
    start(moduleId: string, options?: Object): this;
    stop(moduleId: string, instanceId?: string): this;
    listModules(): string[];

    hook(hookType: string, plugin: () => boolean): this;
    run(action?: Function): this;
}

interface DCoreState {
    isRunning: boolean;
    isDebug: boolean;
}

interface DSubscriptionToken {
    destroy(topic?: string): void;
}

interface DModule {
    init(options?: Object): void;
    destroy(): void;
}

namespace dcore {
    "use strict";

    let hasOwnProperty = Object.prototype.hasOwnProperty;
    let lastUsedSubscriptionID = 0;

    interface HookList {
        [name: string]: Function[];
    }

    interface SubscriberList {
        [topic: string]: TopicHandlerList;
    }

    interface TopicHandlerList {
        [tokenId: string]: Function;
    }

    interface ModuleList {
        [id: string]: { create: (sb: DSandbox) => DModule, instances: ModuleHolders };
    }

    interface ModuleHolders {
        [instanceId: string]: DModule;
    }

    function typeGuard(expected: string, value: any, errorMsg: string): void {
        let toThrow = false;
        switch (expected) {
            case "array": toThrow = !Array.isArray(value); break;
            default: toThrow = typeof value !== expected || value === null;
        }

        if (toThrow) {
            throw new TypeError(errorMsg);
        }
    }

    function runPlugins(hookType: string, ...params: any[]): boolean {
        if (!this.state.isRunning) {
            throw new Error("runPlugins(): Core is not running");
        }

        let plugins = this.hooks[hookType];
        if (!Array.isArray(plugins)) {
            return true;
        }

        let argumentsLength = arguments.length;
        let args = new Array(argumentsLength - 1);
        for (let i = 1; i < argumentsLength; i++) {
            args[i - 1] = arguments[i];
        }

        for (let i = 0, len = plugins.length; i < len; i++) {
            try {
                if (!plugins[i].apply(null, args)) {
                    return false;
                }
            } catch (err) {
                let argsDetails = args.length > 0 ? args.join(", ") : "none";
                console.error(`runPlugins(): Execution failed on hook ${hookType}`);
                console.error(`runPlugins(): Execution arguments: ${argsDetails}`);
                console.error(`runPlugins(): Error: ${err}`);
            }
        }

        return true;
    }

    function addSubscriber(topic: string, handler: Function): string {
        if (!hasOwnProperty.call(this.subscribers, topic)) {
            this.subscribers[topic] = {};
        }

        let subscriptionID = "sbscrptn" + (++lastUsedSubscriptionID);
        this.subscribers[topic][subscriptionID] = handler;
        return subscriptionID;
    }

    export const HOOK_DOM_READY = "dom-ready";
    export const HOOK_MODULE_DESTROY = "module-destroy";
    export const HOOK_MODULE_DESTROYED = "module-destroyed";
    export const HOOK_MODULE_INITIALIZE = "module-init";
    export const HOOK_MODULE_INITIALIZED = "module-initialized";
    export const HOOK_MODULE_REGISTER = "module-register";
    export const HOOK_MODULE_REGISTERED = "module-registered";
    export const HOOK_MODULE_PUBLISH = "module-publish";
    export const HOOK_MODULE_SUBSCRIBE = "module-subscribe";
    export const HOOK_MODULE_UNSUBSCRIBE = "module-unsubscribe";

    export class Instance implements DCore {
        private subscribers: SubscriberList = {};
        private modules: ModuleList = {};
        private hooks: HookList = {};
        private beforeRunAction: Function;
        public state: DCoreState;
        public Sandbox: DSandboxConstructor;

        constructor(sandboxType?: DSandboxConstructor, isDebug = true) {
            this.Sandbox = typeof sandboxType === "function" ? sandboxType : DefaultSandbox;
            this.state = {
                isDebug: !!isDebug,
                isRunning: false
            };
        }

        /**
         *  Subscribes for given topics.
         *  @param {Array} topics Array of topics to subscribe for.
         *  @param {Function} handler The message handler.
         *  @returns {Object}
         */
        subscribe(topics: string[], handler: (topic: string, data: any) => void): DSubscriptionToken {
            let errorMsg = "subscribe() failed:";
            typeGuard("function", handler, `${errorMsg} message handler should be a function.`);
            typeGuard("array", topics, `${errorMsg} topics should be passed as an array of strings.`);

            if (!runPlugins.call(this, HOOK_MODULE_SUBSCRIBE, topics)) {
                return {
                    destroy: function () { }
                };
            }

            let token = {};
            for (let i = 0, len = topics.length; i < len; i++) {
                let topic = topics[i];
                let subscriptionID = addSubscriber.call(this, topic, handler);
                token[topic] = subscriptionID;
            }

            let that = this;
            return {
                destroy: function (topic?: string): void {
                    if (arguments.length === 0) {
                        Object.keys(token).forEach(t => {
                            runPlugins.call(that, HOOK_MODULE_UNSUBSCRIBE, t);
                            let subscriptionID = token[t];
                            delete that.subscribers[t][subscriptionID];
                        });
                        return;
                    }

                    if (hasOwnProperty.call(token, topic)) {
                        runPlugins.call(that, HOOK_MODULE_UNSUBSCRIBE, topic);
                        let subscriptionID = token[topic];
                        delete that.subscribers[topic][subscriptionID];
                    }
                }
            };
        }

        /**
         *  Publishes a message.
         *  @param {String} topic he topic of the message.
         *  @param {*} [data] Optional data.
         */
        publish(topic: string, data: any): this {
            if (!hasOwnProperty.call(this.subscribers, topic)) {
                return this;
            }

            if (!runPlugins.call(this, HOOK_MODULE_PUBLISH, topic, data)) {
                return this;
            }

            let subscriptions = this.subscribers[topic];
            Object.keys(subscriptions)
                .forEach(key => {
                    let handler = subscriptions[key];
                    try {
                        // let the browser breathе
                        setTimeout(() => handler(topic, data), 0);
                    } catch (ex) {
                        setTimeout(() => {
                            console.info(`${topic} message publishing failed. Subscriber:`);
                            console.info(handler);
                        }, 0);
                    }
                });
            return this;
        }

        /**
         *  Registers a module.
         *  @param {string} moduleId
         *  @param {function} moduleFactory Function which provides an instance of the module.
         */
        register(moduleId: string, moduleFactory: (sb: DSandbox) => DModule): this {
            let errorMsg = `register() failed:`;
            typeGuard("string", moduleId, `${errorMsg} module ID must be a string - ${moduleId}`);
            typeGuard("undefined", this.modules[moduleId], `${errorMsg} module with such id has been already registered - ${moduleId}`);
            let tempModule = moduleFactory(new this.Sandbox(this, moduleId));
            typeGuard("function", tempModule.init, `${errorMsg} module does not implement init method`);
            typeGuard("function", tempModule.destroy, `${errorMsg} module does not implement destroy method`);

            if (!runPlugins.call(this, HOOK_MODULE_REGISTER, moduleId, moduleFactory)) {
                return this;
            }

            this.modules[moduleId] = {
                create: moduleFactory,
                instances: {}
            };
            runPlugins.call(this, HOOK_MODULE_REGISTERED, moduleId, moduleFactory);

            return this;
        }

        /**
         *  Starts an instance of given module and initializes it.
         *  @param {string} moduleId Id of the module which must be started.
         *  @param {object} [options] Optional options.
         */
        start(moduleId: string, options?: Object): this {
            let module = this.modules[moduleId];
            options = options || {};

            let errorMsg = `start() failed:`;
            typeGuard("object", module, `${errorMsg} module not found - ${moduleId}`);
            typeGuard("object", options, `${errorMsg} module options must be an object`);

            let instanceId = options["instanceId"] || moduleId;
            if (hasOwnProperty.call(module.instances, instanceId)) {
                // already initialized
                return this;
            }

            if (!runPlugins.call(this, HOOK_MODULE_INITIALIZE, moduleId, options)) {
                return this;
            }

            let instance = module.create(new this.Sandbox(this, instanceId));
            module.instances[instanceId] = instance;
            instance.init(options);

            runPlugins.call(this, HOOK_MODULE_INITIALIZED, moduleId, options);
            return this;
        }

        /**
         *  Stops a given module.
         *  @param {string} moduleId Id of the module, which must be stopped.
         *  @param {string} [instanceId] Specific module's instance id.
         */
        stop(moduleId: string, instanceId?: string): this {
            let module = this.modules[moduleId];
            let id = instanceId || moduleId;
            if (module && hasOwnProperty.call(module.instances, id)) {
                if (!runPlugins.call(this, HOOK_MODULE_DESTROY, moduleId, instanceId)) {
                    return this;
                }

                try {
                    module.instances[id].destroy();
                    runPlugins.call(this, HOOK_MODULE_DESTROYED, moduleId, instanceId);
                } catch (err) {
                    console.warn(`${moduleId} destroy failed: An error has occured within the module:`);
                    console.error(err);
                } finally {
                    delete module.instances[id];
                }
            } else {
                console.warn(`${moduleId} destroy failed: ${instanceId} instance not found.`);
            }

            return this;
        }

        /**
         *  Lists all registered module ids.
         */
        listModules(): string[] {
            return Object.keys(this.modules);
        }

        /**
         *  Hooks a given function to specific hook type.
         *  The execution pipeline depends on the hook type return parameter -
         *  If it is evaluated to true, pipeline continues, if not, pipeline stops.
         *  Errors do not affect the execution pipeline.
         *  @param {string} hookType The hook type.
         *  @param {function} plugin The function needs to hook. It must return true in order to continue the pipeline.
         */
        hook(hookType: string, plugin: () => boolean): this {
            let errorMsg = "hook() failed:";
            typeGuard("string", hookType, `${errorMsg} hook type should be a string`);
            typeGuard("function", plugin, `${errorMsg} plugin should be a function`);

            if (!Array.isArray(this.hooks[hookType])) {
                this.hooks[hookType] = [];
            }

            this.hooks[hookType].push(plugin);
            return this;
        }

        /**
         *  Runs the core.
         *  @param {Function} [action] Optional. A setup action executed before core run.
         */
        run(action?: () => void): this {
            if (this.state.isRunning) {
                return;
            }

            this.beforeRunAction = action;
            this._onDomReady = this._onDomReady.bind(this);

            if (document.readyState === "complete" ||
                document.readyState === "interactive" ||
                document.readyState === "loaded" /* old safari browsers */) {
                this._onDomReady(null);
            } else {
                document.addEventListener("DOMContentLoaded", this._onDomReady);
            }

            return this;
        }

        private _onDomReady(ev: Event): void {
            document.removeEventListener("DOMContentLoaded", this._onDomReady);
            this.state.isRunning = true;
            if (typeof this.beforeRunAction === "function") {
                this.beforeRunAction();
            }

            runPlugins.call(this, HOOK_DOM_READY);
        }
    }

    /**
     *  Creates an application core instance.
     * @param {function} [sandboxType] Optional. Custom sandbox type.
     * @returns {Core}
     */
    export function createOne(sandboxType?: DSandboxConstructor, isDebug = true): DCore {
        return new Instance(sandboxType, isDebug);
    }
}