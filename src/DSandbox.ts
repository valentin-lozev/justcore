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