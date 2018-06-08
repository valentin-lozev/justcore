/**
 * @module Core
 */

declare global {
	namespace jc {

		export interface Func<T = any> {
			(...args: any[]): T;
		}

		export interface PluginsMap {
			onCoreInit(this: Core, next: Func<void>): void;
			onMessageSubscribe(this: Core, next: Func<Unsubscribe>, messageType: string, handler: MessageHandler): Unsubscribe;
			onMessagePublish<T extends Message>(this: Core, next: Func<void>, message: T): void;

			onModuleAdd(this: Core, next: Func<void>, id: string, factory: ModuleFactory): void;
			onModuleStart(this: Core, next: Func<void>, id: string, options?: ModuleStartOptions): void;
			onModuleStop(this: Core, next: Func<void>, id: string, instanceId?: string): void;
			onModuleInit<TProps = {}>(this: Module, next: Func<void>, props?: TProps): void;
			onModuleSubscribe(this: Module, next: Func<string[]>): string[];
			onModuleReceiveMessage(this: Module, next: Func<void>, message: Message): void;
			onModuleReceiveProps<TProps = {}>(this: Module, next: Func<void>, nextProps: TProps): void;
			onModuleDestroy(this: Module, next: Func<void>): void;
		}

		export interface Hook extends Func {
			_withPipeline: boolean;
			_hookType: HookType;
		}

		export type HookType = keyof PluginsMap;

		export interface Extension {
			name: string;
			install: (core: Core) => Partial<PluginsMap>;
		}

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
			createHook<T extends Func>(type: HookType, method: T, context?: any): T & Hook;

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

			/** Publishes a message. */
			publishAsync<T extends Message>(message: T): void;
		}

		export interface SandboxClass {
			new(core: Core, moduleId: string, instanceId: string): Sandbox;
		}

        /**
         *  Connects the modules to the outside world. Facade of the core.
         */
		export interface Sandbox {
			/** Id of the module that it serves for. */
			moduleId: Readonly<string>;

			/** Instance id of the module that it serves for. */
			instanceId: Readonly<string>;

			/** A reference to the core. It should be used only by extensions. */
			_extensionsOnlyCore: Readonly<Core>;

			/** Starts an instance of given module and initializes it. */
			startModule(id: string, options?: ModuleStartOptions): void;

			/** Stops a given module instance. */
			stopModule(id: string, instanceId?: string): void;

			/** Publishes a message asynchronously. */
			publishAsync<T extends Message>(message: T): void;
		}

		export interface ModuleFactory {
			(sandbox: Sandbox): Module;
		}

		export interface Module<TProps = {}> {
			sandbox: Sandbox;
			init(props?: TProps): void;
			moduleWillSubscribe?(): string[];
			moduleDidReceiveMessage?(message: Message): void;
			moduleDidReceiveProps?(nextProps: TProps): void;
			destroy(): void;
		}

		export interface ModuleStartOptions<TProps = {}> {
			instanceId?: string;
			props?: TProps;
		}

		export interface MessageHandler {
			(message: Message): void;
		}

		export interface Message {
			type: string;
		}

		export interface Unsubscribe {
			(): void;
		}
	}
}

export const Core: jc.CoreClass;