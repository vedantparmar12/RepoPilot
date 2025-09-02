import { DiffChunk } from '../types/github';
import { createLogger } from '../utils/logger';

const logger = createLogger('Chunker');

const MAX_TOKENS_PER_CHUNK = parseInt(process.env.MAX_TOKENS_PER_CHUNK || '4000');
const OVERLAP_LINES = 3;

export function estimateTokens(text: string): number {
  const baseTokens = text.length / 3.5;
  const specialChars = (text.match(/[{}()[\];,.<>!@#$%^&*+=|\\/"'`~]/g) || []).length;
  const newlines = (text.match(/\n/g) || []).length;
  return Math.ceil(baseTokens + specialChars * 0.5 + newlines * 0.2);
}

interface ParsedHunk {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

export function parseDiffHunks(patch: string): ParsedHunk[] {
  const hunks: ParsedHunk[] = [];
  const lines = patch.split('\n');
  
  let currentHunk: ParsedHunk | null = null;
  
  for (const line of lines) {
    const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)?$/);
    
    if (hunkMatch) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }
      
      currentHunk = {
        header: line,
        oldStart: parseInt(hunkMatch[1]),
        oldLines: parseInt(hunkMatch[2] || '1'),
        newStart: parseInt(hunkMatch[3]),
        newLines: parseInt(hunkMatch[4] || '1'),
        lines: []
      };
    } else if (currentHunk && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
      currentHunk.lines.push(line);
    }
  }
  
  if (currentHunk) {
    hunks.push(currentHunk);
  }
  
  return hunks;
}

export function extractOverlap(previousChunk: string[]): string[] {
  const overlap: string[] = [];
  const contextLines = Math.min(OVERLAP_LINES, previousChunk.length);
  
  for (let i = previousChunk.length - contextLines; i < previousChunk.length; i++) {
    const line = previousChunk[i];
    if (line && !line.startsWith('@@')) {
      overlap.push(line);
    }
  }
  
  return overlap;
}

export function chunkFileDiff(
  patch: string | undefined,
  maxTokens: number = MAX_TOKENS_PER_CHUNK
): DiffChunk[] {
  if (!patch) {
    return [];
  }

  const hunks = parseDiffHunks(patch);
  
  if (hunks.length === 0) {
    return [];
  }

  const chunks: DiffChunk[] = [];
  let currentChunk: DiffChunk = {
    old_start: hunks[0].oldStart,
    old_lines: 0,
    new_start: hunks[0].newStart,
    new_lines: 0,
    content: '',
    size_bytes: 0,
    header: ''
  };
  
  let currentTokens = 0;
  let currentLines: string[] = [];

  for (const hunk of hunks) {
    const hunkContent = [hunk.header, ...hunk.lines].join('\n');
    const hunkTokens = estimateTokens(hunkContent);
    
    if (currentTokens + hunkTokens > maxTokens && currentLines.length > 0) {
      currentChunk.content = currentLines.join('\n');
      currentChunk.size_bytes = Buffer.byteLength(currentChunk.content, 'utf8');
      chunks.push(currentChunk);
      
      const overlap = extractOverlap(currentLines);
      
      currentChunk = {
        old_start: hunk.oldStart,
        old_lines: hunk.oldLines,
        new_start: hunk.newStart,
        new_lines: hunk.newLines,
        content: '',
        size_bytes: 0,
        header: hunk.header
      };
      
      currentLines = [...overlap, hunk.header, ...hunk.lines];
      currentTokens = estimateTokens(currentLines.join('\n'));
    } else {
      currentLines.push(hunk.header, ...hunk.lines);
      currentChunk.old_lines += hunk.oldLines;
      currentChunk.new_lines += hunk.newLines;
      currentTokens += hunkTokens;
    }
  }
  
  if (currentLines.length > 0) {
    currentChunk.content = currentLines.join('\n');
    currentChunk.size_bytes = Buffer.byteLength(currentChunk.content, 'utf8');
    chunks.push(currentChunk);
  }

  logger.debug({
    originalSize: Buffer.byteLength(patch, 'utf8'),
    chunks: chunks.length,
    maxTokens
  }, 'Diff chunked');

  return chunks;
}

export function formatChunkWithLineNumbers(chunk: DiffChunk): string {
  const lines = chunk.content.split('\n');
  const formattedLines: string[] = [];
  
  let oldLine = chunk.old_start;
  let newLine = chunk.new_start;
  
  for (const line of lines) {
    if (line.startsWith('@@')) {
      formattedLines.push(line);
    } else if (line.startsWith('-')) {
      formattedLines.push(`${oldLine.toString().padStart(6)} - | ${line}`);
      oldLine++;
    } else if (line.startsWith('+')) {
      formattedLines.push(`       ${newLine.toString().padStart(6)} + | ${line}`);
      newLine++;
    } else {
      formattedLines.push(`${oldLine.toString().padStart(6)} ${newLine.toString().padStart(6)}   | ${line}`);
      oldLine++;
      newLine++;
    }
  }
  
  return formattedLines.join('\n');
}

export function isCompleteHunk(content: string): boolean {
  const lines = content.split('\n');
  let inHunk = false;
  let addCount = 0;
  let removeCount = 0;
  let expectedAdd = 0;
  let expectedRemove = 0;
  
  for (const line of lines) {
    const hunkMatch = line.match(/^@@ -\d+(?:,(\d+))? \+\d+(?:,(\d+))? @@/);
    if (hunkMatch) {
      if (inHunk && (addCount !== expectedAdd || removeCount !== expectedRemove)) {
        return false;
      }
      inHunk = true;
      expectedRemove = parseInt(hunkMatch[1] || '1');
      expectedAdd = parseInt(hunkMatch[2] || '1');
      addCount = 0;
      removeCount = 0;
    } else if (inHunk) {
      if (line.startsWith('+')) addCount++;
      else if (line.startsWith('-')) removeCount++;
      else if (line.startsWith(' ')) {
        addCount++;
        removeCount++;
      }
    }
  }
  
  return !inHunk || (addCount === expectedAdd && removeCount === expectedRemove);
}
