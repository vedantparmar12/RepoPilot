import { MCPTool, ToolResponse, ReadFileInput, ReadFileSchema } from '../types/mcp';
import { GitHubClient } from '../github/client';
import { PaginationError } from '../utils/error-handler';
import { createLogger } from '../utils/logger';
import { chunkFileDiff, formatChunkWithLineNumbers } from '../pagination/chunker';
import { encryptContext, decryptContext, PagedResponse } from '../types/pagination';
import { DiffChunk } from '../types/github';

const logger = createLogger('ReadFileTool');

export class ReadFileTool implements MCPTool {
  name = 'read-file';
  description = 'Read specific file changes with automatic pagination for large diffs';
  inputSchema = ReadFileSchema;
  
  private githubClient: GitHubClient;

  constructor(githubClient: GitHubClient) {
    this.githubClient = githubClient;
  }

  async handler(args: unknown): Promise<ToolResponse> {
    const input = this.inputSchema.parse(args) as ReadFileInput;
      
      if (input.context_token) {
        return this.handleWithContext(input.context_token);
      }
      
      if (!input.owner || !input.repo || !input.pr_number || !input.filename) {
        throw new PaginationError('Missing required parameters. Provide either context_token or all of: owner, repo, pr_number, filename');
      }
      
      return this.handleNewRequest(
        input.owner,
        input.repo,
        input.pr_number,
        input.filename
      );
  }

  private async handleNewRequest(
    owner: string,
    repo: string,
    pr_number: number,
    filename: string
  ): Promise<ToolResponse> {
    logger.info({
      owner,
      repo,
      pr_number,
      filename
    }, 'Reading file diff');

    const file = await this.githubClient.getFileDiff(owner, repo, pr_number, filename);
    
    if (!file) {
      return {
        content: [{
          type: 'text',
          text: `File "${filename}" not found in PR #${pr_number}`
        }],
        isError: true
      };
    }

    if (!file.patch) {
      return {
        content: [{
          type: 'text',
          text: this.formatFileWithoutPatch(file)
        }]
      };
    }

    const chunks = chunkFileDiff(file.patch);
    
    if (chunks.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `File "${filename}" has no changes`
        }]
      };
    }

    const response = this.formatChunkResponse(
      chunks[0],
      0,
      chunks.length,
      {
        owner,
        repo,
        pr_number,
        filename,
        current_file_index: 0,
        current_chunk_index: 0,
        total_files: 1,
        total_chunks: chunks.length
      }
    );
    return {
      content: [{
        type: 'text',
        text: response.data
      }]
    };
  }

  private async handleWithContext(contextToken: string): Promise<ToolResponse> {
    let context;
    
    try {
      context = decryptContext(contextToken);
    } catch (error) {
      if (error instanceof Error && error.message.includes('expired')) {
        return {
          content: [{
            type: 'text',
            text: 'Pagination token has expired. Please start a new request with owner, repo, pr_number, and filename parameters.'
          }],
          isError: true
        };
      }
      throw new PaginationError('Invalid context token');
    }

    const nextChunkIndex = context.current_chunk_index + 1;
    
    if (nextChunkIndex >= context.total_chunks) {
      return {
        content: [{
          type: 'text',
          text: 'No more chunks available. You have reached the end of the file.'
        }]
      };
    }

    const file = await this.githubClient.getFileDiff(
      context.owner,
      context.repo,
      context.pr_number,
      context.filename!
    );
    
    if (!file || !file.patch) {
      throw new PaginationError('File no longer available or has been modified');
    }

    const chunks = chunkFileDiff(file.patch);
    
    if (nextChunkIndex >= chunks.length) {
      throw new PaginationError('Chunk index out of bounds');
    }

    const response = this.formatChunkResponse(
      chunks[nextChunkIndex],
      nextChunkIndex,
      chunks.length,
      {
        ...context,
        current_chunk_index: nextChunkIndex
      }
    );
    return {
      content: [{
        type: 'text',
        text: response.data
      }]
    };
  }

  private formatChunkResponse(
    chunk: DiffChunk,
    chunkIndex: number,
    totalChunks: number,
    context: any
  ): PagedResponse<string> {
    const formattedChunk = formatChunkWithLineNumbers(chunk);
    
    const header = `# File: ${context.filename}
## Chunk ${chunkIndex + 1} of ${totalChunks}
Lines: ${chunk.old_start}-${chunk.old_start + chunk.old_lines} (old) / ${chunk.new_start}-${chunk.new_start + chunk.new_lines} (new)
Size: ${chunk.size_bytes} bytes

\`\`\`diff
${formattedChunk}
\`\`\``;

    const footer = totalChunks > 1 ? `
---
${chunkIndex < totalChunks - 1 
  ? 'Use `read-file` with the `context_token` from the response to see the next chunk.' 
  : 'This is the last chunk of the file.'}` : '';

    const contextToken = encryptContext(context);

    return {
      data: header + footer,
      pagination: {
        has_next: chunkIndex < totalChunks - 1,
        has_previous: chunkIndex > 0,
        current_page: chunkIndex + 1,
        total_pages: totalChunks,
        context_token: contextToken
      },
      content: [{
        type: 'text',
        text: header + footer
      }],
      _meta: {
        progressToken: contextToken
      }
    } as any;
  }

  private formatFileWithoutPatch(file: any): string {
    let output = `# File: ${file.filename}

## Status: ${file.status}
`;

    if (file.status === 'renamed') {
      output += `Renamed from: ${file.previous_filename}\n`;
    }

    output += `
- Additions: +${file.additions}
- Deletions: -${file.deletions}
- Total changes: ${file.changes}

This file appears to be binary or too large to display the patch.

Links:
- [View on GitHub](${file.blob_url})
- [View Raw](${file.raw_url})
`;

    return output;
  }
}