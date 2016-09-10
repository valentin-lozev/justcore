/**
 *  spaMVP - v2.0.0
 *  Copyright © 2016 Valentin Lozev
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *  Source code: http://github.com/valentin-lozev/spaMVP
 */ 
//# sourceMappingURL=license.js.map
var spaMVP;
(function (spaMVP) {
    // Polyfill for older browsers
    if (typeof Object.create !== 'function') {
        Object.create = function (o) {
            function F() { }
            F.prototype = o;
            return new F();
        };
    }
    function subclass(inheritor) {
        var BaseClass = this;
        var prototype = inheritor.prototype;
        inheritor.prototype = Object.create(BaseClass.prototype);
        extend(inheritor.prototype, prototype);
        inheritor.prototype.constructor = inheritor;
        inheritor.BaseClass = BaseClass;
        inheritor.subclass = subclassFactory;
        return inheritor;
    }
    function subclassFactory(getInheritorFunc) {
        var inheritor = getInheritorFunc();
        if (!inheritor || typeof inheritor !== 'function') {
            throw new Error('Inheritor\'s function constructor must be supplied.');
        }
        return subclass.call(this, inheritor);
    }
    spaMVP.subclassFactory = subclassFactory;
    function extend(target, object) {
        for (var prop in object) {
            if (object[prop]) {
                target[prop] = object[prop];
            }
        }
    }
    spaMVP.extend = extend;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=helpers.js.map
var spaMVP;
(function (spaMVP) {
    spaMVP.ModelEvents = {
        Change: 'change',
        Destroy: 'destroy'
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
            this.notify(spaMVP.ModelEvents.Change, this);
        };
        /**
         *  Notifies for destroy event.
         */
        Model.prototype.destroy = function () {
            this.notify(spaMVP.ModelEvents.Destroy, this);
        };
        Model.subclass = spaMVP.subclassFactory;
        return Model;
    }());
    spaMVP.Model = Model;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=Model.js.map
var spaMVP;
(function (spaMVP) {
    /**
     *  Creates a collection of unique items.
     *  @class spaMVP.HashSet
     *  @property {Number} size
     */
    var HashSet = (function () {
        function HashSet() {
            this.items = {};
            this.size = 0;
        }
        /**
         *  Determines whether an item is in the set.
         *  @returns {Boolean}
         */
        HashSet.prototype.contains = function (item) {
            var hashCode = item.hash();
            if (!Object.prototype.hasOwnProperty.call(this.items, hashCode)) {
                return false;
            }
            var hashedItems = this.items[hashCode];
            if (!Array.isArray(hashedItems)) {
                return hashedItems.equals(item);
            }
            for (var i = 0, len = hashedItems.length; i < len; i++) {
                if (hashedItems[i].equals(item)) {
                    return true;
                }
            }
            return false;
        };
        /**
         *  Adds a new item to the set.
         *  @returns {Boolean}
         */
        HashSet.prototype.add = function (item) {
            if (this.contains(item)) {
                return false;
            }
            var hashCode = item.hash();
            // the first item with this hash
            if (!Object.prototype.hasOwnProperty.call(this.items, hashCode)) {
                this.items[hashCode] = item;
            }
            else if (!Array.isArray(this.items[hashCode])) {
                this.items[hashCode] = [this.items[hashCode], item];
            }
            else {
                this.items[hashCode].push(item);
            }
            this.size++;
            return true;
        };
        /**
         *  Removes an item from the set.
         *  @returns {Boolean}
         */
        HashSet.prototype.remove = function (item) {
            if (!this.contains(item)) {
                return false;
            }
            var hashCode = item.hash();
            if (Array.isArray(this.items[hashCode])) {
                var hashCodeItems = this.items[hashCode];
                for (var i = 0, len = hashCodeItems.length; i < len; i++) {
                    if (hashCodeItems[i].equals(item)) {
                        hashCodeItems[i] = hashCodeItems[len - 1];
                        hashCodeItems.length--;
                        break;
                    }
                }
            }
            else {
                delete this.items[hashCode];
            }
            this.size--;
            return true;
        };
        /**
         *  Removes all items from the set.
         *  @returns {Boolean}
         */
        HashSet.prototype.clear = function () {
            if (this.size <= 0) {
                return false;
            }
            this.items = {};
            this.size = 0;
            return true;
        };
        /**
         *  Performs a an action on each item in the set.
         *  @param {Function} action
         *  @param {Object} [context] The action's context.
         */
        HashSet.prototype.forEach = function (action, context) {
            var index = 0;
            var hashes = Object.keys(this.items);
            for (var i = 0, len = hashes.length; i < len; i++) {
                var hashIndexItem = this.items[hashes[i]];
                if (!Array.isArray(hashIndexItem)) {
                    action.call(context, hashIndexItem, index);
                    index++;
                    continue;
                }
                for (var j = 0, hashLength = hashIndexItem.length; j < hashLength; j++) {
                    action.call(context, hashIndexItem[j], index);
                    index++;
                }
            }
        };
        /**
         *  Converts the set to Array.
         *  @returns {Array}
         */
        HashSet.prototype.toArray = function () {
            var result = new Array(this.size);
            var index = 0;
            var hashes = Object.keys(this.items);
            for (var i = 0, hashesLen = hashes.length; i < hashesLen; i++) {
                var hashIndexItem = this.items[hashes[i]];
                if (!Array.isArray(hashIndexItem)) {
                    result[index] = hashIndexItem;
                    index++;
                    continue;
                }
                for (var j = 0, len = hashIndexItem.length; j < len; j++) {
                    result[index] = hashIndexItem[j];
                    index++;
                }
            }
            return result;
        };
        return HashSet;
    }());
    spaMVP.HashSet = HashSet;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=HashSet.js.map
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var spaMVP;
(function (spaMVP) {
    spaMVP.CollectionEvents = {
        AddedItems: 'added-items',
        DeletedItems: 'deleted-items',
        UpdatedItem: 'updated-item'
    };
    /**
     *  Composite pattern on spaMVP.Model.
     *  It is usefull when you want to listen for collection of models.
     *  @class spaMVP.Collection
     *  @augments spaMVP.Model
     */
    var Collection = (function (_super) {
        __extends(Collection, _super);
        function Collection() {
            _super.call(this);
            this.models = new spaMVP.HashSet();
        }
        Object.defineProperty(Collection.prototype, "size", {
            get: function () {
                return this.models.size;
            },
            enumerable: true,
            configurable: true
        });
        Collection.prototype.equals = function (other) {
            return false;
        };
        Collection.prototype.hash = function () {
            return this.size ^ 17;
        };
        /**
         *  Adds new model to the set.
         *  @returns {Boolean}
         */
        Collection.prototype.add = function (model) {
            return this.addRange([model]);
        };
        /**
         *  Adds range of models to the set.
         *  @returns {Boolean}
         */
        Collection.prototype.addRange = function (models) {
            var added = [];
            for (var i = 0, len = models.length; i < len; i++) {
                var model = models[i];
                if (!this.models.add(model)) {
                    continue;
                }
                model.on(spaMVP.ModelEvents.Change, this.onItemChange, this);
                model.on(spaMVP.ModelEvents.Destroy, this.onItemDestroy, this);
                added.push(model);
            }
            var isModified = added.length > 0;
            if (isModified) {
                this.notify(spaMVP.CollectionEvents.AddedItems, added);
            }
            return isModified;
        };
        /**
         *  Removes a model from the set.
         *  @returns {Boolean}
         */
        Collection.prototype.remove = function (model) {
            return this.removeRange([model]);
        };
        /**
         *  Removes range of models.
         *  @returns {Boolean}
         */
        Collection.prototype.removeRange = function (models) {
            var deleted = [];
            for (var i = 0, len = models.length; i < len; i++) {
                var model = models[i];
                if (!this.models.remove(model)) {
                    continue;
                }
                model.off(spaMVP.ModelEvents.Change, this.onItemChange, this);
                model.off(spaMVP.ModelEvents.Destroy, this.onItemDestroy, this);
                deleted.push(model);
            }
            var isModified = deleted.length > 0;
            if (isModified) {
                this.notify(spaMVP.CollectionEvents.DeletedItems, deleted);
            }
            return isModified;
        };
        /**
         *  Removes all models from the set.
         *  @returns {Boolean}
         */
        Collection.prototype.clear = function () {
            return this.removeRange(this.toArray());
        };
        /**
         *  Determines whether a model is in the collection.
         *  @returns {Boolean}
         */
        Collection.prototype.contains = function (model) {
            return this.models.contains(model);
        };
        /**
         *  Determines whether the collection is not empty.
         *  @returns {Boolean}
         */
        Collection.prototype.any = function () {
            return this.size > 0;
        };
        /**
         *  Returns the models as Array.
         *  @returns {Array}
         */
        Collection.prototype.toArray = function () {
            return this.models.toArray();
        };
        /**
         *  Performs an action on each model in the set.
         */
        Collection.prototype.forEach = function (action, context) {
            this.models.forEach(action, context);
        };
        Collection.prototype.onItemChange = function (item) {
            this.notify(spaMVP.CollectionEvents.UpdatedItem, item);
        };
        Collection.prototype.onItemDestroy = function (item) {
            this.removeRange([item]);
        };
        Collection.subclass = spaMVP.subclassFactory;
        return Collection;
    }(spaMVP.Model));
    spaMVP.Collection = Collection;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=Collection.js.map
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
var spaMVP;
(function (spaMVP) {
    function eventHandler(ev) {
        var target = ev.target;
        var dataset = target.dataset;
        if (!dataset.hasOwnProperty(ev.type)) {
            return;
        }
        var callbackName = dataset[ev.type];
        if (typeof this[callbackName] === 'function') {
            this[callbackName](dataset, target, ev);
            return;
        }
    }
    /**
     *  @class spaMVP.View
     *  @param {HTMLElement} domNode The view's html element.
     *  @param {Function} [template] A function which renders view's html element.
     *  @property {HTMLElement} domNode
     */
    var View = (function () {
        function View(domNode, template) {
            if (!domNode) {
                throw new Error("Dom node cannot be null.");
            }
            this._domNode = domNode;
            this._template = template;
        }
        Object.defineProperty(View.prototype, "domNode", {
            get: function () {
                return this._domNode;
            },
            enumerable: true,
            configurable: true
        });
        /**
         *  Maps a view action to given ui event disptached from html element.
         *  Mapping works by using the dataset - e.g data-click="handleClick" maps to handleClick.
         * @param eventType
         * @param useCapture
         * @param selector
         */
        View.prototype.map = function (eventType, useCapture, selector) {
            if (useCapture === void 0) { useCapture = false; }
            new spaMVP.UIEvent({
                name: eventType,
                htmlElement: !selector ? this.domNode : this.domNode.querySelector(selector),
                handler: eventHandler,
                eventType: eventType,
                context: this,
                useCapture: useCapture
            });
            return this;
        };
        /**
         *  Renders the view.
         *  @returns {HTMLElement}
         */
        View.prototype.render = function (model) {
            if (this._template) {
                this.domNode.innerHTML = this._template.call(this, model);
            }
            return this.domNode;
        };
        /**
         *  Removes all elements and mapped events.
         */
        View.prototype.destroy = function () {
            if (typeof this.domNode.detach === 'function') {
                this.domNode.detach();
            }
            this.removeAllElements();
            this._domNode = null;
            return this;
        };
        /**
         *  Finds an element by given selector.
         *  @param {String} selector
         *  @returns {Element}
         */
        View.prototype.query = function (selector) {
            return this.domNode.querySelector(selector);
        };
        /**
         *  Removes an element by given selector.
         *  @param {String} selector
         */
        View.prototype.removeElement = function (selector) {
            var element = this.query(selector);
            if (element) {
                element.parentElement.removeChild(element);
            }
            return this;
        };
        /**
         *  Removes all elements.
         *  @returns {spaMVP.View}
         */
        View.prototype.removeAllElements = function () {
            while (this.domNode.firstElementChild) {
                this.domNode.removeChild(this.domNode.firstElementChild);
            }
            return this;
        };
        View.subclass = spaMVP.subclassFactory;
        return View;
    }());
    spaMVP.View = View;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=View.js.map
var spaMVP;
(function (spaMVP) {
    /**
     *  @class spaMVP.Presenter
     */
    var Presenter = (function () {
        function Presenter() {
            this._view = null;
            this._model = null;
            this._modelHandlers = {};
        }
        Object.defineProperty(Presenter.prototype, "view", {
            get: function () {
                return this._view;
            },
            set: function (value) {
                if (this.view === value) {
                    return;
                }
                if (this.view) {
                    this.view.destroy();
                }
                this._view = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Presenter.prototype, "model", {
            get: function () {
                return this._model;
            },
            set: function (model) {
                var _this = this;
                if (this._model === model) {
                    return;
                }
                Object.keys(this._modelHandlers).forEach(function (type) {
                    var eventHandler = _this._modelHandlers[type];
                    if (_this._model) {
                        _this._model.off(type, eventHandler, _this);
                    }
                    if (model) {
                        model.on(type, eventHandler, _this);
                    }
                });
                this._model = model;
                this.render();
            },
            enumerable: true,
            configurable: true
        });
        /**
         *  Determins which events to handle when model notifies.
         */
        Presenter.prototype.onModel = function (eventType, handler) {
            if (eventType && handler) {
                this._modelHandlers[eventType] = handler;
            }
            return this;
        };
        /**
         *  Renders its view.
         */
        Presenter.prototype.render = function () {
            if (this.view && this.model) {
                return this.view.render(this.model);
            }
            return null;
        };
        /**
         *  Destroys its view and model.
         */
        Presenter.prototype.destroy = function () {
            this.view = null;
            this.model = null;
        };
        Presenter.subclass = spaMVP.subclassFactory;
        return Presenter;
    }());
    spaMVP.Presenter = Presenter;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=Presenter.js.map
var spaMVP;
(function (spaMVP) {
    /**
     *  @class UrlHash - Represents the string after '#' in a url.
     *  @property {String} value - The string after # in a url.
     *  @property {Array} tokens - The array of string tokens after splitint its value by / (slash).
     *  @property {Array} queryParams - The array of key-value pairs parsed from the query string in its value.
     */
    var UrlHash = (function () {
        function UrlHash() {
            this.questionMarkIndex = -1;
            this.url = '';
            this.tokens = [];
            this.queryParams = [];
        }
        Object.defineProperty(UrlHash.prototype, "value", {
            get: function () {
                return this.url;
            },
            set: function (url) {
                url = url || '';
                this.url = url;
                this.questionMarkIndex = url.indexOf('?');
                this.queryParams = [];
                this.tokens = [];
                this.populateQueryParams();
                this.populateTokens();
            },
            enumerable: true,
            configurable: true
        });
        UrlHash.prototype.anyQueryParams = function () {
            return this.questionMarkIndex > -1;
        };
        UrlHash.prototype.populateQueryParams = function () {
            var _this = this;
            if (!this.anyQueryParams()) {
                return;
            }
            this.queryParams = this.value
                .substring(this.questionMarkIndex + 1)
                .split('&')
                .map(function (keyValuePairString) { return _this.parseQueryParam(keyValuePairString); });
        };
        UrlHash.prototype.parseQueryParam = function (keyValuePair) {
            var args = keyValuePair.split('=');
            return {
                key: args[0],
                value: args[1] || ''
            };
        };
        UrlHash.prototype.populateTokens = function () {
            var valueWithoutQuery = this.getValueWithoutQuery();
            this.tokens = valueWithoutQuery
                .split('/')
                .filter(function (token) { return token !== ''; });
        };
        UrlHash.prototype.getValueWithoutQuery = function () {
            if (!this.anyQueryParams()) {
                return this.value;
            }
            return this.value.substring(0, this.value.length - (this.value.length - this.questionMarkIndex));
        };
        return UrlHash;
    }());
    spaMVP.UrlHash = UrlHash;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=UrlHash.js.map
var spaMVP;
(function (spaMVP) {
    var routeParamRegex = /{([a-zA-Z]+)}/; // e.g {id}
    /**
     *  @class Route - Accepts a pattern and split it by / (slash).
     *  It also supports dynamic params - {yourDynamicParam}.
     *  @property {String} pattern
     */
    var Route = (function () {
        function Route(pattern, onStart) {
            this.tokens = [];
            if (typeof pattern === 'undefined' ||
                typeof pattern !== 'string' ||
                pattern === null) {
                throw new Error('Route pattern should be non empty string.');
            }
            this.pattern = pattern;
            this.callback = onStart;
            this.populateTokens();
        }
        /**
         *  The array of tokens after its pattern is splitted by / (slash).
         */
        Route.prototype.getTokens = function () {
            return this.tokens.slice(0);
        };
        /**
         *  Determines whether it equals UrlHash.
         */
        Route.prototype.equals = function (hashUrl) {
            if (this.tokens.length !== hashUrl.tokens.length) {
                return false;
            }
            for (var i = 0, len = this.tokens.length; i < len; i++) {
                var token = this.tokens[i];
                var urlToken = hashUrl.tokens[i];
                if (token.isDynamic) {
                    continue;
                }
                if (token.name.toLowerCase() !== urlToken.toLowerCase()) {
                    return false;
                }
            }
            return true;
        };
        /**
         *  Populate the dynamic params from the UrlHash if such exist
         *  and executes the registered callback.
         */
        Route.prototype.start = function (urlHash) {
            var queryParams = this.getParamsFromUrl(urlHash);
            if (this.callback) {
                this.callback(queryParams);
            }
        };
        Route.prototype.populateTokens = function () {
            var _this = this;
            this.tokens = [];
            this.pattern.split('/').forEach(function (urlFragment) {
                if (urlFragment !== '') {
                    _this.tokens.push(_this.parseToken(urlFragment));
                }
            });
        };
        Route.prototype.parseToken = function (urlFragment) {
            var paramMatchGroups = routeParamRegex.exec(urlFragment);
            var isDynamic = !!paramMatchGroups;
            return {
                name: isDynamic ? paramMatchGroups[1] : urlFragment,
                isDynamic: isDynamic
            };
        };
        Route.prototype.getParamsFromUrl = function (url) {
            var result = this.getQueryParamsFromUrl(url);
            // route params are with higher priority than query params
            this.tokens.forEach(function (token, index) {
                if (token.isDynamic) {
                    result[token.name] = url.tokens[index];
                }
            });
            return result;
        };
        Route.prototype.getQueryParamsFromUrl = function (url) {
            var result = {};
            url.queryParams.forEach(function (param) { return result[param.key] = param.value; });
            return result;
        };
        return Route;
    }());
    spaMVP.Route = Route;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=Route.js.map
var spaMVP;
(function (spaMVP) {
    /**
     *  @class RouteConfig - Handles spa application route changes.
     */
    var RouteConfig = (function () {
        function RouteConfig() {
            this.routes = [];
            this.urlHash = new spaMVP.UrlHash();
            this.defaultUrl = null;
        }
        /**
         *  Registers a route by given url pattern.
         *  When url's hash is changed it executes a callback with populated dynamic routes and query parameters.
         *  Dynamic route param can be registered with {yourParam}.
         */
        RouteConfig.prototype.registerRoute = function (pattern, callback) {
            if (this.routes.some(function (r) { return r.pattern === pattern; })) {
                throw new Error('Route ' + pattern + ' has been already registered.');
            }
            this.routes.push(new spaMVP.Route(pattern, callback));
        };
        /**
         *  Starts hash url if such is registered, if not, it starts the default one.
         */
        RouteConfig.prototype.startRoute = function (hash) {
            this.urlHash.value = hash;
            var nextRoute = this.findRoute();
            if (nextRoute) {
                nextRoute.start(this.urlHash);
                return;
            }
            if (this.defaultUrl) {
                this.startDefaultRoute(hash);
            }
            else {
                console.warn("No route handler for " + hash);
            }
        };
        /**
         *  Returns all registered patterns.
         */
        RouteConfig.prototype.getRoutes = function () {
            return this.routes.map(function (route) { return route.pattern; });
        };
        /**
         *  Determines if there are any registered routes.
         */
        RouteConfig.prototype.hasRoutes = function () {
            return this.routes.length > 0;
        };
        RouteConfig.prototype.findRoute = function () {
            for (var i = 0, len = this.routes.length; i < len; i++) {
                var route = this.routes[i];
                if (route.equals(this.urlHash)) {
                    return route;
                }
            }
            return null;
        };
        RouteConfig.prototype.startDefaultRoute = function (invalidHash) {
            window.history.replaceState(null, null, window.location.pathname + '#' + this.defaultUrl);
            this.urlHash.value = this.defaultUrl;
            var nextRoute = this.findRoute();
            if (nextRoute) {
                nextRoute.start(this.urlHash);
            }
            else {
                console.warn("No route handler for " + invalidHash);
            }
        };
        return RouteConfig;
    }());
    spaMVP.RouteConfig = RouteConfig;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=RouteConfig.js.map
var spaMVP;
(function (spaMVP) {
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
var spaMVP;
(function (spaMVP) {
    function initialize(ev) {
        var _this = this;
        document.removeEventListener("DOMContentLoaded", this.onDomReady);
        if (this.onAppStart) {
            this.onAppStart();
        }
        if (this.routeConfig.hasRoutes()) {
            this.routeConfig.startRoute(window.location.hash.substring(1));
            window.addEventListener('hashchange', function () {
                _this.routeConfig.startRoute(window.location.hash.substring(1));
            });
        }
    }
    var Core = (function () {
        function Core(routeConfig) {
            if (routeConfig === void 0) { routeConfig = new spaMVP.RouteConfig(); }
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
            if (typeof handler !== 'function') {
                throw new TypeError('Event type handler should be a function');
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
            if (moduleId === '' || typeof moduleId !== 'string') {
                throw new TypeError(moduleId + ' Module registration FAILED: ID must be a non empty string.');
            }
            if (this.modules[moduleId]) {
                throw new TypeError(moduleId + ' Module registration FAILED: a module with such id has been already registered.');
            }
            var tempModule = moduleFactory(new spaMVP.Sandbox(this, moduleId));
            if (typeof tempModule.init !== 'function' || typeof tempModule.destroy !== 'function') {
                throw new TypeError(moduleId + ' Module registration FAILED: Module has no init or destroy methods.');
            }
            this.modules[moduleId] = { create: moduleFactory, instances: null };
            return this;
        };
        /**
         *  Returns all registered module ids.
         *  @returns {Array<string>}
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
                throw new ReferenceError(moduleId + ' Module not found.');
            }
            options = options || {};
            if (typeof options !== 'object') {
                throw new TypeError(moduleId + ' Module\'s options must be an object.');
            }
            module.instances = module.instances || {};
            var instanceId = options['instanceId'] || moduleId;
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
            if (typeof id !== 'string' || id === '') {
                throw new TypeError(id + ' Service registration FAILED: ID must be non empty string.');
            }
            if (this.services[id]) {
                throw new TypeError(id + ' Service registration FAILED: a service with such id has been already added.');
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
                throw new ReferenceError(id + ' Service was not found.');
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