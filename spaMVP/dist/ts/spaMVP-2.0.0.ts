/** 
 *  spaMVP - v2.0.0
 *  Copyright © 2016 Valentin Lozev 
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *  Source code: http://github.com/valentin-lozev/spaMVP
 */
namespace spaMVP {

    // Polyfill for older browsers
    if (typeof Object.create !== 'function') {
        Object.create = function (o) {
            function F() { }
            F.prototype = o;
            return new F();
        };
    }

    function subclass(inheritor): Function {
        let BaseClass = this;
        let prototype = inheritor.prototype;

        inheritor.prototype = Object.create(BaseClass.prototype);
        extend(inheritor.prototype, prototype);
        inheritor.prototype.constructor = inheritor;

        inheritor.BaseClass = BaseClass;
        inheritor.subclass = subclassFactory;
        return inheritor;
    }    

    export function subclassFactory(getInheritorFunc: () => Function): Function {
        let inheritor = getInheritorFunc();
        if (!inheritor || typeof inheritor !== 'function') {
            throw new Error('Inheritor\'s function constructor must be supplied.');
        }

        return subclass.call(this, inheritor);
    }

    export function extend(target, object) {
        for (let prop in object) {
            if (object[prop]) {
                target[prop] = object[prop];
            }
        }
    }
}
namespace spaMVP {

    export let ModelEvents = {
        Change: 'change',
        Destroy: 'destroy'
    };

    /**
     *  @class spaMVP.Model
     */
    export abstract class Model {
        private listeners: Object = {};

        constructor() {
        }

        static subclass = subclassFactory;

        /**
         *  Attaches an event handler to model raised events.
         *  @param {String} eventType The name of the event.
         *  @param {Function} handler The event's handler.
         *  @param {Object} [context] The Handler's context.
         */
        on(eventType: string, handler: (data?: any) => void, context?: Object): boolean {
            if (!eventType) {
                return false;
            }

            this.listeners[eventType] = this.listeners[eventType] || [];
            this.listeners[eventType].push({
                handler: handler,
                context: context
            });
            return true;
        }

        /**
         *  Detaches an event handler.
         *  @param {String} eventType The name of the event.
         *  @param {Function} handler The handler which must be detached.
         *  @param {Object} [context] The Handler's context.
         */
        off(eventType: string, handler: (data?: any) => void, context?: Object): boolean {
            let listeners = this.listeners[eventType] || [];
            for (let i = 0, len = listeners.length; i < len; i++) {
                let listener = listeners[i];
                if (listener.handler === handler &&
                    listener.context === context) {
                    listener = listeners[len - 1];
                    listeners.length--;
                    return true;
                }
            }

            return false;
        }

        /**
         *  Notifies the listeners attached for specific event.
         */
        notify(type: string, data?: any) {
            if (!Array.isArray(this.listeners[type])) {
                return;
            }

            this.listeners[type]
                .slice(0)
                .forEach(listener => listener.handler.call(listener.context, data));
        }

        /**
         *  Notifies for change event.
         */
        change() {
            this.notify(ModelEvents.Change, this);
        }

        /**
         *  Notifies for destroy event.
         */
        destroy() {
            this.notify(ModelEvents.Destroy, this);
        }
    }
}
namespace spaMVP {

    export interface Equatable<T> {
        equals(other: T): boolean;
        hash(): number;
    }

    /**
     *  Creates a collection of unique items.
     *  @class spaMVP.HashSet
     *  @property {Number} size  
     */
    export class HashSet<T extends Equatable<T>> {
        private items: Object = {};
        public size: number = 0;

        constructor() {
        }

        /**
         *  Determines whether an item is in the set.
         *  @returns {Boolean}
         */
        contains(item: T): boolean {
            let hashCode = item.hash();
            if (!Object.prototype.hasOwnProperty.call(this.items, hashCode)) {
                return false;
            }

            let hashedItems = this.items[hashCode];
            if (!Array.isArray(hashedItems)) {
                return hashedItems.equals(item);
            }

            for (let i = 0, len = hashedItems.length; i < len; i++) {
                if (hashedItems[i].equals(item)) {
                    return true;
                }
            }

            return false;
        }

