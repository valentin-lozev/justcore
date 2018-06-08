export class Sandbox implements jc.Sandbox {

	public _extensionsOnlyCore: Readonly<jc.Core>;
	private _moduleId: string;
	private _instanceId: string;

	constructor(core: jc.Core, moduleId: string, instanceId: string) {
		this._extensionsOnlyCore = core;
		this._moduleId = moduleId;
		this._instanceId = instanceId;
	}

	get moduleId(): string {
		return this._moduleId;
	}

	get instanceId(): string {
		return this._instanceId;
	}

	public startModule(id: string, options?: jc.ModuleStartOptions): void {
		this._extensionsOnlyCore.startModule(id, options);
	}

	public stopModule(id: string, instanceId?: string): void {
		this._extensionsOnlyCore.stopModule(id, instanceId);
	}

	public publishAsync<T extends jc.Message>(message: T): void {
		this._extensionsOnlyCore.publishAsync(message);
	}
}