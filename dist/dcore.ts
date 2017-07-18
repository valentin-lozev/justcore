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

interface DMediator {
    subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken;
    publish(topic: string, message: any): void;
}

interface DSubscriptionToken {
    destroy(topic?: string): void;
}

interface DCore {
    Sandbox: DSandboxConstructor;
    getState(): DCoreState;
    setState<TState extends keyof DCoreState>(value: Pick<DCoreState, TState>): void;
    
    subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken;
    publish(topic: string, message: any): void;

    register(moduleId: string, moduleFactory: (sb: DSandbox) => DModule<any>): void;
    start<TProps>(moduleId: string, props?: DModuleProps & TProps): void;
    stop(moduleId: string, instanceId?: string): void;
    listModules(): string[];
    
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
    
    getAppState(): DCoreState;
    setAppState<TState extends keyof DCoreState>(value: Pick<DCoreState, TState>): void;

    subscribe(topic: string, handler: (topic: string, message: any) => void): DSubscriptionToken;
    subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken;
    publish(topic: string, message: any): void;

    start<TProps>(moduleId: string, props?: DModuleProps & TProps): void;
    stop(moduleId: string, instanceId?: string): void;
}
namespace dcore._private {

    class ArgumentGuard {

        constructor(private errorMsgPrefix = "") {
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

    export function argumentGuard(errorMsgPrefix = ""): ArgumentGuard {
        return new ArgumentGuard(errorMsgPrefix);
    }
}
namespace dcore._private {
    "use strict";

    interface SubscribersMap {
        [topic: string]: { [tokenId: string]: Function; };
    }

    let hasOwnProperty = Object.prototype.hasOwnProperty;
    let lastUsedSubscriptionID = 0;

    export class DefaultMediator implements DMediator {

        private subscribers: SubscribersMap = {};

        subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken {
            argumentGuard("subscribe(): ")
                .mustBeFunction(handler, "message handler should be a function.")
                .mustBeArray(topics, "topics should be passed as an array of strings.");

            let token = {};
            topics.forEach(topic => token[topic] = this.addSubscriber(topic, handler));

            let that = this;
            return {
                destroy: function (topic?: string): void {
                    if (arguments.length > 0) {
                        that.unsubscribe(topic, token);
                        return;
                    }

                    Object.keys(token).forEach(topic => that.unsubscribe(topic, token));
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

                // let the browser breathе
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

        private addSubscriber(topic: string, handler: Function): string {
            if (!hasOwnProperty.call(this.subscribers, topic)) {
                this.subscribers[topic] = {};
            }

            let subscriptionID = "sbscrptn" + (++lastUsedSubscriptionID);
            this.subscribers[topic][subscriptionID] = handler;
            return subscriptionID;
        }

        private unsubscribe(topic: string, token: { [topic: string]: string; }): void {
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

    /**
     *  @class DefaultSandbox - Connects the modules to the outside world.
     */
    export class DefaultSandbox implements DSandbox {

        private core: DCore;
        private moduleId: string;
        private moduleInstanceId: string;

        constructor(core: DCore, moduleId: string, moduleInstanceId: string) {
            argumentGuard("DefaultSandbox: ")
                .mustBeDefined(core, "core must be provided")
                .mustBeNonEmptyString(moduleId, "module id must be a non empty string")
                .mustBeNonEmptyString(moduleInstanceId, "module instance id must be a non empty string");

            this.core = core;
            this.moduleId = moduleId;
            this.moduleInstanceId = moduleInstanceId;
        }

        /**
         *  Gets the module id it serves for.
         *  @returns {String}
         */
        getModuleId(): string {
            return this.moduleId;
        }

        /**
         *  Gets the module instance id it serves for.
         *  @returns {String}
         */
        getModuleInstanceId(): string {
            return this.moduleInstanceId;
        }

        /**
         *  Gets current application's state.
         */
        getAppState(): DCoreState {
            return this.core.getState();
        }

        /**
         *  Update current application's state by merging the provided object to the current state.
         *  Also, "isRunning" and "isDebug" are being skipped.
         *  "isRunning" is used internaly, "isDebug" can be set only on first initialization.
         */
        setAppState<TState extends keyof DCoreState>(value: Pick<DCoreState, TState>): void {
            this.core.setState(value);
        }

        /**
         *  Subscribes for given topics.
         *  @returns {Object}
         */
        subscribe(topic: string, handler: (topic: string, message: any) => void): DSubscriptionToken;
        subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken;
        subscribe(topics: any, handler: (topic: string, message: any) => void): DSubscriptionToken {
            topics = Array.isArray(topics) ? topics : [topics];
            return this.core.subscribe(topics, handler);
        }

        /**
         *  Publishes a message.
         *  @param {String} topic The topic of the message.
         *  @param {*} message The message.
         */
        publish(topic: string, message: any): void {
            this.core.publish(topic, message);
        }

        /**
         *  Starts an instance of given module and initializes it.
         *  @param {string} moduleId Id of the module which must be started.
         *  @param {object} [props] Optional. Module properties.
         */
        start<TProps>(moduleId: string, props?: DModuleProps & TProps): void {
            this.core.start(moduleId, props);
        }

        /**
         *  Stops a given module.
         *  @param {string} moduleId Id of the module which must be stopped.
         *  @param {string} [instanceId] Optional. Specific module's instance id.
         */
        stop(moduleId: string, instanceId?: string): void {
            this.core.stop(moduleId, instanceId);
        }
    }
}
namespace dcore {
    "use strict";
    
    import _privateData = _private;

    interface ModulesMap {
        [id: string]: {
            create: (sb: DSandbox) => DModule<any>,
            instances: { [instanceId: string]: DModule<any>; }
        };
    }

    function isDocumentReady(): boolean {
        return document.readyState === "complete" ||
            document.readyState === "interactive" ||
            document.readyState === "loaded"; /* old safari browsers */
    }

    let hasOwnProperty = Object.prototype.hasOwnProperty;

    class DefaultCore implements DCore {

        public Sandbox: DSandboxConstructor;

        private mediator: DMediator;
        private modules: ModulesMap = {};
        private beforeRunAction: Function;
        private state: DCoreState;

        constructor(isDebug = true, mediator: DMediator = new _privateData.DefaultMediator()) {
            this.Sandbox = _privateData.DefaultSandbox;
            this.mediator = mediator;
            this.state = {
                isDebug: isDebug,
                isRunning: false
            };
        }

        /**
         *  Gets current core's state.
         */
        getState(): DCoreState {
            return <any>Object.assign({}, this.state);
        }

        /**
         *  Update current core's state by merging the provided object to the current state.
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
         *  @param {Array} topics Array of topics to subscribe for.
         *  @param {Function} handler The message handler.
         *  @returns {Object}
         */
        subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken {
            return this.mediator.subscribe(topics, handler);
        }

        /**
         *  Publishes a message.
         *  @param {String} topic The topic of the message.
         *  @param {*} message The message.
         */
        publish(topic: string, message: any): void {
            this.mediator.publish(topic, message);
        }

        /**
         *  Registers a module.
         *  @param {string} moduleId
         *  @param {function} moduleFactory Function which provides an instance of the module.
         */
        register(moduleId: string, moduleFactory: (sb: DSandbox) => DModule<any>): void {
            _privateData.argumentGuard("register(): ")
                .mustBeNonEmptyString(moduleId, "module id must be a non empty string")
                .mustBeUndefined(this.modules[moduleId], `module with such id has been already registered - ${moduleId}`);

            let tempModule = moduleFactory(new this.Sandbox(this, moduleId, moduleId));
            _privateData.argumentGuard("register(): ")
                .mustBeFunction(tempModule.init, "module must implement init method")
                .mustBeFunction(tempModule.destroy, "module must implement destroy method");

            this.modules[moduleId] = {
                create: moduleFactory,
                instances: {}
            };
        }

        /**
         *  Starts an instance of given module and initializes it.
         *  @param {string} moduleId Id of the module which must be started.
         *  @param {object} [props] Optional. Module properties.
         */
        start<TProps>(moduleId: string, props?: DModuleProps & TProps): void {
            let module = this.modules[moduleId];
            _privateData.argumentGuard("start(): ")
                .mustBeDefined(module, `module not found - ${moduleId}`);

            let instanceId = props && props.instanceId ? props.instanceId : moduleId;
            if (hasOwnProperty.call(module.instances, instanceId)) {
                // already initialized
                return;
            }

            let instance = module.create(new this.Sandbox(this, moduleId, instanceId));
            module.instances[instanceId] = instance;
            instance.init(props);
        }

        /**
         *  Stops a given module.
         *  @param {string} moduleId Id of the module which must be stopped.
         *  @param {string} [instanceId] Specific module's instance id.
         */
        stop(moduleId: string, instanceId?: string): void {
            let module = this.modules[moduleId];
            let id = instanceId || moduleId;
            if (!module || !hasOwnProperty.call(module.instances, id)) {
                console.warn(`stop(): "${moduleId}" destroy failed. "${instanceId}" instance not found.`);
                return;
            }

            try {
                module.instances[id].destroy();
            } catch (err) {
                console.error(`stop(): "${moduleId}" destroy failed. An error has occured within the module`);
                console.error(err);
            } finally {
                delete module.instances[id];
            }
        }

        /**
         *  Lists all registered module ids.
         */
        listModules(): string[] {
            return Object.keys(this.modules);
        }

        /**
         *  Runs the core.
         *  @param {Function} [action] Optional. A setup action executed before core run.
         */
        run(action?: () => void): void {
            if (this.state.isRunning) {
                return;
            }

            this.beforeRunAction = action;
            if (isDocumentReady()) {
                this._onDomReady(null);
            } else {
                this._onDomReady = this._onDomReady.bind(this);
                document.addEventListener("DOMContentLoaded", this._onDomReady);
            }
        }

        private _onDomReady(ev: Event): void {
            document.removeEventListener("DOMContentLoaded", this._onDomReady);

            this.state.isRunning = true;
            if (typeof this.beforeRunAction === "function") {
                this.beforeRunAction();
            }
        }
    }

    /**
     *  Creates an application core instance.
     */
    export function createOne(isDebug = true, mediator: DMediator = new _privateData.DefaultMediator()): DCore {
        return new DefaultCore(isDebug, mediator);
    }
}