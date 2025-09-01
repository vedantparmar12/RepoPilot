
export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public rateLimitRemaining?: number,
    public rateLimitReset?: Date
  ) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

export class PaginationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaginationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export function handleError(error: any, toolName: string): { content: Array<{ type: 'text' | 'image' | 'resource', text?: string, data?: any, mimeType?: string }>, isError: boolean } {
  let errorMessage = 'An unknown error occurred';
  
  if (error instanceof GitHubAPIError) {
    errorMessage = `GitHub API Error: ${error.message}`;
    if (error.statusCode) {
      errorMessage += ` (Status: ${error.statusCode})`;
    }
  } else if (error instanceof AuthenticationError) {
    errorMessage = `Authentication Error: ${error.message}`;
  } else if (error instanceof PaginationError) {
    errorMessage = `Pagination Error: ${error.message}`;
  } else if (error.message) {
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


