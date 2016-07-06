/// <reference path="/scripts/jasmine.js" />
/// <reference path="../../spaMVP/src/routing/routemanager.js" />

describe('RouteManager', function () {
    var routeManager = null,
        homeRoute = null,
        eventRoute = null,
        defaultUrl = null,
        eventUrl = null;

    beforeAll(function () {
        routeManager = spaMVP._private.RouteManager.getInstance();
    });

    it('should has not any registered routes', function () {
        expect(spaMVP._private.RouteManager.hasRoutes()).toBeFalsy();
    });

    it('should throw an error if pattern is not a string', function () {
        expect(function () {
            routeManager.registerPattern(123, {});
        }).toThrow();
    });

    it('should register valid routes', function () {
        homeRoute = '/home';
        eventRoute = '/events/{id}/info/{infoId}';

        routeManager.registerRoute(homeRoute, function (routeParams) {
            if (typeof routeParams !== 'object') {
                throw new Error();
            }

            if (routeParams.page !== '10') {
                throw new Error();
            }
        });

        routeManager.registerRoute(eventRoute, function (routeParams) {
            if (routeParams.id !== '1') {
                throw new Error();
            }

            if (routeParams.infoId !== '2') {
                throw new Error();
            }
        });

        var routes = routeManager.getRoutes();
        expect(routes instanceof Array).toBeTruthy();
        expect(routes.length).toBe(2);
        expect(routes.indexOf(homeRoute) > -1).toBeTruthy();
        expect(routes.indexOf(eventRoute) > -1).toBeTruthy();
    });

    it('should throw an error if set invalid default url', function () {
        expect(function () { routeManager.setDefaultUrl(1); }).toThrow();
        expect(routeManager.defaultUrl).toBeNull();
    });

    it('should set valid default url', function () {
        defaultUrl = '/home?page=10';
        routeManager.setDefaultUrl(defaultUrl);
        expect(routeManager.defaultUrl).toEqual(defaultUrl);
    });

    it('should start already registered route', function () {
        eventUrl = '/events/1/info/2';
        expect(function () {
            routeManager.startRoute(eventUrl);
        }).not.toThrow();
    });

    it('should start default route and get query parameter from it', function () {
        expect(function () {
            routeManager.startRoute(defaultUrl);
        }).not.toThrow();
    });
});