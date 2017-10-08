/** 
 *  @license dcore.js
 *  Copyright © 2017 Valentin Lozev 
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *  Source code: http://github.com/valentin-lozev/dcore
 */

// Production steps of ECMA-262, Edition 5, 15.4.4.22
// Reference: http://es5.github.io/#x15.4.4.22
if (typeof Array.prototype.reduceRight !== 'function') {
  Array.prototype.reduceRight = function (callback /*, initialValue*/) {
    'use strict';
    if (null === this || 'undefined' === typeof this) {
      throw new TypeError('Array.prototype.reduce called on null or undefined');
    }
    if ('function' !== typeof callback) {
      throw new TypeError(callback + ' is not a function');
    }
    var t = Object(this), len = t.length >>> 0, k = len - 1, value;
    if (arguments.length >= 2) {
      value = arguments[1];
    } else {
      while (k >= 0 && !(k in t)) {
        k--;
      }
      if (k < 0) {
        throw new TypeError('Reduce of empty array with no initial value');
      }
      value = t[k--];
    }
    for (; k >= 0; k--) {
      if (k in t) {
        value = callback(value, t[k], k, t);
      }
    }
    return value;
  };
}

declare type DPlugin<TResponse> = (next: () => TResponse, ...args: any[]) => TResponse;

interface DSubscriptionToken {
  destroy(topic?: string): void;
}

interface DCore {
  Sandbox: DSandboxConstructor;
  pipeline: dcore._private.DPluginsPipeline;
  messages: dcore._private.DMessagesAggregator;

  register(moduleId: string, moduleFactory: (sb: DSandbox) => DModule): void;
  start(moduleId: string, props?: DModuleProps): void;
  stop(moduleId: string, instanceId?: string): void;
  listModules(): string[];
  run(action?: Function): void;
}

interface DModule {
  init(props?: DModuleProps): void;
  destroy(): void;
}

interface DModuleProps {
  instanceId?: string;
}

interface DSandboxConstructor {
  new (core: DCore, moduleId: string, moduleInstanceId: string): DSandbox;
}

interface DSandbox {
  getModuleId(): string;
  getModuleInstanceId(): string;

  subscribe(topic: string, handler: (topic: string, message: any) => void): DSubscriptionToken;
  subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken;
  publish(topic: string, message: any): void;

  start(moduleId: string, props?: DModuleProps): void;
  stop(moduleId: string, instanceId?: string): void;
}
namespace dcore._private {
    "use strict";

    class DArgumentGuard {

        constructor(private errorMsgPrefix = "") {
        }

        mustBeTrue(arg: boolean, msg: string): this {
            if (!arg) throw new Error(this.errorMsgPrefix + msg);
            return this;
        }

        mustBeDefined(arg: any, msg: string): this {
            if (typeof arg === "undefined" || arg === null) throw new Error(this.errorMsgPrefix + msg);
            return this;
        }

        mustBeUndefined(arg: any, msg: string): this {
            if (typeof arg !== "undefined" && arg !== null) throw new Error(this.errorMsgPrefix + msg);
            return this;
        }

        mustBeNonEmptyString(arg: string, msg: string): this {
            if (typeof arg !== "string" || !arg.length) throw new Error(this.errorMsgPrefix + msg);
            return this;
        }

        mustBeFunction(arg: Function, msg: string): this {
            if (typeof arg !== "function") throw new Error(this.errorMsgPrefix + msg);
            return this;
        }

        mustBeArray(arg: any[], msg: string): this {
            if (!Array.isArray(arg)) throw new Error(this.errorMsgPrefix + msg);
            return this;
        }
    }

    export function argumentGuard(errorMsgPrefix = ""): DArgumentGuard {
        return new DArgumentGuard(errorMsgPrefix);
    }
}
namespace dcore._private {
  "use strict";

  interface SubscribersMap {
    [topic: string]: { [tokenId: string]: Function; };
  }

  const hasOwnProperty = Object.prototype.hasOwnProperty;

