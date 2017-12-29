/**
 *  Connects the modules to the outside world. Facade of dcore.
 */
export class Sandbox implements dcore.Sandbox {

	_extensionsOnlyCore: Readonly<dcore.Core>;
	private _moduleId: string;
	private _instanceId: string;

	constructor(dcore: dcore.Core, moduleId: string, instanceId: string) {
		this._extensionsOnlyCore = dcore;
		this._moduleId = moduleId;
		this._instanceId = instanceId;
	}

	get moduleId(): string {
		return this._moduleId;
	}

	get instanceId(): string {
		return this._instanceId;
	}

	/**
	 *  Starts an instance of given module and initializes it.
	 */
	startModule(id: string, options?: dcore.ModuleStartOptions): void {
		this._extensionsOnlyCore.startModule(id, options);
	}

	/**
	 *  Stops a given module instance.
	 */
	stopModule(id: string, instanceId?: string): void {
		this._extensionsOnlyCore.stopModule(id, instanceId);
	}

	/**
	 *  Publishes a message asynchronously.
	 */
	publishAsync<T extends dcore.Message>(message: T): void {
		this._extensionsOnlyCore.publishAsync(message);
	}
}