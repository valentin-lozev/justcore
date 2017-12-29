export const VERSION = "3.0.0";

class ArgumentGuard {
	array(arg: any[], msg: string): this {
		if (!Array.isArray(arg)) throw new Error(msg);
		return this;
	}

	defined(arg: any, msg: string): this {
		if (typeof arg === "undefined" || arg === null) throw new Error(msg);
		return this;
	}

	undefined(arg: any, msg: string): this {
		if (typeof arg !== "undefined" && arg !== null) throw new Error(msg);
		return this;
	}

	object(arg: any, msg: string): this {
		if (typeof arg !== "object" || arg === null) throw new Error(msg);
		return this;
	}

	function(arg: Function, msg: string): this {
		if (typeof arg !== "function") throw new Error(msg);
		return this;
	}

	nonEmptyString(arg: string, msg: string): this {
		if (typeof arg !== "string" || !arg.length) throw new Error(msg);
		return this;
	}

	true(arg: boolean, msg: string): this {
		if (!arg) throw new Error(msg);
		return this;
	}

	false(arg: boolean, msg: string): this {
		if (arg) throw new Error(msg);
		return this;
	}
}

export const guard = new ArgumentGuard();

export function isDocumentReady(): boolean {
	return document.readyState === "complete" ||
		document.readyState === "interactive" ||
		document.readyState === "loaded"; /* old safari browsers */
}

export const hasOwnProperty = Object.prototype.hasOwnProperty;

let lastUID = 0;

export function uid(): number {
	return ++lastUID;
}