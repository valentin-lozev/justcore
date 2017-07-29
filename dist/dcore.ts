/** 
 *  @license dcore.js
 *  Copyright © 2017 Valentin Lozev 
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *  Source code: http://github.com/valentin-lozev/dcore
 */

declare interface ObjectConstructor {
    assign(target: Object, ...objects: Object[]): Object;
}

if (typeof Object.assign != 'function') {
    Object.assign = function (target, varArgs) { // .length of function is 2
        'use strict';
        if (target == null) { // TypeError if undefined or null
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];

            if (nextSource != null) { // Skip over if undefined or null
                for (var nextKey in nextSource) {
                    // Avoid bugs when hasOwnProperty is shadowed
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

// Production steps of ECMA-262, Edition 5, 15.4.4.22
// Reference: http://es5.github.io/#x15.4.4.22
if (typeof Array.prototype.reduceRight !== 'function') {
    Array.prototype.reduceRight = function (callback /*, initialValue*/) {
        'use strict';
        if (null === this || 'undefined' === typeof this) {
            throw new TypeError('Array.prototype.reduce called on null or undefined');
        }
        if ('function' !== typeof callback) {
            throw new TypeError(callback + ' is not a function');
        }
        var t = Object(this), len = t.length >>> 0, k = len - 1, value;
        if (arguments.length >= 2) {
            value = arguments[1];
        } else {
            while (k >= 0 && !(k in t)) {
                k--;
            }
            if (k < 0) {
                throw new TypeError('Reduce of empty array with no initial value');
            }
            value = t[k--];
        }
        for (; k >= 0; k--) {
            if (k in t) {
                value = callback(value, t[k], k, t);
            }
        }
        return value;
    };
}

declare type DPlugin<TResponse> = (next: (...args: any[]) => TResponse, ...args: any[]) => TResponse;

interface DSubscriptionToken {
    destroy(topic?: string): void;
}

interface DCore {
    Sandbox: DSandboxConstructor;
    getState(): Readonly<DCoreState>;
    setState<TState extends keyof DCoreState>(value: Pick<DCoreState, TState>): void;

    subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken;
    publish(topic: string, message: any): void;

    register(moduleId: string, moduleFactory: (sb: DSandbox) => DModule<any>): void;
    start<TProps>(moduleId: string, props?: DModuleProps & TProps): void;
    stop(moduleId: string, instanceId?: string): void;
    listModules(): string[];

    hook<TResponse>(hookName: string, plugin: DPlugin<TResponse>): void;
    pipe<TResponse>(hookName: string, hookInvoker: (...args: any[]) => TResponse, hookContext: any, ...args: any[]): TResponse;

    run(action?: Function): void;
}

interface DCoreState {
    isRunning: boolean;
    isDebug: boolean;
}

interface DModule<TProps> {
    init<TProps>(props?: DModuleProps & TProps): void;
    destroy(): void;
}

interface DModuleProps {
    instanceId?: string;
}

interface DSandboxConstructor {
    new (core: DCore, moduleId: string, moduleInstanceId: string): DSandbox;
}

interface DSandbox {
    getModuleId(): string;
    getModuleInstanceId(): string;

    getAppState(): Readonly<DCoreState>;
    setAppState<TState extends keyof DCoreState>(value: Pick<DCoreState, TState>): void;

    subscribe(topic: string, handler: (topic: string, message: any) => void): DSubscriptionToken;
    subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken;
    publish(topic: string, message: any): void;

    start<TProps>(moduleId: string, props?: DModuleProps & TProps): void;
    stop(moduleId: string, instanceId?: string): void;
}
namespace dcore._private {
    "use strict";

    class DArgumentGuard {

        constructor(private errorMsgPrefix = "") {
        }

        mustBeTrue(arg: boolean, msg: string): this {
            if (!arg) throw new Error(this.errorMsgPrefix + msg);
            return this;
        }

        mustBeDefined(arg: any, msg: string): this {
            if (typeof arg === "undefined" || arg === null) throw new Error(this.errorMsgPrefix + msg);
            return this;
        }

        mustBeUndefined(arg: any, msg: string): this {
            if (typeof arg !== "undefined" && arg !== null) throw new Error(this.errorMsgPrefix + msg);
            return this;
        }

        mustBeNonEmptyString(arg: string, msg: string): this {
            if (typeof arg !== "string" || !arg.length) throw new Error(this.errorMsgPrefix + msg);
            return this;
        }

        mustBeFunction(arg: Function, msg: string): this {
            if (typeof arg !== "function") throw new Error(this.errorMsgPrefix + msg);
            return this;
        }

        mustBeArray(arg: any[], msg: string): this {
            if (!Array.isArray(arg)) throw new Error(this.errorMsgPrefix + msg);
            return this;
        }
    }

    export function argumentGuard(errorMsgPrefix = ""): DArgumentGuard {
        return new DArgumentGuard(errorMsgPrefix);
    }
}
namespace dcore._private {
    "use strict";

    interface SubscribersMap {
        [topic: string]: { [tokenId: string]: Function; };
    }

    const hasOwnProperty = Object.prototype.hasOwnProperty;

    let lastUsedSubscriptionID = 0;

    export class DMessagesAggregator {

        private subscribers: SubscribersMap = {};

        subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken {
            argumentGuard("subscribe(): ")
                .mustBeFunction(handler, "message handler should be a function.")
                .mustBeArray(topics, "topics should be passed as an array of strings.");

            let token = {};
            topics.forEach(topic => token[topic] = this.__addSubscriber(topic, handler));

            let that = this;
            return {
                destroy: function (topic?: string): void {
                    if (arguments.length > 0) {
                        that.__unsubscribe(topic, token);
                        return;
                    }

                    Object.keys(token).forEach(topic => that.__unsubscribe(topic, token));
                }
            };
        }

        publish(topic: string, message: any): void {
            if (!hasOwnProperty.call(this.subscribers, topic)) {
                return;
            }

            let subscriptions = this.subscribers[topic];
            Object.keys(subscriptions).forEach(key => {
                let handler = subscriptions[key];
                setTimeout(() => {
                    try {
                        handler(topic, message);
                    } catch (err) {
                        console.error(`publish(): Receive "${topic}" message failed.`);
                        console.error(err);
                        console.error(`Handler:`);
                        console.error(handler);
                    }
                }, 0);
            });
        }

        private __addSubscriber(topic: string, handler: Function): string {
            if (!hasOwnProperty.call(this.subscribers, topic)) {
                this.subscribers[topic] = {};
            }

            let subscriptionID = "sbscrptn" + (++lastUsedSubscriptionID);
            this.subscribers[topic][subscriptionID] = handler;
            return subscriptionID;
        }

        private __unsubscribe(topic: string, token: { [topic: string]: string; }): void {
            if (!hasOwnProperty.call(token, topic)) {
                return;
            }

            let subscriptionID = token[topic];
            delete this.subscribers[topic][subscriptionID];
        }
    }
}
namespace dcore._private {
    "use strict";

    interface PluginsMap {
        [hook: string]: DPlugin<any>[];
    }

    export class DPluginsPipeline {

        private pluginsMap: PluginsMap = {};

        hook<TResponse>(hookName: string, plugin: DPlugin<TResponse>): void {
            argumentGuard("hook(): ")
                .mustBeNonEmptyString(hookName, "hook name must be a non empty string")
                .mustBeFunction(plugin, "plugin must be a function");

            let list = this.pluginsMap[hookName];
            if (!list) {
                this.pluginsMap[hookName] = list = [];
            }

            list.push(plugin);
        }

        pipe<TResponse>(
            hookName: string,
            hookInvoker: (...args: any[]) => TResponse,
            hookContext: any,
            ...args: any[]): TResponse {

            argumentGuard("pipe(): ")
                .mustBeFunction(hookInvoker, "hook invoker must be a function");

            let pipeline = (this.pluginsMap[hookName] || [])
                .slice(0)
                .reduceRight(function (next, pipeline): () => TResponse {
                    return function (...args: any[]): TResponse {
                        return pipeline.apply(this, [next].concat(args));
                    };
                }, hookInvoker);

            const result = pipeline.apply(hookContext, args);
            pipeline = null;
            return result;
        }
    }
}
namespace dcore.hooks {
    "use strict";

    export const SANDBOX_SUBSCRIBE = "sandbox.subscribe";
    export const SANDBOX_PUBLISH = "sandbox.publish";
    export const SANDBOX_START = "sandbox.start";
    export const SANDBOX_STOP = "sandbox.stop";
}

namespace dcore {
    "use strict";

    import _privateData = _private;
    
    /**
     *  Connects the modules to the outside world. Facade of the core.
     */
    export class Sandbox implements DSandbox {

        private core: DCore;
        private moduleId: string;
        private moduleInstanceId: string;

        constructor(core: DCore, moduleId: string, moduleInstanceId: string) {
            _privateData.argumentGuard("DefaultSandbox: ")
                .mustBeDefined(core, "core must be provided")
                .mustBeNonEmptyString(moduleId, "module id must be a non empty string")
                .mustBeNonEmptyString(moduleInstanceId, "module instance id must be a non empty string");

            this.core = core;
            this.moduleId = moduleId;
            this.moduleInstanceId = moduleInstanceId;
        }

        /**
         *  Gets the module id it serves for.
         */
        getModuleId(): string {
            return this.moduleId;
        }

        /**
         *  Gets the module instance id it serves for.
         */
        getModuleInstanceId(): string {
            return this.moduleInstanceId;
        }

        /**
         *  Gets application's current state.
         */
        getAppState(): Readonly<DCoreState> {
            return this.core.getState();
        }

        /**
         *  Update application's current state by merging the provided object to the current state.
         *  Also, "isRunning" and "isDebug" are being skipped.
         *  "isRunning" is used internaly, "isDebug" can be set only on first initialization.
         */
        setAppState<TState extends keyof DCoreState>(value: Pick<DCoreState, TState>): void {
            this.core.setState(value);
        }

        /**
         *  Subscribes for given topics.
         */
        subscribe(topic: string, handler: (topic: string, message: any) => void): DSubscriptionToken;
        subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken;
        subscribe(topics: any, handler: (topic: string, message: any) => void): DSubscriptionToken {
            return this.core.pipe(
                hooks.SANDBOX_SUBSCRIBE,
                this.__subscribe,
                this,
                Array.isArray(topics) ? topics : [topics], handler);
        }

        /**
         *  Publishes a message asynchronously.
         */
        publish(topic: string, message: any): void {
            this.core.pipe(
                hooks.SANDBOX_PUBLISH,
                this.__publish,
                this,
                topic, message);
        }

        /**
         *  Starts an instance of given module and initializes it.
         */
        start<TProps>(moduleId: string, props?: DModuleProps & TProps): void {
            this.core.pipe(
                hooks.SANDBOX_START,
                this.__start,
                this,
                moduleId, props);
        }

        /**
         *  Stops a given module.
         */
        stop(moduleId: string, instanceId?: string): void {
            this.core.pipe(
                hooks.SANDBOX_STOP,
                this.__stop,
                this,
                moduleId, instanceId);
        }

        private __subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken {
            return this.core.subscribe(topics, handler);
        }

        private __publish(topic: string, message: any): void {
            this.core.publish(topic, message);
        }

        private __start<TProps>(moduleId: string, props?: DModuleProps & TProps): void {
            this.core.start(moduleId, props);
        }

        private __stop(moduleId: string, instanceId?: string): void {
            this.core.stop(moduleId, instanceId);
        }
    }
}
namespace dcore {
    "use strict";

    import _privateData = _private;
    delete dcore._private; // comment before run unit tests

    export namespace hooks {
        export const CORE_REGISTER = "core.register";
        export const CORE_RUN = "core.run";
        export const MODULE_INIT = "module.init";
        export const MODULE_DESTROY = "module.destroy";
    }

    interface ModuleData {
        create: (sb: DSandbox) => DModule<any>;
        instances: {
            [instanceId: string]: DModule<any>;
        };
    }

    interface ModulesMap {
        [id: string]: ModuleData;
    }

    function isDocumentReady(): boolean {
        return document.readyState === "complete" ||
            document.readyState === "interactive" ||
            document.readyState === "loaded"; /* old safari browsers */
    }

    const hasOwnProperty = Object.prototype.hasOwnProperty;

    /**
     *  A mediator between the modules and base libraries.
     */
    export class Application implements DCore {

        public Sandbox: DSandboxConstructor;

        private pluginsPipeline: _privateData.DPluginsPipeline;
        private messagesAggregator: _privateData.DMessagesAggregator;
        private modules: ModulesMap = {};
        private onApplicationRun: Function;
        private state: DCoreState;

        constructor(isDebug = true) {
            this.Sandbox = Sandbox;
            this.pluginsPipeline = new _privateData.DPluginsPipeline();
            this.messagesAggregator = new _privateData.DMessagesAggregator();
            this.state = {
                isDebug: isDebug,
                isRunning: false
            };
        }

        /**
         *  Gets current state.
         */
        getState(): Readonly<DCoreState> {
            return <any>Object.assign({}, this.state);
        }

        /**
         *  Update current state by merging the provided object to the current state.
         *  Also, "isRunning" and "isDebug" are being skipped.
         *  "isRunning" is used internaly, "isDebug" can be set only on first initialization.
         */
        setState<TState extends keyof DCoreState>(value: Pick<DCoreState, TState>): void {
            if (typeof value === "object") {
                value.isRunning = this.state.isRunning;
                value.isDebug = this.state.isDebug;
                this.state = <any>Object.assign({}, this.state, <any>value);
            }
        }

        /**
         *  Subscribes for given topics.
         */
        subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken {
            return this.messagesAggregator.subscribe(topics, handler);
        }

        /**
         *  Publishes a message asynchronously.
         */
        publish(topic: string, message: any): void {
            this.messagesAggregator.publish(topic, message);
        }

        /**
         *  Registers a module.
         */
        register(moduleId: string, moduleFactory: (sb: DSandbox) => DModule<any>): void {
            _privateData.argumentGuard("register(): ")
                .mustBeNonEmptyString(moduleId, "module id must be a non empty string")
                .mustBeUndefined(this.modules[moduleId], `module with such id has been already registered - ${moduleId}`);

            let tempModule = moduleFactory(new this.Sandbox(this, moduleId, moduleId));
            _privateData.argumentGuard("register(): ")
                .mustBeFunction(tempModule.init, "module must implement init method")
                .mustBeFunction(tempModule.destroy, "module must implement destroy method");

            this.pluginsPipeline.pipe(
                hooks.CORE_REGISTER,
                this.__register,
                this,
                moduleId, moduleFactory);
        }

        /**
         *  Starts an instance of given module and initializes it.
         */
        start<TProps>(moduleId: string, props?: DModuleProps & TProps): void {
            let moduleData = this.modules[moduleId];
            _privateData.argumentGuard("start(): ")
                .mustBeDefined(moduleData, `module not found - ${moduleId}`);

            let instanceId = props && props.instanceId ? props.instanceId : moduleId;
            let alreadyInitialized = hasOwnProperty.call(moduleData.instances, instanceId);
            if (alreadyInitialized) {
                return;
            }

            try {
                this.__startModule(moduleId, instanceId, moduleData, props);
            } catch (err) {
                delete moduleData.instances[instanceId];
                console.error(`start(): "${moduleId}" instance init failed`);
                console.error(err);
            }
        }

        /**
         *  Stops a given module.
         */
        stop(moduleId: string, instanceId?: string): void {
            let moduleData = this.modules[moduleId];
            let id = instanceId || moduleId;
            if (!moduleData || !hasOwnProperty.call(moduleData.instances, id)) {
                console.warn(`stop(): "${moduleId}" destroy failed. "${instanceId}" instance not found.`);
                return;
            }

            let instance = moduleData.instances[id];
            try {
                this.pluginsPipeline.pipe(hooks.MODULE_DESTROY, instance.destroy, instance);
            } catch (err) {
                console.error(`stop(): "${moduleId}" destroy failed. An error has occured within the module`);
                console.error(err);
            } finally {
                delete moduleData.instances[id];
                instance = null;
            }
        }

        /**
         *  Lists all registered module ids.
         */
        listModules(): string[] {
            return Object.keys(this.modules);
        }

        /**
         *  Hooks a plugin to given hook name from dcore.hooks constants.
         */
        hook<TResponse>(hookName: string, plugin: DPlugin<TResponse>): void {
            this.pluginsPipeline.hook(hookName, plugin);
        }

        /**
         *  Runs all plugins for given hook as pipeline.
         *  It is useful when you want to provide hooks in your own plugin.
         */
        pipe<TResponse>(
            hookName: string,
            hookInvoker: (...args: any[]) => TResponse,
            hookContext: any,
            ...args: any[]): TResponse {
            return this.pluginsPipeline.pipe.apply(
                this.pluginsPipeline,
                [hookName, hookInvoker, hookContext].concat(args));
        }

        /**
         *  Runs the core.
         */
        run(onRunCallback?: Function): void {
            if (this.state.isRunning) {
                return;
            }

            this.onApplicationRun = onRunCallback;
            if (isDocumentReady()) {
                this.__onDomReady(null);
            } else {
                this.__onDomReady = this.__onDomReady.bind(this);
                document.addEventListener("DOMContentLoaded", this.__onDomReady);
            }
        }

        private __onDomReady(ev: Event): void {
            document.removeEventListener("DOMContentLoaded", this.__onDomReady);
            this.state.isRunning = true;
            if (typeof this.onApplicationRun === "function") {
                try {
                    this.onApplicationRun();
                } catch (err) {
                    console.error(`run(): onRunCallback failed`);
                    console.error(err);
                }
            }

            delete this.onApplicationRun;
            this.pluginsPipeline.pipe(hooks.CORE_RUN, function (): void { }, this);
        }

        private __register(moduleId: string, moduleFactory: (sb: DSandbox) => DModule<any>): void {
            this.modules[moduleId] = {
                create: moduleFactory,
                instances: {}
            };
        }

        private __startModule(
            moduleId: string,
            instanceId: string,
            moduleData: ModuleData,
            props?: DModuleProps): void {

            props = props || { instanceId: instanceId };
            let sb = new this.Sandbox(this, moduleId, instanceId);
            let instance = moduleData.create(sb);
            moduleData.instances[instanceId] = instance;

            this.pluginsPipeline.pipe(
                hooks.MODULE_INIT,
                function (): void {
                    instance.init(props);
                    instance = null;
                },
                instance,
                props, sb);
        }
    }
}