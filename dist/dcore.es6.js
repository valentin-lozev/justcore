/**
 *  @license dcore.js
 *  Copyright © 2018 Valentin Lozev
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *  Source code: http://github.com/valentin-lozev/dcore
 */

if (typeof Object.assign !== 'function') {
    Object.assign = function (target) {
        'use strict';
        if (target === null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        var to = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];
            if (nextSource !== null) {
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

/**
*  Connects the modules to the outside world. Facade of dcore.
*/
var Sandbox = /** @class */ (function () {
    function Sandbox(dcore, moduleId, instanceId) {
        this._extensionsOnlyCore = dcore;
        this._moduleId = moduleId;
        this._instanceId = instanceId;
    }
    Object.defineProperty(Sandbox.prototype, "moduleId", {
        get: function () {
            return this._moduleId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sandbox.prototype, "instanceId", {
        get: function () {
            return this._instanceId;
        },
        enumerable: true,
        configurable: true
    });
    /**
     *  Starts an instance of given module and initializes it.
     */
    Sandbox.prototype.startModule = function (id, options) {
        this._extensionsOnlyCore.startModule(id, options);
    };
    /**
     *  Stops a given module instance.
     */
    Sandbox.prototype.stopModule = function (id, instanceId) {
        this._extensionsOnlyCore.stopModule(id, instanceId);
    };
    /**
     *  Publishes a message asynchronously.
     */
    Sandbox.prototype.publishAsync = function (message) {
        this._extensionsOnlyCore.publishAsync(message);
    };
    return Sandbox;
}());

var VERSION = "3.0.0";
var ArgumentGuard = /** @class */ (function () {
    function ArgumentGuard() {
    }
    ArgumentGuard.prototype.array = function (arg, msg) {
        if (!Array.isArray(arg))
            throw new Error(msg);
        return this;
    };
    ArgumentGuard.prototype.defined = function (arg, msg) {
        if (typeof arg === "undefined" || arg === null)
            throw new Error(msg);
        return this;
    };
    ArgumentGuard.prototype.undefined = function (arg, msg) {
        if (typeof arg !== "undefined" && arg !== null)
            throw new Error(msg);
        return this;
    };
    ArgumentGuard.prototype.object = function (arg, msg) {
        if (typeof arg !== "object" || arg === null)
            throw new Error(msg);
        return this;
    };
    ArgumentGuard.prototype.function = function (arg, msg) {
        if (typeof arg !== "function")
            throw new Error(msg);
        return this;
    };
    ArgumentGuard.prototype.nonEmptyString = function (arg, msg) {
        if (typeof arg !== "string" || !arg.length)
            throw new Error(msg);
        return this;
    };
    ArgumentGuard.prototype.true = function (arg, msg) {
        if (!arg)
            throw new Error(msg);
        return this;
    };
    ArgumentGuard.prototype.false = function (arg, msg) {
        if (arg)
            throw new Error(msg);
        return this;
    };
    return ArgumentGuard;
}());
var guard = new ArgumentGuard();
function isDocumentReady() {
    return document.readyState === "complete" ||
        document.readyState === "interactive" ||
        document.readyState === "loaded"; /* old safari browsers */
}

var lastUID = 0;
function uid() {
    return ++lastUID;
}

/**
 *  Encapsulates hooks behavior that is private to dcore.
 */
var HooksBehavior = /** @class */ (function () {
    function HooksBehavior() {
        this._plugins = Object.create(null);
    }
    HooksBehavior.prototype.createPipeline = function (hook, method) {
        guard
            .nonEmptyString(hook, "decorate(): hook must be a non empty string")
            .function(method, "decorate(): \"" + hook + "\" method must be a function");
        var pipelineContext = this;
        var result = function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var plugins = pipelineContext._plugins[hook];
            if (!plugins) {
                return method.apply(this, args);
            }
            return plugins.reduceRight(function (pipeline, plugin) { return function () { return plugin.apply(_this, [pipeline].concat(args)); }; }, function () { return method.apply(_this, args); })();
        };
        result._withPipeline = true;
        result._hook = hook;
        return result;
    };
    HooksBehavior.prototype.addPlugin = function (hook, plugin) {
        guard
            .nonEmptyString(hook, "addPlugin(): hook must be a non empty string")
            .function(plugin, "addPlugin(): plugin must be a function");
        (this._plugins[hook] || (this._plugins[hook] = [])).push(plugin);
    };
    return HooksBehavior;
}());

/**
 *  Encapsulates communication behavior that is private to dcore.
 */
var MessageBus = /** @class */ (function () {
    function MessageBus() {
        this._subscribers = Object.create(null);
    }
    MessageBus.prototype.onMessage = function (messageType, handler) {
        guard
            .function(handler, "onMessages(): message handler should be a function")
            .nonEmptyString(messageType, "onMessage(): message type must be a non empty string");
        return this._addSubscriber(messageType, handler);
    };
    MessageBus.prototype.publishAsync = function (message) {
        var _this = this;
        guard.true(typeof message === "object", "publishAsync(): message must be an object with defined type property as string");
        if (!(message.type in this._subscribers)) {
            return;
        }
        var subscriptions = this._subscribers[message.type];
        Object.keys(subscriptions).forEach(function (id) {
            _this._publishSingle(message, subscriptions[id]);
        });
    };
    MessageBus.prototype._publishSingle = function (message, handler) {
        setTimeout(function () {
            try {
                handler(message);
            }
            catch (err) {
                console.error("publishAsync(): Receive \"" + message.type + "\" message failed.");
                console.error(err);
            }
        }, 0);
    };
    MessageBus.prototype._addSubscriber = function (type, handler) {
        var _this = this;
        if (!(type in this._subscribers)) {
            this._subscribers[type] = Object.create(null);
        }
        var subscriptionId = uid();
        this._subscribers[type][subscriptionId] = handler;
        return function () {
            _this._subscribers[type][subscriptionId] = null;
            delete _this._subscribers[type][subscriptionId];
        };
    };
    return MessageBus;
}());

function subscribe() {
    var _this = this;
    var messages = this.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
        return;
    }
    guard.function(this.handleMessage, "handleMessage method must be implemented in order to subscribe to given messages");
    this.handleMessage = this.handleMessage.bind(this);
    var dcore = this.sandbox._extensionsOnlyCore;
    this.sandbox.unsubscribers = messages.reduce(function (map, message) {
        map[message] = dcore.onMessage(message, _this.handleMessage);
        return map;
    }, Object.create(null));
}
function unsubscribe() {
    var unsubscribers = this.sandbox.unsubscribers;
    if (unsubscribers) {
        Object
            .keys(unsubscribers)
            .forEach(function (message) {
            unsubscribers[message]();
            unsubscribers[message] = null;
            delete unsubscribers[message];
        });
    }
}
function moduleAutosubscribe() {
    return {
        name: "module-autosubscribe",
        install: function () { return ({
            onModuleInit: function (next) {
                next();
                subscribe.call(this);
            },
            onModuleDestroy: function (next) {
                unsubscribe.call(this);
                next();
            }
        }); }
    };
}

/**
 *  A mediator between the modules.
 */
var DCore = /** @class */ (function () {
    function DCore(hooksBehavior, messageBus) {
        if (hooksBehavior === void 0) { hooksBehavior = new HooksBehavior(); }
        if (messageBus === void 0) { messageBus = new MessageBus(); }
        this.Sandbox = Sandbox;
        this._isInitialized = false;
        this._onInit = null;
        this._hooksBehavior = null;
        this._messageBus = null;
        this._extensions = Object.create(null);
        this._modules = Object.create(null);
        this._hooksBehavior = hooksBehavior;
        this._messageBus = messageBus;
        this._onDomReady = this._onDomReady.bind(this);
        this.use([
            // built-in extensions
            moduleAutosubscribe()
        ]);
    }
    Object.defineProperty(DCore.prototype, "version", {
        /**
         *	Returns current dcore version.
         */
        get: function () {
            return VERSION;
        },
        enumerable: true,
        configurable: true
    });
    /**
     *	Installs extensions.
     * @param extensions
     */
    DCore.prototype.use = function (extensions) {
        var _this = this;
        guard
            .false(this._isInitialized, "use(): extensions must be installed before init")
            .array(extensions, "use(): extensions must be passed as an array");
        extensions.forEach(function (x) {
            guard
                .object(x, "use(): extension must be an object")
                .nonEmptyString(x.name, "use(): extension name must be a non empty string")
                .function(x.install, "use(): \"" + x.name + "\" extension's install must be a function")
                .false(x.name in _this._extensions, "use(): \"" + x.name + "\" extension has already been installed");
            _this._extensions[x.name] = x;
        });
    };
    /**
     *  Creates a pipeline from given method on given hook.
     */
    DCore.prototype.createPipeline = function (hook, method) {
        return this._hooksBehavior.createPipeline(hook, method);
    };
    /**
     *  Initializes dcore.
     */
    DCore.prototype.init = function (onInit) {
        guard.false(this._isInitialized, "init(): has already been initialized");
        this._onInit = this.createPipeline("onCoreInit", onInit || function () { });
        this._initHooks();
        this._installExtensions();
        if (isDocumentReady()) {
            setTimeout(this._onDomReady, 0);
        }
        else {
            document.addEventListener("DOMContentLoaded", this._onDomReady);
        }
        this._isInitialized = true;
    };
    /**
     *  Adds a module.
     */
    DCore.prototype.addModule = function (id, factory) {
        guard
            .nonEmptyString(id, "addModule(): id must be a non empty string")
            .undefined(this._modules[id], "addModule(): \"" + id + "\" has already been added")
            .function(factory, "addModule(): \"" + id + "\" factory must be a function");
        this._modules[id] = {
            factory: factory,
            instances: Object.create(null)
        };
    };
    /**
     *  Starts an instance of given module and initializes it.
     */
    DCore.prototype.startModule = function (id, options) {
        if (options === void 0) { options = {}; }
        var moduleData = this._modules[id];
        guard
            .true(this._isInitialized, "startModule(): dcore must be initialized first")
            .defined(moduleData, "startModule(): \"" + id + "\" not found");
        var instanceId = options.instanceId || id;
        if (instanceId in moduleData.instances) {
            console.warn("startModule(): \"" + id + "\" \"" + instanceId + "\" has already been initialized");
            return;
        }
        var instance = this._createModule(id, instanceId, moduleData.factory);
        if (!instance) {
            return;
        }
        try {
            this.createPipeline("onModuleInit", instance.init).call(instance, options.props);
            moduleData.instances[instanceId] = instance;
        }
        catch (err) {
            console.error("startModule(): \"" + id + "\" init failed");
            console.error(err);
        }
    };
    /**
     *  Stops a given module instance.
     */
    DCore.prototype.stopModule = function (id, instanceId) {
        var moduleData = this._modules[id];
        if (!moduleData) {
            console.warn("stopModule(): \"" + id + "\" not found");
            return;
        }
        instanceId = instanceId || id;
        if (!(instanceId in moduleData.instances)) {
            console.warn("stopModule(): \"" + id + "\"'s \"" + instanceId + "\" instance is not running");
            return;
        }
        try {
            var instance = moduleData.instances[instanceId];
            this.createPipeline("onModuleDestroy", instance.destroy).call(instance);
            delete moduleData.instances[instanceId];
        }
        catch (err) {
            console.error("stopModule(): \"" + id + "\" destroy failed");
            console.error(err);
        }
    };
    /**
     *	Subscribes for messages of given type.
     * @param messageType
     * @param handler
     */
    DCore.prototype.onMessage = function (messageType, handler) {
        return this._messageBus.onMessage(messageType, handler);
    };
    /**
     *	Publishes a message.
     * @param message
     */
    DCore.prototype.publishAsync = function (message) {
        this._messageBus.publishAsync(message);
    };
    /**
     *	Lists all installed extensions.
     */
    DCore.prototype.listExtensions = function () {
        return Object.keys(this._extensions);
    };
    /**
     *  Lists all added module ids.
     */
    DCore.prototype.listModules = function () {
        return Object.keys(this._modules);
    };
    /**
     *  Lists all running module instances by their id.
     */
    DCore.prototype.listRunningModules = function () {
        var _this = this;
        return this.listModules()
            .reduce(function (result, id) {
            result[id] = Object.keys(_this._modules[id].instances);
            return result;
        }, Object.create(null));
    };
    DCore.prototype._initHooks = function () {
        this.addModule = this.createPipeline("onModuleAdd", this.addModule);
        this.startModule = this.createPipeline("onModuleStart", this.startModule);
        this.stopModule = this.createPipeline("onModuleStop", this.stopModule);
        this.onMessage = this.createPipeline("onMessageSubscribe", this.onMessage);
        this.publishAsync = this.createPipeline("onMessagePublish", this.publishAsync);
    };
    DCore.prototype._installExtensions = function () {
        var _this = this;
        Object
            .keys(this._extensions)
            .forEach(function (name) { return _this._install(_this._extensions[name]); });
    };
    DCore.prototype._install = function (extension) {
        var _this = this;
        var plugins = extension.install(this) || {};
        Object
            .keys(plugins)
            .forEach(function (hook) {
            return _this._hooksBehavior.addPlugin(hook, plugins[hook]);
        });
    };
    DCore.prototype._onDomReady = function () {
        document.removeEventListener("DOMContentLoaded", this._onDomReady);
        this._onInit();
    };
    DCore.prototype._createModule = function (id, instanceId, factory) {
        var result = null;
        try {
            result = factory(new this.Sandbox(this, id, instanceId));
            guard
                .true(result.sandbox instanceof this.Sandbox, "startModule(): \"" + id + ".sandbox\" must be a Sandbox instance")
                .function(result.init, "startModule(): \"" + id + "\" must implement init method")
                .function(result.destroy, "startModule(): \"" + id + "\" must implement destroy method");
        }
        catch (err) {
            result = null;
            console.error(err);
        }
        return result;
    };
    return DCore;
}());

export { DCore };
