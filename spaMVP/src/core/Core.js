var spaMVP;
(function (spaMVP) {
    "use strict";
    function initialize(ev) {
        var _this = this;
        document.removeEventListener("DOMContentLoaded", this.onDomReady);
        if (this.onAppStart) {
            this.onAppStart();
        }
        if (this.routeConfig.hasRoutes()) {
            this.routeConfig.startRoute(window.location.hash.substring(1));
            window.addEventListener("hashchange", function () {
                _this.routeConfig.startRoute(window.location.hash.substring(1));
            });
        }
    }
    var Core = (function () {
        function Core(routeConfig) {
            if (routeConfig === void 0) { routeConfig = new spaMVP.DefaultRouteConfig(); }
            this.onDomReady = initialize.bind(this);
            this.subscribers = {};
            this.modules = {};
            this.services = {};
            this.routeConfig = routeConfig;
        }
        /**
         *  Start listening for hash change if there are any registered routes.
         *  @param {Function} action Optional action to be executed on DOMContentLoaded.
         */
        Core.prototype.run = function (action) {
            this.onAppStart = action;
            document.addEventListener("DOMContentLoaded", this.onDomReady);
            return this;
        };
        /**
         *  Registers a route by given url pattern.
         *  When url's hash is changed it executes a callback with populated dynamic routes and query parameters.
         *  Dynamic route param can be registered with {yourParam}.
         */
        Core.prototype.registerRoute = function (pattern, callback) {
            this.routeConfig.registerRoute(pattern, callback);
            return this;
        };
        /**
         *  Starts hash url if such is registered, if not, it starts the default one.
         */
        Core.prototype.startRoute = function (hash) {
            this.routeConfig.startRoute(hash);
            return this;
        };
        /**
         *  Sets a default url.
         */
        Core.prototype.defaultUrl = function (url) {
            this.routeConfig.defaultUrl = url;
            return this;
        };
        /**
         *  Subscribes for given events.
         *  @param {Array} eventTypes - Array of events to subscribe for.
         *  @param {Function} handler - The events' handler.
         *  @param {Object} context - Handler's context.
         */
        Core.prototype.subscribe = function (eventTypes, handler, context) {
            if (typeof handler !== "function") {
                throw new TypeError("Event type handler should be a function");
            }
            if (Array.isArray(eventTypes)) {
                for (var i = 0, len = eventTypes.length; i < len; i++) {
                    this.addSubscriber(eventTypes[i], handler, context);
                }
            }
        };
        /**
         *  Unsubscribes for specific events.
         *  @param {Array} eventTypes - Array of events to unsubscribe for.
         *  @param {Function} handler - The handler which must be unsubscribed.
         *  @param {Object} context - Handler's context.
         */
        Core.prototype.unsubscribe = function (eventTypes, handler, context) {
            if (Array.isArray(eventTypes)) {
                for (var i = 0, len = eventTypes.length; i < len; i++) {
                    this.removeSubscriber(eventTypes[i], handler, context);
                }
            }
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
            if (moduleId === "" || typeof moduleId !== "string") {
                throw new TypeError(moduleId + " Module registration FAILED: ID must be a non empty string.");
            }
            if (this.modules[moduleId]) {
                throw new TypeError(moduleId + " Module registration FAILED: a module with such id has been already registered.");
            }
            var tempModule = moduleFactory(new spaMVP.Sandbox(this, moduleId));
            if (typeof tempModule.init !== "function" || typeof tempModule.destroy !== "function") {
                throw new TypeError(moduleId + " Module registration FAILED: Module has no init or destroy methods.");
            }
            this.modules[moduleId] = { create: moduleFactory, instances: null };
            return this;
        };
        /**
         *  Returns all registered module ids.
         *  @returns {string[]}
         */
        Core.prototype.getAllModules = function () {
            return Object.keys(this.modules);
        };
        /**
         *  Starts an instance of given module and initializes it.
         *  @param {string} moduleId - Id of the module, which must be started.
         *  @param {object} options
         */
        Core.prototype.start = function (moduleId, options) {
            var module = this.modules[moduleId];
            if (!module) {
                throw new ReferenceError(moduleId + " Module not found.");
            }
            options = options || {};
            if (typeof options !== "object") {
                throw new TypeError(moduleId + " Module's options must be an object.");
            }
            module.instances = module.instances || {};
            var instanceId = options["instanceId"] || moduleId;
            if (module.instances.hasOwnProperty(instanceId)) {
                return this;
            }
            var instance = module.create(new spaMVP.Sandbox(this, instanceId));
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
            if (module && module.instances && module.instances.hasOwnProperty(id)) {
                module.instances[id].destroy();
                delete module.instances[id];
            }
            return this;
        };
        /**
         *  Add a service.
         *  @param {String} id
         *  @param {Function} factory - function which provides an instance of the service.
         */
        Core.prototype.addService = function (id, factory) {
            if (typeof id !== "string" || id === "") {
                throw new TypeError(id + " Service registration FAILED: ID must be non empty string.");
            }
            if (this.services[id]) {
                throw new TypeError(id + " Service registration FAILED: a service with such id has been already added.");
            }
            this.services[id] = factory;
            return this;
        };
        /**
         *  Gets a specific service instance by id.
         *  @param {String} id
         *  @returns {*}
         */
        Core.prototype.getService = function (id) {
            var service = this.services[id];
            if (!service) {
                throw new ReferenceError(id + " Service was not found.");
            }
            return service(new spaMVP.Sandbox(this, id));
        };
        Core.prototype.addSubscriber = function (eventType, handler, context) {
            this.subscribers[eventType] = this.subscribers[eventType] || [];
            this.subscribers[eventType].push({
                handler: handler,
                context: context
            });
        };
        Core.prototype.removeSubscriber = function (eventType, handler, context) {
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
        };
        return Core;
    }());
    spaMVP.Core = Core;
    /**
     *  Returns application core.
     * @param {RouteConfig} [routeConfig] - Optional. It is usefull if you want to use custom route handling.
     * @returns {Core}
     */
    function createAppCore(routeConfig) {
        return new Core(routeConfig);
    }
    spaMVP.createAppCore = createAppCore;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=Core.js.map