        /**
         *  Adds a new item to the set.
         *  @returns {Boolean}
         */
        add(item: T): boolean {
            if (this.contains(item)) {
                return false;
            }

            let hashCode = item.hash();

            // the first item with this hash
            if (!Object.prototype.hasOwnProperty.call(this.items, hashCode)) {
                this.items[hashCode] = item;
            }
            // the second item with this hash
            else if (!Array.isArray(this.items[hashCode])) {
                this.items[hashCode] = [this.items[hashCode], item];
            }
            // there are already two or more items with this hash
            else {
                this.items[hashCode].push(item);
            }

            this.size++;
            return true;
        }

        /**
         *  Removes an item from the set.
         *  @returns {Boolean}
         */
        remove(item: T): boolean {
            if (!this.contains(item)) {
                return false;
            }

            let hashCode = item.hash();

            if (Array.isArray(this.items[hashCode])) {
                let hashCodeItems = this.items[hashCode];
                for (let i = 0, len = hashCodeItems.length; i < len; i++) {
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
        }

        /**
         *  Removes all items from the set.
         *  @returns {Boolean}
         */
        clear(): boolean {
            if (this.size <= 0) {
                return false;
            }

            this.items = {};
            this.size = 0;
            return true;
        }

        /**
         *  Performs a an action on each item in the set.
         *  @param {Function} action
         *  @param {Object} [context] The action's context.
         */
        forEach(action: (item: T, index: number) => void, context?: Object) {
            let index = 0;
            let hashes = Object.keys(this.items);
            for (let i = 0, len = hashes.length; i < len; i++) {
                let hashIndexItem = this.items[hashes[i]];
                if (!Array.isArray(hashIndexItem)) {
                    action.call(context, hashIndexItem, index);
                    index++;
                    continue;
                }

                for (let j = 0, hashLength = hashIndexItem.length; j < hashLength; j++) {
                    action.call(context, hashIndexItem[j], index);
                    index++;
                }
            }
        }

        /**
         *  Converts the set to Array.
         *  @returns {Array}
         */
        toArray(): Array<T> {
            let result = new Array(this.size);
            let index = 0;
            let hashes = Object.keys(this.items);
            for (let i = 0, hashesLen = hashes.length; i < hashesLen; i++) {
                let hashIndexItem = this.items[hashes[i]];
                if (!Array.isArray(hashIndexItem)) {
                    result[index] = hashIndexItem;
                    index++;
                    continue;
                }

                for (let j = 0, len = hashIndexItem.length; j < len; j++) {
                    result[index] = hashIndexItem[j];
                    index++;
                }
            }

            return result;
        }
    }

}
namespace spaMVP {

