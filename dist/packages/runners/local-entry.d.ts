import type { ResearchContract } from '../domain/types.js';
import type { LocalRuntime } from './local-runtime.js';
export declare const LOCAL_ENTRY_HINT = "\u5165\u53E3\u5FC5\u987B\u51C6\u786E\u5BF9\u5E94\u5DF2\u6279\u51C6\u6E90\u7801\u6E05\u5355\u4E2D\u7684\u811A\u672C\u3002Python \u4EC5\u652F\u6301\u72EC\u7ACB\u524D\u7F6E -I\u3001-S\uFF1BNode \u4F7F\u7528\u76F4\u63A5\u811A\u672C\u5165\u53E3\u3002\u4FEE\u6B63\u56FA\u5B9A\u5951\u7EA6\u6216\u6574\u5408\u6E90\u7801\u540E\u91CD\u65B0\u51C6\u5907\u8FD0\u884C\uFF0C\u4E0D\u6539\u5199\u65E7\u5BA1\u6279\u6216\u5931\u8D25\u8BB0\u5F55\u3002";
export declare function assertLocalEntry(contract: Pick<ResearchContract, 'command'>, runtime: Pick<LocalRuntime, 'runtimeVersion'>, files: Array<{
    path: string;
}>): void;
