/// <reference path="../../jasmine.d.ts" />
/// <chutzpah_reference path="jasmine.js" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
describe("Core", function () {
    function getOne() {
        return new spaMVP.Core();
    }
    function getModule() {
        return {
            init: function (options) { return true; },
            destroy: function () { return false; }
        };
    }
    describe("Initialization", function () {
        it("should execute an action on DOMContentLoaded", function () {
            var core = getOne();
            var spy = { action: function () { } };
            spyOn(spy, "action");
            core.run(spy.action);
            document.dispatchEvent(new Event("DOMContentLoaded"));
            expect(spy.action).toHaveBeenCalled();
        });
        it("should initialize with default sandbox type when such is not provided", function () {
            var core = getOne();
            expect(core.Sandbox).toBeDefined();
        });
        it("should initialize with custom sandbox type when such is provided", function () {
            var CustomSandbox = (function (_super) {
                __extends(CustomSandbox, _super);
                function CustomSandbox() {
                    _super.call(this, null, null);
                }
                return CustomSandbox;
            }(spaMVP.Sandbox));
            var core = new spaMVP.Core(CustomSandbox);
            expect(core.Sandbox).toBe(CustomSandbox);
        });
    });
    describe("Modules", function () {
        it("should havent any registered modules by default", function () {
            var modules = getOne().getModules();
            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(0);
        });
        it("should have validation when register", function () {
            var core = getOne();
            var validId = "testModule";
            var validCreator = function (sb) {
                return {
                    init: function () { },
                    destroy: function () { }
                };
            };
            var tests = [
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
            var core = getOne();
            var id = "testModule";
            var creator = function (sb) {
                return {
                    init: function () { },
                    destroy: function () { }
                };
            };
            core.register(id, creator);
            var modules = core.getModules();
            expect(Array.isArray(modules)).toBeTruthy();
            expect(modules.length).toEqual(1);
            expect(modules[0]).toEqual(id);
        });
        it("should throw if when module not found", function () {
            var core = getOne();
            expect(function () { return core.start("test"); }).toThrow();
        });
        it("should throw when register an already registered module", function () {
            var core = getOne();
            var id = "testModule";
            var creator = function (sb) {
                return {
                    init: function () { },
                    destroy: function () { }
                };
            };
            core.register(id, creator);
            expect(function () { return core.register(id, creator); }).toThrow();
            var modules = core.getModules();
            expect(modules.length).toEqual(1);
        });
        it("should start a module", function () {
            var core = getOne();
            var id = "testModule";
            var module = getModule();
            spyOn(module, "init");
            var creator = function (sb) { return module; };
            core.register(id, creator);
            core.start(id);
            var modules = core.getModules();
            expect(modules[0]).toEqual(id);
            expect(module.init).toHaveBeenCalledWith({});
        });
        it("should start a module with options", function () {
            var core = getOne();
            var id = "testModule";
            var module = getModule();
            spyOn(module, "init");
            var creator = function (sb) { return module; };
            core.register(id, creator);
            var options = { count: 5 };
            core.start(id, options);
            expect(module.init).toHaveBeenCalledWith(options);
        });
        it("should not start an already started module", function () {
            var core = getOne();
            var id = "testModule";
            var module = getModule();
            spyOn(module, "init");
            var creator = function (sb) { return module; };
            core.register(id, creator);
            core.start(id);
            core.start(id);
            expect(module.init).toHaveBeenCalledTimes(1);
        });
        it("should start a module with another instance", function () {
            var core = getOne();
            var id = "testModule";
            var module = getModule();
            spyOn(module, "init");
            var creator = function (sb) { return module; };
            core.register(id, creator);
            core.start(id);
            core.start(id, { instanceId: "test2" });
            expect(module.init).toHaveBeenCalledTimes(2);
        });
        it("should not throw when stop not started module", function () {
            var core = getOne();
            expect(function () { return core.stop(""); }).not.toThrow();
        });
        it("should stop a module", function () {
            var core = getOne();
            var id = "testModule";
            var module = getModule();
            spyOn(module, "destroy");
            var creator = function (sb) { return module; };
            core.register(id, creator);
            core.start(id);
            core.stop(id);
            expect(module.destroy).toHaveBeenCalledTimes(1);
        });
        it("should stop a module having multiple instances", function () {
            var core = getOne();
            var id = "testModule";
            var module = getModule();
            spyOn(module, "destroy");
            var creator = function (sb) { return module; };
            core.register(id, creator);
            core.start(id);
            core.start(id, { instanceId: "another" });
            core.stop(id);
            core.stop(id, "another");
            expect(module.destroy).toHaveBeenCalledTimes(2);
        });
    });
    describe("Communication", function () {
        it("should add subscriber", function () {
            var core = getOne();
            var subscriber = {
                onPublish: function (data) { return true; }
            };
            spyOn(subscriber, "onPublish");
            var events = ["change", "destroy"];
            core.subscribe(events, subscriber.onPublish);
            events.forEach(function (ev) { return core.publish(ev, 1); });
            expect(subscriber.onPublish).toHaveBeenCalledTimes(2);
            expect(subscriber.onPublish).toHaveBeenCalledWith(events[0], 1);
            expect(subscriber.onPublish).toHaveBeenCalledWith(events[1], 1);
        });
        it("should remove subscriber", function () {
            var core = getOne();
            var subscriber = {
                onPublish: function (data) { return true; }
            };
            spyOn(subscriber, "onPublish");
            var events = ["change", "destroy"];
            core.subscribe(events, subscriber.onPublish);
            core.unsubscribe(events, subscriber.onPublish);
            events.forEach(function (ev) { return core.publish(ev, 1); });
            expect(subscriber.onPublish).not.toHaveBeenCalled();
        });
    });
    describe("Hooks", function () {
        it("should throw when hook with invalid type", function () {
            var core = getOne();
            var hook = function () {
                core.hook(null, function () { });
            };
            expect(hook).toThrow();
        });
        it("should throw when hook with invalid plugin", function () {
            var core = getOne();
            var hook = function () {
                core.hook(spaMVP.HookType.SPA_DOMReady, null);
            };
            expect(hook).toThrow();
        });
        it("should run plugin when hook into DOMReady", function () {
            var core = getOne();
            var mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_DOMReady, mock.plugin);
            core.run();
            document.dispatchEvent(new Event("DOMContentLoaded"));
            expect(mock.plugin).toHaveBeenCalledTimes(1);
        });
        it("should run plugin when hook into module destroy", function () {
            var core = getOne();
            var module = getModule();
            var creator = function (sb) { return module; };
            var moduleID = "module";
            core.register(moduleID, creator);
            var mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_ModuleDestroy, mock.plugin);
            core.start(moduleID);
            core.stop(moduleID);
            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(moduleID, undefined);
        });
        it("should run plugin when hook into module init", function () {
            var core = getOne();
            var module = getModule();
            var creator = function (sb) { return module; };
            var moduleID = "module";
            core.register(moduleID, creator);
            var mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_ModuleInit, mock.plugin);
            core.start(moduleID);
            core.start(moduleID);
            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(moduleID, {});
        });
        it("should run plugin when hook into module register", function () {
            var core = getOne();
            var module = getModule();
            var creator = function (sb) { return module; };
            var moduleID = "module";
            var mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_ModuleRegister, mock.plugin);
            core.register(moduleID, creator);
            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(moduleID, creator);
        });
        it("should run plugin when hook into publish", function () {
            var core = getOne();
            var mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_Publish, mock.plugin);
            var message = "hello";
            var type = "test";
            core.subscribe([type], function () { });
            core.publish(type, message);
            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith(type, message);
        });
        it("should run plugin when hook into subscribe", function () {
            var core = getOne();
            var mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_Subscribe, mock.plugin);
            var type = "test";
            core.subscribe([type], function () { });
            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith([type]);
        });
        it("should run plugin when hook into unsubscribe", function () {
            var core = getOne();
            var mock = jasmine.createSpyObj("mock", ["plugin"]);
            core.hook(spaMVP.HookType.SPA_Unsubscribe, mock.plugin);
            var type = "test";
            core.subscribe([type], function () { });
            core.unsubscribe([type], function () { });
            expect(mock.plugin).toHaveBeenCalledTimes(1);
            expect(mock.plugin).toHaveBeenCalledWith([type]);
        });
        it("should not throw when plugin execution failed", function () {
            var core = getOne();
            var mock = {
                plugin: function () { throw new Error(); }
            };
            spyOn(mock, "plugin").and.callThrough();
            core.hook(spaMVP.HookType.SPA_Subscribe, mock.plugin);
            expect(function () { return core.subscribe(["test"], function () { }); }).not.toThrow();
            expect(mock.plugin).toHaveBeenCalledTimes(1);
        });
    });
});
//# sourceMappingURL=Core-tests.js.map