"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptContext = encryptContext;
exports.decryptContext = decryptContext;
const crypto_1 = __importDefault(require("crypto"));
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto_1.default.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
function encryptContext(context, ttl_minutes = 30) {
    const fullContext = {
        pr_number: context.pr_number || 0,
        owner: context.owner || '',
        repo: context.repo || '',
        current_file_index: context.current_file_index || 0,
        current_chunk_index: context.current_chunk_index || 0,
        total_files: context.total_files || 0,
        total_chunks: context.total_chunks || 0,
        session_id: context.session_id || crypto_1.default.randomUUID(),
        filename: context.filename,
        cached_summary: context.cached_summary,
        created_at: Date.now(),
        ttl_minutes
    };
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'), iv);
    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(fullContext), 'utf8'),
        cipher.final()
    ]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64url');
}
function decryptContext(token) {
    try {
        const buffer = Buffer.from(token, 'base64url');
        const iv = buffer.subarray(0, 16);
        const authTag = buffer.subarray(16, 32);
        const encrypted = buffer.subarray(32);
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'), iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);
        const context = JSON.parse(decrypted.toString('utf8'));
        const now = Date.now();
        const age_minutes = (now - context.created_at) / (1000 * 60);
        if (age_minutes > context.ttl_minutes) {
            throw new Error('Context token has expired');
        }
        return context;
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Context token has expired') {
            throw error;
        }
        throw new Error('Invalid context token');
    }
}
//# sourceMappingURL=pagination.js.map