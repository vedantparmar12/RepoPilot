#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const server_1 = require("./server");
const logger_1 = require("./utils/logger");
const logger = (0, logger_1.createLogger)('Main');
async function main() {
    logger.info('Starting GitHub PR MCP Server...');
    const requiredEnvVars = ['GITHUB_TOKEN'];
    const missing = requiredEnvVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
        logger.error({ missing }, 'Missing required environment variables');
        console.error(`
Error: Missing required environment variables: ${missing.join(', ')}

Please create a .env file with the following variables:
${missing.map(v => `${v}=your_value_here`).join('\n')}

Or set them as environment variables before running the server.
    `);
        process.exit(1);
    }
    const server = new server_1.GitHubPRServer();
    await server.start();
    logger.info('Server is running. Waiting for MCP connections...');
}
main().catch(error => {
    logger.error({ error }, 'Failed to start server');
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map