namespace spaMVP.Hidden {
    "use strict";

    export interface QueryParam {
        key: string;
        value: string;
    }

    /**
     *  @class UrlHash - Represents the string after "#" in a url.
     *  @property {String} value - The string after # in a url.
     *  @property {Array} tokens - The array of string tokens after splitint its value by / (slash).
     *  @property {Array} queryParams - The array of key-value pairs parsed from the query string in its value.
     */
    export class UrlHash {
        private questionMarkIndex: number = -1;
        private url: string = "";
        public tokens: string[] = [];
        public queryParams: QueryParam[] = [];

        get value(): string {
            return this.url;
        }

        set value(url: string) {
            url = url || "";
            this.url = url;
            this.questionMarkIndex = url.indexOf("?");
            this.queryParams = [];
            this.tokens = [];
            this.populateQueryParams();
            this.populateTokens();
        }

        private anyQueryParams(): boolean {
            return this.questionMarkIndex > -1;
        }

        private populateQueryParams(): void {
            if (!this.anyQueryParams()) {
                return;
            }

            this.queryParams = this.value
                .substring(this.questionMarkIndex + 1)
                .split("&")
                .map(keyValuePairString => this.parseQueryParam(keyValuePairString));
        }

        private parseQueryParam(keyValuePair: string): QueryParam {
            let args = keyValuePair.split("=");
            return {
                key: args[0],
                value: args[1] || ""
            };
        }

        private populateTokens(): void {
            let valueWithoutQuery = this.getValueWithoutQuery();
            this.tokens = valueWithoutQuery
                .split("/")
                .filter(token => token !== "");
        }

        private getValueWithoutQuery(): string {
            if (!this.anyQueryParams()) {
                return this.value;
            }

            return this.value.substring(0, this.value.length - (this.value.length - this.questionMarkIndex));
        }
    }
}