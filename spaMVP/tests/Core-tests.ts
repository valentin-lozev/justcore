/// <reference path="../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe("Core", () => {

    function getOne(): spaMVP.Core {
        return new spaMVP.Core();
    }

    function getModule(sb: spaMVP.Sandbox): spaMVP.Module {
        return {
            init: (options?: Object): void => undefined,
            destroy: (): void => undefined
        };
    }

    describe("Initialization", () => {
        it("should execute an action on DOMContentLoaded", () => {
            let core = getOne();
            let spy = { action: function (): void { return; } };
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
        it("should havent any registered modules by default", () => {
            let modules = getOne().getModules();

            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(0);
        });

        it("should have validation when register", () => {
            let core = getOne();
            let validId = "testModule";
            let tests = [
                function emptyString(): void { core.register("", getModule); },
                function nullString(): void { core.register(null, getModule); },
                function undefinedString(): void { core.register(undefined, getModule); },
                function nullCreator(): void { core.register(validId, null); },
                function undefinedCreator(): void { core.register(validId, undefined); }
            ];

            tests.forEach(test => expect(test).toThrow());
        });

        it("should register a module", () => {
            let core = getOne();
            let id = "testModule";

            core.register(id, getModule);

            let modules = core.getModules();
            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(1);
            expect(modules[0]).toEqual(id);
        });

        it("should throw if when module not found", () => {
            let core = getOne();

            expect(() => core.start("test")).toThrow();
        });

        it("should throw when register an already registered module", () => {
            let core = getOne();
            let id = "testModule";

            core.register(id, getModule);

            expect(() => core.register(id, getModule)).toThrow();
            let modules = core.getModules();
            expect(modules.length).toEqual(1);
        });

        it("should start a module", () => {
            let core = getOne();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id));
            spyOn(module, "init");
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);

            core.start(id);

            let modules = core.getModules();
            expect(modules[0]).toEqual(id);
            expect(module.init).toHaveBeenCalledWith({});
        });

        it("should start a module with options", () => {
            let core = getOne();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id));
            spyOn(module, "init");
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);
            let options = { count: 5 };

            core.start(id, options);

            expect(module.init).toHaveBeenCalledWith(options);
        });

        it("should not start an already started module", () => {
            let core = getOne();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id));
            spyOn(module, "init");
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);

            core.start(id);
            core.start(id);

            expect(module.init).toHaveBeenCalledTimes(1);
        });

        it("should start a module with another instance", () => {
            let core = getOne();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id));
            spyOn(module, "init");
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);

            core.start(id);
            core.start(id, { instanceId: "test2" });

            expect(module.init).toHaveBeenCalledTimes(2);
        });

        it("should not throw when stop not started module", () => {
            let core = getOne();

            expect(() => core.stop("")).not.toThrow();
        });

        it("should stop a module", () => {
            let core = getOne();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id));
            spyOn(module, "destroy");
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(id, creator);
            core.start(id);

            core.stop(id);

            expect(module.destroy).toHaveBeenCalledTimes(1);
        });

        it("should stop a module having multiple instances", () => {
            let core = getOne();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id));
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
                onPublish: (data?: any): void => undefined
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
                onPublish: (data?: any): void => undefined
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
                core.hook(null, () => { return; });
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
            let moduleID = "module";
            let core = getOne();
            let module = getModule(new core.Sandbox(core, moduleID));
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(moduleID, creator);
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_ModuleDestroy, mock.plugin);

            core.start(moduleID);
            core.stop(moduleID);

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(moduleID, undefined);
        });

        it("should run plugin when hook into module init", () => {
            let moduleID = "module";
            let core = getOne();
            let module = getModule(new core.Sandbox(core, moduleID));
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
            core.register(moduleID, creator);
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_ModuleInit, mock.plugin);

            core.start(moduleID);
            core.start(moduleID);

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(moduleID, {});
        });

        it("should run plugin when hook into module register", () => {
            let moduleID = "module";
            let core = getOne();
            let module = getModule(new core.Sandbox(core, moduleID));
            let creator = (sb: spaMVP.Sandbox): spaMVP.Module => module;
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
            core.subscribe([type], () => { return; });

            core.publish(type, message);

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(type, message);
        });

        it("should run plugin when hook into subscribe", () => {
            let core = getOne();
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_Subscribe, mock.plugin);
            let type = "test";

            core.subscribe([type], () => { return; });

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith([type]);
        });

        it("should run plugin when hook into unsubscribe", () => {
            let core = getOne();
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_Unsubscribe, mock.plugin);
            let type = "test";

            core.subscribe([type], () => { return; });
            core.unsubscribe([type], () => { return; });

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith([type]);
        });

        it("should not throw when plugin execution failed", () => {
            let core = getOne();
            let mock = {
                plugin: (): void => { throw new Error(); }
            };
            spyOn(mock, "plugin").and.callThrough();
            core.hook(spaMVP.HookType.SPA_Subscribe, mock.plugin);

            expect(() => core.subscribe(["test"], () => { return; })).not.toThrow();
            expect(mock.plugin).toHaveBeenCalledTimes(1);
        });
    });
});