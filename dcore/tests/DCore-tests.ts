/// <reference path="../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />

describe("DCore", () => {

    function getModule(sb: DSandbox): DModule {
        return {
            init: (options?: Object): void => undefined,
            destroy: (): void => undefined
        };
    }

    describe("Initialization", () => {
        it("should be in debug mode by default", () => {
            let core = dcore.createOne();

            expect(core.state.isDebug).toBeTruthy();
        });

        it("should not be in running mode by default", () => {
            let core = dcore.createOne();

            expect(core.state.isRunning).toBeFalsy();
        });

        it("should throw when run plugins before it is being started", () => {
            let core = dcore.createOne();

            expect(() => core.subscribe(["topic"], function (): void { return; })).toThrow();
        });

        it("should be in running mode after run", () => {
            let core = dcore.createOne();

            core.run();

            expect(core.state.isRunning).toBeTruthy();
        });

        it("should execute an action on DOMContentLoaded", () => {
            let core = dcore.createOne();
            let spy = { action: function (): void { return; } };
            spyOn(spy, "action");

            core.run(spy.action);
            document.dispatchEvent(new Event("DOMContentLoaded"));

            expect(spy.action).toHaveBeenCalled();
        });

        it("should not run again when is already being started", () => {
            let core = dcore.createOne();
            let spy = { action: function (): void { return; } };
            spyOn(spy, "action");

            core.run(spy.action);
            document.dispatchEvent(new Event("DOMContentLoaded"));
            core.run(spy.action);
            document.dispatchEvent(new Event("DOMContentLoaded"));

            expect(spy.action).toHaveBeenCalledTimes(1);
        });

        it("should initialize with default sandbox type when such is not provided", () => {
            let core = dcore.createOne();

            expect(core.Sandbox).toBeDefined();
        });

        it("should initialize with custom sandbox type when such is provided", () => {
            class CustomSandbox implements DSandbox {
                public moduleInstanceId: string;
                constructor(core: DCore, moduleInstanceId: string) {
                    this.moduleInstanceId = moduleInstanceId;
                }

                subscribe(topics: string[], handler: (topic: string, data: any) => void): DSubscriptionToken {
                    return { destroy: (topic?: string): void => undefined };
                }

                publish(topic: string, data: any): this {
                    return this;
                }

                start(moduleId: string, options?: Object): this {
                    return this;
                }

                stop(moduleId: string, instanceId?: string): this {
                    return this;
                }
            }

            let core = dcore.createOne(CustomSandbox);

            expect(core.Sandbox).toBe(CustomSandbox);
        });
    });

    describe("Modules", () => {
        it("should havent any registered modules by default", () => {
            let modules = dcore.createOne().listModules();

            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(0);
        });

        it("should have validation when register", () => {
            let core = dcore.createOne();
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
            let core = dcore.createOne().run();
            let id = "testModule";

            core.register(id, getModule);

            let modules = core.listModules();
            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(1);
            expect(modules[0]).toEqual(id);
        });

        it("should throw if when module not found", () => {
            let core = dcore.createOne();

            expect(() => core.start("test")).toThrow();
        });

        it("should throw when register an already registered module", () => {
            let core = dcore.createOne().run();
            let id = "testModule";

            core.register(id, getModule);

            expect(() => core.register(id, getModule)).toThrow();
            let modules = core.listModules();
            expect(modules.length).toEqual(1);
        });

        it("should start a module", () => {
            let core = dcore.createOne().run();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id));
            spyOn(module, "init");
            let creator = (sb: DSandbox): DModule => module;
            core.register(id, creator);

            core.start(id);

            let modules = core.listModules();
            expect(modules[0]).toEqual(id);
            expect(module.init).toHaveBeenCalledWith({});
        });

        it("should start a module with options", () => {
            let core = dcore.createOne().run();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id));
            spyOn(module, "init");
            let creator = (sb: DSandbox): DModule => module;
            core.register(id, creator);
            let options = { count: 5 };

            core.start(id, options);

            expect(module.init).toHaveBeenCalledWith(options);
        });

        it("should not start an already started module", () => {
            let core = dcore.createOne().run();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id));
            spyOn(module, "init");
            let creator = (sb: DSandbox): DModule => module;
            core.register(id, creator);

            core.start(id);
            core.start(id);

            expect(module.init).toHaveBeenCalledTimes(1);
        });

        it("should start a module with another instance", () => {
            let core = dcore.createOne().run();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id));
            spyOn(module, "init");
            let creator = (sb: DSandbox): DModule => module;
            core.register(id, creator);

            core.start(id);
            core.start(id, { instanceId: "test2" });

            expect(module.init).toHaveBeenCalledTimes(2);
        });

        it("should not throw when stop not started module", () => {
            let core = dcore.createOne();

            expect(() => core.stop("")).not.toThrow();
        });

        it("should stop a module", () => {
            let core = dcore.createOne().run();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id));
            spyOn(module, "destroy");
            let creator = (sb: DSandbox): DModule => module;
            core.register(id, creator);
            core.start(id);

            core.stop(id);

            expect(module.destroy).toHaveBeenCalledTimes(1);
        });

        it("should stop a module having multiple instances", () => {
            let core = dcore.createOne().run();
            let id = "testModule";
            let module = getModule(new core.Sandbox(core, id));
            spyOn(module, "destroy");
            let creator = (sb: DSandbox): DModule => module;
            core.register(id, creator);
            core.start(id);
            core.start(id, { instanceId: "another" });

            core.stop(id);
            core.stop(id, "another");

            expect(module.destroy).toHaveBeenCalledTimes(2);
        });
    });

    describe("Communication", () => {
        it("should add subscriber", (done: DoneFn) => {
            let core = dcore.createOne().run();
            let subscriber = {
                onPublish: (data?: any): void => undefined
            };
            spyOn(subscriber, "onPublish");
            let topics = ["change", "destroy"];

            core.subscribe(topics, subscriber.onPublish);

            topics.forEach(topic => core.publish(topic, 1));
            setTimeout(() => {
                expect(subscriber.onPublish).toHaveBeenCalledTimes(2);
                expect(subscriber.onPublish).toHaveBeenCalledWith(topics[0], 1);
                expect(subscriber.onPublish).toHaveBeenCalledWith(topics[1], 1);
                done();
            }, 100);
        });

        it("should remove subscriber", () => {
            let core = dcore.createOne().run();
            let subscriber = {
                onPublish: (data?: any): void => undefined
            };
            spyOn(subscriber, "onPublish");
            let topics = ["change", "destroy"];

            let token = core.subscribe(topics, subscriber.onPublish);
            token.destroy();
            topics.forEach(topic => core.publish(topic, 1));

            expect(subscriber.onPublish).not.toHaveBeenCalled();
        });

        it("should remove subscriber per topic", (done: DoneFn) => {
            let core = dcore.createOne().run();
            let subscriber = {
                onPublish: (data?: any): void => undefined
            };
            spyOn(subscriber, "onPublish");
            let topics = ["change", "destroy"];

            let token = core.subscribe(topics, subscriber.onPublish);
            token.destroy("change");
            topics.forEach(topic => core.publish(topic, 1));
            setTimeout(() => {
                expect(subscriber.onPublish).toHaveBeenCalledTimes(1);
                expect(subscriber.onPublish).toHaveBeenCalledWith("destroy", 1);
                done();
            }, 100);
        });
    });

    describe("Hooks", () => {
        it("should throw when hook with invalid type", () => {
            let core = dcore.createOne();
            let hook = () => {
                core.hook(null, () => { return; });
            };

            expect(hook).toThrow();
        });

        it("should throw when hook with invalid plugin", () => {
            let core = dcore.createOne();
            let hook = () => {
                core.hook(dcore.HookType.Core_DOMReady, null);
            };

            expect(hook).toThrow();
        });

        it("should run plugin when hook into DOMReady", () => {
            let core = dcore.createOne();
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(dcore.HookType.Core_DOMReady, mock.plugin);

            core.run();
            document.dispatchEvent(new Event("DOMContentLoaded"));

            expect(mock.plugin).toHaveBeenCalledTimes(1);
        });

        it("should run plugin when hook into module destroy", () => {
            let moduleID = "module";
            let core = dcore.createOne().run();
            let module = getModule(new core.Sandbox(core, moduleID));
            let creator = (sb: DSandbox): DModule => module;
            core.register(moduleID, creator);
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(dcore.HookType.Core_ModuleDestroy, mock.plugin);

            core.start(moduleID);
            core.stop(moduleID);

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(moduleID, undefined);
        });

        it("should run plugin when hook into module init", () => {
            let moduleID = "module";
            let core = dcore.createOne().run();
            let module = getModule(new core.Sandbox(core, moduleID));
            let creator = (sb: DSandbox): DModule => module;
            core.register(moduleID, creator);
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(dcore.HookType.Core_ModuleInit, mock.plugin);

            core.start(moduleID);
            core.start(moduleID);

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(moduleID, {});
        });

        it("should run plugin when hook into module register", () => {
            let moduleID = "module";
            let core = dcore.createOne().run();
            let module = getModule(new core.Sandbox(core, moduleID));
            let creator = (sb: DSandbox): DModule => module;
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(dcore.HookType.Core_ModuleRegister, mock.plugin);

            core.register(moduleID, creator);

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(moduleID, creator);
        });

        it("should run plugin when hook into publish", () => {
            let core = dcore.createOne().run();
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(dcore.HookType.Core_Publish, mock.plugin);
            let message = "hello";
            let type = "test";
            core.subscribe([type], () => { return; });

            core.publish(type, message);

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(type, message);
        });

        it("should run plugin when hook into subscribe", () => {
            let core = dcore.createOne().run();
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(dcore.HookType.Core_Subscribe, mock.plugin);
            let topic = "test";

            core.subscribe([topic], () => { return; });

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith([topic]);
        });

        it("should run plugin when hook into unsubscribe", () => {
            let core = dcore.createOne().run();
            let mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(dcore.HookType.Core_Unsubscribe, mock.plugin);
            let topic = "test";

            let token = core.subscribe([topic], () => { return; });
            token.destroy();

            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(topic);
        });

        it("should not throw when plugin execution failed", () => {
            let core = dcore.createOne().run();
            let mock = {
                plugin: (): void => { throw new Error(); }
            };
            spyOn(mock, "plugin").and.callThrough();
            core.hook(dcore.HookType.Core_Subscribe, mock.plugin);

            expect(() => core.subscribe(["test"], () => { return; })).not.toThrow();
            expect(mock.plugin).toHaveBeenCalledTimes(1);
        });
    });
});