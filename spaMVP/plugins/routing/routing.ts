namespace spaMVP {
    "use strict";

    import hidden = spaMVP.Hidden;

    export interface Core {
        useRouting(): void;
        routing: hidden.RoutingPlugin;
    }

    Core.prototype.useRouting = function (): void {
        let that = <Core>this;
        if (that.routing) {
            return;
        }

        that.routing = new hidden.RouteConfig();

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