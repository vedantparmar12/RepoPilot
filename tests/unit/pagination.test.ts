import { encryptContext, decryptContext } from '../../src/types/pagination';

describe('PaginationContext', () => {
  describe('encryptContext and decryptContext', () => {
    test('encrypts and decrypts context correctly', () => {
      const context = {
        pr_number: 123,
        owner: 'octocat',
        repo: 'hello-world',
        current_file_index: 5,
        current_chunk_index: 2,
        total_files: 10,
        total_chunks: 4,
        session_id: 'test-session',
        filename: 'src/index.js'
      };
      
      const token = encryptContext(context);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      
      const decrypted = decryptContext(token);
      expect(decrypted.pr_number).toBe(context.pr_number);
      expect(decrypted.owner).toBe(context.owner);
      expect(decrypted.repo).toBe(context.repo);
      expect(decrypted.current_file_index).toBe(context.current_file_index);
      expect(decrypted.current_chunk_index).toBe(context.current_chunk_index);
      expect(decrypted.filename).toBe(context.filename);
    });

    test('handles partial context', () => {
      const partialContext = {
        pr_number: 456,
        owner: 'test',
        repo: 'repo'
      };
      
      const token = encryptContext(partialContext);
      const decrypted = decryptContext(token);
      
      expect(decrypted.pr_number).toBe(456);
      expect(decrypted.owner).toBe('test');
      expect(decrypted.repo).toBe('repo');
      expect(decrypted.current_file_index).toBe(0);
      expect(decrypted.current_chunk_index).toBe(0);
      expect(decrypted.total_files).toBe(0);
      expect(decrypted.total_chunks).toBe(0);
    });

    test('includes timestamp and TTL', () => {
      const context = { pr_number: 789 };
      const token = encryptContext(context, 60);
      
      const decrypted = decryptContext(token);
      expect(decrypted.created_at).toBeDefined();
      expect(decrypted.ttl_minutes).toBe(60);
    });

    test('handles context expiration', () => {
      const context = { pr_number: 123 };
      const token = encryptContext(context, 0.0001);
      
      setTimeout(() => {
        expect(() => decryptContext(token)).toThrow('Context token has expired');
      }, 100);
    });

    test('rejects invalid tokens', () => {
      expect(() => decryptContext('invalid-token')).toThrow('Invalid context token');
      expect(() => decryptContext('')).toThrow('Invalid context token');
      expect(() => decryptContext('YmFzZTY0LWJ1dC1ub3QtdmFsaWQ=')).toThrow('Invalid context token');
    });

    test('generates unique session IDs', () => {
      const token1 = encryptContext({ pr_number: 1 });
      const token2 = encryptContext({ pr_number: 1 });
      
      const context1 = decryptContext(token1);
      const context2 = decryptContext(token2);
      
      expect(context1.session_id).toBeDefined();
      expect(context2.session_id).toBeDefined();
      expect(context1.session_id).not.toBe(context2.session_id);
    });

    test('preserves cached summary', () => {
      const context = {
        pr_number: 123,
        cached_summary: 'This is a cached summary of the PR'
      };
      
      const token = encryptContext(context);
      const decrypted = decryptContext(token);
      
      expect(decrypted.cached_summary).toBe(context.cached_summary);
    });

    test('handles different TTL values', () => {
      const ttlValues = [1, 30, 60, 120, 1440];
      
      ttlValues.forEach(ttl => {
        const token = encryptContext({ pr_number: 1 }, ttl);
        const decrypted = decryptContext(token);
        expect(decrypted.ttl_minutes).toBe(ttl);
      });
    });
  });
});