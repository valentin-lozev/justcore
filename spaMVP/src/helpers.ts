namespace spaMVP.helpers {
    "use strict";

    export function typeGuard(expected: string, value: any, errorMsg: string): void {
        let toThrow = false;
        switch (expected) {
            case "array": toThrow = !Array.isArray(value); break;
            default: toThrow = typeof value !== expected || value === null;
        }

        if (toThrow) {
            throw new TypeError(errorMsg);
        }
    }
}