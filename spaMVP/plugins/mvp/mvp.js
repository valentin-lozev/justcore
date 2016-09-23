var spaMVP;
(function (spaMVP) {
    "use strict";
    var hidden = spaMVP.Hidden;
    spaMVP.Core.prototype.useMVP = function () {
        var that = this;
        if (that.mvp) {
            return;
        }
        var mvp = {
            Model: hidden.Model,
            Collection: hidden.Collection,
            View: hidden.View,
            Presenter: hidden.Presenter,
        };
        that.mvp = mvp;
    };
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=mvp.js.map