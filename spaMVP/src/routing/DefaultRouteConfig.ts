namespace spaMVP {
    "use strict";

    /**
     *  @class RouteConfig - Handles spa application route changes.
     */
    export class DefaultRouteConfig implements RouteConfig {
        private routes: Route[] = [];
        private urlHash: UrlHash = new UrlHash();
        public defaultUrl: string = null;

        /**
         *  Registers a route by given url pattern.
         *  When url's hash is changed it executes a callback with populated dynamic routes and query parameters.
         *  Dynamic route param can be registered with {yourParam}.
         */
        registerRoute(pattern: string, callback: (routeParams: any) => void): void {
            if (this.routes.some(r => r.pattern === pattern)) {
                throw new Error("Route " + pattern + " has been already registered.");
            }

            this.routes.push(new Route(pattern, callback));
        }

        /**
         *  Starts hash url if such is registered, if not, it starts the default one.
         */
        startRoute(hash: string): void {
            this.urlHash.value = hash;
            let nextRoute = this.findRoute();
            if (nextRoute) {
                nextRoute.start(this.urlHash);
                return;
            }

            if (this.defaultUrl) {
                this.startDefaultRoute(hash);
            } else {
                console.warn("No route handler for " + hash);
            }
        }

        /**
         *  Returns all registered patterns.
         */
        getRoutes(): string[] {
            return this.routes.map(route => route.pattern);
        }

        /**
         *  Determines if there are any registered routes.
         */
        hasRoutes(): boolean {
            return this.routes.length > 0;
        }

        private findRoute(): Route {
            for (let i = 0, len = this.routes.length; i < len; i++) {
                let route = this.routes[i];
                if (route.equals(this.urlHash)) {
                    return route;
                }
            }

            return null;
        }

        private startDefaultRoute(invalidHash: string): void {
            window.history.replaceState(
                null,
                null,
                window.location.pathname + "#" + this.defaultUrl
            );

            this.urlHash.value = this.defaultUrl;
            let nextRoute = this.findRoute();
            if (nextRoute) {
                nextRoute.start(this.urlHash);
            } else {
                console.warn("No route handler for " + invalidHash);
            }
        }
    }
}