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
        create: (sb: DSandbox) => DModule<any>;
        instances: {
            [instanceId: string]: {
                module: DModule<any>;
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

        private pluginsPipeline: _privateData.DPluginsPipeline;
        private messagesAggregator: _privateData.DMessagesAggregator;
        private modules: ModulesMap = {};
        private onApplicationRun: Function;
        private state: DCoreState;

        constructor(isDebug = true) {
            this.Sandbox = Sandbox;
            this.pluginsPipeline = new _privateData.DPluginsPipeline();
            this.messagesAggregator = new _privateData.DMessagesAggregator();
            this.state = {
                isDebug: isDebug,
                isRunning: false
            };
        }

        /**
         *  Gets current state.
         */
        getState(): Readonly<DCoreState> {
            return <any>Object.assign({}, this.state);
        }

        /**
         *  Update current state by merging the provided object to the current state.
         *  Also, "isRunning" and "isDebug" are being skipped.
         *  "isRunning" is used internaly, "isDebug" can be set only on first initialization.
         */
        setState<TState extends keyof DCoreState>(value: Pick<DCoreState, TState>): void {
            if (typeof value === "object") {
                value.isRunning = this.state.isRunning;
                value.isDebug = this.state.isDebug;
                this.state = <any>Object.assign({}, this.state, <any>value);
            }
        }

        /**
         *  Subscribes for given topics.
         */
        subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken {
            return this.messagesAggregator.subscribe(topics, handler);
        }

        /**
         *  Publishes a message asynchronously.
         */
        publish(topic: string, message: any): void {
            this.messagesAggregator.publish(topic, message);
        }

        /**
         *  Registers a module.
         */
        register(moduleId: string, moduleFactory: (sb: DSandbox) => DModule<any>): void {
            _privateData.argumentGuard("register(): ")
                .mustBeNonEmptyString(moduleId, "module id must be a non empty string")
                .mustBeUndefined(this.modules[moduleId], `module with such id has been already registered - ${moduleId}`);

            let tempModule = moduleFactory(new this.Sandbox(this, moduleId, moduleId));
            _privateData.argumentGuard("register(): ")
                .mustBeFunction(tempModule.init, "module must implement init method")
                .mustBeFunction(tempModule.destroy, "module must implement destroy method");

            this.pluginsPipeline.pipe(
                hooks.CORE_REGISTER,
                this.__register,
                this,
                moduleId, moduleFactory);
        }

        /**
         *  Starts an instance of given module and initializes it.
         */
        start<TProps>(moduleId: string, props?: DModuleProps & TProps): void {
            let moduleData = this.modules[moduleId];
            _privateData.argumentGuard("start(): ")
                .mustBeDefined(moduleData, `module not found - ${moduleId}`);

            let instanceId = props && props.instanceId ? props.instanceId : moduleId;
            let alreadyInitialized = hasOwnProperty.call(moduleData.instances, instanceId);
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
            let moduleData = this.modules[moduleId];
            let id = instanceId || moduleId;
            if (!moduleData || !hasOwnProperty.call(moduleData.instances, id)) {
                console.warn(`stop(): "${moduleId}" destroy failed. "${instanceId}" instance not found.`);
                return;
            }

            let data = moduleData.instances[id];
            try {
                this.pluginsPipeline.pipe(
                    hooks.MODULE_DESTROY,
                    data.module.destroy,
                    data.module,
                    data.sb);
            } catch (err) {
                console.error(`stop(): "${moduleId}" destroy failed. An error has occured within the module`);
                console.error(err);
            } finally {
                delete moduleData.instances[id];
                data = data.module = data.sb = null;
            }
        }

        /**
         *  Lists all registered module ids.
         */
        listModules(): string[] {
            return Object.keys(this.modules);
        }

        /**
         *  Hooks a plugin to given hook name from dcore.hooks constants.
         */
        hook<TResponse>(hookName: string, plugin: DPlugin<TResponse>): void {
            this.pluginsPipeline.hook(hookName, plugin);
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
            return this.pluginsPipeline.pipe.apply(
                this.pluginsPipeline,
                [hookName, hookInvoker, hookContext].concat(args));
        }

        /**
         *  Runs the core.
         */
        run(onRunCallback?: Function): void {
            if (this.state.isRunning) {
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
            this.state.isRunning = true;
            if (typeof this.onApplicationRun === "function") {
                try {
                    this.onApplicationRun();
                } catch (err) {
                    console.error(`run(): onRunCallback failed`);
                    console.error(err);
                }
            }

            delete this.onApplicationRun;
            this.pluginsPipeline.pipe(hooks.CORE_RUN, function (): void { }, this);
        }

        private __register(moduleId: string, moduleFactory: (sb: DSandbox) => DModule<any>): void {
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
            let sb = new this.Sandbox(this, moduleId, instanceId);
            let instance = moduleData.create(sb);
            moduleData.instances[instanceId] = {
                module: instance,
                sb: sb
            };

            this.pluginsPipeline.pipe(
                hooks.MODULE_INIT,
                function (): void {
                    instance.init(props);
                    instance = null;
                },
                instance,
                props, sb);
        }
    }
}