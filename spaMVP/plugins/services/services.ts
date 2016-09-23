namespace spaMVP {
    "use strict";

    interface ServiceList {
        [id: string]: () => any;
    }

    class ServiceConfig implements ServicesPlugin {
        private services: ServiceList = {};

        /**
         *  Add a service.
         *  @param {String} id
         *  @param {Function} factory - function which provides an instance of the service.
         */
        add<T>(id: string, creator: () => T): this {
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
        }

        /**
         *  Gets a specific service instance by id.
         *  @param {String} id
         *  @returns {*}
         */
        get<T>(id: string): T {
            let creator = this.services[id];
            if (!creator) {
                throw new ReferenceError(id + " service was not found.");
            }

            return creator();
        }
    }

    export interface ServicesPlugin {
        add<T>(id: string, creator: () => T): this;
        get<T>(id: string): T;
    }

    export interface Core {
        useServices(): void;
        services: ServicesPlugin;
    }

    export interface Sandbox {
        getService<T>(id: string): T;
    }

    Core.prototype.useServices = function (): void {
        let that = <Core>this;
        if (that.services) {
            return;
        }

        that.services = new ServiceConfig();
        let sandbox = <Sandbox>that.Sandbox.prototype;

        /**
         *  Gets a specific service instance by id.
         *  @param {String} id
         *  @returns {*}
         */
        sandbox.getService = function <T>(id: string): T {
            return this.core.services.get(id);
        };
    };
}