    export let CollectionEvents = {
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
    export class Collection<TModel extends Model & Equatable<TModel>> extends Model {
        private models: HashSet<TModel> = new HashSet<TModel>();

        constructor() {
            super();
        }

        get size(): number {
            return this.models.size;
        }

        static subclass = subclassFactory;

        equals(other: TModel): boolean {
            return false;
        }

        hash(): number {
            return this.size ^ 17;
        }

        /**
         *  Adds new model to the set.
         *  @returns {Boolean}
         */
        add(model: TModel): boolean {
            return this.addRange([model]);
        }

        /**
         *  Adds range of models to the set.
         *  @returns {Boolean}
         */
        addRange(models: Array<TModel>): boolean {
            let added = [];
            for (let i = 0, len = models.length; i < len; i++) {
                let model = models[i];
                if (!this.models.add(model)) {
                    continue;
                }

                model.on(ModelEvents.Change, this.onItemChange, this);
                model.on(ModelEvents.Destroy, this.onItemDestroy, this);
                added.push(model);
            }

            let isModified = added.length > 0;
            if (isModified) {
                this.notify(CollectionEvents.AddedItems, added);
            }

            return isModified;
        }

        /**
         *  Removes a model from the set.
         *  @returns {Boolean}
         */
        remove(model: TModel): boolean {
            return this.removeRange([model]);
        }

        /**
         *  Removes range of models.
         *  @returns {Boolean}
         */
        removeRange(models: Array<TModel>): boolean {
            let deleted = [];
            for (let i = 0, len = models.length; i < len; i++) {
                let model = models[i];
                if (!this.models.remove(model)) {
                    continue;
                }

                model.off(ModelEvents.Change, this.onItemChange, this);
                model.off(ModelEvents.Destroy, this.onItemDestroy, this);
                deleted.push(model);
            }

            let isModified = deleted.length > 0;
            if (isModified) {
                this.notify(CollectionEvents.DeletedItems, deleted);
            }

            return isModified;
        }

        /**
         *  Removes all models from the set.
         *  @returns {Boolean}
         */
        clear(): boolean {
            return this.removeRange(this.toArray());
        }

        /**
         *  Determines whether a model is in the collection.
         *  @returns {Boolean}
         */
        contains(model: TModel): boolean {
            return this.models.contains(model);
        }

        /**
         *  Determines whether the collection is not empty.
         *  @returns {Boolean}
         */
        any(): boolean {
            return this.size > 0;
        }

        /**
         *  Returns the models as Array.
         *  @returns {Array}
         */
        toArray(): Array<TModel> {
            return this.models.toArray();
        }

        /**
         *  Performs an action on each model in the set.
         */
        forEach(action: (item: TModel, index: number) => void, context: Object) {
            this.models.forEach(action, context);
        }

        private onItemChange(item: TModel) {
            this.notify(CollectionEvents.UpdatedItem, item);
        }

        private onItemDestroy(item: TModel) {
            this.removeRange([item]);
        }
    }

}
interface Element {
    trigger(): boolean;
    hasEvent(name: string): boolean;
    detach(): boolean;
    events: boolean;
}

namespace spaMVP {

    /**
     *  Author: Martin Chaov
     *  github: https://github.com/mchaov/JSEventsManager
     *  Smart events managing by altering the properties of a HTML element
     */

    // 'use strict'; -> issues with iOS Safari on tablet devices: 09.11.2015

    Element.prototype.trigger = function () { return false; }
    Element.prototype.hasEvent = function () { return false; }
    Element.prototype.detach = function () { return false; }
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

    export function UIEvent(config) {
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
}
namespace spaMVP {

    function eventHandler(ev: Event) {
        let target = <HTMLElement>ev.target;
        let dataset = target.dataset;
        if (!dataset.hasOwnProperty(ev.type)) {
            return;
        }

        let callbackName = dataset[ev.type];
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
    export class View {
        private _template: (model: any) => string;
        private _domNode: HTMLElement;

        constructor(domNode: HTMLElement, template?: (model: any) => string) {
            if (!domNode) {
                throw new Error("Dom node cannot be null.");
            }

            this._domNode = domNode;
            this._template = template;
        }

        static subclass = subclassFactory;

        get domNode(): HTMLElement {
            return this._domNode;
        }

        /**
         *  Maps a view action to given ui event disptached from html element.
         *  Mapping works by using the dataset - e.g data-click="handleClick" maps to handleClick.
         * @param eventType
         * @param useCapture
         * @param selector
         */
        map(eventType: string, useCapture: boolean = false, selector?: string): this {
            new UIEvent({
                name: eventType,
                htmlElement: !selector ? this.domNode : this.domNode.querySelector(selector),
                handler: eventHandler,
                eventType: eventType,
                context: this,
                useCapture: useCapture
            });

            return this;
        }

        /**
         *  Renders the view.
         *  @returns {HTMLElement}
         */
        render(model: any): HTMLElement {
            if (this._template) {
                this.domNode.innerHTML = this._template.call(this, model);
            }

            return this.domNode;
        }

        /**
         *  Removes all elements and mapped events.
         */
        destroy(): this {
            if (typeof this.domNode.detach === 'function') {
                this.domNode.detach();
            }

            this.removeAllElements();
            this._domNode = null;
            return this;
        }

        /**
         *  Finds an element by given selector.
         *  @param {String} selector
         *  @returns {Element}
         */
        query(selector: string): Element {
            return this.domNode.querySelector(selector);
        }

        /**
         *  Removes an element by given selector.
         *  @param {String} selector
         */
        removeElement(selector: string): this {
            let element = this.query(selector);
            if (element) {
                element.parentElement.removeChild(element);
            }

            return this;
        }

        /**
         *  Removes all elements.
         *  @returns {spaMVP.View}
         */
        removeAllElements(): this {
            while (this.domNode.firstElementChild) {
                this.domNode.removeChild(this.domNode.firstElementChild);
            }

            return this;
        }
    }

}
namespace spaMVP {

