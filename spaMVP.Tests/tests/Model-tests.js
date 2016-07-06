/// <reference path="/scripts/jasmine.js" />
/// <reference path="../../spaMVP/src/mvp/model.js" />
/// <reference path="../../spaMVP/src/mvp/view.js" />
/// <reference path="../../spaMVP/src/mvp/presenter.js" />

describe('Model', function () {
    it('should have not any listeners if no one is listening for it', function () {
        var model = new spaMVP.Model();
        expect(model._listeners).toBeNull();
    });

    it('should throw an error when listener is not a func', function () {
        var model = new spaMVP.Model();
        expect(function () {
            model.on('change', null, -1);
        }).toThrow();
    });

    it('should have listeners for several events', function () {
        var model = new spaMVP.Model();
        var view = new spaMVP.View();
        var presenter = new spaMVP.Presenter(view);
        var presenter2 = new spaMVP.Presenter(view);
        var action1 = function () { return true; };
        var action2 = function () { return false; };
        var action3 = function () { return false; };

        presenter.setModel(model);
        presenter2.setModel(model);
        model.on('change', action1);
        model.on('change', action2);
        model.on('destroy', action3);

        expect(model._listeners['change'].length).toBe(4);
        expect(model._listeners['destroy'].length).toBe(3);
    });

    it('should have only unique listeners', function () {
        var model = new spaMVP.Model();
        var action1 = function () { return true; };
        var action2 = function () { return false; };
        var presenter = new spaMVP.Presenter(new spaMVP.View());

        model.on('change', action1);
        model.on('change', action2);
        model.on('destroy', action2);
        model.on('destroy', action2); // invalid
        model.on('destroy', action1);
        presenter.setModel(model);
        model.on('change', presenter.onModelChange, presenter); // invalid
        model.on('change', presenter.onModelChange, presenter); // invalid
        model.on('destroy', presenter.onModelDestroy, presenter); // invalid

        expect(model._listeners['change'].length).toBe(3);
        expect(model._listeners['destroy'].length).toBe(3);
    });

    it('should remove properly listeners', function () {
        var model = new spaMVP.Model();
        var action1 = function () { return true; };
        var action2 = function () { return false; };
        model.on('change', action1);
        model.on('change', action2);
        model.off('change', action1);

        expect(model._listeners['change'].length).toBe(1);
        expect(model._listeners['change'][0].handler).toEqual(action2);
    });

    it('should notify its listeners', function () {
        var model = new spaMVP.Model();
        var isCurrentTarget = false;
        var fakeObj = {
            action1: function (ev) {
                isCurrentTarget = ev.currentTarget === model;
            },
            action2: function () {
            }
        };

        spyOn(fakeObj, 'action2');

        model.on('change', fakeObj.action1);
        model.on('change', fakeObj.action2);
        model.notify({ type: 'change' });

        expect(isCurrentTarget).toBeTruthy();
        expect(fakeObj.action2).toHaveBeenCalled();
    });

    it('should notify its listeners with context', function () {
        var model = new spaMVP.Model();
        function Context() {
            this.name = null;
        }
        Context.prototype.setName = function (ev) {
            this.name = ev.type;
        };
        var ctx = new Context();

        model.on('test', ctx.setName, ctx);
        model.notify({ type: 'test' });

        expect(ctx.name).toBe('test');
    });

    it('should destroy itself', function () {
        var model = new spaMVP.Model();
        var fakeObj = {
            onDestroy: function (ev) { }
        };

        spyOn(fakeObj, 'onDestroy');
        model.on('destroy', fakeObj.onDestroy);
        model.destroy();

        expect(fakeObj.onDestroy).toHaveBeenCalled();
    });
});