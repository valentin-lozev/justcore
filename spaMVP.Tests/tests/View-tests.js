/// <reference path="/scripts/jasmine.js" />
/// <reference path="../../spaMVP/lib/uievent.js" />
/// <reference path="../../spaMVP/src/mvp/view.js" />
/// <reference path="../../spaMVP/src/mvp/presenter.js" />
/// <reference path="../../spaMVP/src/helpers.js" />
/// <reference path="../../spaMVP/src/mvp/uievent.js" />

describe('View', function () {
    var TestView = null;
    var testViewInstance = null;

    beforeAll(function () {
        var viewDomNode = document.createElement('div');
        viewDomNode.id = 'mock';
        viewDomNode.dataset.click = 'action';
        viewDomNode.dataset.id = 1;
        document.body.appendChild(viewDomNode);

        TestView = spaMVP._private.subclassFactoryMethod.call(spaMVP.View, function () {
            function TestView(id) {
                TestView.BaseClass.call(this, id);
            }

            TestView.prototype.mapEvents = function () {
                return [{ type: 'click' }];
            };

            return TestView;
        });

        testViewInstance = new TestView('#mock');
    });

    it('should build its html element', function () {
        expect(testViewInstance.render() instanceof Element).toBeTruthy();
    });

    it('should get its presenter', function () {
        var presenter = new spaMVP.Presenter(testViewInstance);
        var expectedPresenter = testViewInstance.getPresenter();
        expect(expectedPresenter).toEqual(presenter);
    });

    it('should map events', function () {
        var result = false;
        testViewInstance.action = function (viewModel, target, ev) {
            result = viewModel.id === '1' &&
                viewModel.click === 'action' &&
                target === this.domNode &&
                ev instanceof Event &&
                arguments.length === 3;
        };
        var presenter = new spaMVP.Presenter(testViewInstance);
        var clickEvent = new Event('click');
        testViewInstance.render().dispatchEvent(clickEvent);

        expect(result).toBeTruthy();
    });

    it('should destroy itself', function () {
        var presenter = new spaMVP.Presenter(testViewInstance);
        testViewInstance.destroy();

        expect(testViewInstance.domNode).toBeNull();
    });
});