namespace spaMVP {
    "use strict";

    delete spaMVP.helpers;

    /**
     *  Returns the application core.
     * @param {function} [sandboxType] - Optional. Sandbox type which the application will use.
     * @returns {Core}
     */
    export function createCore(sandboxType?: SandboxConstructor): Core {
        return new Core(sandboxType);
    }
}