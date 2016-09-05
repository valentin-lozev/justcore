/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
describe('Model', function () {
    var TestModel = (function (_super) {
        __extends(TestModel, _super);
        function TestModel() {
            _super.call(this);
        }
        return TestModel;
    }(spaMVP.Model));
    beforeAll(function () {
    });
    beforeEach(function () {
    });
    it('should not accept listener when event type is invalid string', function () {
        var model = new TestModel();
        var spy = jasmine.createSpyObj('spy', ['listener']);
        expect(model.on('', spy.listener)).toBeFalsy();
        expect(model.on(null, spy.listener)).toBeFalsy();
        expect(model.on(undefined, spy.listener)).toBeFalsy();
    });
    it('should accept listener when event type is valid string', function () {
        var model = new TestModel();
        var spy = jasmine.createSpyObj('spy', ['listener']);
        expect(model.on('change', spy.listener)).toBeTruthy();
    });
    it('should notify without data when there is attached listener', function () {
        var model = new TestModel();
        var spy = jasmine.createSpyObj('spy', ['listener']);
        var event = 'something';
        model.on(event, spy.listener);
        model.notify(event);
        expect(spy.listener).toHaveBeenCalledWith(undefined);
    });
    it('should notify with data when there is attached listener', function () {
        var model = new TestModel();
        var spy = jasmine.createSpyObj('spy', ['listener']);
        var event = 'something';
        model.on(event, spy.listener);
        model.notify(event, 8);
        expect(spy.listener).toHaveBeenCalledWith(8);
    });
    it('should notify when there is attached listener with given context', function () {
        var model = new TestModel();
        var context = null;
        var action = function () { context = this; };
        var event = 'something';
        model.on(event, action, model);
        model.notify(event);
        expect(context).toBe(model);
    });
    it('should notify when having multiple listeners', function () {
        var model = new TestModel();
        var spy = jasmine.createSpyObj('spy', ['save', 'remove', 'insert']);
        var event = 'something';
        model.on(event, spy.save);
        model.on(event, spy.remove);
        model.on(event, spy.insert);
        model.notify(event);
        expect(spy.save).toHaveBeenCalledTimes(1);
        expect(spy.remove).toHaveBeenCalledTimes(1);
        expect(spy.insert).toHaveBeenCalledTimes(1);
    });
    it('should notify for change with specific string and data', function () {
        var model = new TestModel();
        var spy = jasmine.createSpyObj('spy', ['handler']);
        model.on(spaMVP.ModelEvents.Change, spy.handler);
        model.change();
        expect(spy.handler).toHaveBeenCalledWith(model);
    });
    it('should notify for destroy with specific string and data', function () {
        var model = new TestModel();
        var spy = jasmine.createSpyObj('spy', ['handler']);
        model.on(spaMVP.ModelEvents.Destroy, spy.handler);
        model.destroy();
        expect(spy.handler).toHaveBeenCalledWith(model);
    });
    it('should return false when try to detach unattached listener', function () {
        var model = new TestModel();
        var result = model.off(spaMVP.ModelEvents.Change, function () { return -1; });
        expect(result).toBeFalsy();
    });
    it('should return true when successfully detach a listener', function () {
        var model = new TestModel();
        var spy = jasmine.createSpyObj('spy', ['handler']);
        model.on(spaMVP.ModelEvents.Change, spy.handler);
        var result = model.off(spaMVP.ModelEvents.Change, spy.handler);
        expect(result).toBeTruthy();
    });
    it('should return true when successfully detach a listener passed with given context', function () {
        var model = new TestModel();
        var spy = jasmine.createSpyObj('spy', ['handler']);
        model.on(spaMVP.ModelEvents.Change, spy.handler, model);
        var falsyResult = model.off(spaMVP.ModelEvents.Change, spy.handler);
        var result = model.off(spaMVP.ModelEvents.Change, spy.handler, model);
        expect(falsyResult).toBeFalsy();
        expect(result).toBeTruthy();
    });
    it('should not invoke already detached listener', function () {
        var model = new TestModel();
        var spy = jasmine.createSpyObj('spy', ['handler']);
        model.on(spaMVP.ModelEvents.Change, spy.handler);
        var result = model.off(spaMVP.ModelEvents.Change, spy.handler);
        model.change();
        expect(result).toBeTruthy();
        expect(spy.handler).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=Model-tests.js.map