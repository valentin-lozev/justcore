namespace dcore {
    "use strict";
    
    import _privateData = _private;

    interface ModulesMap {
        [id: string]: {
            create: (sb: DSandbox) => DModule<any>,
            instances: { [instanceId: string]: DModule<any>; }
        };
    }

    function isDocumentReady(): boolean {
        return document.readyState === "complete" ||
            document.readyState === "interactive" ||
            document.readyState === "loaded"; /* old safari browsers */
    }

    let hasOwnProperty = Object.prototype.hasOwnProperty;

    class DefaultCore implements DCore {

        public Sandbox: DSandboxConstructor;

        private mediator: DMediator;
        private modules: ModulesMap = {};
        private beforeRunAction: Function;
        private state: DCoreState;

        constructor(isDebug = true, mediator: DMediator = new _privateData.DefaultMediator()) {
            this.Sandbox = _privateData.DefaultSandbox;
            this.mediator = mediator;
            this.state = {
                isDebug: isDebug,
                isRunning: false
            };
        }

        /**
         *  Gets current core's state.
         */
        getState(): DCoreState {
            return <any>Object.assign({}, this.state);
        }

        /**
         *  Update current core's state by merging the provided object to the current state.
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
         *  @param {Array} topics Array of topics to subscribe for.
         *  @param {Function} handler The message handler.
         *  @returns {Object}
         */
        subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken {
            return this.mediator.subscribe(topics, handler);
        }

        /**
         *  Publishes a message.
         *  @param {String} topic The topic of the message.
         *  @param {*} message The message.
         */
        publish(topic: string, message: any): void {
            this.mediator.publish(topic, message);
        }

        /**
         *  Registers a module.
         *  @param {string} moduleId
         *  @param {function} moduleFactory Function which provides an instance of the module.
         */
        register(moduleId: string, moduleFactory: (sb: DSandbox) => DModule<any>): void {
            _privateData.argumentGuard("register(): ")
                .mustBeNonEmptyString(moduleId, "module id must be a non empty string")
                .mustBeUndefined(this.modules[moduleId], `module with such id has been already registered - ${moduleId}`);

            let tempModule = moduleFactory(new this.Sandbox(this, moduleId, moduleId));
            _privateData.argumentGuard("register(): ")
                .mustBeFunction(tempModule.init, "module must implement init method")
                .mustBeFunction(tempModule.destroy, "module must implement destroy method");

            this.modules[moduleId] = {
                create: moduleFactory,
                instances: {}
            };
        }

        /**
         *  Starts an instance of given module and initializes it.
         *  @param {string} moduleId Id of the module which must be started.
         *  @param {object} [props] Optional. Module properties.
         */
        start<TProps>(moduleId: string, props?: DModuleProps & TProps): void {
            let module = this.modules[moduleId];
            _privateData.argumentGuard("start(): ")
                .mustBeDefined(module, `module not found - ${moduleId}`);

            let instanceId = props && props.instanceId ? props.instanceId : moduleId;
            if (hasOwnProperty.call(module.instances, instanceId)) {
                // already initialized
                return;
            }

            let instance = module.create(new this.Sandbox(this, moduleId, instanceId));
            module.instances[instanceId] = instance;
            instance.init(props);
        }

        /**
         *  Stops a given module.
         *  @param {string} moduleId Id of the module which must be stopped.
         *  @param {string} [instanceId] Specific module's instance id.
         */
        stop(moduleId: string, instanceId?: string): void {
            let module = this.modules[moduleId];
            let id = instanceId || moduleId;
            if (!module || !hasOwnProperty.call(module.instances, id)) {
                console.warn(`stop(): "${moduleId}" destroy failed. "${instanceId}" instance not found.`);
                return;
            }

            try {
                module.instances[id].destroy();
            } catch (err) {
                console.error(`stop(): "${moduleId}" destroy failed. An error has occured within the module`);
                console.error(err);
            } finally {
                delete module.instances[id];
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
         *  @param {Function} [action] Optional. A setup action executed before core run.
         */
        run(action?: () => void): void {
            if (this.state.isRunning) {
                return;
            }

            this.beforeRunAction = action;
            if (isDocumentReady()) {
                this._onDomReady(null);
            } else {
                this._onDomReady = this._onDomReady.bind(this);
                document.addEventListener("DOMContentLoaded", this._onDomReady);
            }
        }

        private _onDomReady(ev: Event): void {
            document.removeEventListener("DOMContentLoaded", this._onDomReady);

            this.state.isRunning = true;
            if (typeof this.beforeRunAction === "function") {
                this.beforeRunAction();
            }
        }
    }

    /**
     *  Creates an application core instance.
     */
    export function createOne(isDebug = true, mediator: DMediator = new _privateData.DefaultMediator()): DCore {
        return new DefaultCore(isDebug, mediator);
    }
}