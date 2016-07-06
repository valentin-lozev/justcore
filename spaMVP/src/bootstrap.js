var spaMVP = (function (spaMVP)
{
    'use strict';

    var _private = spaMVP._private;

    spaMVP.Model.subclass =
    spaMVP.View.subclass =
    spaMVP.Presenter.subclass =
    spaMVP.Collection.subclass = _private.subclassFactoryMethod;
    spaMVP.createAppCore = function ()
    {
        return new _private.Core();
    };

    delete spaMVP._private;
    return spaMVP;

}(spaMVP));