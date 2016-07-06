var spaMVP = (function (spaMVP) {
    var routeManagerInstance = null,
        routeParamRegex = null,
        routes = null,
        cachedHashUrl = null;

    function init() {
        routeParamRegex = /{([a-zA-Z]+)}/; // e.g {id}
        routes = [];
        routeManagerInstance = new RouteManager();
        window.addEventListener('hashchange', onHashChanged);
    }

    function onHashChanged() {
        routeManagerInstance.startRoute(window.location.hash.substring(1));
    }

    function findRouteByUrl(hashUrl) {
        for (var i = 0, len = routes.length; i < len; i++) {
            var route = routes[i];
            if (route.equals(hashUrl)) {
                return route;
            }
        }

        return null;
    }

    function HashUrl()
    {
    }

    HashUrl.create = function (url) {
        if (!cachedHashUrl) {
            cachedHashUrl = new HashUrl();
        }

        cachedHashUrl.init(url);
        return cachedHashUrl;
    };

    HashUrl.prototype.init = function (url) {
        this.value = url;
        this.questionMarkIndex = url.indexOf('?');
        this.queryParams = [];
        this.tokens = [];
        this.extractQueryParams();
        this.extractTokens();
    };

    HashUrl.prototype.extractQueryParams = function () {
        var hasQueryParams = this.questionMarkIndex > -1;
        if (!hasQueryParams) {
            return;
        }

        this.queryParams = this.value
            .substring(this.questionMarkIndex + 1)
            .split('&')
            .map(function (keyValuePairString) {
                return this.getQueryParamFromString(keyValuePairString);
            }, this);
    };

    HashUrl.prototype.getQueryParamFromString = function (keyValuePairString) {
        keyValuePairString = keyValuePairString.split('=');
        return {
            key: keyValuePairString[0],
            value: keyValuePairString[1]
        };
    };

    HashUrl.prototype.extractTokens = function () {
        this.removeQueryString();

        if (this.value === '' || this.value === '/') {
            this.tokens = ['/'];
            return;
        }

        this.tokens = this.value
            .split('/')
            .map(function (urlFragment) {
                return this.parseToken(urlFragment);
            }, this);
    };

    HashUrl.prototype.removeQueryString = function () {
        var hasQueryParams = this.questionMarkIndex > -1;
        if (!hasQueryParams) {
            return;
        }

        this.value = this.value.substring(0, this.value.length - (this.value.length - this.questionMarkIndex));
    };

    HashUrl.prototype.parseToken = function (urlFragment) {
        return urlFragment || '/';
    };

    function Route(pattern, callback) {
        this.pattern = pattern;
        this.callback = callback;
        this.tokens = [];
        this.extractTokens();
    }

    Route.prototype.extractTokens = function () {
        if (this.pattern === '/' || this.pattern === '') {
            this.tokens = ['/'];
            return;
        }

        this.tokens = this.pattern
            .split('/')
            .map(function (urlFragment) {
                return this.parseToken(urlFragment);
            }, this);
    };

    Route.prototype.parseToken = function (urlFragment) {
        var paramMatchGroups = routeParamRegex.exec(urlFragment);
        if (paramMatchGroups) {
            return {
                name: paramMatchGroups[1]
            };
        }

        return urlFragment || '/';
    };

    Route.prototype.equals = function (hashUrl) {
        if (this.tokens.length !== hashUrl.tokens.length) {
            return false;
        }

        for (var i = 0, len = this.tokens.length; i < len; i++) {
            var token = this.tokens[i],
                urlToken = hashUrl.tokens[i];

            var isRouteParam = typeof token === 'object';
            if (isRouteParam) {
                continue;
            }

            if (token.toLowerCase() !== urlToken.toLowerCase()) {
                return false;
            }
        }

        return true;
    };

    Route.prototype.getParamsFromUrl = function (url) {
        if (this.tokens.length !== url.tokens.length) {
            throw new Error('Url does not match the target route.');
        }

        var result = this.getQueryParamsFromUrl(url);

        // route params are with higher priority than query params
        this.tokens.forEach(function (token, index) {
            var isRouteParam = typeof token === 'object';
            if (isRouteParam) {
                result[token.name] = url.tokens[index];
            }
        });        

        return result;
    };

    Route.prototype.getQueryParamsFromUrl = function (url) {
        var result = {};
        url.queryParams.forEach(function (queryParam) {
            result[queryParam.key] = queryParam.value;
        });
        return result;
    };

    Route.prototype.start = function (routeParams) {
        this.callback(routeParams);
    };

    function RouteManager() {
        this.defaultUrl = null;
    }

    RouteManager.prototype.registerRoute = function (pattern, callback) {
        if (typeof pattern !== 'string') {
            throw new Error('Route pattern must be a string');
        }

        if (typeof callback !== 'function') {
            throw new Error('Route callback must be function');
        }

        routes.push(new Route(pattern, callback));
    };

    RouteManager.prototype.setDefaultUrl = function (url) {
        if (typeof url !== 'string') {
            throw new Error('url must be a string.');
        }

        this.defaultUrl = url;
    };

    RouteManager.prototype.startRoute = function (hashUrlValue) {
        var hashUrl = HashUrl.create(hashUrlValue);
        var nextRoute = findRouteByUrl(hashUrl);
        if (nextRoute) {
            var routeParams = nextRoute.getParamsFromUrl(hashUrl);
            nextRoute.start(routeParams);
            return;
        }

        this.startDefaultRoute();
    };

    RouteManager.prototype.startDefaultRoute = function () {
        if (this.defaultUrl) {
            window.history.replaceState(
                null,
                null,
                window.location.pathname + '#' + this.defaultUrl
            );
            this.startRoute(this.defaultUrl);
        }
    };

    RouteManager.prototype.getRoutes = function () {
        return routes.map(function (route) {
            return route.pattern;
        });
    };

    var exposedObj = {
        getInstance: function () {
            if (!routeManagerInstance) {
                init();
            }

            return routeManagerInstance;
        },
        hasRoutes: function () {
            return !!routes && routes.length > 0;
        }
    };

    spaMVP._private = spaMVP._private || {};
    spaMVP._private.RouteManager = exposedObj;

    return spaMVP;

}(spaMVP || {}));