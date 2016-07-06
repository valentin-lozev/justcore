var spaMVP = (function (spaMVP) {

    function subclassFactory(getInheritorFunc) {
        var inheritor = getInheritorFunc();
        if (!inheritor || typeof inheritor !== 'function') {
            throw new Error('Inheritor\'s function constructor must be supplied.');
        }

        return subclass.call(this, inheritor);
    }

    function subclass(inheritor) {
        // Polyfill for older browsers
        if (typeof Object.create !== 'function') {
            Object.create = function (o) {
                function F() { }
                F.prototype = o;
                return new F();
            };
        }

        var BaseClass = this;

        var prototype = inheritor.prototype;
        inheritor.prototype = Object.create(BaseClass.prototype);
        extend(inheritor.prototype, prototype);
        inheritor.prototype.constructor = inheritor;

        inheritor.BaseClass = BaseClass;
        inheritor.subclass = subclassFactory;
        return inheritor;
    }

    function extend(target, object) {
        for (var prop in object) {
            if (object[prop]) {
                target[prop] = object[prop];
            }
        }
    }

    spaMVP._private = spaMVP._private || {};
    spaMVP._private.subclassFactoryMethod = subclassFactory;
    return spaMVP;

}(spaMVP || {}));
