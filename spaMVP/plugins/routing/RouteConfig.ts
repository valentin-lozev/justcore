namespace spaMVP.plugins.routing {
    "use strict";

    function findRoute(): Route {
        for (let i = 0, len = this.routes.length; i < len; i++) {
            let route = this.routes[i];
            if (route.equals(this.urlHash)) {
                return route;
            }
        }

        return null;
    }

    function startDefaultRoute(invalidHash: string): void {
        window.history.replaceState(
            null,
            null,
            window.location.pathname + "#" + this.defaultUrl
        );

        this.urlHash.value = this.defaultUrl;
        let nextRoute = findRoute.call(this);
        if (nextRoute) {
            nextRoute.start(this.urlHash);
        } else {
            console.warn("No route handler for " + invalidHash);
        }
    }

    export interface RoutingPlugin {
        defaultUrl: string;
        register(pattern: string, callback: (routeParams: any) => void): this;
        startRoute(hash: string): void;
        getRoutes(): string[];
        hasRoutes(): boolean;
    }

    /**
     *  @class RouteConfig - Handles window hash change.
     */
    export class RouteConfig implements RoutingPlugin {
        private routes: Route[] = [];
        private urlHash: UrlHash = new UrlHash();
        public defaultUrl: string = null;

        /**
         *  Registers a route by given url pattern.
         *  When url's hash is changed it executes a callback with populated dynamic routes and query parameters.
         *  Dynamic route param can be registered with {yourParam}.
         */
        register(pattern: string, callback: (routeParams: any) => void): this {
            if (this.routes.some(r => r.pattern === pattern)) {
                throw new Error("Route " + pattern + " has been already registered.");
            }

            this.routes.push(new Route(pattern, callback));
            return this;
        }

        /**
         *  Starts hash url if such is registered, if not, it starts the default one.
         */
        startRoute(hash: string): void {
            this.urlHash.value = hash;
            let nextRoute = findRoute.call(this);
            if (nextRoute) {
                nextRoute.start(this.urlHash);
                return;
            }

            if (typeof this.defaultUrl === "string") {
                startDefaultRoute.call(this, hash);
            } else {
                console.warn("No route matches " + hash);
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
    }
}