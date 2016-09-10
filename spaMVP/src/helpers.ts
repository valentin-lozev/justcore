namespace spaMVP {

    // Polyfill for older browsers
    if (typeof Object.create !== 'function') {
        Object.create = function (o) {
            function F() { }
            F.prototype = o;
            return new F();
        };
    }

    function subclass(inheritor): Function {
        let BaseClass = this;
        let prototype = inheritor.prototype;

        inheritor.prototype = Object.create(BaseClass.prototype);
        extend(inheritor.prototype, prototype);
        inheritor.prototype.constructor = inheritor;

        inheritor.BaseClass = BaseClass;
        inheritor.subclass = subclassFactory;
        return inheritor;
    }    

    export function subclassFactory(getInheritorFunc: () => Function): Function {
        let inheritor = getInheritorFunc();
        if (!inheritor || typeof inheritor !== 'function') {
            throw new Error('Inheritor\'s function constructor must be supplied.');
        }

        return subclass.call(this, inheritor);
    }

    export function extend(target, object) {
        for (let prop in object) {
            if (object[prop]) {
                target[prop] = object[prop];
            }
        }
    }
}