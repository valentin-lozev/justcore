/**
 * @module Core
 */

declare global {
    namespace jc {

        /** A simplified typing of generic function. */
        export interface Func<T = any> {
            (...args: any[]): T;
        }

        /** A helper interface that holds all supported lifecycle hooks. */
        export interface PluginsMap {
            /** Invoked when [[Core.init]] */
            onCoreInit(this: Core, next: Func<void>): void;

            /** Invoked when [[Core.onMessage]] */
            onMessageSubscribe(this: Core, next: Func<Unsubscribe>, messageType: string, handler: MessageHandler): Unsubscribe;

            /** Invoked when [[Core.publishAsync]] */
            onMessagePublish<T extends Message>(this: Core, next: Func<void>, message: T): void;

            /** Invoked when [[Core.addModule]] */
            onModuleAdd(this: Core, next: Func<void>, id: string, factory: ModuleFactory): void;

            /** Invoked when [[Core.startModule]] */
            onModuleStart(this: Core, next: Func<void>, id: string, options?: ModuleStartOptions): void;

            /** Invoked when [[Core.stopModule]] */
            onModuleStop(this: Core, next: Func<void>, id: string, instanceId?: string): void;

            /** Invoked when [[Module.init]] */
            onModuleInit<TProps = {}>(this: Module, next: Func<void>, props?: TProps): void;

            /** Invoked when [[Module.moduleWillSubscribe]] */
            onModuleSubscribe(this: Module, next: Func<string[]>): string[];

            /** Invoked when [[Module.moduleDidReceiveMessage]] */
            onModuleReceiveMessage<T extends Message>(this: Module, next: Func<void>, message: T): void;

            /** Invoked when [[Module.moduleDidReceiveProps]] */
            onModuleReceiveProps<TProps = {}>(this: Module, next: Func<void>, nextProps: TProps): void;

            /** Invoked when [[Module.destroy]] */
            onModuleDestroy(this: Module, next: Func<void>): void;
        }

        /** Props that are added to methods created as hooks. */
        export interface HookProps {
            /** Helper flag for testing. */
            _withPipeline: true;

            /** Type of the hook. */
            _hookType: HookType;
        }

        /** One of the the supported hooks' keys. See [[PluginsMap]] */
        export type HookType = keyof PluginsMap;

        /** A piece of code that extends the core. */
        export interface Extension {
			/** 
			 * An unique name of the extension that will distinguish your extension from the rest. 
			 * It will be used for logging too.
			 */
            name: string;

			/** 
			 * A callback that will be invoked on core init.
			 * Here you can extend the core, the prototype of the core's Sandbox class or
			 * you can plug into some of the lifecycle hooks by returning an object that has
			 * hook types as keys and plugins as values.
			 */
            install: (core: Core) => Partial<PluginsMap>;
        }

        /** The core's function constructor. */
        export interface CoreClass {
            new(): Core;
        }

        /**
         * A mediator object that hooks everything together and runs your application.
         */
        export interface Core {
            /** Returns current justcore's version. */
            version: Readonly<string>;

            /** Lists all installed extensions. */
            extensions: Readonly<string[]>;

            /** Lists all added module ids. */
            modules: Readonly<string[]>;

            /** Lists all running module instances by their id. */
            runningModules: Readonly<{ [id: string]: string[]; }>;

            /** The Sandbox class that will be used when core creates sandbox instances. */
            Sandbox: SandboxClass;

            /** Schedules a list of extensions for installation. */
            use(extensions: Extension[]): void;

            /** Creates a hook from given method. */
            createHook<T extends Func>(type: HookType, method: T, context?: any): T & HookProps;

            /** Initializes the core. */
            init(onInit?: Func<void>): void;

            /** Adds a module. */
            addModule(id: string, factory: ModuleFactory): void;

            /** Starts an instance of given module and initializes it. */
            startModule(id: string, options?: ModuleStartOptions): void;

            /** Stops a given module instance. */
            stopModule(id: string, instanceId?: string): void;

            /** Subscribes for messages of given type. */
            onMessage(type: string, handler: MessageHandler): Unsubscribe;

			/** 
			 * Publishes a message asynchronously 
			 * by scheduling (setTimeout) each message handler to the event loop.
			 * That async behavior gives us the following benefits:
			 * 
			 * - Each message handler is invoked in dedicated call stack;
			 * 
			 * - Loose coupling between publishers and handlers. 
			 *   If you somehow rely on the publishAsync's result, your modules don't work independently from each other.
			 *   
			 * - Process of tracing messages won't suffer when message handlers depth increases.
			 *   Because of the event loop's nature in javascript,
			 *	 each message will be published to all of its handlers first even though some of the handlers might publish a new message along the way,
			 *	 e.g. lets say:
			 *	 - Module "A" publishes message "M1"
			 *	 - Module "B" subscribes for message "M1" and publishes a new message "M2" when message "M1" comes
			 *	 - Module "C" subscribes for message "M1"
			 *	 - Module "D" subscribes for message "M2"
			 *	 
			 *	 When Module "A" publishes its message "M1", the order of the handlers invoked will be:
			 *	 
			 *	 Module "B" -> Module "C" -> Module "D".
			 */
            publishAsync<T extends Message>(message: T): void;
        }

        /** The sandbox's function constructor. */
        export interface SandboxClass {
            new(core: Core, moduleId: string, instanceId: string): Sandbox;
        }

        /**
         *  Connects the modules to the outside world. A facade of the core.
         */
        export interface Sandbox {
            /** Id of the module that it serves for. */
            moduleId: Readonly<string>;

            /** Instance id of the module that it serves for. */
            instanceId: Readonly<string>;

            /** A reference to the core. It should be used only by extensions. */
            _extensionsOnlyCore: Readonly<Core>;

            /** See [[Core.startModule]] */
            startModule(id: string, options?: ModuleStartOptions): void;

            /** See [[Core.stopModule]] */
            stopModule(id: string, instanceId?: string): void;

            /** See [[Core.publishAsync]] */
            publishAsync<T extends Message>(message: T): void;
        }

        /** A function that accepts a sandbox instance and creates a module for it. */
        export interface ModuleFactory {
            (sandbox: Sandbox): Module;
        }

		/** 
		 * An object that represents a part of your domain.
		 * It contains business logic related to its particular job.
		 */
        export interface Module<TProps = {}> {
            /** The sandbox instance that serves the module. */
            sandbox: Sandbox;

            /** A lifecycle hook that is called when something starts the module. */
            init(props?: TProps): void;

            /** A lifecycle hook that determines what messages the module should subscribe for. */
            moduleWillSubscribe?(): string[];

            /** A lifecycle hook that is called when the module receives a message. */
            moduleDidReceiveMessage?<T extends Message = Message>(message: T): void;

            /** A lifecycle hook that is called when the module has already been started and something tries to start it again. */
            moduleDidReceiveProps?(nextProps: TProps): void;

            /** A lifecycle hook that is called when something stops the module. */
            destroy(): void;
        }

        /** Options that can be passed to the core when it starts a module. */
        export interface ModuleStartOptions<TProps = {}> {
			/** 
			 * An id that will distinguish module instances.
			 * If not provided, the module id will be used by default.
			 */
            instanceId?: string;

            /** Properties that will be passed to the module's init method. */
            props?: TProps;
        }

        /** A function that subscribes for given message. */
        export interface MessageHandler<T extends Message = Message> {
            (message: T): void;
        }

        /** An object with data that modules can publish. */
        export interface Message {
            /** The type of the message. */
            type: string;
        }

		/** 
		 * A function that is returned when you subscribe for given message by invoking [[Core.onMessage]], e.g. in an extension.
		 * Caling the function will unsubscribe you.
		 */
        export interface Unsubscribe {
            (): void;
        }
    }
}

/** The main module that justcore exports. */
export const Core: jc.CoreClass;