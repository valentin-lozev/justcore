const errorCodes = {
    m1: () => "use(): extensions must be installed before init",
    m2: () => "use(): extensions must be passed as an array",
    m3: () => "use(): extension must be an object",
    m4: () => "use(): extension name must be a non empty string",
    m5: id => `use(): "${id}" install must be a function`,
    m6: id => `use(): "${id}" has already been used`,
    m7: () => "init(): core has already been initialized",
    m8: () => "addModule(): id must be a non empty string",
    m9: id => `addModule(): "${id}" has already been added`,
    m10: id => `addModule(): "${id}" factory must be a function`,
    m11: () => "startModule(): core must be initialized first",
    m12: id => `startModule(): "${id}" not found`,
    m13: id => `startModule(): "${id}"'s sandbox property must be a Sandbox instance`,
    m14: id => `startModule(): "${id}" init hook must be defined`,
    m15: id => `startModule(): "${id}" destroy hook must be defined`,
    m16: () => "createHook(): type must be a non empty string",
    m17: id => `createHook(): "${id}" method must be a function`,
    m18: () => "addPlugin(): hook type must be a non empty string",
    m19: id => `addPlugin(): "${id}" plugin must be a function`,
    m20: () => "onMessage(): message type must be a non empty string",
    m21: id => `onMessage(): "${id}" handler should be a function`,
    m22: () => "publishAsync(): message must be an object",
    m23: id => `"${id}" moduleDidReceiveMessage hook must be defined in order to subscribe`,
    m24: () => "addService(): key must be a non empty string",
    m25: key => `addService(): "${key}" has already been added`,
    m26: key => `addService(): "${key}" factory must be a function that returns service instance`,
    m27: key => `getService(): ${key} service not found`,
};

type ErrorCode = keyof typeof errorCodes;

function throwError(code: ErrorCode, formatId?: string): void {
    const msgCreator = errorCodes[code] as (...args: any[]) => string;
    throw new Error(msgCreator(formatId));
}

class ArgumentGuard {
    public array(arg: any[], code: ErrorCode, formatId?: string): this {
        if (!Array.isArray(arg)) { throwError(code, formatId); }
        return this;
    }

    public object(arg: any, code: ErrorCode, formatId?: string): this {
        if (typeof arg !== "object" || arg === null) { throwError(code, formatId); }
        return this;
    }

    public function(arg: (...args: any[]) => any, code: ErrorCode, formatId?: string): this {
        if (typeof arg !== "function") { throwError(code, formatId); }
        return this;
    }

    public nonEmptyString(arg: string, code: ErrorCode, formatId?: string): this {
        if (typeof arg !== "string" || !arg.length) { throwError(code, formatId); }
        return this;
    }

    public true(arg: boolean, code: ErrorCode, formatId?: string): this {
        if (!arg) { throwError(code, formatId); }
        return this;
    }

    public false(arg: boolean, code: ErrorCode, formatId?: string): this {
        if (arg) { throwError(code, formatId); }
        return this;
    }
}

export const guard = new ArgumentGuard();

export function isDocumentReady(): boolean {
    const state = document.readyState;
    return state === "complete" ||
        state === "interactive" ||
        state as string === "loaded"; /* old safari browsers */
}

export const hasOwnProperty = Object.prototype.hasOwnProperty;

let lastUID = 0;

export function uid(): number {
    return ++lastUID;
}