/// <reference path="/scripts/jasmine.js" />
/// <reference path="../../spamvp/src/core.js" />
/// <reference path="../../spamvp/src/sandbox/sandbox.js" />

describe('Sandbox', function ()
{
    var sandbox = null, mock = null, core = null; hasModuleStarted = false;

    beforeAll(function () {
        core = new spaMVP._private.Core();
        sandbox = new spaMVP.Sandbox(core);
        mock = {
            action: function () { },
            otherAction: function () { }
        };
        spyOn(mock, 'action');
        spyOn(mock, 'otherAction');
    });

    it('should have observer methods', function () {
        expect(typeof sandbox.subscribe).toEqual('function');
        expect(typeof sandbox.unsubscribe).toEqual('function');
        expect(typeof sandbox.publish).toEqual('function');
    });

    it('should check for invalid params before subscribe', function ()
    {
        var eventTypesNotAnArray = function () {
            sandbox.subscribe('custom', mock.action, mock);
        };
        var handlerNotAFunction = function ()
        {
            sandbox.subscribe(['custom'], null, mock);
        };
        
        expect(eventTypesNotAnArray).toThrow();
        expect(handlerNotAFunction).toThrow();
    });

    it('should subscribe', function () {
        var validParams = function () {
            sandbox.subscribe(['custom', 'change'], mock.action, mock);
            sandbox.subscribe(['custom', 'change'], mock.otherAction, mock);
        };

        expect(validParams).not.toThrow();
    });

    it('should publish events', function ()
    {
        sandbox.publish('custom', 123);
        sandbox.publish('custom', null);
        sandbox.publish('change', 'X');
        sandbox.publish('change', [1]);

        expect(mock.action).toHaveBeenCalledWith('custom', 123);
        expect(mock.otherAction).toHaveBeenCalledWith('custom', 123);

        expect(mock.action).toHaveBeenCalledWith('custom', null);
        expect(mock.otherAction).toHaveBeenCalledWith('custom', null);

        expect(mock.action).toHaveBeenCalledWith('change', 'X');
        expect(mock.otherAction).toHaveBeenCalledWith('change', 'X');

        expect(mock.action).toHaveBeenCalledWith('change', [1]);
        expect(mock.otherAction).toHaveBeenCalledWith('change', [1]);
    });

    it('should unsubscribe', function ()
    {
        var result = 0,
            justMock = {
                increaseBy1: function () { result++; },
                increaseBy10: function () { result += 10; }
            };

        sandbox.subscribe(['custom', 'change'], justMock.increaseBy1, justMock);
        sandbox.subscribe(['custom', 'change'], justMock.increaseBy10, justMock);
        sandbox.publish('custom', null);
        sandbox.publish('change', null);

        sandbox.unsubscribe(['custom', 'change'], justMock.increaseBy1, justMock);
        sandbox.unsubscribe(['custom', 'change'], justMock.increaseBy10, justMock);
        sandbox.publish('custom', null);
        sandbox.publish('change', null);

        expect(result).toEqual(22);
    });

    it('should be able to add services in its core by providing valid parameters', function () {
        var serviceId = 'testService';       
        expect(function () { core.addService(serviceId, null); }).toThrow();
        expect(function () { core.addService(serviceId, 3); }).toThrow();
        expect(function () { core.addService(serviceId, 'invalid factory'); }).toThrow();
        expect(function () { core.addService('', function () { }); }).toThrow();
        expect(function () { core.addService(null, function () { }); }).toThrow();

        expect(function () {
            core.addService(serviceId, function (sb) {
                var obj = {};
                obj.success = function () { return sb instanceof spaMVP.Sandbox; };
                return obj;
            });
        }).not.toThrow();
    });

    it('should be able to get services from its core', function () {
        var serviceId = 'testService';

        var service = sandbox.getService(serviceId);
        var differentInstance = sandbox.getService(serviceId);

        expect(function () { sandbox.getService('unknown'); }).toThrow();
        expect(service).toBeDefined();
        expect(differentInstance).toBeDefined();
        expect(service.success()).toBeTruthy();
        expect(service === differentInstance).not.toBeTruthy();
    });

    it('should be able to start modules from its core by providing valid parameters', function () {
        var moduleId = 'testModule';
        expect(function () { core.register(moduleId, null); }).toThrow();
        expect(function () { core.register(moduleId, 3); }).toThrow();
        expect(function () { core.register('', function () { }); }).toThrow();
        expect(function () { core.register(null, function () { }); }).toThrow();
        expect(function () { core.register(moduleId, 'invalid factory'); }).toThrow();
        expect(function () {
            core.register(moduleId, function (sb) {
                return {
                    destroy: function () { }
                };
            });
        }).toThrow();
        expect(function () {
            core.register(moduleId, function (sb) {
                return {
                    init: function () { }
                };
            });
        }).toThrow();

        var validModuleFactory = function () {
            core.register(moduleId, function (sb) {
                return {
                    init: function () {
                        hasModuleStarted = sb instanceof spaMVP.Sandbox;
                    },
                    destroy: function () { hasModuleStarted = false; }
                };
            });
        };
        expect(validModuleFactory).not.toThrow();
        expect(validModuleFactory).toThrow();

        sandbox.startModule(moduleId);
        expect(hasModuleStarted).toBeTruthy();
    });

    it('should be able to stop modules from its core', function () {
        var moduleId = 'testModule';
        sandbox.stopModule(moduleId);

        expect(hasModuleStarted).toBeFalsy();
    });
});