var spaMVP;
(function (spaMVP) {
    "use strict";
    function eventHandler(ev) {
        var target = ev.target;
        var dataset = target.dataset;
        if (!dataset.hasOwnProperty(ev.type)) {
            return;
        }
        var callbackName = dataset[ev.type];
        if (typeof this[callbackName] === "function") {
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
            spaMVP.UIEvent({
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
            if (typeof this.domNode.detach === "function") {
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