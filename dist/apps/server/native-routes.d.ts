import type { NativeRequestService } from '../../packages/pi-adapter/native-requests.js';
export declare function readNativeRoute(service: NativeRequestService, path: string, url: URL): import("../../packages/pi-adapter/native-request-types.js").NativeRequestView | import("../../packages/pi-adapter/native-request-types.js").NativeRequestList | undefined;
export declare function writeNativeRoute(service: NativeRequestService, path: string, value: unknown, key: string, signal: AbortSignal, method: string, query: string): {
    result: import("../../packages/pi-adapter/native-request-types.js").NativeSource | import("../../packages/pi-adapter/native-request-types.js").NativeRequestView | Promise<import("../../packages/pi-adapter/native-request-types.js").NativeRequestView>;
} | undefined;
