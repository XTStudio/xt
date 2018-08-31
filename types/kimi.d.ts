declare class KMCore {
    static version: string
}

declare class console {
    static log(message?: any, ...optionalParams: any[]): void;
    static info(message?: any, ...optionalParams: any[]): void;
    static warn(message?: any, ...optionalParams: any[]): void;
    static error(message?: any, ...optionalParams: any[]): void;
    static debug(message?: any, ...optionalParams: any[]): void;
}

declare var global: { [key: string]: any }