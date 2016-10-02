/**
 *  @license spaMVP - v2.0.0
 *  Copyright © 2016 Valentin Lozev
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *  Source code: http://github.com/valentin-lozev/spaMVP
 */ 
//# sourceMappingURL=license.js.map
var spaMVP;
(function (spaMVP) {
    var Hidden;
    (function (Hidden) {
        "use strict";
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
        Hidden.typeGuard = typeGuard;
    })(Hidden = spaMVP.Hidden || (spaMVP.Hidden = {}));
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=helpers.js.map
var spaMVP;
(function (spaMVP) {
    "use strict";
    /**
     *  @class Sandbox - Connects all modules to the outside world.
     *  @property {String} moduleInstanceId - Id of the module it serves for.
     */
    var Sandbox = (function () {
        function Sandbox(core, moduleInstanceId) {
            if (!core || !moduleInstanceId) {
                throw new Error("Missing core or module instance ID.");
            }
            this.core = core;
            this.moduleInstanceId = moduleInstanceId;
        }
        Sandbox.prototype.subscribe = function (eventTypes, handler, context) {
            this.core.subscribe(eventTypes, handler, context);
            return this;
        };
        Sandbox.prototype.unsubscribe = function (eventTypes, handler, context) {
            this.core.unsubscribe(eventTypes, handler, context);
            return this;
        };
        Sandbox.prototype.publish = function (eventType, data) {
            this.core.publish(eventType, data);
            return this;
        };
        Sandbox.prototype.start = function (moduleId, options) {
            this.core.start(moduleId, options);
            return this;
        };
        Sandbox.prototype.stop = function (moduleId, instanceId) {
            this.core.stop(moduleId, instanceId);
            return this;
        };
        return Sandbox;
    }());
    spaMVP.Sandbox = Sandbox;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=Sandbox.js.map
var spaMVP;
(function (spaMVP) {
    "use strict";
    function addSubscriber(eventType, handler, context) {
        this.subscribers[eventType] = this.subscribers[eventType] || [];
        this.subscribers[eventType].push({
            handler: handler,
            context: context
        });
    }
    function removeSubscriber(eventType, handler, context) {
        var subscribers = this.subscribers[eventType] || [];
        for (var i = 0, len = subscribers.length; i < len; i++) {
            var subscriber = subscribers[i];
            if (subscriber.handler === handler &&
                subscriber.context === context) {
                subscribers[i] = subscribers[len - 1];
                subscribers.length--;
                return;
            }
        }
    }
    function onDomReady(ev) {
        document.removeEventListener("DOMContentLoaded", onDomReady);
        onApplicationStartCustom();
        onApplicationStart();
    }
    function runPlugins(hookType) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
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
    var hidden = spaMVP.Hidden;
    var onApplicationStart = function () { };
    var onApplicationStartCustom = function () { };
    (function (HookType) {
        HookType[HookType["SPA_DOMReady"] = 0] = "SPA_DOMReady";
        HookType[HookType["SPA_ModuleDestroy"] = 1] = "SPA_ModuleDestroy";
        HookType[HookType["SPA_ModuleInit"] = 2] = "SPA_ModuleInit";
        HookType[HookType["SPA_ModuleRegister"] = 3] = "SPA_ModuleRegister";
        HookType[HookType["SPA_Publish"] = 4] = "SPA_Publish";
        HookType[HookType["SPA_Subscribe"] = 5] = "SPA_Subscribe";
        HookType[HookType["SPA_Unsubscribe"] = 6] = "SPA_Unsubscribe";
    })(spaMVP.HookType || (spaMVP.HookType = {}));
    var HookType = spaMVP.HookType;
    var Core = (function () {
        function Core(sandboxType) {
            this.subscribers = {};
            this.modules = {};
            this.hooks = {};
            this.Sandbox = typeof sandboxType === "function" ? sandboxType : spaMVP.Sandbox;
        }
        /**
         *  Subscribes for given events.
         *  @param {Array} eventTypes - Array of events to subscribe for.
         *  @param {Function} handler - The events' handler.
         *  @param {Object} context - Handler's context.
         */
        Core.prototype.subscribe = function (eventTypes, handler, context) {
            var errorMsg = "Subscribing failed:";
            hidden.typeGuard("function", handler, errorMsg + " event handler should be a function.");
            hidden.typeGuard("array", eventTypes, errorMsg + " event types should be passed as an array of strings.");
            runPlugins.call(this, HookType.SPA_Subscribe, eventTypes);
            for (var i = 0, len = eventTypes.length; i < len; i++) {
                addSubscriber.call(this, eventTypes[i], handler, context);
            }
            return this;
        };
        /**
         *  Unsubscribes for specific events.
         *  @param {Array} eventTypes - Array of events to unsubscribe for.
         *  @param {Function} handler - The handler which must be unsubscribed.
         *  @param {Object} context - Handler's context.
         */
        Core.prototype.unsubscribe = function (eventTypes, handler, context) {
            var errorMsg = "Unsubscribing failed:";
            hidden.typeGuard("function", handler, errorMsg + " event handler should be a function.");
            hidden.typeGuard("array", eventTypes, errorMsg + " event types should be passed as an array of strings.");
            runPlugins.call(this, HookType.SPA_Unsubscribe, eventTypes);
            for (var i = 0, len = eventTypes.length; i < len; i++) {
                removeSubscriber.call(this, eventTypes[i], handler, context);
            }
            return this;
        };
        /**
         *  Publishes an event.
         *  @param {String} type - Type of the event.
         *  @param {*} [data] - Optional data.
         */
        Core.prototype.publish = function (type, data) {
            if (!Array.isArray(this.subscribers[type])) {
                return;
            }
            runPlugins.call(this, HookType.SPA_Publish, type, data);
            this.subscribers[type]
                .slice(0)
                .forEach(function (subscriber) { return subscriber.handler.call(subscriber.context, type, data); });
        };
        /**
         *  Registers a module.
         *  @param {string} moduleId
         *  @param {function} moduleFactory - function which provides an instance of the module.
         */
        Core.prototype.register = function (moduleId, moduleFactory) {
            var errorMsg = moduleId + " registration failed:";
            hidden.typeGuard("string", moduleId, errorMsg + " module ID must be a string.");
            hidden.typeGuard("string", moduleId, errorMsg + " module ID must be a string.");
            hidden.typeGuard("undefined", this.modules[moduleId], errorMsg + " module with such id has been already registered.");
            var tempModule = moduleFactory(new this.Sandbox(this, moduleId));
            hidden.typeGuard("function", tempModule.init, errorMsg + " module does not implement init method.");
            hidden.typeGuard("function", tempModule.destroy, errorMsg + " module does not implement destroy method.");
            runPlugins.call(this, HookType.SPA_ModuleRegister, moduleId, moduleFactory);
            this.modules[moduleId] = {
                create: moduleFactory,
                instances: {}
            };
            return this;
        };
        /**
         *  Starts an instance of given module and initializes it.
         *  @param {string} moduleId - Id of the module, which must be started.
         *  @param {object} options
         */
        Core.prototype.start = function (moduleId, options) {
            var module = this.modules[moduleId];
            options = options || {};
            var errorMsg = moduleId + " initialization failed:";
            hidden.typeGuard("object", module, errorMsg + " module not found.");
            hidden.typeGuard("object", options, errorMsg + " module options must be an object.");
            var instanceId = options["instanceId"] || moduleId;
            if (module.instances.hasOwnProperty(instanceId)) {
                // already initialized
                return this;
            }
            runPlugins.call(this, HookType.SPA_ModuleInit, moduleId, options);
            var instance = module.create(new this.Sandbox(this, instanceId));
            module.instances[instanceId] = instance;
            instance.init(options);
            return this;
        };
        /**
         *  Stops a given module.
         *  @param {string} moduleId - Id of the module, which must be stopped.
         *  @param {string} [instanceId] - Specific module's instance id.
         */
        Core.prototype.stop = function (moduleId, instanceId) {
            var module = this.modules[moduleId];
            var id = instanceId || moduleId;
            if (module && module.instances.hasOwnProperty(id)) {
                runPlugins.call(this, HookType.SPA_ModuleDestroy, moduleId, instanceId);
                module.instances[id].destroy();
                delete module.instances[id];
            }
            return this;
        };
        /**
         *  Get all registered module ids.
         */
        Core.prototype.getModules = function () {
            return Object.keys(this.modules);
        };
        /**
         *  Hooks a given function to specific hook type.
         *  @param {HookType} hookType - The hook type.
         *  @param {function} plugin - The function needs to hook.
         */
        Core.prototype.hook = function (hookType, plugin) {
            var errorMsg = "Hook plugin failed:";
            hidden.typeGuard("number", hookType, errorMsg + " hook type should be an HookType enum.");
            hidden.typeGuard("function", plugin, errorMsg + " plugin should be a function.");
            if (!Array.isArray(this.hooks[hookType])) {
                this.hooks[hookType] = [];
            }
            this.hooks[hookType].push(plugin);
            return this;
        };
        /**
         *  Start listening for hash change if there are any registered routes.
         *  @param {Function} action Optional action to be executed before core initialization.
         */
        Core.prototype.run = function (action) {
            var _this = this;
            onApplicationStartCustom = typeof action === "function" ? action : onApplicationStartCustom;
            onApplicationStart = function () {
                runPlugins.call(_this, HookType.SPA_DOMReady);
            };
            if (document.readyState === "complete" ||
                document.readyState === "interactive" ||
                document.readyState === "loaded" /* old safari browsers */) {
                onDomReady(null);
            }
            else {
                document.addEventListener("DOMContentLoaded", onDomReady);
            }
            return this;
        };
        return Core;
    }());
    spaMVP.Core = Core;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=Core.js.map
var spaMVP;
(function (spaMVP) {
    var Hidden;
    (function (Hidden) {
        "use strict";
        Hidden.ModelEvents = {
            Change: "change",
            Destroy: "destroy"
        };
        Hidden.CollectionEvents = {
            AddedItems: "added-items",
            DeletedItems: "deleted-items",
            UpdatedItem: "updated-item"
        };
        /**
         *  @class spaMVP.Model
         */
        var Model = (function () {
            function Model() {
                this.listeners = {};
            }
            /**
             *  Attaches an event handler to model raised events.
             *  @param {String} eventType The name of the event.
             *  @param {Function} handler The event's handler.
             *  @param {Object} [context] The Handler's context.
             */
            Model.prototype.on = function (eventType, handler, context) {
                if (!eventType) {
                    return false;
                }
                this.listeners[eventType] = this.listeners[eventType] || [];
                this.listeners[eventType].push({
                    handler: handler,
                    context: context
                });
                return true;
            };
            /**
             *  Detaches an event handler.
             *  @param {String} eventType The name of the event.
             *  @param {Function} handler The handler which must be detached.
             *  @param {Object} [context] The Handler's context.
             */
            Model.prototype.off = function (eventType, handler, context) {
                var listeners = this.listeners[eventType] || [];
                for (var i = 0, len = listeners.length; i < len; i++) {
                    var listener = listeners[i];
                    if (listener.handler === handler &&
                        listener.context === context) {
                        listener = listeners[len - 1];
                        listeners.length--;
                        return true;
                    }
                }
                return false;
            };
            /**
             *  Notifies the listeners attached for specific event.
             */
            Model.prototype.notify = function (type, data) {
                if (!Array.isArray(this.listeners[type])) {
                    return;
                }
                this.listeners[type]
                    .slice(0)
                    .forEach(function (listener) { return listener.handler.call(listener.context, data); });
            };
            /**
             *  Notifies for change event.
             */
            Model.prototype.change = function () {
                this.notify(Hidden.ModelEvents.Change, this);
            };
            /**
             *  Notifies for destroy event.
             */
            Model.prototype.destroy = function () {
                this.notify(Hidden.ModelEvents.Destroy, this);
            };
            return Model;
        }());
        Hidden.Model = Model;
        var Model;
        (function (Model) {
            Model.Events = Hidden.ModelEvents;
            Model.CollectionEvents = {
                AddedItems: "added-items",
                DeletedItems: "deleted-items",
                UpdatedItem: "updated-item"
            };
        })(Model = Hidden.Model || (Hidden.Model = {}));
    })(Hidden = spaMVP.Hidden || (spaMVP.Hidden = {}));
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=Model.js.map
var spaMVP;
(function (spaMVP) {
    "use strict";
})(spaMVP || (spaMVP = {}));
var spaMVP;
(function (spaMVP) {
    var Hidden;
    (function (Hidden) {
        "use strict";
        /**
         *  Creates a collection of unique items.
         *  @class spaMVP.HashSet
         *  @property {Number} size
         */
        var HashSet = (function () {
            function HashSet() {
                this.items = {};
                this.size = 0;
            }
            /**
             *  Determines whether an item is in the set.
             *  @returns {Boolean}
             */
            HashSet.prototype.contains = function (item) {
                var hashCode = item.hash();
                if (!Object.prototype.hasOwnProperty.call(this.items, hashCode)) {
                    return false;
                }
                var hashedItems = this.items[hashCode];
                if (!Array.isArray(hashedItems)) {
                    return hashedItems.equals(item);
                }
                for (var i = 0, len = hashedItems.length; i < len; i++) {
                    if (hashedItems[i].equals(item)) {
                        return true;
                    }
                }
                return false;
            };
            /**
             *  Adds a new item to the set.
             *  @returns {Boolean}
             */
            HashSet.prototype.add = function (item) {
                if (item === null ||
                    typeof item === "undefined" ||
                    this.contains(item)) {
                    return false;
                }
                var hashCode = item.hash();
                // the first item with this hash
                if (!Object.prototype.hasOwnProperty.call(this.items, hashCode)) {
                    this.items[hashCode] = item;
                }
                else if (!Array.isArray(this.items[hashCode])) {
                    // the second item with this hash
                    this.items[hashCode] = [this.items[hashCode], item];
                }
                else {
                    // there are already two or more items with this hash
                    this.items[hashCode].push(item);
                }
                this.size++;
                return true;
            };
            /**
             *  Removes an item from the set.
             *  @returns {Boolean}
             */
            HashSet.prototype.remove = function (item) {
                if (!this.contains(item)) {
                    return false;
                }
                var hashCode = item.hash();
                if (Array.isArray(this.items[hashCode])) {
                    var hashCodeItems = this.items[hashCode];
                    for (var i = 0, len = hashCodeItems.length; i < len; i++) {
                        if (hashCodeItems[i].equals(item)) {
                            hashCodeItems[i] = hashCodeItems[len - 1];
                            hashCodeItems.length--;
                            break;
                        }
                    }
                }
                else {
                    delete this.items[hashCode];
                }
                this.size--;
                return true;
            };
            /**
             *  Removes all items from the set.
             *  @returns {Boolean}
             */
            HashSet.prototype.clear = function () {
                if (this.size <= 0) {
                    return false;
                }
                this.items = {};
                this.size = 0;
                return true;
            };
            /**
             *  Performs a an action on each item in the set.
             *  @param {Function} action
             *  @param {Object} [context] The action's context.
             */
            HashSet.prototype.forEach = function (action, context) {
                var index = 0;
                var hashes = Object.keys(this.items);
                for (var i = 0, len = hashes.length; i < len; i++) {
                    var hashIndexItem = this.items[hashes[i]];
                    if (!Array.isArray(hashIndexItem)) {
                        action.call(context, hashIndexItem, index);
                        index++;
                        continue;
                    }
                    for (var j = 0, hashLength = hashIndexItem.length; j < hashLength; j++) {
                        action.call(context, hashIndexItem[j], index);
                        index++;
                    }
                }
            };
            /**
             *  Converts the set to Array.
             *  @returns {Array}
             */
            HashSet.prototype.toArray = function () {
                var result = new Array(this.size);
                var index = 0;
                var hashes = Object.keys(this.items);
                for (var i = 0, hashesLen = hashes.length; i < hashesLen; i++) {
                    var hashIndexItem = this.items[hashes[i]];
                    if (!Array.isArray(hashIndexItem)) {
                        result[index] = hashIndexItem;
                        index++;
                        continue;
                    }
                    for (var j = 0, len = hashIndexItem.length; j < len; j++) {
                        result[index] = hashIndexItem[j];
                        index++;
                    }
                }
                return result;
            };
            return HashSet;
        }());
        Hidden.HashSet = HashSet;
    })(Hidden = spaMVP.Hidden || (spaMVP.Hidden = {}));
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=HashSet.js.map
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var spaMVP;
(function (spaMVP) {
    var Hidden;
    (function (Hidden) {
        "use strict";
        function onItemChange(item) {
            this.notify(Hidden.Model.CollectionEvents.UpdatedItem, item);
        }
        function onItemDestroy(item) {
            this.removeRange([item]);
        }
        /**
         *  Composite pattern on spaMVP.Model.
         *  It is usefull when you want to listen for collection of models.
         *  @class spaMVP.Collection
         *  @augments spaMVP.Model
         */
        var Collection = (function (_super) {
            __extends(Collection, _super);
            function Collection() {
                _super.call(this);
                this.models = new Hidden.HashSet();
            }
            Object.defineProperty(Collection.prototype, "size", {
                get: function () {
                    return this.models.size;
                },
                enumerable: true,
                configurable: true
            });
            Collection.prototype.equals = function (other) {
                return false;
            };
            Collection.prototype.hash = function () {
                return this.size ^ 17;
            };
            /**
             *  Adds new model to the set.
             *  @returns {Boolean}
             */
            Collection.prototype.add = function (model) {
                return this.addRange([model]);
            };
            /**
             *  Adds range of models to the set.
             *  @returns {Boolean}
             */
            Collection.prototype.addRange = function (models) {
                var added = [];
                for (var i = 0, len = models.length; i < len; i++) {
                    var model = models[i];
                    if (!this.models.add(model)) {
                        continue;
                    }
                    model.on(Hidden.Model.Events.Change, onItemChange, this);
                    model.on(Hidden.Model.Events.Destroy, onItemDestroy, this);
                    added.push(model);
                }
                var isModified = added.length > 0;
                if (isModified) {
                    this.notify(Hidden.Model.CollectionEvents.AddedItems, added);
                }
                return isModified;
            };
            /**
             *  Removes a model from the set.
             *  @returns {Boolean}
             */
            Collection.prototype.remove = function (model) {
                return this.removeRange([model]);
            };
            /**
             *  Removes range of models.
             *  @returns {Boolean}
             */
            Collection.prototype.removeRange = function (models) {
                var deleted = [];
                for (var i = 0, len = models.length; i < len; i++) {
                    var model = models[i];
                    if (!this.models.remove(model)) {
                        continue;
                    }
                    model.off(Hidden.Model.Events.Change, onItemChange, this);
                    model.off(Hidden.Model.Events.Destroy, onItemDestroy, this);
                    deleted.push(model);
                }
                var isModified = deleted.length > 0;
                if (isModified) {
                    this.notify(Hidden.Model.CollectionEvents.DeletedItems, deleted);
                }
                return isModified;
            };
            /**
             *  Removes all models from the set.
             *  @returns {Boolean}
             */
            Collection.prototype.clear = function () {
                return this.removeRange(this.toArray());
            };
            /**
             *  Determines whether a model is in the collection.
             *  @returns {Boolean}
             */
            Collection.prototype.contains = function (model) {
                return this.models.contains(model);
            };
            /**
             *  Determines whether the collection is not empty.
             *  @returns {Boolean}
             */
            Collection.prototype.any = function () {
                return this.size > 0;
            };
            /**
             *  Returns the models as Array.
             *  @returns {Array}
             */
            Collection.prototype.toArray = function () {
                return this.models.toArray();
            };
            /**
             *  Performs an action on each model in the set.
             */
            Collection.prototype.forEach = function (action, context) {
                this.models.forEach(action, context);
            };
            return Collection;
        }(Hidden.Model));
        Hidden.Collection = Collection;
    })(Hidden = spaMVP.Hidden || (spaMVP.Hidden = {}));
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=Collection.js.map
var spaMVP;
(function (spaMVP) {
    var Hidden;
    (function (Hidden) {
        "use strict";
        /**
         *  Author: Martin Chaov
         *  github: https://github.com/mchaov/JSEventsManager
         *  Smart events managing by altering the properties of a HTML element
         */
        // 'use strict'; -> issues with iOS Safari on tablet devices: 09.11.2015
        Element.prototype.trigger = function () { return false; };
        Element.prototype.hasEvent = function () { return false; };
        Element.prototype.detach = function () { return false; };
        Element.prototype.events = false;
        function removeEvent(name) {
            var ev, type, handler, useCapture;
            ev = this.events[name];
            useCapture = ev.useCapture;
            type = ev.eventType;
            handler = ev.handler;
            this.removeEventListener(type, handler, useCapture);
            delete this.eventsList[name];
        }
        function detachEvent(name) {
            var i;
            if (name === undefined || name === '') {
                for (i in this.eventsList) {
                    removeEvent.call(this, i);
                }
                this.eventsList = {};
            }
            else if (this.hasEvent(name)) {
                removeEvent.call(this, name);
            }
            return this.eventsList;
        }
        function hasEvent(name) {
            return typeof this.eventsList[name] === 'object' ? this.eventsList[name] : false;
        }
        function triggerEvent(name) {
            var evt = this.hasEvent(name);
            if (typeof evt.handler === 'function') {
                return evt.handler();
            }
            return false;
        }
        function UIEvent(config) {
            if (!(this instanceof UIEvent)) {
                return new UIEvent(config);
            }
            this.htmlElement = config.htmlElement;
            this.eventConfig = {
                name: config.name,
                eventType: config.eventType,
                handler: config.handler === undefined ? false : config.handler,
                useCapture: config.useCapture === undefined ? false : config.useCapture,
                context: config.context === undefined ? null : config.context
            };
            this.init();
        }
        Hidden.UIEvent = UIEvent;
        UIEvent.prototype.init = function () {
            if (this.htmlElement.eventsList === undefined) {
                Object.defineProperties(this.htmlElement, {
                    'eventsList': {
                        writable: true,
                        enumerable: false,
                        configurable: false,
                        value: {}
                    },
                    'events': {
                        enumerable: false,
                        configurable: false,
                        get: function () {
                            return this.eventsList;
                        },
                        set: function (e) {
                            return this.eventsList[e.name] = e;
                        }
                    },
                    'trigger': {
                        writable: false,
                        enumerable: false,
                        configurable: false,
                        value: triggerEvent
                    },
                    'hasEvent': {
                        writable: false,
                        enumerable: false,
                        configurable: false,
                        value: hasEvent
                    },
                    'detach': {
                        writable: false,
                        enumerable: false,
                        configurable: false,
                        value: detachEvent
                    }
                });
            }
            else if (this.htmlElement.hasEvent(this.eventConfig.name)) {
                return false;
            }
            this.eventConfig.handler = this.eventConfig.handler.bind(this.eventConfig.context || this);
            this.htmlElement.addEventListener(this.eventConfig.eventType, this.eventConfig.handler, this.eventConfig.useCapture);
            this.htmlElement.events = this.eventConfig;
        };
        Object.defineProperties(UIEvent.prototype, {
            'detach': {
                writable: false,
                enumerable: false,
                configurable: false,
                value: function (name) {
                    return detachEvent.call(this.htmlElement, name);
                }
            },
            'trigger': {
                writable: false,
                enumerable: false,
                configurable: false,
                value: function (name) {
                    return triggerEvent.call(this.htmlElement, name || this.eventConfig.name);
                }
            }
        });
    })(Hidden = spaMVP.Hidden || (spaMVP.Hidden = {}));
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=UIEvent.js.map
var spaMVP;
(function (spaMVP) {
    var Hidden;
    (function (Hidden) {
        "use strict";
        function eventHandler(ev) {
            var target = ev.target;
            var dataset = target.dataset;
            if (!dataset.hasOwnProperty(ev.type)) {
                return;
            }
            var callbackName = dataset[ev.type];
            if (typeof this[callbackName] === "function") {
                this[callbackName](dataset, target, ev);
                return;
            }
        }
        /**
         *  @class spaMVP.View
         *  @param {HTMLElement} domNode The view's html element.
         *  @param {Function} [template] A function which renders view's html element.
         *  @property {HTMLElement} domNode
         */
        var View = (function () {
            function View(domNode, template) {
                if (!domNode) {
                    throw new Error("Dom node cannot be null.");
                }
                this._domNode = domNode;
                this.template = template;
            }
            Object.defineProperty(View.prototype, "domNode", {
                get: function () {
                    return this._domNode;
                },
                enumerable: true,
                configurable: true
            });
            /**
             *  Maps a view action to given ui event disptached from html element.
             *  Mapping works by using the dataset - e.g data-click="handleClick" maps to handleClick.
             * @param eventType
             * @param useCapture
             * @param selector
             */
            View.prototype.map = function (eventType, useCapture, selector) {
                if (useCapture === void 0) { useCapture = false; }
                Hidden.UIEvent({
                    name: eventType,
                    htmlElement: !selector ? this.domNode : this.domNode.querySelector(selector),
                    handler: eventHandler,
                    eventType: eventType,
                    context: this,
                    useCapture: useCapture
                });
                return this;
            };
            /**
             *  Renders the view.
             *  @returns {HTMLElement}
             */
            View.prototype.render = function (model) {
                if (this.template) {
                    this.domNode.innerHTML = this.template.call(this, model);
                }
                return this.domNode;
            };
            /**
             *  Removes all elements and mapped events.
             */
            View.prototype.destroy = function () {
                if (typeof this.domNode.detach === "function") {
                    this.domNode.detach();
                }
                this.removeAllElements();
                this._domNode = null;
                return this;
            };
            /**
             *  Finds an element by given selector.
             *  @param {String} selector
             *  @returns {Element}
             */
            View.prototype.query = function (selector) {
                return this.domNode.querySelector(selector);
            };
            /**
             *  Removes an element by given selector.
             *  @param {String} selector
             */
            View.prototype.removeElement = function (selector) {
                var element = this.query(selector);
                if (element) {
                    element.parentElement.removeChild(element);
                }
                return this;
            };
            /**
             *  Removes all elements.
             *  @returns {spaMVP.View}
             */
            View.prototype.removeAllElements = function () {
                while (this.domNode.firstElementChild) {
                    this.domNode.removeChild(this.domNode.firstElementChild);
                }
                return this;
            };
            return View;
        }());
        Hidden.View = View;
    })(Hidden = spaMVP.Hidden || (spaMVP.Hidden = {}));
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=View.js.map
var spaMVP;
(function (spaMVP) {
    var Hidden;
    (function (Hidden) {
        "use strict";
        /**
         *  @class spaMVP.Presenter
         */
        var Presenter = (function () {
            function Presenter() {
                this._view = null;
                this._model = null;
                this._modelHandlers = {};
            }
            Object.defineProperty(Presenter.prototype, "view", {
                get: function () {
                    return this._view;
                },
                set: function (value) {
                    if (this.view === value) {
                        return;
                    }
                    if (this.view) {
                        this.view.destroy();
                    }
                    this._view = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Presenter.prototype, "model", {
                get: function () {
                    return this._model;
                },
                set: function (model) {
                    var _this = this;
                    if (this._model === model) {
                        return;
                    }
                    Object.keys(this._modelHandlers).forEach(function (type) {
                        var eventHandler = _this._modelHandlers[type];
                        if (_this._model) {
                            _this._model.off(type, eventHandler, _this);
                        }
                        if (model) {
                            model.on(type, eventHandler, _this);
                        }
                    });
                    this._model = model;
                    this.render();
                },
                enumerable: true,
                configurable: true
            });
            /**
             *  Determins which events to handle when model notifies.
             */
            Presenter.prototype.onModel = function (eventType, handler) {
                if (eventType && handler) {
                    this._modelHandlers[eventType] = handler;
                }
                return this;
            };
            /**
             *  Renders its view.
             */
            Presenter.prototype.render = function () {
                if (this.view) {
                    return this.view.render(this.model);
                }
                return null;
            };
            /**
             *  Destroys its view and model.
             */
            Presenter.prototype.destroy = function () {
                this.view = null;
                this.model = null;
            };
            return Presenter;
        }());
        Hidden.Presenter = Presenter;
    })(Hidden = spaMVP.Hidden || (spaMVP.Hidden = {}));
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=Presenter.js.map
var spaMVP;
(function (spaMVP) {
    "use strict";
    var hidden = spaMVP.Hidden;
    spaMVP.Core.prototype.useMVP = function () {
        var that = this;
        if (that.mvp) {
            return;
        }
        var mvp = {
            Model: hidden.Model,
            Collection: hidden.Collection,
            View: hidden.View,
            Presenter: hidden.Presenter,
        };
        that.mvp = mvp;
    };
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=mvp.js.map
var spaMVP;
(function (spaMVP) {
    var Hidden;
    (function (Hidden) {
        "use strict";
        /**
         *  @class UrlHash - Represents the string after "#" in a url.
         *  @property {String} value - The string after # in a url.
         *  @property {Array} tokens - The array of string tokens after splitint its value by / (slash).
         *  @property {Array} queryParams - The array of key-value pairs parsed from the query string in its value.
         */
        var UrlHash = (function () {
            function UrlHash() {
                this.questionMarkIndex = -1;
                this.url = "";
                this.tokens = [];
                this.queryParams = [];
            }
            Object.defineProperty(UrlHash.prototype, "value", {
                get: function () {
                    return this.url;
                },
                set: function (url) {
                    url = url || "";
                    this.url = url;
                    this.questionMarkIndex = url.indexOf("?");
                    this.queryParams = [];
                    this.tokens = [];
                    this.populateQueryParams();
                    this.populateTokens();
                },
                enumerable: true,
                configurable: true
            });
            UrlHash.prototype.anyQueryParams = function () {
                return this.questionMarkIndex > -1;
            };
            UrlHash.prototype.populateQueryParams = function () {
                var _this = this;
                if (!this.anyQueryParams()) {
                    return;
                }
                this.queryParams = this.value
                    .substring(this.questionMarkIndex + 1)
                    .split("&")
                    .map(function (keyValuePairString) { return _this.parseQueryParam(keyValuePairString); });
            };
            UrlHash.prototype.parseQueryParam = function (keyValuePair) {
                var args = keyValuePair.split("=");
                return {
                    key: args[0],
                    value: args[1] || ""
                };
            };
            UrlHash.prototype.populateTokens = function () {
                var valueWithoutQuery = this.getValueWithoutQuery();
                this.tokens = valueWithoutQuery
                    .split("/")
                    .filter(function (token) { return token !== ""; });
            };
            UrlHash.prototype.getValueWithoutQuery = function () {
                if (!this.anyQueryParams()) {
                    return this.value;
                }
                return this.value.substring(0, this.value.length - (this.value.length - this.questionMarkIndex));
            };
            return UrlHash;
        }());
        Hidden.UrlHash = UrlHash;
    })(Hidden = spaMVP.Hidden || (spaMVP.Hidden = {}));
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=UrlHash.js.map
var spaMVP;
(function (spaMVP) {
    var Hidden;
    (function (Hidden) {
        "use strict";
        var routeParamRegex = /{([a-zA-Z]+)}/; // e.g {id}
        /**
         *  @class Route - Accepts a pattern and split it by / (slash).
         *  It also supports dynamic params - {yourDynamicParam}.
         *  @property {String} pattern
         */
        var Route = (function () {
            function Route(pattern, onStart) {
                this.tokens = [];
                var errorMsg = "Route registration failed:";
                Hidden.typeGuard("string", pattern, errorMsg + " pattern should be non empty string.");
                Hidden.typeGuard("function", onStart, errorMsg + " callback should be a function.");
                this.pattern = pattern;
                this.callback = onStart;
                this.populateTokens();
            }
            /**
             *  The array of tokens after its pattern is splitted by / (slash).
             */
            Route.prototype.getTokens = function () {
                return this.tokens.slice(0);
            };
            /**
             *  Determines whether it equals UrlHash.
             */
            Route.prototype.equals = function (hashUrl) {
                if (this.tokens.length !== hashUrl.tokens.length) {
                    return false;
                }
                for (var i = 0, len = this.tokens.length; i < len; i++) {
                    var token = this.tokens[i];
                    var urlToken = hashUrl.tokens[i];
                    if (token.isDynamic) {
                        continue;
                    }
                    if (token.name.toLowerCase() !== urlToken.toLowerCase()) {
                        return false;
                    }
                }
                return true;
            };
            /**
             *  Populate the dynamic params from the UrlHash if such exist
             *  and executes the registered callback.
             */
            Route.prototype.start = function (urlHash) {
                var queryParams = this.getParamsFromUrl(urlHash);
                if (this.callback) {
                    this.callback(queryParams);
                }
            };
            Route.prototype.populateTokens = function () {
                var _this = this;
                this.tokens = [];
                this.pattern.split("/").forEach(function (urlFragment) {
                    if (urlFragment !== "") {
                        _this.tokens.push(_this.parseToken(urlFragment));
                    }
                });
            };
            Route.prototype.parseToken = function (urlFragment) {
                var paramMatchGroups = routeParamRegex.exec(urlFragment);
                var isDynamic = !!paramMatchGroups;
                return {
                    name: isDynamic ? paramMatchGroups[1] : urlFragment,
                    isDynamic: isDynamic
                };
            };
            Route.prototype.getParamsFromUrl = function (url) {
                var result = this.getQueryParamsFromUrl(url);
                // route params are with higher priority than query params
                this.tokens.forEach(function (token, index) {
                    if (token.isDynamic) {
                        result[token.name] = url.tokens[index];
                    }
                });
                return result;
            };
            Route.prototype.getQueryParamsFromUrl = function (url) {
                var result = {};
                url.queryParams.forEach(function (param) { return result[param.key] = param.value; });
                return result;
            };
            return Route;
        }());
        Hidden.Route = Route;
    })(Hidden = spaMVP.Hidden || (spaMVP.Hidden = {}));
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=Route.js.map
var spaMVP;
(function (spaMVP) {
    var Hidden;
    (function (Hidden) {
        "use strict";
        function findRoute() {
            for (var i = 0, len = this.routes.length; i < len; i++) {
                var route = this.routes[i];
                if (route.equals(this.urlHash)) {
                    return route;
                }
            }
            return null;
        }
        function startDefaultRoute(invalidHash) {
            window.history.replaceState(null, null, window.location.pathname + "#" + this.defaultUrl);
            this.urlHash.value = this.defaultUrl;
            var nextRoute = findRoute.call(this);
            if (nextRoute) {
                nextRoute.start(this.urlHash);
            }
            else {
                console.warn("No route handler for " + invalidHash);
            }
        }
        /**
         *  @class RouteConfig - Handles window hash change.
         */
        var RouteConfig = (function () {
            function RouteConfig() {
                this.routes = [];
                this.urlHash = new Hidden.UrlHash();
                this.defaultUrl = null;
            }
            /**
             *  Registers a route by given url pattern.
             *  When url's hash is changed it executes a callback with populated dynamic routes and query parameters.
             *  Dynamic route param can be registered with {yourParam}.
             */
            RouteConfig.prototype.register = function (pattern, callback) {
                if (this.routes.some(function (r) { return r.pattern === pattern; })) {
                    throw new Error("Route " + pattern + " has been already registered.");
                }
                this.routes.push(new Hidden.Route(pattern, callback));
                return this;
            };
            /**
             *  Starts hash url if such is registered, if not, it starts the default one.
             */
            RouteConfig.prototype.startRoute = function (hash) {
                this.urlHash.value = hash;
                var nextRoute = findRoute.call(this);
                if (nextRoute) {
                    nextRoute.start(this.urlHash);
                    return;
                }
                if (typeof this.defaultUrl === "string") {
                    startDefaultRoute.call(this, hash);
                }
                else {
                    console.warn("No route matches " + hash);
                }
            };
            /**
             *  Returns all registered patterns.
             */
            RouteConfig.prototype.getRoutes = function () {
                return this.routes.map(function (route) { return route.pattern; });
            };
            /**
             *  Determines if there are any registered routes.
             */
            RouteConfig.prototype.hasRoutes = function () {
                return this.routes.length > 0;
            };
            return RouteConfig;
        }());
        Hidden.RouteConfig = RouteConfig;
    })(Hidden = spaMVP.Hidden || (spaMVP.Hidden = {}));
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=RouteConfig.js.map
var spaMVP;
(function (spaMVP) {
    "use strict";
    var hidden = spaMVP.Hidden;
    spaMVP.Core.prototype.useRouting = function () {
        var that = this;
        if (that.routing) {
            return;
        }
        that.routing = new hidden.RouteConfig();
        that.hook(spaMVP.HookType.SPA_DOMReady, function () {
            if (!that.routing.hasRoutes()) {
                return;
            }
            var global = window;
            that.routing.startRoute(global.location.hash.substring(1));
            global.addEventListener("hashchange", function () {
                that.routing.startRoute(global.location.hash.substring(1));
            });
        });
    };
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=routing.js.map
var spaMVP;
(function (spaMVP) {
    "use strict";
    var ServiceConfig = (function () {
        function ServiceConfig() {
            this.services = {};
        }
        /**
         *  Add a service.
         *  @param {String} id
         *  @param {Function} factory - function which provides an instance of the service.
         */
        ServiceConfig.prototype.add = function (id, creator) {
            if (typeof id !== "string" || id === "") {
                throw new TypeError(id + " service registration failed: ID must be non empty string.");
            }
            if (typeof creator !== "function") {
                throw new TypeError(id + " service registration failed: creator must be a function.");
            }
            if (this.services[id]) {
                throw new TypeError(id + " service registration failed: a service with such id has been already added.");
            }
            this.services[id] = creator;
            return this;
        };
        /**
         *  Gets a specific service instance by id.
         *  @param {String} id
         *  @returns {*}
         */
        ServiceConfig.prototype.get = function (id) {
            var creator = this.services[id];
            if (!creator) {
                throw new ReferenceError(id + " service was not found.");
            }
            return creator();
        };
        return ServiceConfig;
    }());
    spaMVP.Core.prototype.useServices = function () {
        var that = this;
        if (that.services) {
            return;
        }
        that.services = new ServiceConfig();
        var sandbox = that.Sandbox.prototype;
        /**
         *  Gets a specific service instance by id.
         *  @param {String} id
         *  @returns {*}
         */
        sandbox.getService = function (id) {
            return this.core.services.get(id);
        };
    };
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=services.js.map
var spaMVP;
(function (spaMVP) {
    "use strict";
    delete spaMVP.Hidden;
    /**
     *  Returns the application core.
     * @param {function} [sandboxType] - Optional. Sandbox type which the application will use.
     * @returns {Core}
     */
    function createCore(sandboxType) {
        return new spaMVP.Core(sandboxType);
    }
    spaMVP.createCore = createCore;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=spaMVP.js.map