    /**
     *  @class spaMVP.Presenter
     */
    export class Presenter<TView extends View, TModel extends Model> {
        private _view: TView = null;
        private _model: TModel = null;
        private _modelHandlers = {};

        constructor() {
        }

        get view(): TView {
            return this._view;
        }

        set view(value: TView) {
            if (this.view === value) {
                return;
            }

            if (this.view) {
                this.view.destroy();
            }

            this._view = value;
        }

        get model(): TModel {
            return this._model;
        }

        set model(model: TModel) {
            if (this._model === model) {
                return;
            }

            Object.keys(this._modelHandlers).forEach(type => {
                let eventHandler = this._modelHandlers[type];
                if (this._model) {
                    this._model.off(type, eventHandler, this);
                }

                if (model) {
                    model.on(type, eventHandler, this);
                }
            });

            this._model = model;
            this.render();
        }

        static subclass = subclassFactory;

        /**
         *  Determins which events to handle when model notifies. 
         */
        onModel(eventType: string, handler: (data?: any) => void): this {
            if (eventType && handler) {
                this._modelHandlers[eventType] = handler;
            }

            return this;
        }

        /**
         *  Renders its view.
         */
        render(): Element {
            if (this.view && this.model) {
                return this.view.render(this.model);
            }

            return null;
        }

        /**
         *  Destroys its view and model.
         */
        destroy() {
            this.view = null;
            this.model = null;
        }
    }

}
namespace spaMVP {

    export interface QueryParam {
        key: string;
        value: string;
    }

    /**
     *  @class UrlHash - Represents the string after '#' in a url.
     *  @property {String} value - The string after # in a url.
     *  @property {Array} tokens - The array of string tokens after splitint its value by / (slash).
     *  @property {Array} queryParams - The array of key-value pairs parsed from the query string in its value.
     */
    export class UrlHash {
        private questionMarkIndex: number = -1;
        private url: string = '';
        public tokens: Array<string> = [];
        public queryParams: Array<QueryParam> = [];

        constructor() {
        }

        get value(): string {
            return this.url;
        }

        set value(url: string) {
            url = url || '';
            this.url = url;
            this.questionMarkIndex = url.indexOf('?');
            this.queryParams = [];
            this.tokens = [];
            this.populateQueryParams();
            this.populateTokens();
        }

        private anyQueryParams(): boolean {
            return this.questionMarkIndex > -1;
        }

        private populateQueryParams() {
            if (!this.anyQueryParams()) {
                return;
            }

            this.queryParams = this.value
                .substring(this.questionMarkIndex + 1)
                .split('&')
                .map(keyValuePairString => this.parseQueryParam(keyValuePairString));
        }

        private parseQueryParam(keyValuePair: string): QueryParam {
            let args = keyValuePair.split('=');
            return {
                key: args[0],
                value: args[1] || ''
            };
        }

        private populateTokens() {
            let valueWithoutQuery = this.getValueWithoutQuery();
            this.tokens = valueWithoutQuery
                .split('/')
                .filter(token => token !== '');
        }

        private getValueWithoutQuery(): string {
            if (!this.anyQueryParams()) {
                return this.value;
            }

            return this.value.substring(0, this.value.length - (this.value.length - this.questionMarkIndex));
        }
    }
}
namespace spaMVP {

    let routeParamRegex = /{([a-zA-Z]+)}/; // e.g {id}

    export interface RouteToken {
        name: string;
        isDynamic: boolean;
    }

    /**
     *  @class Route - Accepts a pattern and split it by / (slash).
     *  It also supports dynamic params - {yourDynamicParam}.
     *  @property {String} pattern
     */
    export class Route {
        private callback: (routeParams: any) => void;
        private tokens: Array<RouteToken> = [];
        public pattern: string;

