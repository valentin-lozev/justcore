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
        if (this._template) {
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
            return;
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