/**
 *  @license dcore.js
 *  Copyright © 2017 Valentin Lozev
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *  Source code: http://github.com/valentin-lozev/dcore
 */
if (typeof Object.assign != 'function') {
    Object.assign = function (target, varArgs) {
        'use strict';
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        var to = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];
            if (nextSource != null) {
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
        }
        else {
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

var dcore;
(function (dcore) {
    var _private;
    (function (_private) {
        "use strict";
        var ArgumentGuard = (function () {
            function ArgumentGuard(errorMsgPrefix) {
                if (errorMsgPrefix === void 0) { errorMsgPrefix = ""; }
                this.errorMsgPrefix = errorMsgPrefix;
            }
            ArgumentGuard.prototype.mustBeTrue = function (arg, msg) {
                if (!arg)
                    throw new Error(this.errorMsgPrefix + msg);
                return this;
            };
            ArgumentGuard.prototype.mustBeDefined = function (arg, msg) {
                if (typeof arg === "undefined" || arg === null)
                    throw new Error(this.errorMsgPrefix + msg);
                return this;
            };
            ArgumentGuard.prototype.mustBeUndefined = function (arg, msg) {
                if (typeof arg !== "undefined" && arg !== null)
                    throw new Error(this.errorMsgPrefix + msg);
                return this;
            };
            ArgumentGuard.prototype.mustBeNonEmptyString = function (arg, msg) {
                if (typeof arg !== "string" || !arg.length)
                    throw new Error(this.errorMsgPrefix + msg);
                return this;
            };
            ArgumentGuard.prototype.mustBeFunction = function (arg, msg) {
                if (typeof arg !== "function")
                    throw new Error(this.errorMsgPrefix + msg);
                return this;
            };
            ArgumentGuard.prototype.mustBeArray = function (arg, msg) {
                if (!Array.isArray(arg))
                    throw new Error(this.errorMsgPrefix + msg);
                return this;
            };
            return ArgumentGuard;
        }());
        function argumentGuard(errorMsgPrefix) {
            if (errorMsgPrefix === void 0) { errorMsgPrefix = ""; }
            return new ArgumentGuard(errorMsgPrefix);
        }
        _private.argumentGuard = argumentGuard;
    })(_private = dcore._private || (dcore._private = {}));
})(dcore || (dcore = {}));

var dcore;
(function (dcore) {
    var _private;
    (function (_private) {
        "use strict";
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var lastUsedSubscriptionID = 0;
        var DMessagesAggregator = (function () {
            function DMessagesAggregator() {
                this.subscribers = {};
            }
            DMessagesAggregator.prototype.subscribe = function (topics, handler) {
                var _this = this;
                _private.argumentGuard("subscribe(): ")
                    .mustBeFunction(handler, "message handler should be a function.")
                    .mustBeArray(topics, "topics should be passed as an array of strings.");
                var token = {};
                topics.forEach(function (topic) { return token[topic] = _this.__addSubscriber(topic, handler); });
                var that = this;
                return {
                    destroy: function (topic) {
                        if (arguments.length > 0) {
                            that.__unsubscribe(topic, token);
                            return;
                        }
                        Object.keys(token).forEach(function (topic) { return that.__unsubscribe(topic, token); });
                    }
                };
            };
            DMessagesAggregator.prototype.publish = function (topic, message) {
                if (!hasOwnProperty.call(this.subscribers, topic)) {
                    return;
                }
                var subscriptions = this.subscribers[topic];
                Object.keys(subscriptions).forEach(function (key) {
                    var handler = subscriptions[key];
                    setTimeout(function () {
                        try {
                            handler(topic, message);
                        }
                        catch (err) {
                            console.error("publish(): Receive \"" + topic + "\" message failed.");
                            console.error(err);
                            console.error("Handler:");
                            console.error(handler);
                        }
                    }, 0);
                });
            };
            DMessagesAggregator.prototype.__addSubscriber = function (topic, handler) {
                if (!hasOwnProperty.call(this.subscribers, topic)) {
                    this.subscribers[topic] = {};
                }
                var subscriptionID = "sbscrptn" + (++lastUsedSubscriptionID);
                this.subscribers[topic][subscriptionID] = handler;
                return subscriptionID;
            };
            DMessagesAggregator.prototype.__unsubscribe = function (topic, token) {
                if (!hasOwnProperty.call(token, topic)) {
                    return;
                }
                var subscriptionID = token[topic];
                delete this.subscribers[topic][subscriptionID];
            };
            return DMessagesAggregator;
        }());
        _private.DMessagesAggregator = DMessagesAggregator;
    })(_private = dcore._private || (dcore._private = {}));
})(dcore || (dcore = {}));

var dcore;
(function (dcore) {
    var _private;
    (function (_private) {
        "use strict";
        var DPluginsPipeline = (function () {
            function DPluginsPipeline() {
                this.pluginsMap = {};
            }
            DPluginsPipeline.prototype.hook = function (hookName, plugin) {
                _private.argumentGuard("hook(): ")
                    .mustBeNonEmptyString(hookName, "hook name must be a non empty string")
                    .mustBeFunction(plugin, "plugin must be a function");
                var list = this.pluginsMap[hookName];
                if (!list) {
                    this.pluginsMap[hookName] = list = [];
                }
                list.push(plugin);
            };
            DPluginsPipeline.prototype.pipe = function (hookName, hookInvoker, hookContext) {
                var args = [];
                for (var _i = 3; _i < arguments.length; _i++) {
                    args[_i - 3] = arguments[_i];
                }
                _private.argumentGuard("pipe(): ")
                    .mustBeFunction(hookInvoker, "hook invoker must be a function");
                var pipeline = (this.pluginsMap[hookName] || [])
                    .slice(0)
                    .reduceRight(function (next, pipeline) {
                    return function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        return pipeline.apply(this, [next].concat(args));
                    };
                }, hookInvoker);
                var result = pipeline.apply(hookContext, args);
                pipeline = null;
                return result;
            };
            return DPluginsPipeline;
        }());
        _private.DPluginsPipeline = DPluginsPipeline;
    })(_private = dcore._private || (dcore._private = {}));
})(dcore || (dcore = {}));

var dcore;
(function (dcore) {
    var hooks;
    (function (hooks) {
        "use strict";
        hooks.SANDBOX_SUBSCRIBE = "sandbox.subscribe";
        hooks.SANDBOX_PUBLISH = "sandbox.publish";
        hooks.SANDBOX_START = "sandbox.start";
        hooks.SANDBOX_STOP = "sandbox.stop";
    })(hooks = dcore.hooks || (dcore.hooks = {}));
})(dcore || (dcore = {}));
(function (dcore) {
    var _private;
    (function (_private) {
        "use strict";
        /**
         *  Connects the modules to the outside world. Facade of the core.
         */
        var DefaultSandbox = (function () {
            function DefaultSandbox(core, moduleId, moduleInstanceId) {
                _private.argumentGuard("DefaultSandbox: ")
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
            DefaultSandbox.prototype.getModuleId = function () {
                return this.moduleId;
            };
            /**
             *  Gets the module instance id it serves for.
             */
            DefaultSandbox.prototype.getModuleInstanceId = function () {
                return this.moduleInstanceId;
            };
            /**
             *  Gets application's current state.
             */
            DefaultSandbox.prototype.getAppState = function () {
                return this.core.getState();
            };
            /**
             *  Update application's current state by merging the provided object to the current state.
             *  Also, "isRunning" and "isDebug" are being skipped.
             *  "isRunning" is used internaly, "isDebug" can be set only on first initialization.
             */
            DefaultSandbox.prototype.setAppState = function (value) {
                this.core.setState(value);
            };
            DefaultSandbox.prototype.subscribe = function (topics, handler) {
                return this.core.pipe(dcore.hooks.SANDBOX_SUBSCRIBE, this.__subscribe, this, Array.isArray(topics) ? topics : [topics], handler);
            };
            /**
             *  Publishes a message asynchronously.
             */
            DefaultSandbox.prototype.publish = function (topic, message) {
                this.core.pipe(dcore.hooks.SANDBOX_PUBLISH, this.__publish, this, topic, message);
            };
            /**
             *  Starts an instance of given module and initializes it.
             */
            DefaultSandbox.prototype.start = function (moduleId, props) {
                this.core.pipe(dcore.hooks.SANDBOX_START, this.__start, this, moduleId, props);
            };
            /**
             *  Stops a given module.
             */
            DefaultSandbox.prototype.stop = function (moduleId, instanceId) {
                this.core.pipe(dcore.hooks.SANDBOX_STOP, this.__stop, this, moduleId, instanceId);
            };
            DefaultSandbox.prototype.__subscribe = function (topics, handler) {
                return this.core.subscribe(topics, handler);
            };
            DefaultSandbox.prototype.__publish = function (topic, message) {
                this.core.publish(topic, message);
            };
            DefaultSandbox.prototype.__start = function (moduleId, props) {
                this.core.start(moduleId, props);
            };
            DefaultSandbox.prototype.__stop = function (moduleId, instanceId) {
                this.core.stop(moduleId, instanceId);
            };
            return DefaultSandbox;
        }());
        _private.DefaultSandbox = DefaultSandbox;
    })(_private = dcore._private || (dcore._private = {}));
})(dcore || (dcore = {}));

var dcore;
(function (dcore) {
    "use strict";
    var _privateData = dcore._private;
    delete dcore._private; // comment before run unit tests
    var hooks;
    (function (hooks) {
        hooks.CORE_REGISTER = "core.register";
        hooks.CORE_RUN = "core.run";
        hooks.MODULE_INIT = "module.init";
        hooks.MODULE_DESTROY = "module.destroy";
    })(hooks = dcore.hooks || (dcore.hooks = {}));
    function isDocumentReady() {
        return document.readyState === "complete" ||
            document.readyState === "interactive" ||
            document.readyState === "loaded"; /* old safari browsers */
    }
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    /**
     *  A mediator between the modules and base libraries.
     */
    var Application = (function () {
        function Application(isDebug) {
            if (isDebug === void 0) { isDebug = true; }
            this.modules = {};
            this.Sandbox = _privateData.DefaultSandbox;
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
        Application.prototype.getState = function () {
            return Object.assign({}, this.state);
        };
        /**
         *  Update current state by merging the provided object to the current state.
         *  Also, "isRunning" and "isDebug" are being skipped.
         *  "isRunning" is used internaly, "isDebug" can be set only on first initialization.
         */
        Application.prototype.setState = function (value) {
            if (typeof value === "object") {
                value.isRunning = this.state.isRunning;
                value.isDebug = this.state.isDebug;
                this.state = Object.assign({}, this.state, value);
            }
        };
        /**
         *  Subscribes for given topics.
         */
        Application.prototype.subscribe = function (topics, handler) {
            return this.messagesAggregator.subscribe(topics, handler);
        };
        /**
         *  Publishes a message asynchronously.
         */
        Application.prototype.publish = function (topic, message) {
            this.messagesAggregator.publish(topic, message);
        };
        /**
         *  Registers a module.
         */
        Application.prototype.register = function (moduleId, moduleFactory) {
            _privateData.argumentGuard("register(): ")
                .mustBeNonEmptyString(moduleId, "module id must be a non empty string")
                .mustBeUndefined(this.modules[moduleId], "module with such id has been already registered - " + moduleId);
            var tempModule = moduleFactory(new this.Sandbox(this, moduleId, moduleId));
            _privateData.argumentGuard("register(): ")
                .mustBeFunction(tempModule.init, "module must implement init method")
                .mustBeFunction(tempModule.destroy, "module must implement destroy method");
            this.pluginsPipeline.pipe(hooks.CORE_REGISTER, this.__register, this, moduleId, moduleFactory);
        };
        /**
         *  Starts an instance of given module and initializes it.
         */
        Application.prototype.start = function (moduleId, props) {
            var moduleData = this.modules[moduleId];
            _privateData.argumentGuard("start(): ")
                .mustBeDefined(moduleData, "module not found - " + moduleId);
            var instanceId = props && props.instanceId ? props.instanceId : moduleId;
            var alreadyInitialized = hasOwnProperty.call(moduleData.instances, instanceId);
            if (alreadyInitialized) {
                return;
            }
            try {
                this.__startModule(moduleId, instanceId, moduleData, props);
            }
            catch (err) {
                delete moduleData.instances[instanceId];
                console.error("start(): \"" + moduleId + "\" instance init failed");
                console.error(err);
            }
        };
        /**
         *  Stops a given module.
         */
        Application.prototype.stop = function (moduleId, instanceId) {
            var moduleData = this.modules[moduleId];
            var id = instanceId || moduleId;
            if (!moduleData || !hasOwnProperty.call(moduleData.instances, id)) {
                console.warn("stop(): \"" + moduleId + "\" destroy failed. \"" + instanceId + "\" instance not found.");
                return;
            }
            var instance = moduleData.instances[id];
            try {
                this.pluginsPipeline.pipe(hooks.MODULE_DESTROY, instance.destroy, instance);
            }
            catch (err) {
                console.error("stop(): \"" + moduleId + "\" destroy failed. An error has occured within the module");
                console.error(err);
            }
            finally {
                delete moduleData.instances[id];
                instance = null;
            }
        };
        /**
         *  Lists all registered module ids.
         */
        Application.prototype.listModules = function () {
            return Object.keys(this.modules);
        };
        /**
         *  Hooks a plugin to given hook name from dcore.hooks constants.
         */
        Application.prototype.hook = function (hookName, plugin) {
            this.pluginsPipeline.hook(hookName, plugin);
        };
        /**
         *  Runs all plugins for given hook as pipeline.
         *  It is useful when you want to provide hooks in your own plugin.
         */
        Application.prototype.pipe = function (hookName, hookInvoker, hookContext) {
            var args = [];
            for (var _i = 3; _i < arguments.length; _i++) {
                args[_i - 3] = arguments[_i];
            }
            return this.pluginsPipeline.pipe.apply(this.pluginsPipeline, [hookName, hookInvoker, hookContext].concat(args));
        };
        /**
         *  Runs the core.
         */
        Application.prototype.run = function (onRunCallback) {
            if (this.state.isRunning) {
                return;
            }
            this.onApplicationRun = onRunCallback;
            if (isDocumentReady()) {
                this.__onDomReady(null);
            }
            else {
                this.__onDomReady = this.__onDomReady.bind(this);
                document.addEventListener("DOMContentLoaded", this.__onDomReady);
            }
        };
        Application.prototype.__onDomReady = function (ev) {
            document.removeEventListener("DOMContentLoaded", this.__onDomReady);
            this.state.isRunning = true;
            if (typeof this.onApplicationRun === "function") {
                try {
                    this.onApplicationRun();
                }
                catch (err) {
                    console.error("run(): onRunCallback failed");
                    console.error(err);
                }
            }
            delete this.onApplicationRun;
            this.pluginsPipeline.pipe(hooks.CORE_RUN, function () { }, this);
        };
        Application.prototype.__register = function (moduleId, moduleFactory) {
            this.modules[moduleId] = {
                create: moduleFactory,
                instances: {}
            };
        };
        Application.prototype.__startModule = function (moduleId, instanceId, moduleData, props) {
            props = props || { instanceId: instanceId };
            var sb = new this.Sandbox(this, moduleId, instanceId);
            var instance = moduleData.create(sb);
            moduleData.instances[instanceId] = instance;
            this.pluginsPipeline.pipe(hooks.MODULE_INIT, function () {
                instance.init(props);
                instance = null;
            }, instance, props, sb);
        };
        return Application;
    }());
    dcore.Application = Application;
})(dcore || (dcore = {}));