        constructor(pattern: string, onStart: (routeParams: any) => void) {
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
        getTokens(): Array<RouteToken> {
            return this.tokens.slice(0);
        }

        /**
         *  Determines whether it equals UrlHash.
         */
        equals(hashUrl: UrlHash): boolean {
            if (this.tokens.length !== hashUrl.tokens.length) {
                return false;
            }

            for (let i = 0, len = this.tokens.length; i < len; i++) {
                let token = this.tokens[i];
                let urlToken = hashUrl.tokens[i];
                if (token.isDynamic) {
                    continue;
                }

                if (token.name.toLowerCase() !== urlToken.toLowerCase()) {
                    return false;
                }
            }

            return true;
        }

        /**
         *  Populate the dynamic params from the UrlHash if such exist
         *  and executes the registered callback.
         */
        start(urlHash: UrlHash) {
            let queryParams = this.getParamsFromUrl(urlHash);
            if (this.callback) {
                this.callback(queryParams);
            }
        }

        private populateTokens() {
            this.tokens = [];
            this.pattern.split('/').forEach(urlFragment => {
                if (urlFragment !== '') {
                    this.tokens.push(this.parseToken(urlFragment));
                }
            });
        }

        private parseToken(urlFragment: string): RouteToken {
            let paramMatchGroups = routeParamRegex.exec(urlFragment);
            let isDynamic = !!paramMatchGroups;
            return {
                name: isDynamic ? paramMatchGroups[1] : urlFragment,
                isDynamic: isDynamic
            };
        }

        private getParamsFromUrl(url: UrlHash): Object {
            let result = this.getQueryParamsFromUrl(url);
            // route params are with higher priority than query params
            this.tokens.forEach((token, index) => {
                if (token.isDynamic) {
                    result[token.name] = url.tokens[index];
                }
            });

            return result;
        }

        private getQueryParamsFromUrl(url: UrlHash): Object {
            let result = {};
            url.queryParams.forEach(param => result[param.key] = param.value);
            return result;
        }
    }
}
namespace spaMVP {

    /**
     *  @class RouteConfig - Handles spa application route changes.
     */
    export class RouteConfig {
        private routes: Array<Route> = [];
        private urlHash: UrlHash = new UrlHash();
        public defaultUrl: string = null;

        constructor() {
        }

        /**
         *  Registers a route by given url pattern.
         *  When url's hash is changed it executes a callback with populated dynamic routes and query parameters.
         *  Dynamic route param can be registered with {yourParam}.
         */
        registerRoute(pattern: string, callback: (routeParams: any) => void) {
            if (this.routes.some(r => r.pattern === pattern)) {
                throw new Error('Route ' + pattern + ' has been already registered.');
            }

            this.routes.push(new Route(pattern, callback));
        }

        /**
         *  Starts hash url if such is registered, if not, it starts the default one.
         */
        startRoute(hash: string) {
            this.urlHash.value = hash;
            let nextRoute = this.findRoute();
            if (nextRoute) {
                nextRoute.start(this.urlHash);
                return;
            }

            if (this.defaultUrl) {
                this.startDefaultRoute(hash);
            } else {
                console.warn("No route handler for " + hash);
            }
        }

        /**
         *  Returns all registered patterns.
         */
        getRoutes(): Array<string> {
            return this.routes.map(route => route.pattern);
        }

        /**
         *  Determines if there are any registered routes.
         */
        hasRoutes(): boolean {
            return this.routes.length > 0;
        }

        private findRoute(): Route {
            for (let i = 0, len = this.routes.length; i < len; i++) {
                let route = this.routes[i];
                if (route.equals(this.urlHash)) {
                    return route;
                }
            }

            return null;
        }

        private startDefaultRoute(invalidHash: string) {
            window.history.replaceState(
                null,
                null,
                window.location.pathname + '#' + this.defaultUrl
            );

            this.urlHash.value = this.defaultUrl;
            let nextRoute = this.findRoute();
            if (nextRoute) {
                nextRoute.start(this.urlHash);
            } else {
                console.warn("No route handler for " + invalidHash);
            }
        }
    }
}
namespace spaMVP {

