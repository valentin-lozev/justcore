namespace spaMVP {
    "use strict";

    function initialize(ev: Event): void {
        document.removeEventListener("DOMContentLoaded", this.onDomReady);
        if (this.onAppStart) {
            this.onAppStart();
        }

        if (this.routeConfig.hasRoutes()) {
            this.routeConfig.startRoute(window.location.hash.substring(1));
            window.addEventListener("hashchange", () => {
                this.routeConfig.startRoute(window.location.hash.substring(1));
            });
        }
    }

    export class Core {
        private onDomReady: (ev: Event) => void = initialize.bind(this);
        private onAppStart: Function;
        private routeConfig: RouteConfig;
        private subscribers: Object = {};
        private modules: Object = {};
        private services: Object = {};

        constructor(routeConfig: RouteConfig = new DefaultRouteConfig()) {
            this.routeConfig = routeConfig;
        }

        /**
         *  Start listening for hash change if there are any registered routes.
         *  @param {Function} action Optional action to be executed on DOMContentLoaded.
         */
        run(action?: Function): this {
            this.onAppStart = action;
            document.addEventListener("DOMContentLoaded", this.onDomReady);
            return this;
        }

        /**
         *  Registers a route by given url pattern.
         *  When url's hash is changed it executes a callback with populated dynamic routes and query parameters.
         *  Dynamic route param can be registered with {yourParam}.
         */
        registerRoute(pattern: string, callback: (routeParams: any) => void): this {
            this.routeConfig.registerRoute(pattern, callback);
            return this;
        }

        /**
         *  Starts hash url if such is registered, if not, it starts the default one.
         */
        startRoute(hash: string): this {
            this.routeConfig.startRoute(hash);
            return this;
        }

        /**
         *  Sets a default url.
         */
        defaultUrl(url: string): this {
            this.routeConfig.defaultUrl = url;
            return this;
        }

        /**
         *  Subscribes for given events.
         *  @param {Array} eventTypes - Array of events to subscribe for.
         *  @param {Function} handler - The events' handler.
         *  @param {Object} context - Handler's context.
         */
        subscribe(eventTypes: string[], handler: (type: string, data: any) => void, context?: Object): void {
            if (typeof handler !== "function") {
                throw new TypeError("Event type handler should be a function");
            }

            if (Array.isArray(eventTypes)) {
                for (let i = 0, len = eventTypes.length; i < len; i++) {
                    this.addSubscriber(eventTypes[i], handler, context);
                }
            }
        }

        /**
         *  Unsubscribes for specific events.
         *  @param {Array} eventTypes - Array of events to unsubscribe for.
         *  @param {Function} handler - The handler which must be unsubscribed.
         *  @param {Object} context - Handler's context.
         */
        unsubscribe(eventTypes: string[], handler: (type: string, data: any) => void, context?: Object): void {
            if (Array.isArray(eventTypes)) {
                for (let i = 0, len = eventTypes.length; i < len; i++) {
                    this.removeSubscriber(eventTypes[i], handler, context);
                }
            }
        }

        /**
         *  Publishes an event.
         *  @param {String} type - Type of the event.
         *  @param {*} [data] - Optional data.
         */
        publish(type: string, data: any): void {
            if (!Array.isArray(this.subscribers[type])) {
                return;
            }

            this.subscribers[type]
                .slice(0)
                .forEach(subscriber => subscriber.handler.call(subscriber.context, type, data));
        }

        /**
         *  Registers a module.
         *  @param {string} moduleId
         *  @param {function} moduleFactory - function which provides an instance of the module.
         */
        register(moduleId: string, moduleFactory: (sb: Sandbox) => Module): this {
            if (moduleId === "" || typeof moduleId !== "string") {
                throw new TypeError(moduleId + " Module registration FAILED: ID must be a non empty string.");
            }

            if (this.modules[moduleId]) {
                throw new TypeError(moduleId + " Module registration FAILED: a module with such id has been already registered.");
            }

            let tempModule = moduleFactory(new spaMVP.Sandbox(this, moduleId));
            if (typeof tempModule.init !== "function" || typeof tempModule.destroy !== "function") {
                throw new TypeError(moduleId + " Module registration FAILED: Module has no init or destroy methods.");
            }

            this.modules[moduleId] = { create: moduleFactory, instances: null };
            return this;
        }

        /**
         *  Returns all registered module ids.
         *  @returns {string[]}
         */
        getAllModules(): string[] {
            return Object.keys(this.modules);
        }

        /**
         *  Starts an instance of given module and initializes it.
         *  @param {string} moduleId - Id of the module, which must be started.
         *  @param {object} options
         */
        start(moduleId: string, options?: Object): this {
            let module = this.modules[moduleId];
            if (!module) {
                throw new ReferenceError(moduleId + " Module not found.");
            }

            options = options || {};
            if (typeof options !== "object") {
                throw new TypeError(moduleId + " Module's options must be an object.");
            }

            module.instances = module.instances || {};
            let instanceId = options["instanceId"] || moduleId;
            if (module.instances.hasOwnProperty(instanceId)) {
                return this;
            }

            let instance = module.create(new spaMVP.Sandbox(this, instanceId));
            module.instances[instanceId] = instance;
            instance.init(options);
            return this;
        }

        /**
         *  Stops a given module.
         *  @param {string} moduleId - Id of the module, which must be stopped.
         *  @param {string} [instanceId] - Specific module's instance id.
         */
        stop(moduleId: string, instanceId?: string): this {
            let module = this.modules[moduleId];
            let id = instanceId || moduleId;
            if (module && module.instances && module.instances.hasOwnProperty(id)) {
                module.instances[id].destroy();
                delete module.instances[id];
            }

            return this;
        }

        /**
         *  Add a service.
         *  @param {String} id
         *  @param {Function} factory - function which provides an instance of the service.
         */
        addService(id: string, factory: (sb: Sandbox) => any): this {
            if (typeof id !== "string" || id === "") {
                throw new TypeError(id + " Service registration FAILED: ID must be non empty string.");
            }

            if (this.services[id]) {
                throw new TypeError(id + " Service registration FAILED: a service with such id has been already added.");
            }

            this.services[id] = factory;
            return this;
        }

        /**
         *  Gets a specific service instance by id.
         *  @param {String} id
         *  @returns {*}
         */
        getService<T>(id: string): T {
            let service = this.services[id];
            if (!service) {
                throw new ReferenceError(id + " Service was not found.");
            }

            return service(new spaMVP.Sandbox(this, id));
        }

        private addSubscriber(eventType: string, handler: Function, context?: Object): void {
            this.subscribers[eventType] = this.subscribers[eventType] || [];
            this.subscribers[eventType].push({
                handler: handler,
                context: context
            });
        }

        private removeSubscriber(eventType: string, handler: Function, context?: Object): void {
            let subscribers = this.subscribers[eventType] || [];
            for (let i = 0, len = subscribers.length; i < len; i++) {
                let subscriber = subscribers[i];
                if (subscriber.handler === handler &&
                    subscriber.context === context) {
                    subscribers[i] = subscribers[len - 1];
                    subscribers.length--;
                    return;
                }
            }
        }
    }

    /**
     *  Returns application core.
     * @param {RouteConfig} [routeConfig] - Optional. It is usefull if you want to use custom route handling.
     * @returns {Core}
     */
    export function createAppCore(routeConfig?: RouteConfig): Core {
        return new Core(routeConfig);
    }
}