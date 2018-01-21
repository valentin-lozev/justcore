/**
 *  @license dcore.js
 *  Copyright © 2018 Valentin Lozev
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *  Source code: http://github.com/valentin-lozev/dcore
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.dcore = {})));
}(this, (function (exports) { 'use strict';

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
var errorCodes = {
    m1: function () { return "use(): extensions must be installed before init"; },
    m2: function () { return "use(): extensions must be passed as an array"; },
    m3: function () { return "use(): extension must be an object"; },
    m4: function () { return "use(): extension name must be a non empty string"; },
    m5: function (id) { return "use(): \"" + id + "\" install must be a function"; },
    m6: function (id) { return "use(): \"" + id + "\" has already been used"; },
    m7: function () { return "init(): dcore has already been initialized"; },
    m8: function () { return "addModule(): id must be a non empty string"; },
    m9: function (id) { return "addModule(): \"" + id + "\" has already been added"; },
    m10: function (id) { return "addModule(): \"" + id + "\" factory must be a function"; },
    m11: function () { return "startModule(): dcore must be initialized first"; },
    m12: function (id) { return "startModule(): \"" + id + "\" not found"; },
    m13: function (id) { return "startModule(): \"" + id + "\"'s sandbox property must be a Sandbox instance"; },
    m14: function (id) { return "startModule(): \"" + id + "\" init hook must be defined"; },
    m15: function (id) { return "startModule(): \"" + id + "\" destroy hook must be defined"; },
    m16: function () { return "createHook(): type must be a non empty string"; },
    m17: function (id) { return "createHook(): \"" + id + "\" method must be a function"; },
    m18: function () { return "addPlugin(): hook type must be a non empty string"; },
    m19: function (id) { return "addPlugin(): \"" + id + "\" plugin must be a function"; },
    m20: function () { return "onMessage(): message type must be a non empty string"; },
    m21: function (id) { return "onMessage(): \"" + id + "\" handler should be a function"; },
    m22: function () { return "publishAsync(): message must be an object"; },
    m23: function (id) { return "\"" + id + "\" moduleDidReceiveMessage hook must be defined in order to subscribe"; }
};
function throwError(code, formatId) {
    var msgCreator = errorCodes[code];
    throw new Error(msgCreator(formatId));
}
var ArgumentGuard = /** @class */ (function () {
    function ArgumentGuard() {
    }
    ArgumentGuard.prototype.array = function (arg, code, formatId) {
        if (!Array.isArray(arg))
            throwError(code, formatId);
        return this;
    };
    ArgumentGuard.prototype.object = function (arg, code, formatId) {
        if (typeof arg !== "object" || arg === null)
            throwError(code, formatId);
        return this;
    };
    ArgumentGuard.prototype.function = function (arg, code, formatId) {
        if (typeof arg !== "function")
            throwError(code, formatId);
        return this;
    };
    ArgumentGuard.prototype.nonEmptyString = function (arg, code, formatId) {
        if (typeof arg !== "string" || !arg.length)
            throwError(code, formatId);
        return this;
    };
    ArgumentGuard.prototype.true = function (arg, code, formatId) {
        if (!arg)
            throwError(code, formatId);
        return this;
    };
    ArgumentGuard.prototype.false = function (arg, code, formatId) {
        if (arg)
            throwError(code, formatId);
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
    HooksBehavior.prototype.createHook = function (type, method) {
        guard
            .nonEmptyString(type, "m16")
            .function(method, "m17", type);
        var hookContext = this;
        var result = function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var plugins = hookContext._plugins[type];
            if (!plugins) {
                return method.apply(this, args);
            }
            return plugins.reduceRight(function (pipeline, plugin) { return function () { return plugin.apply(_this, [pipeline].concat(args)); }; }, function () { return method.apply(_this, args); })();
        };
        result._withPipeline = true;
        result._hookType = type;
        return result;
    };
    HooksBehavior.prototype.addPlugin = function (hookType, plugin) {
        guard
            .nonEmptyString(hookType, "m18")
            .function(plugin, "m19", hookType);
        (this._plugins[hookType] || (this._plugins[hookType] = [])).push(plugin);
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
    MessageBus.prototype.onMessage = function (type, handler) {
        guard
            .nonEmptyString(type, "m20")
            .function(handler, "m21", type);
        return this._addSubscriber(type, handler);
    };
    MessageBus.prototype.publishAsync = function (message) {
        var _this = this;
        guard.true(typeof message === "object", "m22");
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
    var dcore = this.sandbox._extensionsOnlyCore;
    var messages = typeof this.moduleWillSubscribe === "function"
        ? dcore.createHook("onModuleSubscribe", this.moduleWillSubscribe).call(this)
        : null;
    var anyMessages = Array.isArray(messages) && messages.length >= 0;
    if (!anyMessages) {
        return;
    }
    guard.function(this.moduleDidReceiveMessage, "m23", this.sandbox.moduleId);
    var moduleDidReceiveMessage = dcore.createHook("onModuleReceiveMessage", this.moduleDidReceiveMessage.bind(this));
    this.sandbox.unsubscribers = messages.reduce(function (map, message) {
        map[message] = dcore.onMessage(message, moduleDidReceiveMessage);
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
    Object.defineProperty(DCore.prototype, "extensions", {
        /**
         *	Lists all installed extensions.
         */
        get: function () {
            return Object.keys(this._extensions);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DCore.prototype, "modules", {
        /**
         *  Lists all added module ids.
         */
        get: function () {
            return Object.keys(this._modules);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DCore.prototype, "runningModules", {
        /**
         *  Lists all running module instances by their id.
         */
        get: function () {
            var _this = this;
            return this.modules
                .reduce(function (result, id) {
                result[id] = Object.keys(_this._modules[id].instances);
                return result;
            }, Object.create(null));
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
            .false(this._isInitialized, "m1")
            .array(extensions, "m2");
        extensions.forEach(function (x) {
            guard
                .object(x, "m3")
                .nonEmptyString(x.name, "m4")
                .function(x.install, "m5", x.name)
                .false(x.name in _this._extensions, "m6", x.name);
            _this._extensions[x.name] = x;
        });
    };
    /**
     *  Creates a hook from given method.
     */
    DCore.prototype.createHook = function (type, method) {
        return this._hooksBehavior.createHook(type, method);
    };
    /**
     *  Initializes dcore.
     */
    DCore.prototype.init = function (onInit) {
        guard.false(this._isInitialized, "m7");
        this._onInit = this.createHook("onCoreInit", onInit || function () { });
        this._createHooks();
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
            .nonEmptyString(id, "m8")
            .false(id in this._modules, "m9")
            .function(factory, "m10", id);
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
        guard.true(this._isInitialized, "m11")
            .true(id in this._modules, "m12", id);
        var moduleData = this._modules[id];
        var instanceId = options.instanceId || id;
        var instance = moduleData.instances[instanceId];
        if (instance) {
            if (typeof instance.moduleDidReceiveProps === "function") {
                this.createHook("onModuleReceiveProps", instance.moduleDidReceiveProps)
                    .call(instance, options.props);
            }
            return;
        }
        instance = this._createModule(id, instanceId, moduleData.factory);
        if (!instance) {
            return;
        }
        try {
            this.createHook("onModuleInit", instance.init)
                .call(instance, options.props);
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
            this.createHook("onModuleDestroy", instance.destroy).call(instance);
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
    DCore.prototype.onMessage = function (type, handler) {
        return this._messageBus.onMessage(type, handler);
    };
    /**
     *	Publishes a message.
     * @param message
     */
    DCore.prototype.publishAsync = function (message) {
        this._messageBus.publishAsync(message);
    };
    DCore.prototype._createHooks = function () {
        this.addModule = this.createHook("onModuleAdd", this.addModule);
        this.startModule = this.createHook("onModuleStart", this.startModule);
        this.stopModule = this.createHook("onModuleStop", this.stopModule);
        this.onMessage = this.createHook("onMessageSubscribe", this.onMessage);
        this.publishAsync = this.createHook("onMessagePublish", this.publishAsync);
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
            .forEach(function (hookType) {
            return _this._hooksBehavior.addPlugin(hookType, plugins[hookType]);
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
                .true(result.sandbox instanceof this.Sandbox, "m13", id)
                .function(result.init, "m14", id)
                .function(result.destroy, "m15", id);
        }
        catch (err) {
            result = null;
            console.error(err);
        }
        return result;
    };
    return DCore;
}());

exports.DCore = DCore;

Object.defineProperty(exports, '__esModule', { value: true });

})));
