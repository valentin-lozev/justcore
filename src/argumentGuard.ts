namespace dcore._private {
    "use strict";

    class ArgumentGuard {

        constructor(private errorMsgPrefix = "") {
        }

        mustBeTrue(arg: boolean, msg: string): this {
            if (!arg) throw new Error(this.errorMsgPrefix + msg);
            return this;
        }

        mustBeDefined(arg: any, msg: string): this {
            if (typeof arg === "undefined" || arg === null) throw new Error(this.errorMsgPrefix + msg);
            return this;
        }

        mustBeUndefined(arg: any, msg: string): this {
            if (typeof arg !== "undefined" && arg !== null) throw new Error(this.errorMsgPrefix + msg);
            return this;
        }

        mustBeNonEmptyString(arg: string, msg: string): this {
            if (typeof arg !== "string" || !arg.length) throw new Error(this.errorMsgPrefix + msg);
            return this;
        }

        mustBeFunction(arg: Function, msg: string): this {
            if (typeof arg !== "function") throw new Error(this.errorMsgPrefix + msg);
            return this;
        }

        mustBeArray(arg: any[], msg: string): this {
            if (!Array.isArray(arg)) throw new Error(this.errorMsgPrefix + msg);
            return this;
        }
    }

    export function argumentGuard(errorMsgPrefix = ""): ArgumentGuard {
        return new ArgumentGuard(errorMsgPrefix);
    }
}