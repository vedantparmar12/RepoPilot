import {
  estimateTokens,
  parseDiffHunks,
  chunkFileDiff,
  extractOverlap,
  isCompleteHunk,
  formatChunkWithLineNumbers
} from '../../src/pagination/chunker';

describe('DiffChunker', () => {
  const sampleDiff = `@@ -1,4 +1,5 @@
 function hello() {
-  console.log('Hello');
+  console.log('Hello, World!');
+  console.log('Welcome!');
 }
 
@@ -10,3 +11,4 @@
 function goodbye() {
   console.log('Goodbye');
+  return true;
 }`;

  describe('estimateTokens', () => {
    test('estimates tokens for simple text', () => {
      const text = 'Hello, World!';
      const tokens = estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(10);
    });

    test('accounts for special characters', () => {
      const textWithSpecial = '{}()[]<>';
      const textWithout = 'abcdefgh';
      expect(estimateTokens(textWithSpecial)).toBeGreaterThan(estimateTokens(textWithout));
    });

    test('accounts for newlines', () => {
      const withNewlines = 'a\\nb\\nc';
      const without = 'abc';
      expect(estimateTokens(withNewlines)).toBeGreaterThan(estimateTokens(without));
    });
  });

  describe('parseDiffHunks', () => {
    test('parses diff hunks correctly', () => {
      const hunks = parseDiffHunks(sampleDiff);
      
      expect(hunks).toHaveLength(2);
      expect(hunks[0].oldStart).toBe(1);
      expect(hunks[0].oldLines).toBe(4);
      expect(hunks[0].newStart).toBe(1);
      expect(hunks[0].newLines).toBe(5);
      expect(hunks[0].header).toBe('@@ -1,4 +1,5 @@');
    });

    test('handles single-line hunks', () => {
      const singleLineHunk = `@@ -1 +1 @@
-old line
+new line`;
      const hunks = parseDiffHunks(singleLineHunk);
      
      expect(hunks).toHaveLength(1);
      expect(hunks[0].oldLines).toBe(1);
      expect(hunks[0].newLines).toBe(1);
    });

    test('handles empty patch', () => {
      const hunks = parseDiffHunks('');
      expect(hunks).toHaveLength(0);
    });
  });

  describe('chunkFileDiff', () => {
    test('chunks large diff correctly', () => {
      const largeDiff = generateLargeDiff(100);
      const chunks = chunkFileDiff(largeDiff, 1000);
      
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        expect(estimateTokens(chunk.content)).toBeLessThanOrEqual(1000);
      });
    });

    test('preserves complete hunks', () => {
      const chunks = chunkFileDiff(sampleDiff, 100);
      
      chunks.forEach(chunk => {
        expect(isCompleteHunk(chunk.content)).toBe(true);
      });
    });

    test('handles undefined patch', () => {
      const chunks = chunkFileDiff(undefined);
      expect(chunks).toEqual([]);
    });

    test('includes size information', () => {
      const chunks = chunkFileDiff(sampleDiff);
      
      chunks.forEach(chunk => {
        expect(chunk.size_bytes).toBeGreaterThan(0);
        expect(chunk.size_bytes).toBe(Buffer.byteLength(chunk.content, 'utf8'));
      });
    });
  });

  describe('extractOverlap', () => {
    test('extracts overlap lines correctly', () => {
      const prev = ['line1', 'line2', 'line3', 'line4'];
      const next = ['line5', 'line6'];
      const overlap = extractOverlap(prev, next);
      
      expect(overlap).toHaveLength(3);
      expect(overlap).toEqual(['line2', 'line3', 'line4']);
    });

    test('handles small arrays', () => {
      const prev = ['line1'];
      const next = ['line2'];
      const overlap = extractOverlap(prev, next);
      
      expect(overlap).toHaveLength(1);
      expect(overlap).toEqual(['line1']);
    });

    test('filters out hunk headers', () => {
      const prev = ['line1', '@@ -1,2 +1,2 @@', 'line3'];
      const next = ['line4'];
      const overlap = extractOverlap(prev, next);
      
      expect(overlap).not.toContain('@@ -1,2 +1,2 @@');
    });
  });

  describe('formatChunkWithLineNumbers', () => {
    test('formats chunk with line numbers', () => {
      const chunk = {
        old_start: 10,
        old_lines: 3,
        new_start: 10,
        new_lines: 4,
        content: `@@ -10,3 +10,4 @@
 normal line
-removed line
+added line
+another added`,
        size_bytes: 100,
        header: '@@ -10,3 +10,4 @@'
      };

      const formatted = formatChunkWithLineNumbers(chunk);
      
      expect(formatted).toContain('10');
      expect(formatted).toContain('11');
      expect(formatted).toContain(' - |');
      expect(formatted).toContain(' + |');
    });
  });

  describe('isCompleteHunk', () => {
    test('validates complete hunks', () => {
      const completeHunk = `@@ -1,2 +1,2 @@
 context
-removed`;
      
      expect(isCompleteHunk(completeHunk)).toBe(true);
    });

    test('detects incomplete hunks', () => {
      const incompleteHunk = `@@ -1,3 +1,2 @@
 context
-removed`;
      
      expect(isCompleteHunk(incompleteHunk)).toBe(false);
    });
  });
});

function generateLargeDiff(lines: number): string {
  const hunks: string[] = [];
  const hunksCount = Math.ceil(lines / 10);
  
  for (let i = 0; i < hunksCount; i++) {
    const startLine = i * 10 + 1;
    hunks.push(`@@ -${startLine},10 +${startLine},10 @@`);
    
    for (let j = 0; j < 10; j++) {
      if (j % 3 === 0) {
        hunks.push(`-  old line ${startLine + j}`);
        hunks.push(`+  new line ${startLine + j}`);
      } else {
        hunks.push(`   context line ${startLine + j}`);
      }
    }
  }
  
  return hunks.join('\\n');
}