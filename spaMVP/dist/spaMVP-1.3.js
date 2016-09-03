/** 
 *  spaMVP - v1.3
 *  Copyright © 2016 Valentin Lozev 
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *  Source code: http://github.com/valentin-lozev/spaMVP
 */
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
var spaMVP = (function (spaMVP)
{
    function defaultHashingFunc(item)
    {
        if (typeof item.hashCode === 'function')
        {
            return item.hashCode();
        }

        return item.toString();
    }

    function defaultEqualityFunc(item, other)
    {
        if (typeof item.equals === 'function')
        {
            return item.equals(other);
        }

        return item === other;
    }

    /**
     *  Creates a collection of unique values.
     *  @class spaMVP.HashSet
     *  @property {Object} items
     *  @property {Number} size
     *  @param {Function} [hashingFunc] - Provides hash codes for objects placed in the set.
     *          If not provided, the set checks whether the object has a hashCode() method, 
     *          and if not, calls its toString() method.
     *  @param {Function} [equalityFunc] - Checks for equality between two objects with the same hash code.
     *          If not provided, the set checks whether object being compared has an equals(other) method, 
     *          and if not, compares the objects by using the === operator.  
     */
    function HashSet(hashingFunc, equalityFunc)
    {
        this.items = {};
        this.size = 0;
        this._hashingFunc = hashingFunc || defaultHashingFunc;
        this._equalityFunc = equalityFunc || defaultEqualityFunc;
    }

    /**
     *  Adds a new item to the set.
     *  @returns {Boolean}
     */
    HashSet.prototype.add = function (item)
    {
        if (this.contains(item))
        {
            return false;
        }

        var hashCode = this._hashingFunc(item);

        // the first item with this hash
        if (!Object.prototype.hasOwnProperty.call(this.items, hashCode))
        {
            this.items[hashCode] = item;
        }
        // the second item with this hash
        else if (!(this.items[hashCode] instanceof Array))
        {
            this.items[hashCode] = [this.items[hashCode], item];
        }
        // there are already two or more items with this hash
        else
        {
            this.items[hashCode].push(item);
        }

        this.size++;

        return true;
    };

    /**
     *  Removes an item from the set.
     *  @returns {Boolean}
     */
    HashSet.prototype.remove = function (item)
    {
        if (!this.contains(item))
        {
            return false;
        }

        var hashCode = this._hashingFunc(item);

        if (this.items[hashCode] instanceof Array)
        {
            var hashCodeItems = this.items[hashCode];
            for (var i = 0, len = hashCodeItems.length; i < len; i++)
            {
                if (this._equalityFunc(hashCodeItems[i], item))
                {
                    hashCodeItems[i] = hashCodeItems[len - 1];
                    hashCodeItems.length--;
                    break;
                }
            }
        }
        else
        {
            delete this.items[hashCode];
        }

        this.size--;

        return true;
    };

    /**
     *  Determines whether an item is in the set.
     *  @returns {Boolean}
     */
    HashSet.prototype.contains = function (item)
    {
        var hashCode = this._hashingFunc(item);
        if (!Object.prototype.hasOwnProperty.call(this.items, hashCode))
        {
            return false;
        }

        var hashedItems = this.items[hashCode];
        if (!(hashedItems instanceof Array))
        {
            return this._equalityFunc(hashedItems, item);
        }

        for (var i = 0, len = hashedItems.length; i < len; i++)
        {
            if (this._equalityFunc(hashedItems[i], item))
            {
                return true;
            }
        }

        return false;
    };

    /**
     *  Removes all items from the set.
     *  @returns {Boolean}
     */
    HashSet.prototype.clear = function ()
    {
        if (this.size <= 0)
        {
            return false;
        }

        this.items = {};
        this.size = 0;

        return true;
    };

    /**
     *  Performs a specified action on each item in the set.
     *  @param {Function} action
     *  @param {Object} [context] - Value to use as this when executing the action.
     */
    HashSet.prototype.forEach = function (action /*, context */)
    {
        var context = arguments[1],
            index = 0,
            hashes = Object.keys(this.items);

        for (var i = 0, len = hashes.length; i < len; i++)
        {
            var hashIndexItem = this.items[hashes[i]];
            if (!(hashIndexItem instanceof Array))
            {
                action.call(context, hashIndexItem, index);
                index++;
                continue;
            }

            for (var j = 0, hashLength = hashIndexItem.length; j < hashLength; j++)
            {
                action.call(context, hashIndexItem[j], index);
                index++;
            }
        }
    };

    /**
     *  Converts the set to Array without copying the items.
     *  @returns {Array}
     */
    HashSet.prototype.toArray = function ()
    {
        var result = new Array(this.size),
            index = 0,
            hashes = Object.keys(this.items);
        for (var i = 0, hashesLen = hashes.length; i < hashesLen; i++)
        {
            var hashIndexItem = this.items[hashes[i]];
            if (!(hashIndexItem instanceof Array))
            {
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

    spaMVP.HashSet = HashSet;
    return spaMVP;

}(spaMVP || {}));
var spaMVP = (function (spaMVP) {

    /**
     *  Composite pattern on spaMVP.Model.
     *  It is usefull when you want to listen for collection of models.
     *  @class spaMVP.Collection
     *  @augments spaMVP.Model
     *  @property {spaMVP.HashSet} models - Set of models
     *  @param {Function} [hashingFunc] - Provides hash codes for models placed in the set.
     *          If not provided, the set checks whether the model has a hashCode() method, 
     *          and if not, calls its toString() method.
     *  @param {Function} [equalityFunc] - Checks for equality between two models with the same hash code.
     *          If not provided, the set checks whether the model being compared has an equals(other) method, 
     *          and if not, compares the models by using the === operator.
     */
    function Collection(hashingFunc, equalityFunc) {
        spaMVP.Model.call(this);
        this.models = new spaMVP.HashSet(hashingFunc, equalityFunc);
    }

    Collection.prototype = Object.create(spaMVP.Model.prototype);

    Collection.prototype.constructor = Collection;

    /**
     *  Adds a new model to the set, subscribes to its change and destroy events, 
     *  and notifies the listeners if the model is added successfully.
     *  @param {spaMVP.Model} model
     *  @returns {Boolean}
     */
    Collection.prototype.add = function (model) {
        return this.addRange([model]);
    };

    /**
     *  Adds range of models to the set, subsribes to their change and destroy events, 
     *  and notifies the listeners if there are successfully added models.
     *  @param {Array} models - The array of models to be added.
     *  @returns {Boolean}
     */
    Collection.prototype.addRange = function (models) {
        var added = [];
        for (var i = 0, len = models.length; i < len; i++) {
            var model = models[i];

            if (!(model instanceof spaMVP.Model)) {
                throw new ReferenceError('Item must be a subclass of spaMVP.Model.js');
            }

            if (!this.models.add(model)) {
                continue;
            }

            model.on('change', this.onItemChange, this);
            model.on('destroy', this.onItemDestroy, this);

            added.push(model);
        }

        var isModified = added.length > 0;
        if (isModified) {
            this.notify({
                type: 'change',
                addedTargets: added,
                deletedTargets: [],
                updatedTargets: []
            });
        }

        return isModified;
    };

    /**
     *   Removes a model from the set, unsubscribes from it and notifies the listeners.
     *   @param {spaMVP.Model} model
     *   @returns {Boolean}
     */
    Collection.prototype.remove = function (model) {
        return this.removeRange([model]);
    };

    /**
     *  Removes range of models, unsubsribes from them and notifies the listeners.
     *  @param {Array} models - The array of models to be removed.
     *  @returns {Boolean}
     */
    Collection.prototype.removeRange = function (models) {
        var deleted = [];
        for (var i = 0, len = models.length; i < len; i++) {
            var model = models[i];
            if (!this.models.remove(model)) {
                continue;
            }

            model.off('change', this.onItemChange, this);
            model.off('destroy', this.onItemDestroy, this);

            deleted.push(model);
        }

        var isModified = deleted.length > 0;
        if (isModified) {
            this.notify({
                type: 'change',
                addedTargets: [],
                deletedTargets: deleted,
                updatedTargets: []
            });
        }

        return isModified;
    };

    /**
     *  Removes all models from the set, unsubscribes from them and notifies the listeners.
     *  @returns {Boolean}
     */
    Collection.prototype.clear = function () {
        var allItems = this.toArray();
        return this.removeRange(allItems);
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
        return this.models.size > 0;
    };

    /**
     *  Returns the models as Array without copying them.
     *  @returns {Array}
     */
    Collection.prototype.toArray = function () {
        return this.models.toArray();
    };

    /**
     *  Performs a specified action on each model in the set.
     *  @param {Function} action
     *  @param {Object} [context] - Value to use as this when executing the action.
     */
    Collection.prototype.forEach = function (action /* , context */) {
        var context = arguments[1];
        this.models.forEach(action, context);
    };

    /**
     *  Handles the change event of its models by notifying the listeners.
     *  @param {ModelEvent} ev - The dispatched event from the changed model.
     */
    Collection.prototype.onItemChange = function (ev) {
        this.notify({
            type: 'change',
            addedTargets: [],
            deletedTargets: [],
            updatedTargets: [ev.currentTarget]
        });
    };

    /**
     *  Handles the destroy event of its models by removing the destroyed one 
     *  and notifying the listeners.
     *  @param {ModelEvent} ev - The dispatched event from the destroyed model.
     */
    Collection.prototype.onItemDestroy = function (ev) {
        this.remove(ev.currentTarget);
    };

    spaMVP.Collection = Collection;
    return spaMVP;

}(spaMVP));
var spaMVP = (function (spaMVP)
{
    /**
     *  Author: Martin Chaov
     *  github: https://github.com/mchaov/JSEventsManager
     *  Smart events managing by altering the properties of a HTML element
     */
    var UIEvent = (function ()
    {
        //'use strict'; -> issues with iOS Safari on tablet devices: 09.11.2015

        Element.prototype.trigger = function () { return false; }
        Element.prototype.hasEvent = function () { return false; }
        Element.prototype.detach = function () { return false; }
        Element.prototype.events = false;

        function removeEvent(name)
        {
            var ev, type, handler, useCapture;
            ev = this.events[name];
            useCapture = ev.useCapture;
            type = ev.eventType;
            handler = ev.handler;
            this.removeEventListener(type, handler, useCapture);
            delete this.eventsList[name];
        }

        function detachEvent(name)
        {
            var i;

            if (name === undefined || name === '')
            {

                for (i in this.eventsList)
                {
                    removeEvent.call(this, i);
                }
                this.eventsList = {};
            }
            else if (this.hasEvent(name))
            {
                removeEvent.call(this, name);
            }

            return this.eventsList;
        }

        function hasEvent(name)
        {
            return typeof this.eventsList[name] === 'object' ? this.eventsList[name] : false;
        }

        function triggerEvent(name)
        {
            var evt = this.hasEvent(name);
            if (typeof evt.handler === 'function')
            {
                return evt.handler();
            }
            return false;
        }

        function UIEvent(config)
        {
            if (!config)
            {
                return false;
            }

            if ((this instanceof UIEvent) === false)
            {
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

        UIEvent.prototype.init = function ()
        {
            if (this.htmlElement.eventsList === undefined)
            {
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
                        get: function ()
                        {
                            return this.eventsList;
                        },
                        set: function (e)
                        {
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
            else if (this.htmlElement.hasEvent(this.eventConfig.name))
            {
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
                value: function (name)
                {
                    return detachEvent.call(this.htmlElement, name);
                }
            },
            'trigger': {
                writable: false,
                enumerable: false,
                configurable: false,
                value: function (name)
                {
                    return triggerEvent.call(this.htmlElement, name || this.eventConfig.name);
                }
            }

        });

        return UIEvent;
    }());

    spaMVP._private = spaMVP._private || {};
    spaMVP._private.UIEvent = UIEvent;
    return spaMVP;

}(spaMVP || {}));
var spaMVP = (function (spaMVP, document) {

    var _private = spaMVP._private;

    /**
     *  @typedef {Object} UIEvent
     *  @property {String} type - Type of the event.
     *  @property {Boolean} useCapture - Determines if the event should be catched in capture phase.
     */

    function attachEvents() {
        var events = this.mapEvents();
        for (var i = 0, len = events.length; i < len; i++) {
            var ev = events[i];
            new _private.UIEvent({
                name: 'on' + this._id + ev.type,
                htmlElement: this.domNode,
                handler: eventHandler,
                eventType: ev.type,
                context: this,
                useCapture: ev.useCapture || false
            });
        }
    }

    function eventHandler(ev) {
        var target = ev.target || ev.srcElement,
            dataset = target.dataset,
            callbackName = null;
        if (!dataset.hasOwnProperty(ev.type)) {
            return;
        }

        callbackName = dataset[ev.type];
        if (typeof this[callbackName] === 'function') {
            this[callbackName](dataset, target, ev);
            return;
        }
    }

    /**
     *  @class spaMVP.View
     *  @param {String} id - Id selector of the view's container.
     *  @param {Function} [template] - A function which populates view's container with html template on render.
     *  @property {Element} domNode - The html element container.
     */
    function View(id, template) {
        this._presenter = null;
        this._template = template || null;
        this._id = id;
        this.domNode = document.querySelector(id);
    }

    /**
     *  Renders the view.
     *  @param {spaMVP.Model} [model]
     *  @returns {Element}
     */
    View.prototype.render = function (model) {
        if (this.domNode && this._template) {
            this.domNode.innerHTML = this._template.call(this, model);
        }

        return this.domNode;
    };

    /**
     *  Returns its presenter.
     *  @returns {spaMVP.Presenter}
     */
    View.prototype.getPresenter = function () {
        return this._presenter;
    };

    /**
     *  Sets a new presenter and maps the events declared in mapEvents method to its methods
     *  by using dataset attributes. E.g. data-click="someMethod" or data-change="someMethod".
     *  Must be called ONLY by the presenter.
     *  @param {spaMVP.Presenter} presenter
     */
    View.prototype.setPresenter = function (presenter) {
        if (this._presenter === presenter) {
            return this;
        }

        this._presenter = presenter;
        attachEvents.call(this);
        return this;
    };

    /**
     *  Determines what types of events to map.
     *  It must return array of objects e.g { type: 'click', useCapture: false }
     *  @returns {Array.<UIEvent>}
     */
    View.prototype.mapEvents = function () {
        return [];
    };

    /**
     *  Finds a child element by given selector.
     *  @param {String} selector
     *  @returns {Element}
     */
    View.prototype.findElement = function (selector) {
        return this.domNode.querySelector(selector);
    };

    /**
     *  Removes an element by given selector.
     *  @param {String} selector
     *  @returns {spaMVP.View}
     */
    View.prototype.removeElement = function (selector) {
        var element = this.domNode.querySelector(selector);
        if (element) {
            element.parentElement.removeChild(element);
        }

        return this;
    };

    /**
     *  Removes all child elements.
     *  @returns {spaMVP.View}
     */
    View.prototype.removeAllElements = function () {
        while (this.domNode.firstElementChild) {
            this.domNode.removeChild(this.domNode.firstElementChild);
        }

        return this;
    };

    /**
     *  Inserts a child element at given index.
     *  @param {Number} index
     *  @param {Element} element
     *  @returns {spaMVP.View}
     */
    View.prototype.insertElementAt = function (index, element) {
        this.domNode.insertBefore(element, this.domNode.children[index]);
        return this;
    };

    /**
     *  Destroys itself.
     */
    View.prototype.destroy = function () {
        if (this.domNode) {
            if (typeof this.domNode.detach === 'function') {
                this.domNode.detach();
            }

            this.removeAllElements();
            this.domNode = null;
        }
    };

    spaMVP.View = View;
    return spaMVP;

}(spaMVP || {}, document));
var spaMVP = (function (spaMVP) {
    /**
     *  @class spaMVP.Presenter
     *  @param {spaMVP.View} view - An interface of all view methods used in the presenter.
     */
    function Presenter(view) {
        if (!(view instanceof spaMVP.View)) {
            throw new Error('Given view must be a subclass of View.js');
        }

        this._view = null;
        this._model = null;

        this.setView(view);
    }

    /**
     *  Returns its view.
     *  @returns {spaMVP.View}
     */
    Presenter.prototype.getView = function () {
        return this._view;
    };

    /**
     *  Sets a new view.
     *  @param {spaMVP.View} view
     */
    Presenter.prototype.setView = function (view) {
        if (this._view === view) {
            return;
        }

        if (this._view) {
            this._view.destroy();
        }

        if (view) {
            view.setPresenter(this);
        }

        this._view = view;
    };

    /**
     *  Returns its model.
     *  @returns {spaMVP.Model}
     */
    Presenter.prototype.getModel = function () {
        return this._model;
    };

    /**
     *  Sets a new model, subscribes to it for all mapped events defined in getModelEventsMap(),
     *  and if the model is not null it renders its view.
     *  @param {spaMVP.Model} model
     */
    Presenter.prototype.setModel = function (model) {
        var modelEventsMap = null, eventHandler = null;

        if (model && !(model instanceof spaMVP.Model)) {
            throw new Error('Model must be a subclass of spaMVP.Model');
        }

        if (this._model === model) {
            return;
        }

        modelEventsMap = this.getModelEventsMap();
        for (var eventType in modelEventsMap) {

            eventHandler = modelEventsMap[eventType];

            if (this._model) {
                this._model.off(eventType, this[eventHandler], this);
            }

            if (model) {
                model.on(eventType, this[eventHandler], this);
            }
        }

        this._model = model;
        if (this._model) {
            this.render();
        }
    };

    /**
     *  Renders its view.
     */
    Presenter.prototype.render = function () {
        return this.getView().render(this.getModel());
    };

    /**
     *  Determines which model events to listen for and map them to specific methods.
     *  Default mappings: 
     *      'change' handled by 'onModelChange',
     *      'destroy' handled by 'onModelDestroy'.
     *  @returns {Object}
     */
    Presenter.prototype.getModelEventsMap = function () {
        return {
            'change': 'onModelChange',
            'destroy': 'onModelDestroy'
        };
    };

    /**
     *  Handles model's change event.
     *  @param {ModelEvent} ev
     */
    Presenter.prototype.onModelChange = function () {
        // Must be overriden
    };

    /**
     *  Handles model's destroy event.
     *  @param {ModelEvent} ev
     */
    Presenter.prototype.onModelDestroy = function () {
        this.destroy();
    };

    /**
     *  Destroys its view and model.
     */
    Presenter.prototype.destroy = function () {
        this.setView(null);
        this.setModel(null);
    };

    spaMVP.Presenter = Presenter;
    return spaMVP;

}(spaMVP));
var spaMVP = (function (spaMVP) {
    var routeManagerInstance = null,
        routeParamRegex = null,
        routes = null,
        cachedHashUrl = null;

    function init() {
        routeParamRegex = /{([a-zA-Z]+)}/; // e.g {id}
        routes = [];
        routeManagerInstance = new RouteManager();
        window.addEventListener('hashchange', onHashChanged);
    }

    function onHashChanged() {
        routeManagerInstance.startRoute(window.location.hash.substring(1));
    }

    function findRouteByUrl(hashUrl) {
        for (var i = 0, len = routes.length; i < len; i++) {
            var route = routes[i];
            if (route.equals(hashUrl)) {
                return route;
            }
        }

        return null;
    }

    function HashUrl()
    {
    }

    HashUrl.create = function (url) {
        if (!cachedHashUrl) {
            cachedHashUrl = new HashUrl();
        }

        cachedHashUrl.init(url);
        return cachedHashUrl;
    };

    HashUrl.prototype.init = function (url) {
        this.value = url;
        this.questionMarkIndex = url.indexOf('?');
        this.queryParams = [];
        this.tokens = [];
        this.extractQueryParams();
        this.extractTokens();
    };

    HashUrl.prototype.extractQueryParams = function () {
        var hasQueryParams = this.questionMarkIndex > -1;
        if (!hasQueryParams) {
            return;
        }

        this.queryParams = this.value
            .substring(this.questionMarkIndex + 1)
            .split('&')
            .map(function (keyValuePairString) {
                return this.getQueryParamFromString(keyValuePairString);
            }, this);
    };

    HashUrl.prototype.getQueryParamFromString = function (keyValuePairString) {
        keyValuePairString = keyValuePairString.split('=');
        return {
            key: keyValuePairString[0],
            value: keyValuePairString[1]
        };
    };

    HashUrl.prototype.extractTokens = function () {
        this.removeQueryString();

        if (this.value === '' || this.value === '/') {
            this.tokens = ['/'];
            return;
        }

        this.tokens = this.value
            .split('/')
            .map(function (urlFragment) {
                return this.parseToken(urlFragment);
            }, this);
    };

    HashUrl.prototype.removeQueryString = function () {
        var hasQueryParams = this.questionMarkIndex > -1;
        if (!hasQueryParams) {
            return;
        }

        this.value = this.value.substring(0, this.value.length - (this.value.length - this.questionMarkIndex));
    };

    HashUrl.prototype.parseToken = function (urlFragment) {
        return urlFragment || '/';
    };

    function Route(pattern, callback) {
        this.pattern = pattern;
        this.callback = callback;
        this.tokens = [];
        this.extractTokens();
    }

    Route.prototype.extractTokens = function () {
        if (this.pattern === '/' || this.pattern === '') {
            this.tokens = ['/'];
            return;
        }

        this.tokens = this.pattern
            .split('/')
            .map(function (urlFragment) {
                return this.parseToken(urlFragment);
            }, this);
    };

    Route.prototype.parseToken = function (urlFragment) {
        var paramMatchGroups = routeParamRegex.exec(urlFragment);
        if (paramMatchGroups) {
            return {
                name: paramMatchGroups[1]
            };
        }

        return urlFragment || '/';
    };

    Route.prototype.equals = function (hashUrl) {
        if (this.tokens.length !== hashUrl.tokens.length) {
            return false;
        }

        for (var i = 0, len = this.tokens.length; i < len; i++) {
            var token = this.tokens[i],
                urlToken = hashUrl.tokens[i];

            var isRouteParam = typeof token === 'object';
            if (isRouteParam) {
                continue;
            }

            if (token.toLowerCase() !== urlToken.toLowerCase()) {
                return false;
            }
        }

        return true;
    };

    Route.prototype.getParamsFromUrl = function (url) {
        if (this.tokens.length !== url.tokens.length) {
            throw new Error('Url does not match the target route.');
        }

        var result = this.getQueryParamsFromUrl(url);

        // route params are with higher priority than query params
        this.tokens.forEach(function (token, index) {
            var isRouteParam = typeof token === 'object';
            if (isRouteParam) {
                result[token.name] = url.tokens[index];
            }
        });        

        return result;
    };

    Route.prototype.getQueryParamsFromUrl = function (url) {
        var result = {};
        url.queryParams.forEach(function (queryParam) {
            result[queryParam.key] = queryParam.value;
        });
        return result;
    };

    Route.prototype.start = function (routeParams) {
        this.callback(routeParams);
    };

    function RouteManager() {
        this.defaultUrl = null;
    }

    RouteManager.prototype.registerRoute = function (pattern, callback) {
        if (typeof pattern !== 'string') {
            throw new Error('Route pattern must be a string');
        }

        if (typeof callback !== 'function') {
            throw new Error('Route callback must be function');
        }

        routes.push(new Route(pattern, callback));
    };

    RouteManager.prototype.setDefaultUrl = function (url) {
        if (typeof url !== 'string') {
            throw new Error('url must be a string.');
        }

        this.defaultUrl = url;
    };

    RouteManager.prototype.startRoute = function (hashUrlValue) {
        var hashUrl = HashUrl.create(hashUrlValue);
        var nextRoute = findRouteByUrl(hashUrl);
        if (nextRoute) {
            var routeParams = nextRoute.getParamsFromUrl(hashUrl);
            nextRoute.start(routeParams);
            return;
        }

        this.startDefaultRoute();
    };

    RouteManager.prototype.startDefaultRoute = function () {
        if (this.defaultUrl) {
            window.history.replaceState(
                null,
                null,
                window.location.pathname + '#' + this.defaultUrl
            );
            this.startRoute(this.defaultUrl);
        }
    };

    RouteManager.prototype.getRoutes = function () {
        return routes.map(function (route) {
            return route.pattern;
        });
    };

    var exposedObj = {
        getInstance: function () {
            if (!routeManagerInstance) {
                init();
            }

            return routeManagerInstance;
        },
        hasRoutes: function () {
            return !!routes && routes.length > 0;
        }
    };

    spaMVP._private = spaMVP._private || {};
    spaMVP._private.RouteManager = exposedObj;

    return spaMVP;

}(spaMVP || {}));
var spaMVP = (function (spaMVP) {

    function subclassFactory(getInheritorFunc) {
        var inheritor = getInheritorFunc();
        if (!inheritor || typeof inheritor !== 'function') {
            throw new Error('Inheritor\'s function constructor must be supplied.');
        }

        return subclass.call(this, inheritor);
    }

    function subclass(inheritor) {
        // Polyfill for older browsers
        if (typeof Object.create !== 'function') {
            Object.create = function (o) {
                function F() { }
                F.prototype = o;
                return new F();
            };
        }

        var BaseClass = this;

        var prototype = inheritor.prototype;
        inheritor.prototype = Object.create(BaseClass.prototype);
        extend(inheritor.prototype, prototype);
        inheritor.prototype.constructor = inheritor;

        inheritor.BaseClass = BaseClass;
        inheritor.subclass = subclassFactory;
        return inheritor;
    }

    function extend(target, object) {
        for (var prop in object) {
            if (object[prop]) {
                target[prop] = object[prop];
            }
        }
    }

    spaMVP._private = spaMVP._private || {};
    spaMVP._private.subclassFactoryMethod = subclassFactory;
    return spaMVP;

}(spaMVP || {}));

var spaMVP = (function (spaMVP) {

    /**
     *  @class spaMVP.Sandbox
     *  @property {spaMVP.Core} core
     *  @property {string} moduleInstanceId
     */
    function Sandbox(core, moduleInstanceId) {
        this.core = core;
        this.moduleInstanceId = moduleInstanceId;
    }

    /**
     *  Publishes an event to the subscribers.
     *  @param {String} eventType - Type of the event.
     *  @param {*} [data] - Optional data.
     */
    Sandbox.prototype.publish = function (eventType, data) {
        if (typeof eventType === 'string') {
            this.core.publish(eventType, data);
        }
    };

    /**
     *  Subscribes for specific events.
     *  @param {Array} eventTypes - Array of events to subscribe for.
     *  @param {Function} handler - The events' handler.
     *  @param {Object} context - Handler's context.
     */
    Sandbox.prototype.subscribe = function (eventTypes, handler, context) {
        if (!Array.isArray(eventTypes)) {
            throw new TypeError('Event types must be an array');
        }

        if (typeof handler !== 'function') {
            throw new TypeError('Event type handler must be a function');
        }

        this.core.subscribe(eventTypes, handler, context);
    };

    /**
     *  Unsubscribes for specific events.
     *  @param {Array} eventTypes - Array of events to unsubscribe for.
     *  @param {Function} handler - The handler which must be unsubscribed.
     *  @param {Object} context - Handler's context.
     */
    Sandbox.prototype.unsubscribe = function (eventTypes, handler, context) {
        if (Array.isArray(eventTypes)) {
            this.core.unsubscribe(eventTypes, handler, context);
        }
    };

    /**
     *  Gets a service instance from the application core.
     *  @param {String} id
     *  @returns {Object}
     */
    Sandbox.prototype.getService = function (id) {
        return this.core.getService(id);
    };

    spaMVP.Sandbox = Sandbox;
    return spaMVP;

}(spaMVP || {}));
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
        if (typeof moduleId !== 'string' || moduleId === '') {
            throw new TypeError(moduleId + ' Module registration FAILED: ID must be a non empty string.');
        }

        if (typeof moduleFactory !== 'function') {
            throw new TypeError(moduleId + ' Module registration FAILED: moduleFactory must be a function which provides a module.');
        }

        if (_modules[moduleId]) {
            throw new TypeError(moduleId + ' Module registration FAILED: a module with such id has been already registered.');
        }

        tempModule = moduleFactory(new spaMVP.Sandbox(this, moduleId));
        if (typeof tempModule.init !== 'function' || typeof tempModule.destroy !== 'function') {
            throw new TypeError(moduleId + ' Module registration FAILED: Module has no init or destroy methods.');
        }

        tempModule = null;
        _modules[moduleId] = { create: moduleFactory, instances: null };
        return this;
    };

    /**
     *  Starts an instance of given module and initializes it.
     *  @param {string} moduleId - Id of the module, which must be started.
     *  @param {object} options - 
     */
    Core.prototype.start = function (moduleId, options) {
        var module = _modules[moduleId];
        if (!module) {
            throw new ReferenceError(moduleId + ' Module not found.');
        }

        options = options || {};
        if (typeof options !== 'object') {
            throw new TypeError(moduleId + ' Module\'s options must be an object.');
        }

        module.instances = module.instances || {};
        var instanceId = options.instanceId || moduleId;
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
        var module = _modules[moduleId], id = instanceId || moduleId;
        if (module && module.instances && module.instances.hasOwnProperty(id)) {
            module.instances[id].destroy();
            delete module.instances[id];
        }

        return this;
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
var spaMVP = (function (spaMVP)
{
    'use strict';

    var _private = spaMVP._private;

    spaMVP.Model.subclass =
    spaMVP.View.subclass =
    spaMVP.Presenter.subclass =
    spaMVP.Collection.subclass = _private.subclassFactoryMethod;
    spaMVP.createAppCore = function ()
    {
        return new _private.Core();
    };

    delete spaMVP._private;
    return spaMVP;

}(spaMVP));