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