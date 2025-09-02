import crypto from 'crypto';

export interface PaginationContext {
  pr_number: number;
  owner: string;
  repo: string;
  current_file_index: number;
  current_chunk_index: number;
  total_files: number;
  total_chunks: number;
  session_id: string;
  filename?: string;
  cached_summary?: string;
  created_at: number;
  ttl_minutes: number;
}

export interface PagedResponse<T> {
  data: T;
  pagination: {
    has_next: boolean;
    has_previous: boolean;
    current_page: number;
    total_pages: number;
    context_token: string;
  };
}

export interface ChunkMetadata {
  file_index: number;
  chunk_index: number;
  total_chunks: number;
  lines_start: number;
  lines_end: number;
  estimated_tokens: number;
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

export function encryptContext(context: Partial<PaginationContext>, ttl_minutes: number = 30): string {
  const fullContext: PaginationContext = {
    pr_number: context.pr_number || 0,
    owner: context.owner || '',
    repo: context.repo || '',
    current_file_index: context.current_file_index || 0,
    current_chunk_index: context.current_chunk_index || 0,
    total_files: context.total_files || 0,
    total_chunks: context.total_chunks || 0,
    session_id: context.session_id || crypto.randomUUID(),
    filename: context.filename,
    cached_summary: context.cached_summary,
    created_at: Date.now(),
    ttl_minutes
  };

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'), iv);
  
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(fullContext), 'utf8'),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return Buffer.concat([iv, authTag, encrypted]).toString('base64url');
}

export function decryptContext(token: string): PaginationContext {
  try {
    const buffer = Buffer.from(token, 'base64url');
    const iv = buffer.subarray(0, 16);
    const authTag = buffer.subarray(16, 32);
    const encrypted = buffer.subarray(32);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    const context = JSON.parse(decrypted.toString('utf8')) as PaginationContext;
    
    const now = Date.now();
    const age_minutes = (now - context.created_at) / (1000 * 60);
    
    if (age_minutes > context.ttl_minutes) {
      throw new Error('Context token has expired');
    }
    
    return context;
  } catch (error) {
    if (error instanceof Error && error.message === 'Context token has expired') {
      throw error;
    }
    throw new Error('Invalid context token');
  }
}