/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
describe("Presenter", function () {
    var core = new spaMVP.Core();
    core.useMVP();
    var Book = (function (_super) {
        __extends(Book, _super);
        function Book() {
            _super.call(this);
        }
        return Book;
    }(core.mvp.Model));
    var BookPresenter = (function (_super) {
        __extends(BookPresenter, _super);
        function BookPresenter() {
            _super.call(this);
        }
        BookPresenter.prototype.onBookChanged = function (book) {
            this.calledContext = this;
        };
        return BookPresenter;
    }(core.mvp.Presenter));
    function getPresenter() {
        return new BookPresenter();
    }
    function getView() {
        return new core.mvp.View(document.createElement("div"));
    }
    it("should set view when it is first time init", function () {
        var presenter = getPresenter();
        var view = getView();
        presenter.view = view;
        expect(presenter.view).toBe(view);
    });
    it("should not replace its view when the same is set", function () {
        var presenter = getPresenter();
        var view = getView();
        spyOn(view, "destroy");
        presenter.view = view;
        presenter.view = view;
        expect(view.destroy).not.toHaveBeenCalled();
    });
    it("should destroy its view when a new one is set", function () {
        var presenter = getPresenter();
        var view = getView();
        spyOn(view, "destroy");
        presenter.view = view;
        presenter.view = null;
        expect(presenter.view).toBeNull();
        expect(view.destroy).toHaveBeenCalled();
    });
    it("should map to model when a new one is set", function () {
        var presenter = getPresenter();
        spyOn(presenter, "onBookChanged").and.callThrough();
        presenter.onModel(spaMVP.Hidden.Model.Events.Change, presenter.onBookChanged);
        var book = new Book();
        presenter.model = book;
        book.change();
        expect(presenter.onBookChanged).toHaveBeenCalledWith(book);
        expect(presenter.calledContext).toBe(presenter);
    });
    it("should not replace its model when the same is set", function () {
        var presenter = getPresenter();
        var model = new Book();
        spyOn(model, "off");
        presenter.model = model;
        presenter.model = model;
        expect(model.off).not.toHaveBeenCalled();
    });
    it("should remove mapping from its model when a new one is set", function () {
        var presenter = getPresenter();
        presenter.onModel(spaMVP.Hidden.Model.Events.Change, presenter.onBookChanged);
        var book = new Book();
        spyOn(presenter, "onBookChanged");
        spyOn(book, "off");
        presenter.model = book;
        presenter.model = null;
        book.change();
        expect(presenter.onBookChanged).not.toHaveBeenCalled();
        expect(book.off).toHaveBeenCalled();
    });
    it("should try to render when model is set", function () {
        var presenter = getPresenter();
        spyOn(presenter, "render");
        presenter.model = new Book();
        expect(presenter.render).toHaveBeenCalled();
    });
    it("should render when model and view are defined", function () {
        var presenter = getPresenter();
        var view = getView();
        spyOn(presenter, "render").and.callThrough();
        spyOn(view, "render");
        presenter.view = view;
        presenter.model = new Book();
        expect(presenter.render).toHaveBeenCalled();
        expect(view.render).toHaveBeenCalledWith(presenter.model);
    });
    it("should not render when model is not defined", function () {
        var presenter = getPresenter();
        var view = getView();
        spyOn(view, "render");
        presenter.view = view;
        presenter.render();
        expect(view.render).not.toHaveBeenCalled();
    });
    it("should reset its model and view when destroy", function () {
        var presenter = getPresenter();
        presenter.model = new Book();
        presenter.view = getView();
        presenter.destroy();
        expect(presenter.model).toBeNull();
        expect(presenter.view).toBeNull();
    });
});
//# sourceMappingURL=Presenter-tests.js.map