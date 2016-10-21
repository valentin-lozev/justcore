/**
 *  @license dcore - v1.0.0
 *  Copyright © 2016 Valentin Lozev
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *  Source code: http://github.com/valentin-lozev/dcore
 */ 
//# sourceMappingURL=license.js.map
var dcore;
(function (dcore) {
    "use strict";
    /**
     *  @class Sandbox - Connects all modules to the outside world.
     *  @property {String} moduleInstanceId - Id of the module it serves for.
     */
    var DefaultSandbox = (function () {
        function DefaultSandbox(core, moduleInstanceId) {
            if (!core || !moduleInstanceId) {
                throw new Error("Missing core or module instance ID.");
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
        DefaultSandbox.prototype.subscribe = function (topics, handler) {
            return this.core.subscribe(topics, handler);
        };
        /**
         *  Publishes a message.
         *  @param {String} topic The topic of the message.
         *  @param {*} [data] Optional data.
         */
        DefaultSandbox.prototype.publish = function (topic, data) {
            this.core.publish(topic, data);
            return this;
        };
        /**
         *  Starts an instance of given module and initializes it.
         *  @param {string} moduleId Id of the module which must be started.
         *  @param {object} [options] Optional options.
         */
        DefaultSandbox.prototype.start = function (moduleId, options) {
            this.core.start(moduleId, options);
            return this;
        };
        /**
         *  Stops a given module.
         *  @param {string} moduleId Id of the module which must be stopped.
         *  @param {string} [instanceId] Optional. Specific module's instance id.
         */
        DefaultSandbox.prototype.stop = function (moduleId, instanceId) {
            this.core.stop(moduleId, instanceId);
            return this;
        };
        return DefaultSandbox;
    }());
    dcore.DefaultSandbox = DefaultSandbox;
})(dcore || (dcore = {}));
//# sourceMappingURL=DSandbox.js.map
var dcore;
(function (dcore) {
    "use strict";
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var lastUsedSubscriptionID = 0;
    function typeGuard(expected, value, errorMsg) {
        var toThrow = false;
        switch (expected) {
            case "array":
                toThrow = !Array.isArray(value);
                break;
            default: toThrow = typeof value !== expected || value === null;
        }
        if (toThrow) {
            throw new TypeError(errorMsg);
        }
    }
    function runPlugins(hookType) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        if (!this.state.isRunning) {
            throw new Error("Core is not running.");
        }
        var plugins = this.hooks[hookType];
        if (!Array.isArray(plugins)) {
            return;
        }
        var argumentsLength = arguments.length;
        var args = new Array(argumentsLength - 1);
        for (var i = 1; i < argumentsLength; i++) {
            args[i - 1] = arguments[i];
        }
        for (var i = 0, len = plugins.length; i < len; i++) {
            try {
                plugins[i].apply(null, args);
            }
            catch (ex) {
                var argsDetails = args.length > 0 ? args.join(", ") : "none";
                console.error("Plugin execution failed on hook " + HookType[hookType] + ". Arguments: " + argsDetails + ". Message: " + ex);
            }
        }
    }
    function addSubscriber(topic, handler) {
        if (!hasOwnProperty.call(this.subscribers, topic)) {
            this.subscribers[topic] = {};
        }
        var subscriptionID = "t" + (++lastUsedSubscriptionID);
        this.subscribers[topic][subscriptionID] = handler;
        return subscriptionID;
    }
    (function (HookType) {
        HookType[HookType["Core_DOMReady"] = 0] = "Core_DOMReady";
        HookType[HookType["Core_ModuleDestroy"] = 1] = "Core_ModuleDestroy";
        HookType[HookType["Core_ModuleInit"] = 2] = "Core_ModuleInit";
        HookType[HookType["Core_ModuleRegister"] = 3] = "Core_ModuleRegister";
        HookType[HookType["Core_Publish"] = 4] = "Core_Publish";
        HookType[HookType["Core_Subscribe"] = 5] = "Core_Subscribe";
        HookType[HookType["Core_Unsubscribe"] = 6] = "Core_Unsubscribe";
    })(dcore.HookType || (dcore.HookType = {}));
    var HookType = dcore.HookType;
    var Instance = (function () {
        function Instance(sandboxType, isDebug) {
            if (isDebug === void 0) { isDebug = true; }
            this.subscribers = {};
            this.modules = {};
            this.hooks = {};
            this.Sandbox = typeof sandboxType === "function" ? sandboxType : dcore.DefaultSandbox;
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
        Instance.prototype.subscribe = function (topics, handler) {
            var errorMsg = "Subscribing failed:";
            typeGuard("function", handler, errorMsg + " message handler should be a function.");
            typeGuard("array", topics, errorMsg + " topics should be passed as an array of strings.");
            runPlugins.call(this, HookType.Core_Subscribe, topics);
            var token = {};
            for (var i = 0, len = topics.length; i < len; i++) {
                var topic = topics[i];
                var subscriptionID = addSubscriber.call(this, topic, handler);
                token[topic] = subscriptionID;
            }
            var that = this;
            return {
                destroy: function (topic) {
                    if (arguments.length === 0) {
                        Object.keys(token).forEach(function (t) {
                            runPlugins.call(that, HookType.Core_Unsubscribe, t);
                            var subscriptionID = token[t];
                            delete that.subscribers[t][subscriptionID];
                        });
                        return;
                    }
                    if (hasOwnProperty.call(token, topic)) {
                        runPlugins.call(that, HookType.Core_Unsubscribe, topic);
                        var subscriptionID = token[topic];
                        delete that.subscribers[topic][subscriptionID];
                    }
                }
            };
        };
        /**
         *  Publishes a message.
         *  @param {String} topic he topic of the message.
         *  @param {*} [data] Optional data.
         */
        Instance.prototype.publish = function (topic, data) {
            if (!hasOwnProperty.call(this.subscribers, topic)) {
                return;
            }
            runPlugins.call(this, HookType.Core_Publish, topic, data);
            var subscriptions = this.subscribers[topic];
            Object.keys(subscriptions)
                .forEach(function (key) {
                var handler = subscriptions[key];
                try {
                    // let the browser breathе
                    setTimeout(function () { return handler(topic, data); }, 0);
                }
                catch (ex) {
                    setTimeout(function () {
                        console.info(topic + " message publishing failed. Subscriber:");
                        console.info(handler);
                    }, 0);
                }
            });
        };
        /**
         *  Registers a module.
         *  @param {string} moduleId
         *  @param {function} moduleFactory Function which provides an instance of the module.
         */
        Instance.prototype.register = function (moduleId, moduleFactory) {
            var errorMsg = moduleId + " registration failed:";
            typeGuard("string", moduleId, errorMsg + " module ID must be a string.");
            typeGuard("string", moduleId, errorMsg + " module ID must be a string.");
            typeGuard("undefined", this.modules[moduleId], errorMsg + " module with such id has been already registered.");
            var tempModule = moduleFactory(new this.Sandbox(this, moduleId));
            typeGuard("function", tempModule.init, errorMsg + " module does not implement init method.");
            typeGuard("function", tempModule.destroy, errorMsg + " module does not implement destroy method.");
            runPlugins.call(this, HookType.Core_ModuleRegister, moduleId, moduleFactory);
            this.modules[moduleId] = {
                create: moduleFactory,
                instances: {}
            };
            return this;
        };
        /**
         *  Starts an instance of given module and initializes it.
         *  @param {string} moduleId Id of the module which must be started.
         *  @param {object} [options] Optional options.
         */
        Instance.prototype.start = function (moduleId, options) {
            var module = this.modules[moduleId];
            options = options || {};
            var errorMsg = moduleId + " initialization failed:";
            typeGuard("object", module, errorMsg + " module not found.");
            typeGuard("object", options, errorMsg + " module options must be an object.");
            var instanceId = options["instanceId"] || moduleId;
            if (hasOwnProperty.call(module.instances, instanceId)) {
                // already initialized
                return this;
            }
            runPlugins.call(this, HookType.Core_ModuleInit, moduleId, options);
            var instance = module.create(new this.Sandbox(this, instanceId));
            module.instances[instanceId] = instance;
            instance.init(options);
            return this;
        };
        /**
         *  Stops a given module.
         *  @param {string} moduleId Id of the module, which must be stopped.
         *  @param {string} [instanceId] Specific module's instance id.
         */
        Instance.prototype.stop = function (moduleId, instanceId) {
            var module = this.modules[moduleId];
            var id = instanceId || moduleId;
            if (module && hasOwnProperty.call(module.instances, id)) {
                runPlugins.call(this, HookType.Core_ModuleDestroy, moduleId, instanceId);
                module.instances[id].destroy();
                delete module.instances[id];
            }
            return this;
        };
        /**
         *  Lists all registered module ids.
         */
        Instance.prototype.listModules = function () {
            return Object.keys(this.modules);
        };
        /**
         *  Hooks a given function to specific hook type.
         *  @param {HookType} hookType The hook type.
         *  @param {function} plugin The function needs to hook.
         */
        Instance.prototype.hook = function (hookType, plugin) {
            var errorMsg = "Hook plugin failed:";
            typeGuard("number", hookType, errorMsg + " hook type should be an HookType enum.");
            typeGuard("function", plugin, errorMsg + " plugin should be a function.");
            if (!Array.isArray(this.hooks[hookType])) {
                this.hooks[hookType] = [];
            }
            this.hooks[hookType].push(plugin);
            return this;
        };
        /**
         *  Runs the core.
         *  @param {Function} [action] Optional. A setup action executed before core run.
         */
        Instance.prototype.run = function (action) {
            if (this.state.isRunning) {
                return;
            }
            this.beforeRunAction = action;
            this._onDomReady = this._onDomReady.bind(this);
            if (document.readyState === "complete" ||
                document.readyState === "interactive" ||
                document.readyState === "loaded" /* old safari browsers */) {
                this._onDomReady(null);
            }
            else {
                document.addEventListener("DOMContentLoaded", this._onDomReady);
            }
            return this;
        };
        Instance.prototype._onDomReady = function (ev) {
            document.removeEventListener("DOMContentLoaded", this._onDomReady);
            this.state.isRunning = true;
            if (typeof this.beforeRunAction === "function") {
                this.beforeRunAction();
            }
            runPlugins.call(this, HookType.Core_DOMReady);
        };
        return Instance;
    }());
    dcore.Instance = Instance;
    /**
     *  Creates an application core instance.
     * @param {function} [sandboxType] Optional. Custom sandbox type.
     * @returns {Core}
     */
    function createOne(sandboxType) {
        return new Instance(sandboxType);
    }
    dcore.createOne = createOne;
})(dcore || (dcore = {}));
//# sourceMappingURL=DCore.js.map