import { guard } from "../utils";

interface Plugin extends dcore.Func {
	(next: () => any, ...args: any[]): any;
}

/**
 *  Encapsulates hooks behavior that is private to dcore.
 */
export class HooksBehavior {

	private _plugins: { [hookName: string]: Plugin[]; } = Object.create(null);

	createPipeline<T extends dcore.Func>(hook: dcore.LifecycleHook, method: T): T & dcore.FuncWithPipeline {
		guard
			.nonEmptyString(hook, "decorate(): hook must be a non empty string")
			.function(method, `decorate(): "${hook}" method must be a function`);

		const pipelineContext = this;
		const result = function (...args: any[]): any {
			const plugins = pipelineContext._plugins[hook];
			if (!plugins) {
				return method.apply(this, args);
			}

			return plugins.reduceRight(
				(pipeline, plugin) => () => plugin.apply(this, [pipeline, ...args]),
				() => method.apply(this, args)
			)();
		} as T & dcore.FuncWithPipeline;

		result._withPipeline = true;
		result._hook = hook;
		return result;
	}

	addPlugin(hook: dcore.LifecycleHook, plugin: Plugin): void {
		guard
			.nonEmptyString(hook, "addPlugin(): hook must be a non empty string")
			.function(plugin, `addPlugin(): plugin must be a function`);

		(this._plugins[hook] || (this._plugins[hook] = [])).push(plugin);
	}
}