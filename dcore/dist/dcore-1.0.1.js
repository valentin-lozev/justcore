/**
 *  @license dcore - v1.0.1
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
        function DefaultSandbox(core, moduleId, moduleInstanceId) {
            if (!core || !moduleId || !moduleInstanceId) {
                throw new Error("DefaultSandbox: Missing core or module instance ID");
            }
            this.core = core;
            this.moduleId = moduleId;
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
            throw new Error("runPlugins(): Core is not running");
        }
        var plugins = this.hooks[hookType];
        if (!Array.isArray(plugins)) {
            return true;
        }
        var argumentsLength = arguments.length;
        var args = new Array(argumentsLength - 1);
        for (var i = 1; i < argumentsLength; i++) {
            args[i - 1] = arguments[i];
        }
        for (var i = 0, len = plugins.length; i < len; i++) {
            try {
                if (!plugins[i].apply(null, args)) {
                    return false;
                }
            }
            catch (err) {
                var argsDetails = args.length > 0 ? args.join(", ") : "none";
                console.error("runPlugins(): Execution failed on hook " + hookType);
                console.error("runPlugins(): Execution arguments: " + argsDetails);
                console.error("runPlugins(): Error: " + err);
            }
        }
        return true;
    }
    function addSubscriber(topic, handler) {
        if (!hasOwnProperty.call(this.subscribers, topic)) {
            this.subscribers[topic] = {};
        }
        var subscriptionID = "sbscrptn" + (++lastUsedSubscriptionID);
        this.subscribers[topic][subscriptionID] = handler;
        return subscriptionID;
    }
    dcore.HOOK_DOM_READY = "dom-ready";
    dcore.HOOK_MODULE_DESTROY = "module-destroy";
    dcore.HOOK_MODULE_DESTROYED = "module-destroyed";
    dcore.HOOK_MODULE_INITIALIZE = "module-init";
    dcore.HOOK_MODULE_INITIALIZED = "module-initialized";
    dcore.HOOK_MODULE_REGISTER = "module-register";
    dcore.HOOK_MODULE_REGISTERED = "module-registered";
    dcore.HOOK_MODULE_PUBLISH = "module-publish";
    dcore.HOOK_MODULE_SUBSCRIBE = "module-subscribe";
    dcore.HOOK_MODULE_UNSUBSCRIBE = "module-unsubscribe";
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
            var errorMsg = "subscribe() failed:";
            typeGuard("function", handler, errorMsg + " message handler should be a function.");
            typeGuard("array", topics, errorMsg + " topics should be passed as an array of strings.");
            if (!runPlugins.call(this, dcore.HOOK_MODULE_SUBSCRIBE, topics)) {
                return {
                    destroy: function () { }
                };
            }
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
                            runPlugins.call(that, dcore.HOOK_MODULE_UNSUBSCRIBE, t);
                            var subscriptionID = token[t];
                            delete that.subscribers[t][subscriptionID];
                        });
                        return;
                    }
                    if (hasOwnProperty.call(token, topic)) {
                        runPlugins.call(that, dcore.HOOK_MODULE_UNSUBSCRIBE, topic);
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
                return this;
            }
            if (!runPlugins.call(this, dcore.HOOK_MODULE_PUBLISH, topic, data)) {
                return this;
            }
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
            return this;
        };
        /**
         *  Registers a module.
         *  @param {string} moduleId
         *  @param {function} moduleFactory Function which provides an instance of the module.
         */
        Instance.prototype.register = function (moduleId, moduleFactory) {
            var errorMsg = "register() failed:";
            typeGuard("string", moduleId, errorMsg + " module ID must be a string - " + moduleId);
            typeGuard("undefined", this.modules[moduleId], errorMsg + " module with such id has been already registered - " + moduleId);
            var tempModule = moduleFactory(new this.Sandbox(this, moduleId, moduleId));
            typeGuard("function", tempModule.init, errorMsg + " module does not implement init method");
            typeGuard("function", tempModule.destroy, errorMsg + " module does not implement destroy method");
            if (!runPlugins.call(this, dcore.HOOK_MODULE_REGISTER, moduleId, moduleFactory)) {
                return this;
            }
            this.modules[moduleId] = {
                create: moduleFactory,
                instances: {}
            };
            runPlugins.call(this, dcore.HOOK_MODULE_REGISTERED, moduleId, moduleFactory);
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
            var errorMsg = "start() failed:";
            typeGuard("object", module, errorMsg + " module not found - " + moduleId);
            typeGuard("object", options, errorMsg + " module options must be an object");
            var instanceId = options["instanceId"] || moduleId;
            if (hasOwnProperty.call(module.instances, instanceId)) {
                // already initialized
                return this;
            }
            if (!runPlugins.call(this, dcore.HOOK_MODULE_INITIALIZE, moduleId, options)) {
                return this;
            }
            var instance = module.create(new this.Sandbox(this, moduleId, instanceId));
            module.instances[instanceId] = instance;
            instance.init(options);
            runPlugins.call(this, dcore.HOOK_MODULE_INITIALIZED, moduleId, options);
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
                if (!runPlugins.call(this, dcore.HOOK_MODULE_DESTROY, moduleId, instanceId)) {
                    return this;
                }
                try {
                    module.instances[id].destroy();
                    runPlugins.call(this, dcore.HOOK_MODULE_DESTROYED, moduleId, instanceId);
                }
                catch (err) {
                    console.warn(moduleId + " destroy failed: An error has occured within the module:");
                    console.error(err);
                }
                finally {
                    delete module.instances[id];
                }
            }
            else {
                console.warn(moduleId + " destroy failed: " + instanceId + " instance not found.");
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
         *  The execution pipeline depends on the hook type return parameter -
         *  If it is evaluated to true, pipeline continues, if not, pipeline stops.
         *  Errors do not affect the execution pipeline.
         *  @param {string} hookType The hook type.
         *  @param {function} plugin The function needs to hook. It must return true in order to continue the pipeline.
         */
        Instance.prototype.hook = function (hookType, plugin) {
            var errorMsg = "hook() failed:";
            typeGuard("string", hookType, errorMsg + " hook type should be a string");
            typeGuard("function", plugin, errorMsg + " plugin should be a function");
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
            runPlugins.call(this, dcore.HOOK_DOM_READY);
        };
        return Instance;
    }());
    dcore.Instance = Instance;
    /**
     *  Creates an application core instance.
     * @param {function} [sandboxType] Optional. Custom sandbox type.
     * @returns {Core}
     */
    function createOne(sandboxType, isDebug) {
        if (isDebug === void 0) { isDebug = true; }
        return new Instance(sandboxType, isDebug);
    }
    dcore.createOne = createOne;
})(dcore || (dcore = {}));
//# sourceMappingURL=DCore.js.map