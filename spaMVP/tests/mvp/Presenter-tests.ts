/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe("Presenter", () => {

    let mvp = spaMVP.plugins.mvp;
    let core = new spaMVP.Core();
    core.useMVP();

    class Book extends core.mvp.Model {
        constructor() {
            super();
        }
    }

    class BookPresenter extends core.mvp.Presenter<spaMVP.plugins.mvp.View, Book> {
        calledContext: any;
        constructor() {
            super();
        }

        onBookChanged(book: Book): void {
            this.calledContext = this;
        }
    }

    function getPresenter(): BookPresenter {
        return new BookPresenter();
    }

    function getView(): spaMVP.plugins.mvp.View {
        return new core.mvp.View(document.createElement("div"));
    }

    it("should set view when it is first time init", () => {
        let presenter = getPresenter();
        let view = getView();

        presenter.view = view;

        expect(presenter.view).toBe(view);
    });

    it("should not replace its view when the same is set", () => {
        let presenter = getPresenter();
        let view = getView();
        spyOn(view, "destroy");

        presenter.view = view;
        presenter.view = view;

        expect(view.destroy).not.toHaveBeenCalled();
    });

    it("should destroy its view when a new one is set", () => {
        let presenter = getPresenter();
        let view = getView();
        spyOn(view, "destroy");
        presenter.view = view;

        presenter.view = null;

        expect(presenter.view).toBeNull();
        expect(view.destroy).toHaveBeenCalled();
    });

    it("should map to model when a new one is set", () => {
        let presenter = getPresenter();
        spyOn(presenter, "onBookChanged").and.callThrough();
        presenter.onModel(mvp.ModelEvents.Change, presenter.onBookChanged);
        let book = new Book();

        presenter.model = book;
        book.change();

        expect(presenter.onBookChanged).toHaveBeenCalledWith(book);
        expect(presenter.calledContext).toBe(presenter);
    });

    it("should not replace its model when the same is set", () => {
        let presenter = getPresenter();
        let model = new Book();
        spyOn(model, "off");

        presenter.model = model;
        presenter.model = model;

        expect(model.off).not.toHaveBeenCalled();
    });

    it("should remove mapping from its model when a new one is set", () => {
        let presenter = getPresenter();
        presenter.onModel(mvp.ModelEvents.Change, presenter.onBookChanged);
        let book = new Book();
        spyOn(presenter, "onBookChanged");
        spyOn(book, "off");

        presenter.model = book;
        presenter.model = null;
        book.change();

        expect(presenter.onBookChanged).not.toHaveBeenCalled();
        expect(book.off).toHaveBeenCalled();
    });

    it("should try to render when model is set", () => {
        let presenter = getPresenter();
        spyOn(presenter, "render");

        presenter.model = new Book();

        expect(presenter.render).toHaveBeenCalled();
    });

    it("should render when view is defined", () => {
        let presenter = getPresenter();
        presenter.view = getView();
        spyOn(presenter, "render").and.callThrough();
        spyOn(presenter.view, "render");

        presenter.model = new Book();

        expect(presenter.render).toHaveBeenCalled();
        expect(presenter.view.render).toHaveBeenCalledWith(presenter.model);
    });

    it("should return view's dom node when render", () => {
        let presenter = getPresenter();
        presenter.view = getView();
        presenter.model = new Book();
        spyOn(presenter, "render").and.callThrough();

        let result = presenter.render();

        expect(result).toBe(presenter.render());
    });

    it("should not render when view is not defined", () => {
        let presenter = getPresenter();

        expect(presenter.render()).toBeNull();
    });

    it("should reset its model and view when destroy", () => {
        let presenter = getPresenter();
        presenter.model = new Book();
        presenter.view = getView();

        presenter.destroy();

        expect(presenter.model).toBeNull();
        expect(presenter.view).toBeNull();
    });
});