"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createLogger = createLogger;
const pino_1 = __importDefault(require("pino"));
const fs_1 = require("fs");
const path_1 = require("path");
// For MCP servers, we must NOT log to stdout/stderr as it interferes with stdio transport
// Instead, log to a file or disable logging entirely in production
const isProduction = process.env.NODE_ENV === 'production' || !process.env.LOG_LEVEL || process.env.LOG_LEVEL === 'silent';
const logFile = (0, path_1.join)(process.cwd(), 'mcp-server.log');
exports.logger = isProduction ?
    // Silent logger for production (MCP mode)
    (0, pino_1.default)({ level: 'silent' }) :
    // File logger for development/debugging
    (0, pino_1.default)({
        level: process.env.LOG_LEVEL || 'info',
        serializers: {
            error: pino_1.default.stdSerializers.err
        }
    }, (0, fs_1.createWriteStream)(logFile, { flags: 'a' }));
function createLogger(name) {
    return exports.logger.child({ component: name });
}
//# sourceMappingURL=logger.js.map