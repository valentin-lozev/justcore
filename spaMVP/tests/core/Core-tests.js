/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />
describe('Core', function () {
    function getOne(routeConfig) {
        return spaMVP.createAppCore(routeConfig);
    }
    function getModule() {
        return {
            init: function (options) { return true; },
            destroy: function () { return false; }
        };
    }
    describe('Routing', function () {
        it('should execute an action on DOMContentLoaded', function () {
            var core = getOne();
            var spy = { action: function () { } };
            spyOn(spy, 'action');
            core.run(spy.action);
            document.dispatchEvent(new Event('DOMContentLoaded'));
            expect(spy.action).toHaveBeenCalled();
        });
        it('should register a route by delegating to its route config', function () {
            var config = new spaMVP.Hidden.DefaultRouteConfig();
            var core = getOne(config);
            spyOn(config, 'registerRoute');
            var pattern = 'home';
            core.registerRoute(pattern, null);
            expect(config.registerRoute).toHaveBeenCalledWith(pattern, null);
        });
        it('should start a route by delegating to its route config', function () {
            var config = new spaMVP.Hidden.DefaultRouteConfig();
            var core = getOne(config);
            spyOn(config, 'startRoute');
            var pattern = 'home';
            core.startRoute(pattern);
            expect(config.startRoute).toHaveBeenCalledWith(pattern);
        });
        it('should start the current hash route on DOMContentLoaded', function () {
            var config = new spaMVP.Hidden.DefaultRouteConfig();
            var core = getOne(config);
            core.registerRoute('', null);
            spyOn(config, 'startRoute');
            core.run();
            document.dispatchEvent(new Event('DOMContentLoaded'));
            expect(config.startRoute).toHaveBeenCalled();
        });
        it('should start listening for hashchange on DOMContentLoaded', function () {
            var config = new spaMVP.Hidden.DefaultRouteConfig();
            var core = getOne(config);
            core.registerRoute('', null);
            spyOn(config, 'startRoute');
            core.run();
            document.dispatchEvent(new Event('DOMContentLoaded'));
            window.dispatchEvent(new Event('hashchange'));
            expect(config.startRoute).toHaveBeenCalledTimes(2);
        });
        it('should set default url on its route config', function () {
            var config = new spaMVP.Hidden.DefaultRouteConfig();
            var core = getOne(config);
            var url = 'home';
            core.defaultUrl(url);
            expect(config.defaultUrl).toEqual(url);
        });
    });
    describe('Modules', function () {
        it('should havent any registered modules by default', function () {
            var modules = getOne().getAllModules();
            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(0);
        });
        it('should have validation when register', function () {
            var core = getOne();
            var validId = 'testModule';
            var validCreator = function (sb) {
                return {
                    init: function () { },
                    destroy: function () { }
                };
            };
            var tests = [
                function emptyString() { core.register('', validCreator); },
                function nullString() { core.register(null, validCreator); },
                function undefinedString() { core.register(undefined, validCreator); },
                function nullCreator() { core.register(validId, null); },
                function undefinedCreator() { core.register(validId, undefined); }
            ];
            tests.forEach(function (test) {
                expect(test).toThrow();
            });
        });
        it('should register a module', function () {
            var core = getOne();
            var id = 'testModule';
            var creator = function (sb) {
                return {
                    init: function () { },
                    destroy: function () { }
                };
            };
            core.register(id, creator);
            var modules = core.getAllModules();
            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(1);
            expect(modules[0]).toEqual(id);
        });
        it('should throw if when module not found', function () {
            var core = getOne();
            expect(function () { return core.start('test'); }).toThrow();
        });
        it('should throw when register an already registered module', function () {
            var core = getOne();
            var id = 'testModule';
            var creator = function (sb) {
                return {
                    init: function () { },
                    destroy: function () { }
                };
            };
            core.register(id, creator);
            expect(function () { return core.register(id, creator); }).toThrow();
            var modules = core.getAllModules();
            expect(modules.length).toEqual(1);
        });
        it('should start a module', function () {
            var core = getOne();
            var id = 'testModule';
            var module = getModule();
            spyOn(module, 'init');
            var creator = function (sb) { return module; };
            core.register(id, creator);
            core.start(id);
            var modules = core.getAllModules();
            expect(modules[0]).toEqual(id);
            expect(module.init).toHaveBeenCalledWith({});
        });
        it('should start a module with options', function () {
            var core = getOne();
            var id = 'testModule';
            var module = getModule();
            spyOn(module, 'init');
            var creator = function (sb) { return module; };
            core.register(id, creator);
            var options = { count: 5 };
            core.start(id, options);
            expect(module.init).toHaveBeenCalledWith(options);
        });
        it('should not start an already started module', function () {
            var core = getOne();
            var id = 'testModule';
            var module = getModule();
            spyOn(module, 'init');
            var creator = function (sb) { return module; };
            core.register(id, creator);
            core.start(id);
            core.start(id);
            expect(module.init).toHaveBeenCalledTimes(1);
        });
        it('should start a module with another instance', function () {
            var core = getOne();
            var id = 'testModule';
            var module = getModule();
            spyOn(module, 'init');
            var creator = function (sb) { return module; };
            core.register(id, creator);
            core.start(id);
            core.start(id, { instanceId: 'test2' });
            expect(module.init).toHaveBeenCalledTimes(2);
        });
        it('should not throw when stop not started module', function () {
            var core = getOne();
            expect(function () { return core.stop(''); }).not.toThrow();
        });
        it('should stop a module', function () {
            var core = getOne();
            var id = 'testModule';
            var module = getModule();
            spyOn(module, 'destroy');
            var creator = function (sb) { return module; };
            core.register(id, creator);
            core.start(id);
            core.stop(id);
            expect(module.destroy).toHaveBeenCalledTimes(1);
        });
        it('should stop a module having multiple instances', function () {
            var core = getOne();
            var id = 'testModule';
            var module = getModule();
            spyOn(module, 'destroy');
            var creator = function (sb) { return module; };
            core.register(id, creator);
            core.start(id);
            core.start(id, { instanceId: 'another' });
            core.stop(id);
            core.stop(id, 'another');
            expect(module.destroy).toHaveBeenCalledTimes(2);
        });
    });
    describe('Services', function () {
        it('should have id validation when add', function () {
            var core = getOne();
            var validId = 'testService';
            var validCreator = function () { return {}; };
            var tests = [
                function emptyString() { core.addService('', validCreator); },
                function nullString() { core.addService(null, validCreator); },
                function undefinedString() { core.addService(undefined, validCreator); }
            ];
            tests.forEach(function (test) {
                expect(test).toThrow();
            });
        });
        it('should add service', function () {
            var core = getOne();
            var id = 'testService';
            var creator = function () { return { id: id }; };
            core.addService(id, creator);
            var service = core.getService(id);
            expect(service).toBeDefined();
            expect(service.id).toEqual(id);
        });
        it('should throw when add service twice', function () {
            var core = getOne();
            var creator = function () { return Object.create({}); };
            core.addService('asd', creator);
            expect(function () { return core.addService('asd', creator); }).toThrow();
        });
        it('should throw when service not found', function () {
            var core = getOne();
            expect(function () { return core.getService(''); }).toThrow();
        });
    });
    describe('Communications', function () {
        it('should add subscriber', function () {
            var core = getOne();
            var subscriber = {
                onPublish: function (data) { return true; }
            };
            spyOn(subscriber, 'onPublish');
            var events = ['change', 'destroy'];
            core.subscribe(events, subscriber.onPublish);
            events.forEach(function (ev) { return core.publish(ev, 1); });
            expect(subscriber.onPublish).toHaveBeenCalledTimes(2);
            expect(subscriber.onPublish).toHaveBeenCalledWith(events[0], 1);
            expect(subscriber.onPublish).toHaveBeenCalledWith(events[1], 1);
        });
        it('should remove subscriber', function () {
            var core = getOne();
            var subscriber = {
                onPublish: function (data) { return true; }
            };
            spyOn(subscriber, 'onPublish');
            var events = ['change', 'destroy'];
            core.subscribe(events, subscriber.onPublish);
            core.unsubscribe(events, subscriber.onPublish);
            events.forEach(function (ev) { return core.publish(ev, 1); });
            expect(subscriber.onPublish).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=Core-tests.js.map