"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationError = exports.PaginationError = exports.GitHubAPIError = void 0;
exports.handleError = handleError;
class GitHubAPIError extends Error {
    statusCode;
    rateLimitRemaining;
    rateLimitReset;
    constructor(message, statusCode, rateLimitRemaining, rateLimitReset) {
        super(message);
        this.statusCode = statusCode;
        this.rateLimitRemaining = rateLimitRemaining;
        this.rateLimitReset = rateLimitReset;
        this.name = 'GitHubAPIError';
    }
}
exports.GitHubAPIError = GitHubAPIError;
class PaginationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PaginationError';
    }
}
exports.PaginationError = PaginationError;
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
function handleError(error, toolName) {
    let errorMessage = 'An unknown error occurred';
    if (error instanceof GitHubAPIError) {
        errorMessage = `GitHub API Error: ${error.message}`;
        if (error.statusCode) {
            errorMessage += ` (Status: ${error.statusCode})`;
        }
    }
    else if (error instanceof AuthenticationError) {
        errorMessage = `Authentication Error: ${error.message}`;
    }
    else if (error instanceof PaginationError) {
        errorMessage = `Pagination Error: ${error.message}`;
    }
    else if (error.message) {
        errorMessage = error.message;
    }
    return {
        content: [{
                type: 'text',
                text: `Error in ${toolName}: ${errorMessage}`
            }],
        isError: true
    };
}
//# sourceMappingURL=error-handler.js.map