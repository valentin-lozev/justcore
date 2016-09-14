/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe('Core', () => {

    function getOne(routeConfig?: spaMVP.RouteConfig): spaMVP.Core {
        return spaMVP.createAppCore(routeConfig);
    }

    function getModule(): spaMVP.Module {
        return {
            init: (options?: Object) => true,
            destroy: () => false
        };
    }

    describe('Routing', () => {
        it('should execute an action on DOMContentLoaded', () => {
            let core = getOne();
            let spy = { action: function () { } };
            spyOn(spy, 'action');

            core.run(spy.action);
            document.dispatchEvent(new Event('DOMContentLoaded'));

            expect(spy.action).toHaveBeenCalled();
        });

        it('should register a route by delegating to its route config', () => {
            let config = new spaMVP.Hidden.DefaultRouteConfig();
            let core = getOne(config);
            spyOn(config, 'registerRoute');
            let pattern = 'home';

            core.registerRoute(pattern, null);

            expect(config.registerRoute).toHaveBeenCalledWith(pattern, null);
        });

        it('should start a route by delegating to its route config', () => {
            let config = new spaMVP.Hidden.DefaultRouteConfig();
            let core = getOne(config);
            spyOn(config, 'startRoute');
            let pattern = 'home';

            core.startRoute(pattern);

            expect(config.startRoute).toHaveBeenCalledWith(pattern);
        });

        it('should start the current hash route on DOMContentLoaded', () => {
            let config = new spaMVP.Hidden.DefaultRouteConfig();
            let core = getOne(config);
            core.registerRoute('', null);
            spyOn(config, 'startRoute');

            core.run();
            document.dispatchEvent(new Event('DOMContentLoaded'));

            expect(config.startRoute).toHaveBeenCalled();
        });

        it('should start listening for hashchange on DOMContentLoaded', () => {
            let config = new spaMVP.Hidden.DefaultRouteConfig();
            let core = getOne(config);
            core.registerRoute('', null);
            spyOn(config, 'startRoute');

            core.run();
            document.dispatchEvent(new Event('DOMContentLoaded'));
            window.dispatchEvent(new Event('hashchange'));

            expect(config.startRoute).toHaveBeenCalledTimes(2);
        });

        it('should set default url on its route config', () => {
            let config = new spaMVP.Hidden.DefaultRouteConfig();
            let core = getOne(config);
            let url = 'home';

            core.defaultUrl(url);

            expect(config.defaultUrl).toEqual(url);
        });
    });

    describe('Modules', () => {
        it('should havent any registered modules by default', function () {
            let modules = getOne().getAllModules();

            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(0);
        });

        it('should have validation when register', function () {
            let core = getOne();
            let validId = 'testModule';
            let validCreator = (sb: spaMVP.Sandbox): spaMVP.Module => {
                return {
                    init: function () { },
                    destroy: function () { }
                };
            };
            let tests = [
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
            let core = getOne();
            let id = 'testModule';
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => {
                return {
                    init: function () { },
                    destroy: function () { }
                };
            };

            core.register(id, creator);

            let modules = core.getAllModules();
            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(1);
            expect(modules[0]).toEqual(id);
        });

        it('should throw if when module not found', function () {
            let core = getOne();

            expect(() => core.start('test')).toThrow();
        });

        it('should throw when register an already registered module', function () {
            let core = getOne();
            let id = 'testModule';
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => {
                return {
                    init: function () { },
                    destroy: function () { }
                };
            };

            core.register(id, creator);

            expect(() => core.register(id, creator)).toThrow();
            let modules = core.getAllModules();
            expect(modules.length).toEqual(1);
        });

        it('should start a module', function () {
            let core = getOne();
            let id = 'testModule';
            let module = getModule();
            spyOn(module, 'init');
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);

            core.start(id);

            let modules = core.getAllModules();
            expect(modules[0]).toEqual(id);
            expect(module.init).toHaveBeenCalledWith({});
        });

        it('should start a module with options', function () {
            let core = getOne();
            let id = 'testModule';
            let module = getModule();
            spyOn(module, 'init');
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);
            let options = { count: 5 };

            core.start(id, options);

            expect(module.init).toHaveBeenCalledWith(options);
        });

        it('should not start an already started module', function () {
            let core = getOne();
            let id = 'testModule';
            let module = getModule();
            spyOn(module, 'init');
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);

            core.start(id);
            core.start(id);

            expect(module.init).toHaveBeenCalledTimes(1);
        });

        it('should start a module with another instance', function () {
            let core = getOne();
            let id = 'testModule';
            let module = getModule();
            spyOn(module, 'init');
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);

            core.start(id);
            core.start(id, { instanceId: 'test2' });

            expect(module.init).toHaveBeenCalledTimes(2);
        });

        it('should not throw when stop not started module', function () {
            let core = getOne();

            expect(() => core.stop('')).not.toThrow();
        });

        it('should stop a module', function () {
            let core = getOne();
            let id = 'testModule';
            let module = getModule();
            spyOn(module, 'destroy');
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);
            core.start(id);

            core.stop(id);

            expect(module.destroy).toHaveBeenCalledTimes(1);
        });

        it('should stop a module having multiple instances', function () {
            let core = getOne();
            let id = 'testModule';
            let module = getModule();
            spyOn(module, 'destroy');
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);
            core.start(id);
            core.start(id, { instanceId: 'another' });

            core.stop(id);
            core.stop(id, 'another');

            expect(module.destroy).toHaveBeenCalledTimes(2);
        });
    });

    describe('Services', () => {
        it('should have id validation when add', function () {
            let core = getOne();
            let validId = 'testService';
            let validCreator = (): Object => { return {}; };
            let tests = [
                function emptyString() { core.addService('', validCreator); },
                function nullString() { core.addService(null, validCreator); },
                function undefinedString() { core.addService(undefined, validCreator); }
            ];

            tests.forEach(function (test) {
                expect(test).toThrow();
            });
        });

        it('should add service', function () {
            let core = getOne();
            let id = 'testService';
            interface Service {
                id: string;
            }
            let creator = (): Service => { return { id: id }; };

            core.addService(id, creator);

            let service = core.getService<Service>(id);
            expect(service).toBeDefined();
            expect(service.id).toEqual(id);
        });

        it('should throw when add service twice', function () {
            let core = getOne();
            let creator = (): Object => Object.create({});
            core.addService('asd', creator);

            expect(() => core.addService('asd', creator)).toThrow();
        });

        it('should throw when service not found', function () {
            let core = getOne();

            expect(() => core.getService('')).toThrow();
        });
    });

    describe('Communications', () => {
        it('should add subscriber', () => {
            let core = getOne();
            let subscriber = {
                onPublish: (data?: any) => true
            };
            spyOn(subscriber, 'onPublish');
            let events = ['change', 'destroy'];

            core.subscribe(events, subscriber.onPublish);
            events.forEach(ev => core.publish(ev, 1));

            expect(subscriber.onPublish).toHaveBeenCalledTimes(2);
            expect(subscriber.onPublish).toHaveBeenCalledWith(events[0], 1);
            expect(subscriber.onPublish).toHaveBeenCalledWith(events[1], 1);
        });

        it('should remove subscriber', () => {
            let core = getOne();
            let subscriber = {
                onPublish: (data?: any) => true
            };
            spyOn(subscriber, 'onPublish');
            let events = ['change', 'destroy'];

            core.subscribe(events, subscriber.onPublish);
            core.unsubscribe(events, subscriber.onPublish);
            events.forEach(ev => core.publish(ev, 1));

            expect(subscriber.onPublish).not.toHaveBeenCalled();
        });
    });
});