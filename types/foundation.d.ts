declare class Bundle {
    static readonly native: Bundle
    static readonly js: Bundle
    resourcePath(name: string, type?: string, inDirectory?: string): string | undefined
    resourceURL(name: string, type?: string, inDirectory?: string): URL | undefined
}

declare class Data {
    constructor(value?: ArrayBufferLike | {
        utf8String?: string,
        base64EncodedData?: Data,
        base64EncodedString?: string,
    })
    arrayBuffer(): ArrayBufferLike
    utf8String(): string | undefined
    base64EncodedData(): Data
    base64EncodedString(): string
    mutable(): MutableData
}

declare class MutableData extends Data {
    constructor(value?: ArrayBufferLike | {
        utf8String?: string,
        base64EncodedData?: Data,
        base64EncodedString?: string,
    })
    appendData(data: Data): void
    appendArrayBuffer(arrayBuffer: ArrayBufferLike): void
    setData(data: Data): void
    immutable(): Data
}

declare class DispatchQueue {
    static readonly main: DispatchQueue
    static readonly global: DispatchQueue
    constructor(identifier?: string)
    async(asyncBlock: () => void): void
    asyncAfter(delayInSeconds: number, asyncBlock: () => void): void
    isolate(isolateBlock: () => void, ...arguments: any[]): void
}

declare class FileManager {
    static readonly defaultManager: FileManager
    static readonly documentDirectory: string
    static readonly libraryDirectory: string
    static readonly cacheDirectory: string
    static readonly temporaryDirectory: string
    static readonly jsBundleDirectory: string
    subpaths(atPath: string, deepSearch?: boolean): string[]
    createDirectory(atPath: string, withIntermediateDirectories: boolean): Error | undefined
    createFile(atPath: string, data: Data): Error | undefined
    readFile(atPath: string): Data | undefined
    removeItem(atPath: string): Error | undefined
    copyItem(atPath: string, toPath: string): Error | undefined
    moveItem(atPath: string, toPath: string): Error | undefined
    fileExists(atPath: string): boolean
    dirExists(atPath: string): boolean
}

declare class Timer {
    constructor(timeInterval: number, block: () => void, repeats: boolean)
    readonly valid: boolean
    fire(): void
    invalidate(): void
}

declare class URL {
    static URLWithString(string: string, baseURL?: URL): URL | undefined
    static fileURLWithPath(path: string): URL | undefined
    readonly absoluteString: string
}

declare class URLRequest {
    constructor(aURL: URL | string, cachePolicy?: URLRequestCachePolicy, timeout?: number)
    readonly HTTPMethod: string | undefined
    readonly URL: URL
    readonly allHTTPHeaderFields: { [key: string]: any } | undefined
    valueForHTTPHeaderField(field: string): any | undefined
    readonly HTTPBody: Data | undefined
    mutable(): MutableURLRequest
}

declare class MutableURLRequest extends URLRequest {
    constructor(aURL: URL | string, cachePolicy?: URLRequestCachePolicy, timeout?: number)
    HTTPMethod: string | undefined
    allHTTPHeaderFields: { [key: string]: any } | undefined
    setValueForHTTPHeaderField(value: string, field: string): void
    HTTPBody: Data | undefined
    immutable(): URLRequest
}

declare enum URLRequestCachePolicy {
    useProtocol,
    ignoringLocalCache,
    returnCacheElseLoad,
    returnCacheDontLoad,
}

declare class URLResponse {
    readonly URL: URL | undefined
    readonly expectedContentLength: number
    readonly MIMEType: string | undefined
    readonly textEncodingName: string | undefined
    readonly statusCode: number
    readonly allHeaderFields: { [key: string]: any }
}

declare class URLSession {
    static readonly shared: URLSession
    dataTask(req: string | URL | URLRequest, complete: (data?: Data, response?: URLResponse, error?: Error) => void): URLSessionTask
}

declare class URLSessionTask {
    readonly state: URLSessionTaskState
    readonly countOfBytesExpectedToReceive: number
    readonly countOfBytesReceived: number
    readonly countOfBytesExpectedToSend: number
    readonly countOfBytesSent: number
    cancel(): void
    resume(): void
}

declare enum URLSessionTaskState {
    running,
    suspended,
    cancelling,
    completed,
}

declare class UserDefaults {
    static readonly standard: UserDefaults
    constructor(suiteName?: string)
    valueForKey(forKey: string): any | undefined
    setValue(value: any, forKey: string): void
    reset(): void
}

declare class UUID {
    constructor(UUIDString?: string)
    readonly UUIDString: string
}