  let lastUsedSubscriptionID = 0;

  export class DMessagesAggregator {

    private subscribers: SubscribersMap = {};

    /**
     *  Subscribes for given topics.
     */
    subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken {
      argumentGuard("subscribe(): ")
        .mustBeFunction(handler, "message handler should be a function.")
        .mustBeArray(topics, "topics should be passed as an array of strings.");

      const token = {};
      topics.forEach(topic => token[topic] = this.__addSubscriber(topic, handler));

      const that = this;
      return {
        destroy: function (topic?: string): void {
          if (arguments.length > 0) {
            that.__unsubscribe(topic, token);
            return;
          }

          Object.keys(token).forEach(topic => that.__unsubscribe(topic, token));
        }
      };
    }

    /**
     *  Publishes a message asynchronously.
     */
    publish(topic: string, message: any): void {
      if (!hasOwnProperty.call(this.subscribers, topic)) {
        return;
      }

      const subscriptions = this.subscribers[topic];
      Object.keys(subscriptions).forEach(key => {
        const handler = subscriptions[key];
        setTimeout(() => {
          try {
            handler(topic, message);
          } catch (err) {
            console.error(`publish(): Receive "${topic}" message failed.`);
            console.error(err);
            console.error(`Handler:`);
            console.error(handler);
          }
        }, 0);
      });
    }

    private __addSubscriber(topic: string, handler: Function): string {
      if (!hasOwnProperty.call(this.subscribers, topic)) {
        this.subscribers[topic] = {};
      }

      const subscriptionID = "sbscrptn" + (++lastUsedSubscriptionID);
      this.subscribers[topic][subscriptionID] = handler;
      return subscriptionID;
    }

    private __unsubscribe(topic: string, token: { [topic: string]: string; }): void {
      if (!hasOwnProperty.call(token, topic)) {
        return;
      }

      const subscriptionID = token[topic];
      delete this.subscribers[topic][subscriptionID];
    }
  }
}
namespace dcore._private {
  "use strict";

  interface PluginsMap {
    [hook: string]: DPlugin<any>[];
  }

  export class DPluginsPipeline {

    private pluginsMap: PluginsMap = {};

    /**
     *  Hooks a plugin to given hook name from dcore.hooks constants.
     */
    hook<TResponse>(hookName: string, plugin: DPlugin<TResponse>): void {
      argumentGuard("hook(): ")
        .mustBeNonEmptyString(hookName, "hook name must be a non empty string")
        .mustBeFunction(plugin, "plugin must be a function");

      let list = this.pluginsMap[hookName];
      if (!list) {
        this.pluginsMap[hookName] = list = [];
      }

      list.push(plugin);
    }

    /**
     *  Runs all plugins for given hook as pipeline.
     *  It is useful when you want to provide hooks in your own plugin.
     */
    pipe<TResponse>(
      hookName: string,
      hookInvoker: (...args: any[]) => TResponse,
      hookContext: any,
      ...args: any[]): TResponse {

      argumentGuard("pipe(): ")
        .mustBeFunction(hookInvoker, "hook invoker must be a function");

      let pipeline = (this.pluginsMap[hookName] || [])
        .slice(0)
        .reduceRight(function (next, pipeline): () => TResponse {
          return function (): TResponse {
            return pipeline.apply(hookContext, [next].concat(args));
          };
        }, () => hookInvoker.apply(hookContext, args));

      const result = pipeline(null);
      pipeline = null;
      return result;
    }
  }
}
namespace dcore.hooks {
  "use strict";

  export const SANDBOX_SUBSCRIBE = "sandbox.subscribe";
  export const SANDBOX_PUBLISH = "sandbox.publish";
  export const SANDBOX_START = "sandbox.start";
  export const SANDBOX_STOP = "sandbox.stop";
}

namespace dcore {
  "use strict";

  import _privateData = _private;

  /**
   *  Connects the modules to the outside world. Facade of the core.
   */
  export class Sandbox implements DSandbox {

