/// <reference path="../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe("Core", () => {

    function getOne(): spaMVP.Core {
        return new spaMVP.Core();
    }

    function getModule(): spaMVP.Module {
        return {
            init: (options?: Object) => true,
            destroy: () => false
        };
    }

    describe("Initialization", () => {
        it("should execute an action on DOMContentLoaded", () => {
            let core = getOne();
            let spy = { action: function () { } };
            spyOn(spy, "action");

            core.run(spy.action);
            document.dispatchEvent(new Event("DOMContentLoaded"));

            expect(spy.action).toHaveBeenCalled();
        });

        it("should initialize with default sandbox type when such is not provided", () => {
            let core = getOne();

            expect(core.Sandbox).toBeDefined();
        });

        it("should initialize with custom sandbox type when such is provided", () => {
            class CustomSandbox extends spaMVP.Sandbox {
                constructor() {
                    super(null, null);
                }
            }

            let core = new spaMVP.Core(CustomSandbox);

            expect(core.Sandbox).toBe(CustomSandbox);
        });
    });

    describe("Modules", () => {
        it("should havent any registered modules by default", function () {
            let modules = getOne().getModules();

            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(0);
        });

        it("should have validation when register", function () {
            let core = getOne();
            let validId = "testModule";
            let validCreator = (sb: spaMVP.Sandbox): spaMVP.Module => {
                return {
                    init: function () { },
                    destroy: function () { }
                };
            };
            let tests = [
                function emptyString() { core.register("", validCreator); },
                function nullString() { core.register(null, validCreator); },
                function undefinedString() { core.register(undefined, validCreator); },
                function nullCreator() { core.register(validId, null); },
                function undefinedCreator() { core.register(validId, undefined); }
            ];

            tests.forEach(function (test) {
                expect(test).toThrow();
            });
        });

        it("should register a module", function () {
            let core = getOne();
            let id = "testModule";
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => {
                return {
                    init: function () { },
                    destroy: function () { }
                };
            };

            core.register(id, creator);

            let modules = core.getModules();
            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(1);
            expect(modules[0]).toEqual(id);
        });

        it("should throw if when module not found", function () {
            let core = getOne();

            expect(() => core.start("test")).toThrow();
        });

        it("should throw when register an already registered module", function () {
            let core = getOne();
            let id = "testModule";
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => {
                return {
                    init: function () { },
                    destroy: function () { }
                };
            };

            core.register(id, creator);

            expect(() => core.register(id, creator)).toThrow();
            let modules = core.getModules();
            expect(modules.length).toEqual(1);
        });

        it("should start a module", function () {
            let core = getOne();
            let id = "testModule";
            let module = getModule();
            spyOn(module, "init");
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);

            core.start(id);

            let modules = core.getModules();
            expect(modules[0]).toEqual(id);
            expect(module.init).toHaveBeenCalledWith({});
        });

        it("should start a module with options", function () {
            let core = getOne();
            let id = "testModule";
            let module = getModule();
            spyOn(module, "init");
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);
            let options = { count: 5 };

            core.start(id, options);

            expect(module.init).toHaveBeenCalledWith(options);
        });

        it("should not start an already started module", function () {
            let core = getOne();
            let id = "testModule";
            let module = getModule();
            spyOn(module, "init");
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);

            core.start(id);
            core.start(id);

            expect(module.init).toHaveBeenCalledTimes(1);
        });

        it("should start a module with another instance", function () {
            let core = getOne();
            let id = "testModule";
            let module = getModule();
            spyOn(module, "init");
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);

            core.start(id);
            core.start(id, { instanceId: "test2" });

            expect(module.init).toHaveBeenCalledTimes(2);
        });

        it("should not throw when stop not started module", function () {
            let core = getOne();

            expect(() => core.stop("")).not.toThrow();
        });

        it("should stop a module", function () {
            let core = getOne();
            let id = "testModule";
            let module = getModule();
            spyOn(module, "destroy");
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);
            core.start(id);

            core.stop(id);

            expect(module.destroy).toHaveBeenCalledTimes(1);
        });

        it("should stop a module having multiple instances", function () {
            let core = getOne();
            let id = "testModule";
            let module = getModule();
            spyOn(module, "destroy");
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);
            core.start(id);
            core.start(id, { instanceId: "another" });

            core.stop(id);
            core.stop(id, "another");

            expect(module.destroy).toHaveBeenCalledTimes(2);
        });
    });

    describe("Communication", () => {
        it("should add subscriber", () => {
            let core = getOne();
            let subscriber = {
                onPublish: (data?: any) => true
            };
            spyOn(subscriber, "onPublish");
            let events = ["change", "destroy"];

            core.subscribe(events, subscriber.onPublish);
            events.forEach(ev => core.publish(ev, 1));

            expect(subscriber.onPublish).toHaveBeenCalledTimes(2);
            expect(subscriber.onPublish).toHaveBeenCalledWith(events[0], 1);
            expect(subscriber.onPublish).toHaveBeenCalledWith(events[1], 1);
        });

        it("should remove subscriber", () => {
            let core = getOne();
            let subscriber = {
                onPublish: (data?: any) => true
            };
            spyOn(subscriber, "onPublish");
            let events = ["change", "destroy"];

            core.subscribe(events, subscriber.onPublish);
            core.unsubscribe(events, subscriber.onPublish);
            events.forEach(ev => core.publish(ev, 1));

            expect(subscriber.onPublish).not.toHaveBeenCalled();
        });
    });

    describe("Hooks", () => {
        it("should throw when hook with invalid type", () => {
            let core = getOne();
            let hook = () => {
                core.hook(null, () => { });
            };

            expect(hook).toThrow();
        });

        it("should throw when hook with invalid plugin", () => {
            let core = getOne();
            let hook = () => {
                core.hook(spaMVP.HookType.SPA_DOMReady, null);
            };

            expect(hook).toThrow();
        });

        it("should run plugin when hook into DOMReady", () => {
            let core = getOne();
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_DOMReady, mock.plugin);

            core.run();
            document.dispatchEvent(new Event("DOMContentLoaded"));

            expect(mock.plugin).toHaveBeenCalledTimes(1);
        });

        it("should run plugin when hook into module destroy", () => {
            let core = getOne();
            let module = getModule();
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            let moduleID = "module";
            core.register(moduleID, creator);
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_ModuleDestroy, mock.plugin);

            core.start(moduleID);
            core.stop(moduleID);

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(moduleID, undefined);
        });

        it("should run plugin when hook into module init", () => {
            let core = getOne();
            let module = getModule();
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            let moduleID = "module";
            core.register(moduleID, creator);
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_ModuleInit, mock.plugin);

            core.start(moduleID);
            core.start(moduleID);

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(moduleID, {});
        });

        it("should run plugin when hook into module register", () => {
            let core = getOne();
            let module = getModule();
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            let moduleID = "module";
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_ModuleRegister, mock.plugin);

            core.register(moduleID, creator);

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(moduleID, creator);
        });

        it("should run plugin when hook into publish", () => {
            let core = getOne();
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_Publish, mock.plugin);
            let message = "hello";
            let type = "test";
            core.subscribe([type], () => { });

            core.publish(type, message);

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(type, message);
        });

        it("should run plugin when hook into subscribe", () => {
            let core = getOne();
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_Subscribe, mock.plugin);
            let type = "test";

            core.subscribe([type], () => { });

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith([type]);
        });

        it("should run plugin when hook into unsubscribe", () => {
            let core = getOne();
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_Unsubscribe, mock.plugin);
            let type = "test";

            core.subscribe([type], () => { });
            core.unsubscribe([type], () => { });

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith([type]);
        });

        it("should not throw when plugin execution failed", () => {
            let core = getOne();
            let mock = {
                plugin: () => { throw new Error(); }
            };
            spyOn(mock, "plugin").and.callThrough();
            core.hook(spaMVP.HookType.SPA_Subscribe, mock.plugin);

            expect(() => core.subscribe(["test"], () => { })).not.toThrow();
            expect(mock.plugin).toHaveBeenCalledTimes(1);
        });
    });
});