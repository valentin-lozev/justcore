/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />


describe('Presenter', () => {

    class Book extends spaMVP.Model {
        constructor() {
            super();
        }
    }

    class BookPresenter extends spaMVP.Presenter<spaMVP.View, Book> {
        calledContext: any;
        constructor() {
            super();
        }

        onBookChanged(book: Book) {
            this.calledContext = this;
        }
    }

    function getPresenter(): BookPresenter {
        return new BookPresenter();
    }

    function getView(): spaMVP.View {
        return new spaMVP.View(document.createElement('div'));
    }

    it('should set view when it is first time init', () => {
        let presenter = getPresenter();
        let view = getView();

        presenter.view = view;

        expect(presenter.view).toBe(view);
    });

    it('should not replace its view when the same is set', () => {
        let presenter = getPresenter();
        let view = getView();
        spyOn(view, 'destroy');

        presenter.view = view;
        presenter.view = view;

        expect(view.destroy).not.toHaveBeenCalled();
    });

    it('should destroy its view when a new one is set', () => {
        let presenter = getPresenter();
        let view = getView();
        spyOn(view, 'destroy');
        presenter.view = view;

        presenter.view = null;

        expect(presenter.view).toBeNull();
        expect(view.destroy).toHaveBeenCalled();
    });

    it('should map to model when a new one is set', () => {
        let presenter = getPresenter();
        spyOn(presenter, 'onBookChanged').and.callThrough();
        presenter.onModel(spaMVP.ModelEvents.Change, presenter.onBookChanged);
        let book = new Book();

        presenter.model = book;
        book.change();

        expect(presenter.onBookChanged).toHaveBeenCalledWith(book);
        expect(presenter.calledContext).toBe(presenter);
    });

    it('should not replace its model when the same is set', () => {
        let presenter = getPresenter();
        let model = new Book();
        spyOn(model, 'off');

        presenter.model = model;
        presenter.model = model;

        expect(model.off).not.toHaveBeenCalled();
    });

    it('should remove mapping from its model when a new one is set', () => {
        let presenter = getPresenter();
        presenter.onModel(spaMVP.ModelEvents.Change, presenter.onBookChanged);
        let book = new Book();
        spyOn(presenter, 'onBookChanged');
        spyOn(book, 'off');

        presenter.model = book;
        presenter.model = null;
        book.change();

        expect(presenter.onBookChanged).not.toHaveBeenCalled();
        expect(book.off).toHaveBeenCalled();
    });

    it('should try to render when model is set', () => {
        let presenter = getPresenter();
        spyOn(presenter, 'render');

        presenter.model = new Book();

        expect(presenter.render).toHaveBeenCalled();
    });

    it('should render when model and view are defined', () => {
        let presenter = getPresenter();
        let view = getView();
        spyOn(presenter, 'render').and.callThrough();
        spyOn(view, 'render');

        presenter.view = view;
        presenter.model = new Book();

        expect(presenter.render).toHaveBeenCalled();
        expect(view.render).toHaveBeenCalledWith(presenter.model);
    });

    it('should not render when model is not defined', () => {
        let presenter = getPresenter();
        let view = getView();
        spyOn(view, 'render');
        presenter.view = view;

        presenter.render();

        expect(view.render).not.toHaveBeenCalled();
    });

    it('should reset its model and view when destroy', () => {
        let presenter = getPresenter();
        presenter.model = new Book();
        presenter.view = getView();

        presenter.destroy();

        expect(presenter.model).toBeNull();
        expect(presenter.view).toBeNull();
    });
});