namespace spaMVP {
    "use strict";

    import routing = plugins.routing;

    export interface Core {
        useRouting(): void;
        routing: routing.RoutingPlugin;
    }

    Core.prototype.useRouting = function (): void {
        let that = <Core>this;
        if (that.routing) {
            return;
        }

        that.routing = new routing.RouteConfig();

        that.hook(spaMVP.HookType.SPA_DOMReady, () => {
            if (!that.routing.hasRoutes()) {
                return;
            }

            let global = window;
            that.routing.startRoute(global.location.hash.substring(1));

            global.addEventListener("hashchange", () => {
                that.routing.startRoute(global.location.hash.substring(1));
            });
        });
    };
}