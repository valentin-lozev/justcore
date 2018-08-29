/**
 *  @license justcore
 *  Copyright © Valentin Lozev 2016 - Present
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *  Source code: http://github.com/valentin-lozev/justcore
 */

var VERSION = "1.0.2";

var errorCodes = {
    m1: function () { return "use(): extensions must be installed before init"; },
    m2: function () { return "use(): extensions must be passed as an array"; },
    m3: function () { return "use(): extension must be an object"; },
    m4: function () { return "use(): extension name must be a non empty string"; },
    m5: function (id) { return "use(): \"" + id + "\" install must be a function"; },
    m6: function (id) { return "use(): \"" + id + "\" has already been used"; },
    m7: function () { return "init(): core has already been initialized"; },
    m8: function () { return "addModule(): id must be a non empty string"; },
    m9: function (id) { return "addModule(): \"" + id + "\" has already been added"; },
    m10: function (id) { return "addModule(): \"" + id + "\" factory must be a function"; },
    m11: function () { return "startModule(): core must be initialized first"; },
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
        if (!Array.isArray(arg)) {
            throwError(code, formatId);
        }
        return this;
    };
    ArgumentGuard.prototype.object = function (arg, code, formatId) {
        if (typeof arg !== "object" || arg === null) {
            throwError(code, formatId);
        }
        return this;
    };
    ArgumentGuard.prototype.function = function (arg, code, formatId) {
        if (typeof arg !== "function") {
            throwError(code, formatId);
        }
        return this;
    };
    ArgumentGuard.prototype.nonEmptyString = function (arg, code, formatId) {
        if (typeof arg !== "string" || !arg.length) {
            throwError(code, formatId);
        }
        return this;
    };
    ArgumentGuard.prototype.true = function (arg, code, formatId) {
        if (!arg) {
            throwError(code, formatId);
        }
        return this;
    };
    ArgumentGuard.prototype.false = function (arg, code, formatId) {
        if (arg) {
            throwError(code, formatId);
        }
        return this;
    };
    return ArgumentGuard;
}());
var guard = new ArgumentGuard();
function isDocumentReady() {
    if (!document) {
        return true;
    }
    var state = document.readyState;
    return state === "complete" ||
        state === "interactive" ||
        state === "loaded"; /* old safari browsers */
}

var lastUID = 0;
function uid() {
    return ++lastUID;
}

