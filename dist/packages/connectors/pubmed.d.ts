import type { Hit } from './contracts.js';
export interface RestrictedXmlNode {
    name: string;
    attrs: Record<string, string>;
    children: (RestrictedXmlNode | string)[];
}
export declare function parseRestrictedXml(xml: string): RestrictedXmlNode;
export declare function xmlNodes(n: RestrictedXmlNode, name: string): RestrictedXmlNode[];
export declare function xmlChildren(n: RestrictedXmlNode, name: string): RestrictedXmlNode[];
export declare function xmlText(n?: RestrictedXmlNode): string;
export declare function parsePubmed(xml: string): Hit[];
