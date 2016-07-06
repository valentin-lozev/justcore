var spaMVP = (function (spaMVP) {
    
    /**
     *  @typedef {Object} ModelEvent
     *  @property {String} type - Type of the event.
     *  @property {Object} currentTarget - The changed model.
     *  @property {Array} addedTargets - Added items to collection.
     *  @property {Array} deletedTargets - Removed items from collection.
     *  @property {Array} updatedTargets - Changed items in collection.
     */

    /**
     *  @class spaMVP.Model
     *  @property {Object} _listeners
     */
    function Model() {
        this._listeners = null;
    }

    /**
     *  Attaches an event handler to the model for specific event.
     *  @param {String} eventType - The name of the event.
     *  @param {Function} handler - The event's handler.
     *  @param {Object} context - Handler's context.
     */
    Model.prototype.on = function (eventType, handler, context) {
        if (typeof handler !== 'function') {
            throw new Error('Given handler must be a function.');
        }

        this._listeners = this._listeners || {};
        this._listeners[eventType] = this._listeners[eventType] || [];
        var currentEventListeners = this._listeners[eventType];
        for (var i = 0, len = currentEventListeners.length; i < len; i++) {
            // contexts must be compared too, because default presenter handlers are in base class
            // and their references are always the same
            if (currentEventListeners[i].handler === handler &&
                currentEventListeners[i].context === context) {
                return;
            }
        }

        currentEventListeners.push({
            handler: handler,
            context: context
        });
    };

    /**
     *  Detaches an event handler from the model for specific event.
     *  @param {String} eventType - The name of the event.
     *  @param {Function} handler - The handler which must be detached.
     *  @param {Object} context - Handler's context.
     */
    Model.prototype.off = function (eventType, handler, context) {
        if (!this._listeners || !this._listeners[eventType]) {
            return;
        }

        var listeners = this._listeners[eventType];
        for (var i = 0, len = listeners.length; i < len; i++) {
            if (listeners[i].handler === handler &&
                listeners[i].context === context) {
                listeners[i] = listeners[len - 1];
                listeners.length--;
                return;
            }
        }
    };

    /**
     *  Notifies the listeners of specific event by dispatching an event, which
     *  contains the model itself. Use it to notify that the model is changed.
     *  @param {ModelEvent} ev
     */
    Model.prototype.notify = function (ev) {
        if (!this._listeners || !this._listeners[ev.type]) {
            return;
        }
        
        ev.currentTarget = this;

        // Copy the list of listeners in case one of the
        // listeners modifies the list while we are iterating over the list.
        var listeners = this._listeners[ev.type].slice(0);
        for (var i = 0, len = listeners.length; i < len; i++) {
            var listener = listeners[i];
            listener.handler.call(listener.context, ev);
        }
    };

    /**
     *  Notifies the listeners that the model will be destroyed 
     *  by dispatching an event with type destroy.
     */
    Model.prototype.destroy = function () {
        this.notify({ type: 'destroy' });
    };

    spaMVP.Model = Model;

    return spaMVP;

}(spaMVP || {}));