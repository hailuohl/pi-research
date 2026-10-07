/** Bounded ZIP reader, never a filesystem extractor. Only ordinary stored/deflated entries. */
export declare function decodeSkillArchive(zip: Buffer, limits?: {
    zipBytes: number;
    totalBytes: number;
    fileBytes: number;
    nameBytes: number;
    errorCode: string;
}): Array<{
    path: string;
    bytes: Buffer;
}>;
