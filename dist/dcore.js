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

var dcore;
(function (dcore) {
    var _private;
    (function (_private) {
        var ArgumentGuard = (function () {
            function ArgumentGuard(errorMsgPrefix) {
                if (errorMsgPrefix === void 0) { errorMsgPrefix = ""; }
                this.errorMsgPrefix = errorMsgPrefix;
            }
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
        var DefaultMediator = (function () {
            function DefaultMediator() {
                this.subscribers = {};
            }
            DefaultMediator.prototype.subscribe = function (topics, handler) {
                var _this = this;
                _private.argumentGuard("subscribe(): ")
                    .mustBeFunction(handler, "message handler should be a function.")
                    .mustBeArray(topics, "topics should be passed as an array of strings.");
                var token = {};
                topics.forEach(function (topic) { return token[topic] = _this.addSubscriber(topic, handler); });
                var that = this;
                return {
                    destroy: function (topic) {
                        if (arguments.length > 0) {
                            that.unsubscribe(topic, token);
                            return;
                        }
                        Object.keys(token).forEach(function (topic) { return that.unsubscribe(topic, token); });
                    }
                };
            };
            DefaultMediator.prototype.publish = function (topic, message) {
                if (!hasOwnProperty.call(this.subscribers, topic)) {
                    return;
                }
                var subscriptions = this.subscribers[topic];
                Object.keys(subscriptions).forEach(function (key) {
                    var handler = subscriptions[key];
                    // let the browser breathе
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
            DefaultMediator.prototype.addSubscriber = function (topic, handler) {
                if (!hasOwnProperty.call(this.subscribers, topic)) {
                    this.subscribers[topic] = {};
                }
                var subscriptionID = "sbscrptn" + (++lastUsedSubscriptionID);
                this.subscribers[topic][subscriptionID] = handler;
                return subscriptionID;
            };
            DefaultMediator.prototype.unsubscribe = function (topic, token) {
                if (!hasOwnProperty.call(token, topic)) {
                    return;
                }
                var subscriptionID = token[topic];
                delete this.subscribers[topic][subscriptionID];
            };
            return DefaultMediator;
        }());
        _private.DefaultMediator = DefaultMediator;
    })(_private = dcore._private || (dcore._private = {}));
})(dcore || (dcore = {}));

var dcore;
(function (dcore) {
    var _private;
    (function (_private) {
        "use strict";
        /**
         *  @class DefaultSandbox - Connects the modules to the outside world.
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
             *  @returns {String}
             */
            DefaultSandbox.prototype.getModuleId = function () {
                return this.moduleId;
            };
            /**
             *  Gets the module instance id it serves for.
             *  @returns {String}
             */
            DefaultSandbox.prototype.getModuleInstanceId = function () {
                return this.moduleInstanceId;
            };
            /**
             *  Gets current application's state.
             */
            DefaultSandbox.prototype.getAppState = function () {
                return this.core.getState();
            };
            /**
             *  Update current application's state by merging the provided object to the current state.
             *  Also, "isRunning" and "isDebug" are being skipped.
             *  "isRunning" is used internaly, "isDebug" can be set only on first initialization.
             */
            DefaultSandbox.prototype.setAppState = function (value) {
                this.core.setState(value);
            };
            DefaultSandbox.prototype.subscribe = function (topics, handler) {
                topics = Array.isArray(topics) ? topics : [topics];
                return this.core.subscribe(topics, handler);
            };
            /**
             *  Publishes a message.
             *  @param {String} topic The topic of the message.
             *  @param {*} message The message.
             */
            DefaultSandbox.prototype.publish = function (topic, message) {
                this.core.publish(topic, message);
            };
            /**
             *  Starts an instance of given module and initializes it.
             *  @param {string} moduleId Id of the module which must be started.
             *  @param {object} [props] Optional. Module properties.
             */
            DefaultSandbox.prototype.start = function (moduleId, props) {
                this.core.start(moduleId, props);
            };
            /**
             *  Stops a given module.
             *  @param {string} moduleId Id of the module which must be stopped.
             *  @param {string} [instanceId] Optional. Specific module's instance id.
             */
            DefaultSandbox.prototype.stop = function (moduleId, instanceId) {
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
    function isDocumentReady() {
        return document.readyState === "complete" ||
            document.readyState === "interactive" ||
            document.readyState === "loaded"; /* old safari browsers */
    }
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var DefaultCore = (function () {
        function DefaultCore(isDebug, mediator) {
            if (isDebug === void 0) { isDebug = true; }
            if (mediator === void 0) { mediator = new _privateData.DefaultMediator(); }
            this.modules = {};
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
        DefaultCore.prototype.getState = function () {
            return Object.assign({}, this.state);
        };
        /**
         *  Update current core's state by merging the provided object to the current state.
         *  Also, "isRunning" and "isDebug" are being skipped.
         *  "isRunning" is used internaly, "isDebug" can be set only on first initialization.
         */
        DefaultCore.prototype.setState = function (value) {
            if (typeof value === "object") {
                value.isRunning = this.state.isRunning;
                value.isDebug = this.state.isDebug;
                this.state = Object.assign({}, this.state, value);
            }
        };
        /**
         *  Subscribes for given topics.
         *  @param {Array} topics Array of topics to subscribe for.
         *  @param {Function} handler The message handler.
         *  @returns {Object}
         */
        DefaultCore.prototype.subscribe = function (topics, handler) {
            return this.mediator.subscribe(topics, handler);
        };
        /**
         *  Publishes a message.
         *  @param {String} topic The topic of the message.
         *  @param {*} message The message.
         */
        DefaultCore.prototype.publish = function (topic, message) {
            this.mediator.publish(topic, message);
        };
        /**
         *  Registers a module.
         *  @param {string} moduleId
         *  @param {function} moduleFactory Function which provides an instance of the module.
         */
        DefaultCore.prototype.register = function (moduleId, moduleFactory) {
            _privateData.argumentGuard("register(): ")
                .mustBeNonEmptyString(moduleId, "module id must be a non empty string")
                .mustBeUndefined(this.modules[moduleId], "module with such id has been already registered - " + moduleId);
            var tempModule = moduleFactory(new this.Sandbox(this, moduleId, moduleId));
            _privateData.argumentGuard("register(): ")
                .mustBeFunction(tempModule.init, "module must implement init method")
                .mustBeFunction(tempModule.destroy, "module must implement destroy method");
            this.modules[moduleId] = {
                create: moduleFactory,
                instances: {}
            };
        };
        /**
         *  Starts an instance of given module and initializes it.
         *  @param {string} moduleId Id of the module which must be started.
         *  @param {object} [props] Optional. Module properties.
         */
        DefaultCore.prototype.start = function (moduleId, props) {
            var module = this.modules[moduleId];
            _privateData.argumentGuard("start(): ")
                .mustBeDefined(module, "module not found - " + moduleId);
            var instanceId = props && props.instanceId ? props.instanceId : moduleId;
            if (hasOwnProperty.call(module.instances, instanceId)) {
                // already initialized
                return;
            }
            var instance = module.create(new this.Sandbox(this, moduleId, instanceId));
            module.instances[instanceId] = instance;
            instance.init(props);
        };
        /**
         *  Stops a given module.
         *  @param {string} moduleId Id of the module which must be stopped.
         *  @param {string} [instanceId] Specific module's instance id.
         */
        DefaultCore.prototype.stop = function (moduleId, instanceId) {
            var module = this.modules[moduleId];
            var id = instanceId || moduleId;
            if (!module || !hasOwnProperty.call(module.instances, id)) {
                console.warn("stop(): \"" + moduleId + "\" destroy failed. \"" + instanceId + "\" instance not found.");
                return;
            }
            try {
                module.instances[id].destroy();
            }
            catch (err) {
                console.error("stop(): \"" + moduleId + "\" destroy failed. An error has occured within the module");
                console.error(err);
            }
            finally {
                delete module.instances[id];
            }
        };
        /**
         *  Lists all registered module ids.
         */
        DefaultCore.prototype.listModules = function () {
            return Object.keys(this.modules);
        };
        /**
         *  Runs the core.
         *  @param {Function} [action] Optional. A setup action executed before core run.
         */
        DefaultCore.prototype.run = function (action) {
            if (this.state.isRunning) {
                return;
            }
            this.beforeRunAction = action;
            if (isDocumentReady()) {
                this._onDomReady(null);
            }
            else {
                this._onDomReady = this._onDomReady.bind(this);
                document.addEventListener("DOMContentLoaded", this._onDomReady);
            }
        };
        DefaultCore.prototype._onDomReady = function (ev) {
            document.removeEventListener("DOMContentLoaded", this._onDomReady);
            this.state.isRunning = true;
            if (typeof this.beforeRunAction === "function") {
                this.beforeRunAction();
            }
        };
        return DefaultCore;
    }());
    /**
     *  Creates an application core instance.
     */
    function createOne(isDebug, mediator) {
        if (isDebug === void 0) { isDebug = true; }
        if (mediator === void 0) { mediator = new _privateData.DefaultMediator(); }
        return new DefaultCore(isDebug, mediator);
    }
    dcore.createOne = createOne;
})(dcore || (dcore = {}));
