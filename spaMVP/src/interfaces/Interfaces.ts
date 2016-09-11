interface Element {
    trigger(): boolean;
    hasEvent(name: string): boolean;
    detach(): boolean;
    events: boolean;
}

namespace spaMVP {
    "use strict";

    export interface Module {
        init(options: any): void;
        destroy(): void;
    }

    export interface RouteConfig {
        defaultUrl: string;
        registerRoute(pattern: string, callback: (routeParams: any) => void): void;
        startRoute(hash: string): void;
        getRoutes(): string[];
        hasRoutes(): boolean;
    }

    export interface Equatable<T> {
        equals(other: T): boolean;
        hash(): number;
    }

    export namespace Hidden {
        export interface RouteToken {
            name: string;
            isDynamic: boolean;
        }

        export interface QueryParam {
            key: string;
            value: string;
        }
    }
}