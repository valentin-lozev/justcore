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
                throw new Error("Missing core or module instance ID");
            }
            this.core = core;
            this.moduleInstanceId = moduleInstanceId;
        }
        Sandbox.prototype.subscribe = function (eventTypes, handler, context) {
            this.core.subscribe(eventTypes, handler, context);
        };
        Sandbox.prototype.unsubscribe = function (eventTypes, handler, context) {
            this.core.unsubscribe(eventTypes, handler, context);
        };
        Sandbox.prototype.publish = function (eventType, data) {
            this.core.publish(eventType, data);
        };
        Sandbox.prototype.getService = function (id) {
            return this.core.getService(id);
        };
        return Sandbox;
    }());
    spaMVP.Sandbox = Sandbox;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=Sandbox.js.map