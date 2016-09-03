/// <reference path="/scripts/jasmine.js" />
/// <reference path="../../spaMVP/src/mvp/model.js" />
/// <reference path="../../spaMVP/src/mvp/hashSet.js" />
/// <reference path="../../spaMVP/src/mvp/collection.js" />

describe('Collection', function () {
    it('should be instance of Model', function () {
        var collection = new spaMVP.Collection();
        expect(collection instanceof spaMVP.Model).toBeTruthy();
    });

    it('should throw an error if add non Model', function () {
        var collection = new spaMVP.Collection();
        var invalidModel = {};
        expect(function () { collection.add(invalidModel); }).toThrow();
    });

    it('should add one item and subscribe for it', function () {
        var collection = new spaMVP.Collection();
        var model = new spaMVP.Model();
        var result = collection.add(model);

        expect(result).toBeTruthy();
        expect(collection.models.size).toBe(1);
        expect(model._listeners['change'][0].context === collection).toBeTruthy();
    });

    it('should add several unique items', function () {
        var collection = new spaMVP.Collection();
        var model = new spaMVP.Model();
        var model2 = new spaMVP.Model();
        var model3 = new spaMVP.Model();

        result = collection.add(model);
        result = collection.add(model2);
        result = collection.add(model3);
        result = collection.add(model);
        result = collection.add(model2);

        expect(collection.models.size).toBe(3);
    });

    it('should remove items and unsubscribe from them', function () {
        var collection = new spaMVP.Collection();
        var model = new spaMVP.Model();
        var model2 = new spaMVP.Model();
        var model3 = new spaMVP.Model();
        collection.addRange([model, model2, model3]);

        collection.remove(model);
        collection.remove(model2);
        collection.remove(model3);

        expect(collection.models.size).toBe(0);
        expect(model._listeners['change'].length).toBe(0);
        expect(model2._listeners['change'].length).toBe(0);
        expect(model3._listeners['change'].length).toBe(0);
    });

    it('should clear its items and unsubscrube from them', function () {
        var collection = new spaMVP.Collection();
        var model = new spaMVP.Model();
        var model2 = new spaMVP.Model();
        var model3 = new spaMVP.Model();
        collection.addRange([model, model2, model3]);
        collection.clear();

        expect(collection.models.size).toBe(0);
        expect(model._listeners['change'].length).toBe(0);
        expect(model2._listeners['change'].length).toBe(0);
        expect(model3._listeners['change'].length).toBe(0);
    });

    it('should return its items as array', function () {
        var collection = new spaMVP.Collection();
        var model = new spaMVP.Model();
        var model2 = new spaMVP.Model();
        var model3 = new spaMVP.Model();
        collection.addRange([model, model2, model3]);

        var arr = collection.toArray();

        expect(arr instanceof Array).toBeTruthy();
        expect(arr.length).toBe(3);
    });

    it('should iterrate over its items', function () {
        var collection = new spaMVP.Collection();
        var model = new spaMVP.Model();
        var model2 = new spaMVP.Model();
        var model3 = new spaMVP.Model();
        var result = true;
        collection.addRange([model, model2, model3]);

        var iterator = 0;
        collection.forEach(function (item, index) {
            if (!item || typeof index === 'undefined') {
                result = false;
            }

            iterator++;
        });

        expect(iterator).toBe(3);
        expect(result).toBeTruthy();
    });

    it('should notify for added items', function () {
        var result = false;
        var subscriber = {
            action: function (ev) {
                result = ev.addedTargets.length === 2;
            }
        };
        var collection = new spaMVP.Collection();
        collection.on('change', subscriber.action, subscriber);
        var model = new spaMVP.Model();
        var model2 = new spaMVP.Model();

        collection.addRange([model, model2]);

        expect(result).toBeTruthy();
    });

    it('should notify for updated item', function () {
        var result = false;
        var model = new spaMVP.Model();
        var subscriber = {
            action: function (ev) {
                result = ev.updatedTargets.length === 1 &&
                    ev.updatedTargets[0] === model;
            }
        };
        var collection = new spaMVP.Collection();
        collection.add(model);
        collection.on('change', subscriber.action, subscriber);

        model.notify({ type: 'change' });

        expect(result).toBeTruthy();
    });

    it('should notify for removed item', function () {
        var result = false;
        var model = new spaMVP.Model();
        var subscriber = {
            action: function (ev) {
                result = ev.deletedTargets.length === 1 &&
                    ev.deletedTargets[0] === model;
            }
        };
        var collection = new spaMVP.Collection();
        collection.add(model);
        collection.on('change', subscriber.action, subscriber);

        model.destroy();

        expect(result).toBeTruthy();
    });

    it('should return false when does not constain given item', function () {
        var collection = new spaMVP.Collection();
        var model = new spaMVP.Model();

        expect(collection.contains(model)).toBeFalsy();
    });

    it('should return true when constains given item', function () {
        var collection = new spaMVP.Collection();
        var model = new spaMVP.Model();

        collection.add(model);

        expect(collection.contains(model)).toBeTruthy();
    });

    it('should return false when constains no items', function () {
        var collection = new spaMVP.Collection();

        expect(collection.any()).toBeFalsy();
    });

    it('should return true when constains at least one item', function () {
        var collection = new spaMVP.Collection();
        var model = new spaMVP.Model();

        collection.add(model);

        expect(collection.any()).toBeTruthy();
    });
});