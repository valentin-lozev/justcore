/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
describe("View", function () {
    var core = new spaMVP.Core();
    core.useMVP();
    function createDiv() {
        var div = document.createElement("div");
        div.dataset["click"] = "handleClick";
        var heading = document.createElement("h1");
        var p = document.createElement("p");
        heading.textContent = "Heading";
        div.appendChild(heading);
        div.appendChild(p);
        return div;
    }
    function template(model) {
        return "<span>" + model.id + "</span>";
    }
    var TestView = (function (_super) {
        __extends(TestView, _super);
        function TestView() {
            _super.call(this, createDiv(), template);
            this.map("click");
        }
        TestView.prototype.handleClick = function (dataset, target, ev) {
            this.clickedDataset = dataset;
            this.clickedTarget = target;
            this.clickedEvent = ev;
        };
        return TestView;
    }(core.mvp.View));
    function getView() {
        return new TestView();
    }
    it("should query its dom element for elements", function () {
        var view = getView();
        var result = view.query("h1");
        var nullElement = view.query("span");
        expect(result.tagName).toEqual("H1");
        expect(nullElement).toBeNull();
    });
    it("should remove element", function () {
        var view = getView();
        view.removeElement("h1");
        expect(view.query("h1")).toBeNull();
    });
    it("should remove all elements", function () {
        var view = getView();
        view.removeAllElements();
        expect(view.domNode.childElementCount).toEqual(0);
    });
    it("should map event to its container", function () {
        var view = getView();
        expect(view.domNode.hasEvent("click")).toBeTruthy();
    });
    it("should map event to custom element", function () {
        var view = getView();
        view.map("click", false, "h1");
        expect(view.query("h1").hasEvent("click")).toBeTruthy();
    });
    it("should handle mapped event", function () {
        var view = getView();
        spyOn(view, "handleClick").and.callThrough();
        var ev = new Event("click");
        view.domNode.dispatchEvent(ev);
        expect(view.handleClick).toHaveBeenCalled();
        expect(view.clickedDataset).toBe(view.domNode.dataset);
        expect(view.clickedTarget).toBe(view.domNode);
        expect(view.clickedEvent).toBe(ev);
    });
    it("should remove any children and events when destroy", function () {
        var view = getView();
        spyOn(view, "handleClick");
        var domNode = view.domNode;
        view.destroy();
        domNode.dispatchEvent(new Event("click"));
        expect(view.handleClick).not.toHaveBeenCalled();
        expect(view.domNode).toBeNull();
        expect(domNode.childElementCount).toEqual(0);
        expect(domNode.hasEvent("click")).toBeFalsy();
    });
    it("should return its dom node when render", function () {
        var view = getView();
        expect(view.render({})).toBe(view.domNode);
    });
    it("should render span when template action is executed", function () {
        var view = getView();
        view.render({ id: 10 });
        expect(view.domNode.innerText).toEqual("10");
        expect(view.domNode.firstElementChild.nodeName).toEqual("SPAN");
    });
    it("should support chaining for all methods that return nothing", function () {
        var view = getView();
        var chaining = function () {
            view.map("change")
                .removeElement("div")
                .removeAllElements()
                .destroy();
        };
        expect(chaining).not.toThrow();
    });
});
//# sourceMappingURL=View-tests.js.map