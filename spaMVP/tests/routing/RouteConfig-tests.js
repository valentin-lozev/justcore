/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />
describe('RouteConfig', function () {
    function getConfig() {
        return new spaMVP.RouteConfig();
    }
    it('should has null default url by default', function () {
        var config = getConfig();
        expect(config.defaultUrl).toBeNull();
    });
    it('should has not any registered routes by default', function () {
        var config = getConfig();
        expect(config.hasRoutes()).toBeFalsy();
    });
    it('should return empty array when there arent any registered routes', function () {
        var routes = getConfig().getRoutes();
        expect(Array.isArray(routes)).toBeTruthy();
        expect(routes.length).toEqual(0);
    });
    it('should register a route', function () {
        var config = getConfig();
        var pattern = '/home';
        config.registerRoute(pattern, null);
        expect(config.hasRoutes()).toBeTruthy();
        expect(config.getRoutes().length).toEqual(1);
        expect(config.getRoutes()[0]).toEqual(pattern);
    });
    it('should throw an error when register an already registered route', function () {
        var config = getConfig();
        var pattern = '/home';
        config.registerRoute(pattern, null);
        expect(function () { return config.registerRoute(pattern, null); }).toThrow();
        expect(config.getRoutes().length).toEqual(1);
    });
    it('should not trow an error when start not registered route', function () {
        var config = getConfig();
        expect(function () { return config.startRoute('home'); }).not.toThrow();
    });
    it('should start route when route is registered', function () {
        var config = getConfig();
        var pattern = '/home';
        var handler = {
            handle: function (routeParams) {
            }
        };
        spyOn(handler, 'handle');
        config.registerRoute(pattern, handler.handle);
        config.startRoute(pattern);
        expect(handler.handle).toHaveBeenCalled();
    });
    it('should start default url when start not registered route', function () {
        var config = getConfig();
        config.defaultUrl = 'home';
        var pattern = '/home';
        var handler = {
            handle: function (routeParams) {
            }
        };
        spyOn(handler, 'handle');
        config.registerRoute(pattern, handler.handle);
        config.startRoute('invalid');
        expect(handler.handle).toHaveBeenCalled();
    });
    it('should start routes when url matches multiple ones with priority by their registration', function () {
        var config = getConfig();
        var handler = {
            handle: function (routeParams) {
            }
        };
        spyOn(handler, 'handle');
        config.registerRoute('{id}', handler.handle);
        config.registerRoute('page', handler.handle);
        config.registerRoute('home', handler.handle);
        config.startRoute('1');
        expect(handler.handle).toHaveBeenCalledTimes(1);
        expect(handler.handle).toHaveBeenCalledWith({ id: '1' });
    });
});
//# sourceMappingURL=RouteConfig-tests.js.map