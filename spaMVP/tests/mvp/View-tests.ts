/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe('View', () => {

    function createDiv() {
        let div = document.createElement('div');
        div.dataset['click'] = 'handleClick';
        let heading = document.createElement('h1');
        let p = document.createElement('p');
        heading.textContent = 'Heading';
        div.appendChild(heading);
        div.appendChild(p);
        return div;
    }

    function template(model: any): string {
        return '<span>' + model.id + '</span>';
    }

    class TestView extends spaMVP.View {
        clickedDataset: DOMStringMap;
        clickedTarget: HTMLElement;
        clickedEvent: Event;

        constructor() {
            super(createDiv(), template);
            this.map('click');
        }

        handleClick(dataset: DOMStringMap, target: HTMLElement, ev: Event) {
            this.clickedDataset = dataset;
            this.clickedTarget = target;
            this.clickedEvent = ev;
        }
    }

    function getView(): TestView {
        return new TestView();
    }

    it('should query its dom element for elements', () => {
        let view = getView();

        let result = view.query('h1');
        let nullElement = view.query('span');

        expect(result.tagName).toEqual('H1');
        expect(nullElement).toBeNull();
    });

    it('should remove element', () => {
        let view = getView();

        view.removeElement('h1');

        expect(view.query('h1')).toBeNull();
    });

    it('should remove all elements', () => {
        let view = getView();

        view.removeAllElements();

        expect(view.domNode.childElementCount).toEqual(0);
    });

    it('should map event to its container', () => {
        let view = getView();

        expect(view.domNode.hasEvent('click')).toBeTruthy();
    });

    it('should map event to custom element', () => {
        let view = getView();

        view.map('click', false, 'h1');

        expect(view.query('h1').hasEvent('click')).toBeTruthy();
    });

    it('should handle mapped event', () => {
        let view = getView();
        spyOn(view, 'handleClick').and.callThrough();

        let ev = new Event('click');
        view.domNode.dispatchEvent(ev);

        expect(view.handleClick).toHaveBeenCalled();
        expect(view.clickedDataset).toBe(view.domNode.dataset);
        expect(view.clickedTarget).toBe(view.domNode);
        expect(view.clickedEvent).toBe(ev);
    });

    it('should remove any children and events when destroy', () => {
        let view = getView();
        spyOn(view, 'handleClick');
        let domNode = view.domNode;

        view.destroy();
        domNode.dispatchEvent(new Event('click'));

        expect(view.handleClick).not.toHaveBeenCalled();
        expect(view.domNode).toBeNull();
        expect(domNode.childElementCount).toEqual(0);
        expect(domNode.hasEvent('click')).toBeFalsy();
    });

    it('should return its dom node when render', () => {
        let view = getView();

        expect(view.render({})).toBe(view.domNode);
    });

    it('should render span when template action is executed', () => {
        let view = getView();

        view.render({ id: 10 });

        expect(view.domNode.innerText).toEqual('10');
        expect(view.domNode.firstElementChild.nodeName).toEqual('SPAN');
    });

    it('should support chaining for all methods that return nothing', () => {
        let view = getView();

        let chaining = () => {
            view.map('change')
                .removeElement('div')
                .removeAllElements()
                .destroy();
        };

        expect(chaining).not.toThrow();
    });
});