    /**
     *  @class Sandbox - Connects all modules to the outside world.
     *  @property {String} moduleInstanceId - Id of the module it serves for.
     */
    export class Sandbox {
        private core: Core;
        public moduleInstanceId: string;

        constructor(core: Core, moduleInstanceId: string) {
            if (!core || !moduleInstanceId) {
                throw new Error("Missing core or module instance ID");
            }

            this.core = core;
            this.moduleInstanceId = moduleInstanceId;
        }

        subscribe(eventTypes: Array<string>, handler: (type: string, data: any) => void, context?: Object) {
            this.core.subscribe(eventTypes, handler, context);
        }

        unsubscribe(eventTypes: Array<string>, handler: (type: string, data: any) => void, context?: Object) {
            this.core.unsubscribe(eventTypes, handler, context);
        }

        publish(eventType: string, data: any) {
            this.core.publish(eventType, data);
        }

        getService(id: string) : any {
            return this.core.getService(id);
        }
    }
}
namespace spaMVP {

    function initialize(ev: Event) {
        document.removeEventListener("DOMContentLoaded", this.onDomReady);
        if (this.onAppStart) {
            this.onAppStart();
        }

        if (this.routeConfig.hasRoutes()) {
            this.routeConfig.startRoute(window.location.hash.substring(1));
            window.addEventListener('hashchange', () => {
                this.routeConfig.startRoute(window.location.hash.substring(1));
            });
        }
    }

    export interface Module {
        init(options: any);
        destroy();
    }

    export class Core {
        private onDomReady = initialize.bind(this);
        private onAppStart: Function;
        private routeConfig: RouteConfig;
        private subscribers: Object = {};
        private modules: Object = {};
        private services: Object = {};

        constructor(routeConfig = new RouteConfig()) {
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
        subscribe(eventTypes: Array<string>, handler: (type: string, data: any) => void, context?: Object) {
            if (typeof handler !== 'function') {
                throw new TypeError('Event type handler should be a function');
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
        unsubscribe(eventTypes: Array<string>, handler: (type: string, data: any) => void, context?: Object) {
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
        publish(type: string, data: any) {
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
            if (moduleId === '' || typeof moduleId !== 'string') {
                throw new TypeError(moduleId + ' Module registration FAILED: ID must be a non empty string.');
            }

            if (this.modules[moduleId]) {
                throw new TypeError(moduleId + ' Module registration FAILED: a module with such id has been already registered.');
            }

            let tempModule = moduleFactory(new spaMVP.Sandbox(this, moduleId));
            if (typeof tempModule.init !== 'function' || typeof tempModule.destroy !== 'function') {
                throw new TypeError(moduleId + ' Module registration FAILED: Module has no init or destroy methods.');
            }

            this.modules[moduleId] = { create: moduleFactory, instances: null };
            return this;
        }

        /**
         *  Returns all registered module ids.
         *  @returns {Array<string>}
         */
        getAllModules(): Array<string> {
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
                throw new ReferenceError(moduleId + ' Module not found.');
            }

            options = options || {};
            if (typeof options !== 'object') {
                throw new TypeError(moduleId + ' Module\'s options must be an object.');
            }

            module.instances = module.instances || {};
            let instanceId = options['instanceId'] || moduleId;
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
            if (typeof id !== 'string' || id === '') {
                throw new TypeError(id + ' Service registration FAILED: ID must be non empty string.');
            }

            if (this.services[id]) {
                throw new TypeError(id + ' Service registration FAILED: a service with such id has been already added.');
            }

            this.services[id] = factory;
            return this;
        }

        /**
         *  Gets a specific service instance by id.
         *  @param {String} id
         *  @returns {*}
         */
        getService(id: string) {
            let service = this.services[id];
            if (!service) {
                throw new ReferenceError(id + ' Service was not found.');
            }

            return service(new spaMVP.Sandbox(this, id));
        }

        private addSubscriber(eventType: string, handler: Function, context?: Object) {
            this.subscribers[eventType] = this.subscribers[eventType] || [];
            this.subscribers[eventType].push({
                handler: handler,
                context: context
            });
        }

        private removeSubscriber(eventType: string, handler: Function, context?: Object) {
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