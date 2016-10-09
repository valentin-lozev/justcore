interface MVPView {
    render(model: any): HTMLElement;
    destroy(): void;
}

namespace spaMVP.plugins.mvp {
    "use strict";

    function eventHandler(ev: Event): void {
        let target = <HTMLElement>ev.target;
        let dataset = target.dataset;
        if (!dataset.hasOwnProperty(ev.type)) {
            return;
        }

        let callbackName = dataset[ev.type];
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
    export class View implements MVPView {
        private _domNode: HTMLElement;
        private template: (model: any) => string;

        constructor(domNode: HTMLElement, template?: (model: any) => string) {
            if (!domNode) {
                throw new Error("Dom node cannot be null.");
            }

            this._domNode = domNode;
            this.template = template;
        }

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
            UIEvent({
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
            if (this.template) {
                this.domNode.innerHTML = this.template.call(this, model);
            }

            return this.domNode;
        }

        /**
         *  Removes all elements and mapped events.
         */
        destroy(): this {
            if (typeof this.domNode.detach === "function") {
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