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
        onApplicationStart();
        onApplicationStartCustom();
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
            document.addEventListener("DOMContentLoaded", onDomReady);
            return this;
        };
        return Core;
    }());
    spaMVP.Core = Core;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=Core.js.map