var spaMVP;
(function (spaMVP) {
    /**
     *  @class RouteConfig - Handles spa application route changes.
     */
    var RouteConfig = (function () {
        function RouteConfig() {
            this.routes = [];
            this.urlHash = new spaMVP.UrlHash();
            this.defaultUrl = null;
        }
        /**
         *  Registers a route by given url pattern.
         *  When url's hash is changed it executes a callback with populated dynamic routes and query parameters.
         *  Dynamic route param can be registered with {yourParam}.
         */
        RouteConfig.prototype.registerRoute = function (pattern, callback) {
            if (this.routes.some(function (r) { return r.pattern === pattern; })) {
                throw new Error('Route ' + pattern + ' has been already registered.');
            }
            this.routes.push(new spaMVP.Route(pattern, callback));
        };
        /**
         *  Starts hash url if such is registered, if not, it starts the default one.
         */
        RouteConfig.prototype.startRoute = function (hash) {
            this.urlHash.value = hash;
            var nextRoute = this.findRoute();
            if (nextRoute) {
                nextRoute.start(this.urlHash);
                return;
            }
            if (this.defaultUrl) {
                this.startDefaultRoute(hash);
            }
            else {
                console.warn("No route handler for " + hash);
            }
        };
        /**
         *  Returns all registered patterns.
         */
        RouteConfig.prototype.getRoutes = function () {
            return this.routes.map(function (route) { return route.pattern; });
        };
        /**
         *  Determines if there are any registered routes.
         */
        RouteConfig.prototype.hasRoutes = function () {
            return this.routes.length > 0;
        };
        RouteConfig.prototype.findRoute = function () {
            for (var i = 0, len = this.routes.length; i < len; i++) {
                var route = this.routes[i];
                if (route.equals(this.urlHash)) {
                    return route;
                }
            }
            return null;
        };
        RouteConfig.prototype.startDefaultRoute = function (invalidHash) {
            window.history.replaceState(null, null, window.location.pathname + '#' + this.defaultUrl);
            this.urlHash.value = this.defaultUrl;
            var nextRoute = this.findRoute();
            if (nextRoute) {
                nextRoute.start(this.urlHash);
            }
            else {
                console.warn("No route handler for " + invalidHash);
            }
        };
        return RouteConfig;
    }());
    spaMVP.RouteConfig = RouteConfig;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=RouteConfig.js.map