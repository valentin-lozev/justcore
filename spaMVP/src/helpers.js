var spaMVP;
(function (spaMVP) {
    var Hidden;
    (function (Hidden) {
        "use strict";
        function typeGuard(expected, value, errorMsg) {
            var toThrow = false;
            switch (expected) {
                case "array":
                    toThrow = !Array.isArray(value);
                    break;
                default: toThrow = typeof value !== expected || value === null;
            }
            if (toThrow) {
                throw new TypeError(errorMsg);
            }
        }
        Hidden.typeGuard = typeGuard;
    })(Hidden = spaMVP.Hidden || (spaMVP.Hidden = {}));
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=helpers.js.map