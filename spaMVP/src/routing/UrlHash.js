var spaMVP;
(function (spaMVP) {
    /**
     *  @class UrlHash - Represents the string after '#' in a url.
     *  @property {String} value - The string after # in a url.
     *  @property {Array} tokens - The array of string tokens after splitint its value by / (slash).
     *  @property {Array} queryParams - The array of key-value pairs parsed from the query string in its value.
     */
    var UrlHash = (function () {
        function UrlHash() {
            this.questionMarkIndex = -1;
            this.url = '';
            this.tokens = [];
            this.queryParams = [];
        }
        Object.defineProperty(UrlHash.prototype, "value", {
            get: function () {
                return this.url;
            },
            set: function (url) {
                url = url || '';
                this.url = url;
                this.questionMarkIndex = url.indexOf('?');
                this.queryParams = [];
                this.tokens = [];
                this.populateQueryParams();
                this.populateTokens();
            },
            enumerable: true,
            configurable: true
        });
        UrlHash.prototype.anyQueryParams = function () {
            return this.questionMarkIndex > -1;
        };
        UrlHash.prototype.populateQueryParams = function () {
            var _this = this;
            if (!this.anyQueryParams()) {
                return;
            }
            this.queryParams = this.value
                .substring(this.questionMarkIndex + 1)
                .split('&')
                .map(function (keyValuePairString) { return _this.parseQueryParam(keyValuePairString); });
        };
        UrlHash.prototype.parseQueryParam = function (keyValuePair) {
            var args = keyValuePair.split('=');
            return {
                key: args[0],
                value: args[1] || ''
            };
        };
        UrlHash.prototype.populateTokens = function () {
            var valueWithoutQuery = this.getValueWithoutQuery();
            this.tokens = valueWithoutQuery
                .split('/')
                .filter(function (token) { return token !== ''; });
        };
        UrlHash.prototype.getValueWithoutQuery = function () {
            if (!this.anyQueryParams()) {
                return this.value;
            }
            return this.value.substring(0, this.value.length - (this.value.length - this.questionMarkIndex));
        };
        return UrlHash;
    }());
    spaMVP.UrlHash = UrlHash;
})(spaMVP || (spaMVP = {}));
//# sourceMappingURL=UrlHash.js.map