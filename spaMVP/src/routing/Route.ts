namespace spaMVP {
    "use strict";

    let routeParamRegex = /{([a-zA-Z]+)}/; // e.g {id}

    export interface RouteToken {
        name: string;
        isDynamic: boolean;
    }

    /**
     *  @class Route - Accepts a pattern and split it by / (slash).
     *  It also supports dynamic params - {yourDynamicParam}.
     *  @property {String} pattern
     */
    export class Route {
        private callback: (routeParams: any) => void;
        private tokens: RouteToken[] = [];
        public pattern: string;

        constructor(pattern: string, onStart: (routeParams: any) => void) {
            if (typeof pattern === "undefined" ||
                typeof pattern !== "string" ||
                pattern === null) {
                throw new Error("Route pattern should be non empty string.");
            }

            this.pattern = pattern;
            this.callback = onStart;
            this.populateTokens();
        }

        /**
         *  The array of tokens after its pattern is splitted by / (slash).
         */
        getTokens(): RouteToken[] {
            return this.tokens.slice(0);
        }

        /**
         *  Determines whether it equals UrlHash.
         */
        equals(hashUrl: UrlHash): boolean {
            if (this.tokens.length !== hashUrl.tokens.length) {
                return false;
            }

            for (let i = 0, len = this.tokens.length; i < len; i++) {
                let token = this.tokens[i];
                let urlToken = hashUrl.tokens[i];
                if (token.isDynamic) {
                    continue;
                }

                if (token.name.toLowerCase() !== urlToken.toLowerCase()) {
                    return false;
                }
            }

            return true;
        }

        /**
         *  Populate the dynamic params from the UrlHash if such exist
         *  and executes the registered callback.
         */
        start(urlHash: UrlHash): void {
            let queryParams = this.getParamsFromUrl(urlHash);
            if (this.callback) {
                this.callback(queryParams);
            }
        }

        private populateTokens(): void {
            this.tokens = [];
            this.pattern.split("/").forEach((urlFragment: string) => {
                if (urlFragment !== "") {
                    this.tokens.push(this.parseToken(urlFragment));
                }
            });
        }

        private parseToken(urlFragment: string): RouteToken {
            let paramMatchGroups = routeParamRegex.exec(urlFragment);
            let isDynamic = !!paramMatchGroups;
            return {
                name: isDynamic ? paramMatchGroups[1] : urlFragment,
                isDynamic: isDynamic
            };
        }

        private getParamsFromUrl(url: UrlHash): Object {
            let result = this.getQueryParamsFromUrl(url);
            // route params are with higher priority than query params
            this.tokens.forEach((token, index) => {
                if (token.isDynamic) {
                    result[token.name] = url.tokens[index];
                }
            });

            return result;
        }

        private getQueryParamsFromUrl(url: UrlHash): Object {
            let result = {};
            url.queryParams.forEach((param: QueryParam) => result[param.key] = param.value);
            return result;
        }
    }
}