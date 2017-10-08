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