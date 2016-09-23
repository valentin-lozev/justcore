var spaMVP;
(function (spaMVP) {
    "use strict";
    var hidden = spaMVP.Hidden;
    spaMVP.Core.prototype.useRouting = function () {
        var that = this;
        if (that.routing) {
            return;
        }
        that.routing = new hidden.RouteConfig();
        that.hook(spaMVP.HookType.SPA_DOMReady, function () {
            if (!that.routing.hasRoutes()) {
                return;
            }
            var global = window;
            that.routing.startRoute(global.location.hash.substring(1));
            global.addEventListener("hashchange", function () {
                that.routing.startRoute(global.location.hash.substring(1));
            });
        });
    };
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=routing.js.map