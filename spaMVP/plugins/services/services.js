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