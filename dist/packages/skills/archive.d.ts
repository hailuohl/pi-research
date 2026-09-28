/** Bounded ZIP reader, never a filesystem extractor. Only ordinary stored/deflated entries. */
export declare function decodeSkillArchive(zip: Buffer): Array<{
    path: string;
    bytes: Buffer;
}>;
