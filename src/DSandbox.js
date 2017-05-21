var dcore;
(function (dcore) {
    "use strict";
    /**
     *  @class Sandbox - Connects all modules to the outside world.
     *  @property {String} moduleInstanceId - Id of the module it serves for.
     */
    var DefaultSandbox = (function () {
        function DefaultSandbox(core, moduleId, moduleInstanceId) {
            if (!core || !moduleId || !moduleInstanceId) {
                throw new Error("DefaultSandbox: Missing core or module instance ID");
            }
            this.core = core;
            this.moduleId = moduleId;
            this.moduleInstanceId = moduleInstanceId;
        }
        /**
         *  Subscribes for given topics.
         *  @param {Array} topics Array of topics to subscribe for.
         *  @param {Function} handler The message handler.
         *  @returns {Object}
         */
        DefaultSandbox.prototype.subscribe = function (topics, handler) {
            return this.core.subscribe(topics, handler);
        };
        /**
         *  Publishes a message.
         *  @param {String} topic The topic of the message.
         *  @param {*} [data] Optional data.
         */
        DefaultSandbox.prototype.publish = function (topic, data) {
            this.core.publish(topic, data);
            return this;
        };
        /**
         *  Starts an instance of given module and initializes it.
         *  @param {string} moduleId Id of the module which must be started.
         *  @param {object} [options] Optional options.
         */
        DefaultSandbox.prototype.start = function (moduleId, options) {
            this.core.start(moduleId, options);
            return this;
        };
        /**
         *  Stops a given module.
         *  @param {string} moduleId Id of the module which must be stopped.
         *  @param {string} [instanceId] Optional. Specific module's instance id.
         */
        DefaultSandbox.prototype.stop = function (moduleId, instanceId) {
            this.core.stop(moduleId, instanceId);
            return this;
        };
        return DefaultSandbox;
    }());
    dcore.DefaultSandbox = DefaultSandbox;
})(dcore || (dcore = {}));
//# sourceMappingURL=DSandbox.js.map