    private core: DCore;
    private moduleId: string;
    private moduleInstanceId: string;

    constructor(core: DCore, moduleId: string, moduleInstanceId: string) {
      _privateData.argumentGuard("DefaultSandbox: ")
        .mustBeDefined(core, "core must be provided")
        .mustBeNonEmptyString(moduleId, "module id must be a non empty string")
        .mustBeNonEmptyString(moduleInstanceId, "module instance id must be a non empty string");

      this.core = core;
      this.moduleId = moduleId;
      this.moduleInstanceId = moduleInstanceId;
    }

    /**
     *  Gets the module id it serves for.
     */
    getModuleId(): string {
      return this.moduleId;
    }

    /**
     *  Gets the module instance id it serves for.
     */
    getModuleInstanceId(): string {
      return this.moduleInstanceId;
    }

    /**
     *  Subscribes for given topics.
     */
    subscribe(topic: string, handler: (topic: string, message: any) => void): DSubscriptionToken;
    subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken;
    subscribe(topics: any, handler: (topic: string, message: any) => void): DSubscriptionToken {
      return this.core.pipeline.pipe(
        hooks.SANDBOX_SUBSCRIBE,
        this.__subscribe,
        this,
        Array.isArray(topics) ? topics : [topics], handler);
    }

    /**
     *  Publishes a message asynchronously.
     */
    publish(topic: string, message: any): void {
      this.core.pipeline.pipe(
        hooks.SANDBOX_PUBLISH,
        this.__publish,
        this,
        topic, message);
    }

    /**
     *  Starts an instance of given module and initializes it.
     */
    start(moduleId: string, props?: DModuleProps): void {
      this.core.pipeline.pipe(
        hooks.SANDBOX_START,
        this.__start,
        this,
        moduleId, props);
    }

    /**
     *  Stops a given module.
     */
    stop(moduleId: string, instanceId?: string): void {
      this.core.pipeline.pipe(
        hooks.SANDBOX_STOP,
        this.__stop,
        this,
        moduleId, instanceId);
    }

    private __subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken {
      return this.core.messages.subscribe(topics, handler);
    }

    private __publish(topic: string, message: any): void {
      this.core.messages.publish(topic, message);
    }

    private __start(moduleId: string, props?: DModuleProps): void {
      this.core.start(moduleId, props);
    }

    private __stop(moduleId: string, instanceId?: string): void {
      this.core.stop(moduleId, instanceId);
    }
  }
}
namespace dcore {
  "use strict";

  import _privateData = _private;
  delete dcore._private; // comment before run unit tests

  export namespace hooks {
    export const CORE_REGISTER = "core.register";
    export const CORE_RUN = "core.run";
    export const MODULE_INIT = "module.init";
    export const MODULE_DESTROY = "module.destroy";
  }

  interface ModuleData {
    create: (sb: DSandbox) => DModule;
    instances: {
      [instanceId: string]: {
        module: DModule;
        sb: DSandbox;
      };
    };
  }

  interface ModulesMap {
    [id: string]: ModuleData;
  }

  function isDocumentReady(): boolean {
    return document.readyState === "complete" ||
      document.readyState === "interactive" ||
      document.readyState === "loaded"; /* old safari browsers */
  }

  const hasOwnProperty = Object.prototype.hasOwnProperty;

  /**
   *  A mediator between the modules and base libraries.
   */
  export class Application implements DCore {

    public Sandbox: DSandboxConstructor;
    public pipeline: _privateData.DPluginsPipeline;
    public messages: _privateData.DMessagesAggregator;

    private modules: ModulesMap = {};
    private onApplicationRun: Function;
    private isRunning: boolean;

    constructor() {
      this.Sandbox = Sandbox;
      this.pipeline = new _privateData.DPluginsPipeline();
      this.messages = new _privateData.DMessagesAggregator();
      this.isRunning = false;
    }

