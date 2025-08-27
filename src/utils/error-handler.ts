
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


