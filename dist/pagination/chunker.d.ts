import { DiffChunk } from '../types/github';
export declare function estimateTokens(text: string): number;
interface ParsedHunk {
    header: string;
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
}
export declare function parseDiffHunks(patch: string): ParsedHunk[];
export declare function extractOverlap(previousChunk: string[]): string[];
export declare function chunkFileDiff(patch: string | undefined, maxTokens?: number): DiffChunk[];
export declare function formatChunkWithLineNumbers(chunk: DiffChunk): string;
export declare function isCompleteHunk(content: string): boolean;
export {};
//# sourceMappingURL=chunker.d.ts.map