    /**
     *  Registers a module.
     */
    register(moduleId: string, moduleFactory: (sb: DSandbox) => DModule): void {
      _privateData.argumentGuard("register(): ")
        .mustBeNonEmptyString(moduleId, "module id must be a non empty string")
        .mustBeUndefined(this.modules[moduleId], `module with such id has been already registered - ${moduleId}`)
        .mustBeFunction(moduleFactory, "module factory must be a function");

      this.pipeline.pipe(
        hooks.CORE_REGISTER,
        this.__register,
        this,
        moduleId, moduleFactory);
    }

    /**
     *  Starts an instance of given module and initializes it.
     */
    start(moduleId: string, props?: DModuleProps): void {
      const moduleData = this.modules[moduleId];
      _privateData.argumentGuard("start(): ")
        .mustBeDefined(moduleData, `module not found - ${moduleId}`);

      const instanceId = props && props.instanceId ? props.instanceId : moduleId;
      const alreadyInitialized = hasOwnProperty.call(moduleData.instances, instanceId);
      if (alreadyInitialized) {
        return;
      }

      try {
        this.__startModule(moduleId, instanceId, moduleData, props);
      } catch (err) {
        delete moduleData.instances[instanceId];
        console.error(`start(): "${moduleId}" instance init failed`);
        console.error(err);
      }
    }

    /**
     *  Stops a given module.
     */
    stop(moduleId: string, instanceId?: string): void {
      const moduleData = this.modules[moduleId];
      const id = instanceId || moduleId;
      if (!moduleData || !hasOwnProperty.call(moduleData.instances, id)) {
        console.warn(`stop(): "${moduleId}" destroy failed. "${instanceId}" instance not found.`);
        return;
      }

      const data = moduleData.instances[id];
      try {
        this.pipeline.pipe(
          hooks.MODULE_DESTROY,
          data.module.destroy,
          data.module,
          data.sb);
      } catch (err) {
        console.error(`stop(): an error has occured during "${moduleId}" destroy`);
        console.error(err);
      } finally {
        delete moduleData.instances[id];
        data.module = data.sb = null;
      }
    }

    /**
     *  Lists all registered module ids.
     */
    listModules(): string[] {
      return Object.keys(this.modules);
    }

    /**
     *  Runs the core.
     */
    run(onRunCallback?: Function): void {
      if (this.isRunning) {
        return;
      }

      this.onApplicationRun = onRunCallback;
      if (isDocumentReady()) {
        this.__onDomReady(null);
      } else {
        this.__onDomReady = this.__onDomReady.bind(this);
        document.addEventListener("DOMContentLoaded", this.__onDomReady);
      }
    }

    private __onDomReady(ev: Event): void {
      document.removeEventListener("DOMContentLoaded", this.__onDomReady);
      this.isRunning = true;
      if (typeof this.onApplicationRun === "function") {
        try {
          this.onApplicationRun();
        } catch (err) {
          console.error(`run(): onRunCallback failed`);
          console.error(err);
        }
      }

      delete this.onApplicationRun;
      this.pipeline.pipe(hooks.CORE_RUN, function (): void { }, this);
    }

    private __register(moduleId: string, moduleFactory: (sb: DSandbox) => DModule): void {
      this.modules[moduleId] = {
        create: moduleFactory,
        instances: {}
      };
    }

    private __startModule(
      moduleId: string,
      instanceId: string,
      moduleData: ModuleData,
      props?: DModuleProps): void {

      props = props || { instanceId: instanceId };
      const sb = new this.Sandbox(this, moduleId, instanceId);
      const instance = moduleData.create(sb);

      _privateData.argumentGuard("start(): ")
        .mustBeFunction(instance.init, "module must implement init method")
        .mustBeFunction(instance.destroy, "module must implement destroy method");

      moduleData.instances[instanceId] = {
        module: instance,
        sb: sb
      };

      this.pipeline.pipe(
        hooks.MODULE_INIT,
        function (this: DModule, props?: DModuleProps): void {
          this.init(props);
        },
        instance,
        props, sb);
    }
  }
}