function subscribe() {
    var core = this.sandbox._extensionsOnlyCore;
    var messages = typeof this.moduleWillSubscribe === "function"
        ? core.createHook("onModuleSubscribe", this.moduleWillSubscribe, this)()
        : null;
    var anyMessages = Array.isArray(messages) && messages.length >= 0;
    if (!anyMessages) {
        return;
    }
    guard.function(this.moduleDidReceiveMessage, "m23", this.sandbox.moduleId);
    var moduleDidReceiveMessage = core.createHook("onModuleReceiveMessage", this.moduleDidReceiveMessage, this);
    this.sandbox.unsubscribers = messages.reduce(function (map, message) {
        map[message] = core.onMessage(message, moduleDidReceiveMessage);
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

/* tslint:disable */
if (typeof Array.prototype.reduceRight !== "function") {
    Array.prototype.reduceRight = function (callback /*, initialValue*/) {
        "use strict";
        if (null === this || "undefined" === typeof this) {
            throw new TypeError("Array.prototype.reduce called on null or undefined");
        }
        if ("function" !== typeof callback) {
            throw new TypeError(callback + " is not a function");
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
                throw new TypeError("Reduce of empty array with no initial value");
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

var HooksSystem = /** @class */ (function () {
    function HooksSystem() {
        this._plugins = Object.create(null);
    }
    HooksSystem.prototype.createHook = function (type, method, context) {
        guard
            .nonEmptyString(type, "m16")
            .function(method, "m17", type);
        var hooksContext = this;
        var result = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var plugins = hooksContext._plugins[type];
            if (!plugins) {
                return method.apply(context, args);
            }
            return plugins.reduceRight(function (pipeline, plugin) { return function () { return plugin.apply(context, [pipeline].concat(args)); }; }, function () { return method.apply(context, args); })();
        };
        result._withPipeline = true;
        result._hookType = type;
        return result;
    };
    HooksSystem.prototype.addPlugin = function (hookType, plugin) {
        guard
            .nonEmptyString(hookType, "m18")
            .function(plugin, "m19", hookType);
        (this._plugins[hookType] || (this._plugins[hookType] = [])).push(plugin);
    };
    return HooksSystem;
}());

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

var Sandbox = /** @class */ (function () {
    function Sandbox(core, moduleId, instanceId) {
        this._extensionsOnlyCore = core;
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
    Sandbox.prototype.startModule = function (id, options) {
        this._extensionsOnlyCore.startModule(id, options);
    };
    Sandbox.prototype.stopModule = function (id, instanceId) {
        this._extensionsOnlyCore.stopModule(id, instanceId);
    };
    Sandbox.prototype.publishAsync = function (message) {
        this._extensionsOnlyCore.publishAsync(message);
    };
    return Sandbox;
}());

var Core = /** @class */ (function () {
    function Core(hooksSystem, messageBus) {
        if (hooksSystem === void 0) { hooksSystem = new HooksSystem(); }
        if (messageBus === void 0) { messageBus = new MessageBus(); }
        this.Sandbox = Sandbox;
        this._isInitialized = false;
        this._onInit = null;
        this._hooksSystem = null;
        this._messageBus = null;
        this._extensions = Object.create(null);
        this._modules = Object.create(null);
        this._hooksSystem = hooksSystem;
        this._messageBus = messageBus;
        this._onDomReady = this._onDomReady.bind(this);
        this.use([
            // built-in extensions
            moduleAutosubscribe()
        ]);
    }
    Object.defineProperty(Core.prototype, "version", {
        get: function () {
            return VERSION;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Core.prototype, "extensions", {
        get: function () {
            return Object.keys(this._extensions);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Core.prototype, "modules", {
        get: function () {
            return Object.keys(this._modules);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Core.prototype, "runningModules", {
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
    Core.prototype.use = function (extensions) {
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
    Core.prototype.createHook = function (type, method, context) {
        return this._hooksSystem.createHook(type, method, context);
    };
    Core.prototype.init = function (onInit) {
        guard.false(this._isInitialized, "m7");
        this._onInit = this.createHook("onCoreInit", onInit || function () { }, this);
        this._createHooks();
        this._installExtensions();
        if (document) {
            if (isDocumentReady()) {
                setTimeout(this._onDomReady, 0);
            }
            else {
                document.addEventListener("DOMContentLoaded", this._onDomReady);
            }
        }
        else {
            setTimeout(this._onDomReady, 0);
        }
        this._isInitialized = true;
    };
    Core.prototype.addModule = function (id, factory) {
        guard
            .nonEmptyString(id, "m8")
            .false(id in this._modules, "m9")
            .function(factory, "m10", id);
        this._modules[id] = {
            factory: factory,
            instances: Object.create(null)
        };
    };
    Core.prototype.startModule = function (id, options) {
        if (options === void 0) { options = {}; }
        guard.true(this._isInitialized, "m11")
            .true(id in this._modules, "m12", id);
        var moduleData = this._modules[id];
        var instanceId = options.instanceId || id;
        var instance = moduleData.instances[instanceId];
        if (instance) {
            if (typeof instance.moduleDidReceiveProps === "function") {
                this.createHook("onModuleReceiveProps", instance.moduleDidReceiveProps, instance)(options.props);
            }
            return;
        }
        instance = this._createModule(id, instanceId, moduleData.factory);
        if (!instance) {
            return;
        }
        try {
            this.createHook("onModuleInit", instance.init, instance)(options.props);
            moduleData.instances[instanceId] = instance;
        }
        catch (err) {
            console.error("startModule(): \"" + id + "\" init failed");
            console.error(err);
        }
    };
    Core.prototype.stopModule = function (id, instanceId) {
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
            this.createHook("onModuleDestroy", instance.destroy, instance)();
            delete moduleData.instances[instanceId];
        }
        catch (err) {
            console.error("stopModule(): \"" + id + "\" destroy failed");
            console.error(err);
        }
    };
    Core.prototype.onMessage = function (type, handler) {
        return this._messageBus.onMessage(type, handler);
    };
    Core.prototype.publishAsync = function (message) {
        this._messageBus.publishAsync(message);
    };
    Core.prototype._createHooks = function () {
        this.addModule = this.createHook("onModuleAdd", this.addModule, this);
        this.startModule = this.createHook("onModuleStart", this.startModule, this);
        this.stopModule = this.createHook("onModuleStop", this.stopModule, this);
        this.onMessage = this.createHook("onMessageSubscribe", this.onMessage, this);
        this.publishAsync = this.createHook("onMessagePublish", this.publishAsync, this);
    };
    Core.prototype._installExtensions = function () {
        var _this = this;
        Object
            .keys(this._extensions)
            .forEach(function (name) { return _this._install(_this._extensions[name]); });
    };
    Core.prototype._install = function (extension) {
        var _this = this;
        var plugins = extension.install(this) || {};
        Object
            .keys(plugins)
            .forEach(function (hookType) {
            return _this._hooksSystem.addPlugin(hookType, plugins[hookType]);
        });
    };
    Core.prototype._onDomReady = function () {
        if (document) {
            document.removeEventListener("DOMContentLoaded", this._onDomReady);
        }
        this._onInit();
    };
    Core.prototype._createModule = function (id, instanceId, factory) {
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
    return Core;
}());

export { Core };
