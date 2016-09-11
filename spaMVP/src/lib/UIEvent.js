var spaMVP;
(function (spaMVP) {
    /**
     *  Author: Martin Chaov
     *  github: https://github.com/mchaov/JSEventsManager
     *  Smart events managing by altering the properties of a HTML element
     */
    // 'use strict'; -> issues with iOS Safari on tablet devices: 09.11.2015
    Element.prototype.trigger = function () { return false; };
    Element.prototype.hasEvent = function () { return false; };
    Element.prototype.detach = function () { return false; };
    Element.prototype.events = false;
    function removeEvent(name) {
        var ev, type, handler, useCapture;
        ev = this.events[name];
        useCapture = ev.useCapture;
        type = ev.eventType;
        handler = ev.handler;
        this.removeEventListener(type, handler, useCapture);
        delete this.eventsList[name];
    }
    function detachEvent(name) {
        var i;
        if (name === undefined || name === '') {
            for (i in this.eventsList) {
                removeEvent.call(this, i);
            }
            this.eventsList = {};
        }
        else if (this.hasEvent(name)) {
            removeEvent.call(this, name);
        }
        return this.eventsList;
    }
    function hasEvent(name) {
        return typeof this.eventsList[name] === 'object' ? this.eventsList[name] : false;
    }
    function triggerEvent(name) {
        var evt = this.hasEvent(name);
        if (typeof evt.handler === 'function') {
            return evt.handler();
        }
        return false;
    }
    function UIEvent(config) {
        if (!(this instanceof UIEvent)) {
            return new UIEvent(config);
        }
        this.htmlElement = config.htmlElement;
        this.eventConfig = {
            name: config.name,
            eventType: config.eventType,
            handler: config.handler === undefined ? false : config.handler,
            useCapture: config.useCapture === undefined ? false : config.useCapture,
            context: config.context === undefined ? null : config.context
        };
        this.init();
    }
    spaMVP.UIEvent = UIEvent;
    UIEvent.prototype.init = function () {
        if (this.htmlElement.eventsList === undefined) {
            Object.defineProperties(this.htmlElement, {
                'eventsList': {
                    writable: true,
                    enumerable: false,
                    configurable: false,
                    value: {}
                },
                'events': {
                    enumerable: false,
                    configurable: false,
                    get: function () {
                        return this.eventsList;
                    },
                    set: function (e) {
                        return this.eventsList[e.name] = e;
                    }
                },
                'trigger': {
                    writable: false,
                    enumerable: false,
                    configurable: false,
                    value: triggerEvent
                },
                'hasEvent': {
                    writable: false,
                    enumerable: false,
                    configurable: false,
                    value: hasEvent
                },
                'detach': {
                    writable: false,
                    enumerable: false,
                    configurable: false,
                    value: detachEvent
                }
            });
        }
        else if (this.htmlElement.hasEvent(this.eventConfig.name)) {
            return false;
        }
        this.eventConfig.handler = this.eventConfig.handler.bind(this.eventConfig.context || this);
        this.htmlElement.addEventListener(this.eventConfig.eventType, this.eventConfig.handler, this.eventConfig.useCapture);
        this.htmlElement.events = this.eventConfig;
    };
    Object.defineProperties(UIEvent.prototype, {
        'detach': {
            writable: false,
            enumerable: false,
            configurable: false,
            value: function (name) {
                return detachEvent.call(this.htmlElement, name);
            }
        },
        'trigger': {
            writable: false,
            enumerable: false,
            configurable: false,
            value: function (name) {
                return triggerEvent.call(this.htmlElement, name || this.eventConfig.name);
            }
        }
    });
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=UIEvent.js.map