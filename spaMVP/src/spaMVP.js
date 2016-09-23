var spaMVP;
(function (spaMVP) {
    "use strict";
    delete spaMVP.Hidden;
    /**
     *  Returns the application core.
     * @param {function} [sandboxType] - Optional. Sandbox type which the application will use.
     * @returns {Core}
     */
    function createCore(sandboxType) {
        return new spaMVP.Core(sandboxType);
    }
    spaMVP.createCore = createCore;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=spaMVP.js.map