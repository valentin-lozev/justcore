declare global {
	namespace justcore {

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

		export interface Core {
			version: Readonly<string>;
			extensions: Readonly<string[]>;
			modules: Readonly<string[]>;
			runningModules: Readonly<{ [id: string]: string[]; }>;
			Sandbox: SandboxClass;

			use(extensions: Extension[]): void;
			createHook<T extends Func>(type: HookType, method: T, context?: any): T & Hook;
			init(onInit?: Func<void>): void;

			addModule(id: string, factory: ModuleFactory): void;
			startModule(id: string, options?: ModuleStartOptions): void;
			stopModule(id: string, instanceId?: string): void;

			onMessage(type: string, handler: MessageHandler): Unsubscribe;
			publishAsync<T extends Message>(message: T): void;
		}

		export interface SandboxClass {
			new(core: Core, moduleId: string, instanceId: string): Sandbox;
		}

		export interface Sandbox {
			moduleId: Readonly<string>;
			instanceId: Readonly<string>;
			_extensionsOnlyCore: Readonly<Core>;

			startModule(id: string, options?: ModuleStartOptions): void;
			stopModule(id: string, instanceId?: string): void;
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

export const Core: justcore.CoreClass;