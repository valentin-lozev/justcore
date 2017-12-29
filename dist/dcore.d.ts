declare global {
	interface ObjectConstructor {
		assign(target: Object, ...objects: Object[]): Object;
	}

	namespace dcore {
		export interface Func<T = any> {
			(...args: any[]): T;
		}

		export interface FuncWithPipeline extends Func {
			_withPipeline: boolean;
			_hook: LifecycleHook;
		}

		export interface PluginsMap {
			onCoreInit(this: Core, next: Func<void>): void;
			onMessageSubscribe(this: Core, next: Func<Unsubscribe>, messageType: string, handler: MessageHandler): Unsubscribe;
			onMessagePublish<T extends Message>(this: Core, next: Func<void>, message: T): void;

			onModuleAdd(this: Core, next: Func<void>, id: string, factory: ModuleFactory): void;
			onModuleStart(this: Core, next: Func<void>, id: string, options?: ModuleStartOptions): void;
			onModuleStop(this: Core, next: Func<void>, id: string, instanceId?: string): void;
			onModuleInit(this: Module, next: Func<void>, props?: { [key: string]: any; }): void;
			onModuleDestroy(this: Module, next: Func<void>): void;
		}

		export type LifecycleHook = keyof PluginsMap;

		export interface Extension {
			name: string;
			install: (dcore: Core) => Partial<PluginsMap>;
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

		export interface ModuleFactory {
			(sandbox: Sandbox): Module;
		}

		export interface Module {
			sandbox: Sandbox;
			messages?: string[];
			init(props?: { [key: string]: any; }): void;
			destroy(): void;
			handleMessage?(message: Message): void;
		}

		export interface ModuleStartOptions {
			instanceId?: string;
			props?: { [key: string]: any; };
		}

		export interface SandboxClass {
			new(dcore: Core, moduleId: string, instanceId: string): Sandbox;
		}

		export interface Sandbox {
			moduleId: Readonly<string>;
			instanceId: Readonly<string>;
			_extensionsOnlyCore: Readonly<Core>;

			startModule(id: string, options?: ModuleStartOptions): void;
			stopModule(id: string, instanceId?: string): void;
			publishAsync<T extends Message>(message: T): void;
		}

		export interface CoreClass {
			new(): Core;
		}

		export interface Core {
			version: Readonly<string>;
			Sandbox: SandboxClass;

			use(extensions: Extension[]): void;
			createPipeline<T extends Func>(hook: LifecycleHook, method: T): T & FuncWithPipeline;
			init(onInit?: Func<void>): void;

			addModule(id: string, factory: ModuleFactory): void;
			startModule(id: string, options?: ModuleStartOptions): void;
			stopModule(id: string, instanceId?: string): void;

			onMessage(messageType: string, handler: MessageHandler): Unsubscribe;
			publishAsync<T extends Message>(message: T): void;

			listExtensions(): string[];
			listModules(): string[];
			listRunningModules(): { [id: string]: string[]; };
		}
	}
}

export const DCore: dcore.CoreClass;