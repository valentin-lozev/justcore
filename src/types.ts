/** 
 *  @license dcore.js
 *  Copyright © 2017 Valentin Lozev 
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 *  Source code: http://github.com/valentin-lozev/dcore
 */

// Production steps of ECMA-262, Edition 5, 15.4.4.22
// Reference: http://es5.github.io/#x15.4.4.22
if (typeof Array.prototype.reduceRight !== 'function') {
    Array.prototype.reduceRight = function (callback /*, initialValue*/) {
        'use strict';
        if (null === this || 'undefined' === typeof this) {
            throw new TypeError('Array.prototype.reduce called on null or undefined');
        }
        if ('function' !== typeof callback) {
            throw new TypeError(callback + ' is not a function');
        }
        var t = Object(this), len = t.length >>> 0, k = len - 1, value;
        if (arguments.length >= 2) {
            value = arguments[1];
        } else {
            while (k >= 0 && !(k in t)) {
                k--;
            }
            if (k < 0) {
                throw new TypeError('Reduce of empty array with no initial value');
            }
            value = t[k--];
        }
        for (; k >= 0; k--) {
            if (k in t) {
                value = callback(value, t[k], k, t);
            }
        }
        return value;
    };
}

declare type DPlugin<TResponse> = (next: (...args: any[]) => TResponse, ...args: any[]) => TResponse;

interface DSubscriptionToken {
    destroy(topic?: string): void;
}

interface DCore {
    Sandbox: DSandboxConstructor;

    subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken;
    publish(topic: string, message: any): void;

    register(moduleId: string, moduleFactory: (sb: DSandbox) => DModule<any>): void;
    start<TProps>(moduleId: string, props?: DModuleProps & TProps): void;
    stop(moduleId: string, instanceId?: string): void;
    listModules(): string[];

    hook<TResponse>(hookName: string, plugin: DPlugin<TResponse>): void;
    pipe<TResponse>(hookName: string, hookInvoker: (...args: any[]) => TResponse, hookContext: any, ...args: any[]): TResponse;

    run(action?: Function): void;
}

interface DModule<TProps> {
    init<TProps>(props?: DModuleProps & TProps): void;
    destroy(): void;
}

interface DModuleProps {
    instanceId?: string;
}

interface DSandboxConstructor {
    new (core: DCore, moduleId: string, moduleInstanceId: string): DSandbox;
}

interface DSandbox {
    getModuleId(): string;
    getModuleInstanceId(): string;

    subscribe(topic: string, handler: (topic: string, message: any) => void): DSubscriptionToken;
    subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken;
    publish(topic: string, message: any): void;

    start<TProps>(moduleId: string, props?: DModuleProps & TProps): void;
    stop(moduleId: string, instanceId?: string): void;
}