var spaMVP = (function (spaMVP) {
    'use strict';

    var _private = spaMVP._private,
        _onApplicationStart = function () { },
        _subscribers = {},
        _modules = {},
        _services = {};

    function _onDOMReady() {
        document.removeEventListener("DOMContentLoaded", _onDOMReady);
        _onApplicationStart();

        if (_private.RouteManager.hasRoutes()) {
            _private.RouteManager.getInstance().startRoute(window.location.hash.substring(1));
        }
    }

    function addSubscriber(eventType, handler, context) {
        _subscribers[eventType] = _subscribers[eventType] || [];
        _subscribers[eventType].push({
            handler: handler,
            context: context
        });
    }

    function removeSubscriber(eventType, handler, context) {
        var subscribers = _subscribers[eventType] || [];
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

    function Core() {
    }

    Core.prototype.run = function (onAppStartCallback) {
        _onApplicationStart = typeof onAppStartCallback === 'function' ? onAppStartCallback.bind(this) : _onApplicationStart.bind(this);
        document.addEventListener("DOMContentLoaded", _onDOMReady);
        return this;
    };

    Core.prototype.registerRoute = function (urlPattern, callback) {
        _private.RouteManager.getInstance().registerRoute(urlPattern, callback.bind(this));
        return this;
    };

    Core.prototype.startRoute = function (hashUrlValue) {
        _private.RouteManager.getInstance().startRoute(hashUrlValue);
        return this;
    };

    Core.prototype.defaultUrl = function (url) {
        _private.RouteManager.getInstance().setDefaultUrl(url);
        return this;
    };

    /**
     *  Subscribes for specific events.
     *  @param {Array} eventTypes - Array of events to subscribe for.
     *  @param {Function} handler - The events' handler.
     *  @param {Object} context - Handler's context.
     */
    Core.prototype.subscribe = function (eventTypes, handler, context) {
        for (var i = 0, len = eventTypes.length; i < len; i++) {
            addSubscriber(eventTypes[i], handler, context);
        }
    };

    /**
     *  Unsubscribes for specific events.
     *  @param {Array} eventTypes - Array of events to unsubscribe for.
     *  @param {Function} handler - The handler which must be unsubscribed.
     *  @param {Object} context - Handler's context.
     */
    Core.prototype.unsubscribe = function (eventTypes, handler, context) {
        for (var i = 0, len = eventTypes.length; i < len; i++) {
            removeSubscriber(eventTypes[i], handler, context);
        }
    };

    /**
     *  Publishes an event to the subscribers.
     *  @param {String} eventType - Type of the event.
     *  @param {*} [data] - Optional data.
     */
    Core.prototype.publish = function (type, data) {
        if (!Array.isArray(_subscribers[type])) {
            return;
        }

        var subscribers = _subscribers[type].slice(0);
        for (var i = 0, len = subscribers.length; i < len; i++) {
            var subscriber = subscribers[i];
            subscriber.handler.call(subscriber.context, type, data);
        }
    };

    /**
    *  Registers a module.
    *  @param {string} moduleId
    *  @param {function} moduleFactory - function which provides an instance of the module.
    */
    Core.prototype.register = function (moduleId, moduleFactory) {
        var tempModule = null;
        if (typeof moduleId !== 'string' || moduleId.trim() === '') {
            throw new TypeError(moduleId + ' Module registration FAILED: ID must be non empty string.');
        }

        if (typeof moduleFactory !== 'function') {
            throw new TypeError(moduleId + ' Module registration FAILED: moduleFactory must be a function which provides a module.');
        }

        if (_modules[moduleId]) {
            throw new TypeError(moduleId + ' Module registration FAILED: a module with such id has been already registered.');
        }

        tempModule = moduleFactory(new spaMVP.Sandbox(this));
        if (typeof tempModule.init !== 'function' || typeof tempModule.destroy !== 'function') {
            throw new TypeError(moduleId + ' Module registration FAILED: Module has no init or destroy methods.');
        }

        tempModule = null;
        _modules[moduleId] = { create: moduleFactory, instance: null };
        return this;
    };

    /**
     *  Starts an instance of given module and initializes it.
     *  @param {string} moduleId - Id of the module, which must be started.
     */
    Core.prototype.start = function (moduleId) {
        var module = _modules[moduleId];
        if (!module) {
            throw new ReferenceError(moduleId + ' Module was not found.');
        }

        if (module.instance) {
            return;
        }

        module.instance = module.create(new spaMVP.Sandbox(this));
        module.instance.init();
    };

    /**
     *  Stops a given module.
     *  @param {string} moduleId - Id of the module, which must be stopped.
     */
    Core.prototype.stop = function (moduleId) {
        var module = _modules[moduleId];
        if (module && module.instance) {
            module.instance.destroy();
            module.instance = null;
        }
    };

    /**
     *  Add a service in the application core.
     *  @param {String} id
     *  @param {Function} factory - function which provides an instance of the service.
     */
    Core.prototype.addService = function (id, factory) {
        if (typeof id !== 'string' || id.trim() === '') {
            throw new TypeError(id + ' Service registration FAILED: ID must be non empty string.');
        }

        if (typeof factory !== 'function') {
            throw new TypeError(id + ' Service registration FAILED: factory must be a function which provides a service.');
        }

        if (_services[id]) {
            throw new TypeError(id + ' Service registration FAILED: a service with such id has been already added.');
        }

        _services[id] = { create: factory };
        return this;
    };

    /**
     *  Gets specific service instance by id.
     *  @param {String} id
     *  @returns {Object}
     */
    Core.prototype.getService = function (id) {
        var service = _services[id];
        if (!service) {
            throw new ReferenceError(id + ' Service was not found.');
        }

        return service.create(new spaMVP.Sandbox(this));
    };

    spaMVP._private = spaMVP._private || {};
    spaMVP._private.Core = Core;
    return spaMVP;

}(spaMVP || {}));