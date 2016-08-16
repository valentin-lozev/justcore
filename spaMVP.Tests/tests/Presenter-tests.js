/// <reference path="/scripts/jasmine.js" />
/// <reference path="../../spaMVP/src/mvp/view.js" />
/// <reference path="../../spaMVP/src/helpers.js" />
/// <reference path="../../spaMVP/src/mvp/presenter.js" />
/// <reference path="../../spaMVP/src/mvp/model.js" />

describe('Presenter', function () {
    var mockedView = null;

    beforeAll(function () {
        mockedView = new spaMVP.View();
        spyOn(mockedView, 'render');
    });

    it('should trow an error if non View is passed', function () {
        expect(function () { new spaMVP.Presenter({}); }).toThrow();
    });

    it('should trow an error if non Model is passed', function () {
        var presenter = new spaMVP.Presenter(new spaMVP.View());
        
        expect(function () {
            presenter.setModel({});
        }).toThrow();
    });

    it('should set model and subscribe for it', function () {
        var model = new spaMVP.Model();
        var presenter = new spaMVP.Presenter(new spaMVP.View());
        presenter.setModel(model);

        expect(presenter.getModel()).toBe(model);
        expect(model._listeners['change'].length).toBe(1);
        expect(model._listeners['destroy'].length).toBe(1);
    });

    it('should destroy its model and view', function () {
        var model = new spaMVP.Model();
        var presenter = new spaMVP.Presenter(new spaMVP.View());
        presenter.setModel(model);
        presenter.destroy();

        expect(presenter.getModel()).toBeNull();
        expect(presenter.getView()).toBeNull();
        expect(model._listeners['change'].length).toBe(0);
        expect(model._listeners['destroy'].length).toBe(0);
    });

    it('should be able to render its view', function () {
        var model = new spaMVP.Model();
        var presenter = new spaMVP.Presenter(mockedView);
        presenter.setModel(model);
        presenter.render(); 
        
        // TODO: test render result

        expect(mockedView.render).toHaveBeenCalledWith(model);
        expect(mockedView.render.calls.count()).toEqual(2);
    });
});