declare interface ObjectConstructor {
    assign(target: Object, ...objects: Object[]): Object;
}

if (typeof Object.assign != 'function') {
    Object.assign = function (target, varArgs) { // .length of function is 2
        'use strict';
        if (target == null) { // TypeError if undefined or null
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];

            if (nextSource != null) { // Skip over if undefined or null
                for (var nextKey in nextSource) {
                    // Avoid bugs when hasOwnProperty is shadowed
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

interface DMediator {
    subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken;
    publish(topic: string, message: any): void;
}

interface DSubscriptionToken {
    destroy(topic?: string): void;
}

interface DCore {
    Sandbox: DSandboxConstructor;
    getState(): DCoreState;
    setState<TState extends keyof DCoreState>(value: Pick<DCoreState, TState>): void;
    
    subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken;
    publish(topic: string, message: any): void;

    register(moduleId: string, moduleFactory: (sb: DSandbox) => DModule<any>): void;
    start<TProps>(moduleId: string, props?: DModuleProps & TProps): void;
    stop(moduleId: string, instanceId?: string): void;
    listModules(): string[];
    
    run(action?: Function): void;
}

interface DCoreState {
    isRunning: boolean;
    isDebug: boolean;
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
    
    getAppState(): DCoreState;
    setAppState<TState extends keyof DCoreState>(value: Pick<DCoreState, TState>): void;

    subscribe(topic: string, handler: (topic: string, message: any) => void): DSubscriptionToken;
    subscribe(topics: string[], handler: (topic: string, message: any) => void): DSubscriptionToken;
    publish(topic: string, message: any): void;

    start<TProps>(moduleId: string, props?: DModuleProps & TProps): void;
    stop(moduleId: string, instanceId?: string): void;
}