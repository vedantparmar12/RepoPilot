import { Octokit } from '@octokit/rest';
import { createLogger } from '../utils/logger';
import { RateLimiter } from '../utils/rate-limiter';
import { AuthenticationError } from '../utils/error-handler';
import { PullRequest, FileDiff, ReviewComment, Review, CreateReviewParams, GitHubIssue, CreateIssueParams, UpdateIssueParams, CreateIssueCommentParams } from '../types/github';

const logger = createLogger('GitHubClient');

export class GitHubClient {
  private octokit: Octokit;
  private rateLimiter: RateLimiter;

  constructor(token?: string) {
    const authToken = token || process.env.GITHUB_TOKEN;
    
    if (!authToken) {
      throw new AuthenticationError('GitHub token is required. Set GITHUB_TOKEN environment variable or pass token to constructor.');
    }

    this.octokit = new Octokit({
      auth: authToken,
      userAgent: 'mcp-github-pr/1.0.0',
      timeZone: 'UTC',
      baseUrl: 'https://api.github.com',
      log: {
        debug: (message: string) => logger.debug(message),
        info: (message: string) => logger.info(message),
        warn: (message: string) => logger.warn(message),
        error: (message: string) => logger.error(message)
      }
    });

    this.rateLimiter = new RateLimiter();
    
    logger.info('GitHub client initialized');
  }

  async getPullRequest(owner: string, repo: string, pull_number: number): Promise<PullRequest> {
    return this.rateLimiter.withBackoff(async () => {
      logger.debug({ owner, repo, pull_number }, 'Fetching pull request');
      
      const { data, headers } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number
      });

      this.rateLimiter.updateFromHeaders(headers as any);

      return {
        id: data.id,
        number: data.number,
        title: data.title,
        body: data.body,
        state: data.state as PullRequest['state'],
        additions: data.additions,
        deletions: data.deletions,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user: {
          login: data.user?.login || 'unknown',
          avatar_url: data.user?.avatar_url || ''
        },
        base: {
          ref: data.base.ref,
          sha: data.base.sha
        },
        head: {
          ref: data.head.ref,
          sha: data.head.sha
        },
        mergeable: data.mergeable,
        merged: data.merged,
        merged_at: data.merged_at,
        comments: data.comments,
        review_comments: data.review_comments,
        commits: data.commits,
        changed_files: data.changed_files
      };
    });
  }

  async listPullRequestFiles(
    owner: string,
    repo: string,
    pull_number: number,
    page: number = 1,
    per_page: number = 30
  ): Promise<{ files: FileDiff[], hasMore: boolean }> {
    return this.rateLimiter.withBackoff(async () => {
      logger.debug({ owner, repo, pull_number, page, per_page }, 'Listing pull request files');
      
      const { data, headers } = await this.octokit.pulls.listFiles({
        owner,
        repo,
        pull_number,
        page,
        per_page
      });

      this.rateLimiter.updateFromHeaders(headers as any);

      const linkHeader = headers.link;
      const hasMore = linkHeader ? linkHeader.includes('rel="next"') : false;

      const files: FileDiff[] = data.map(file => ({
        filename: file.filename,
        status: file.status as FileDiff['status'],
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
        previous_filename: file.previous_filename,
        blob_url: file.blob_url,
        raw_url: file.raw_url,
        contents_url: file.contents_url,
        sha: file.sha
      }));

      return { files, hasMore };
    });
  }

  async getFileDiff(
    owner: string,
    repo: string,
    pull_number: number,
    filename: string
  ): Promise<FileDiff | null> {
    const { files } = await this.listPullRequestFiles(owner, repo, pull_number, 1, 100);
    return files.find(f => f.filename === filename) || null;
  }

  async createReviewComment(
    owner: string,
    repo: string,
    pull_number: number,
    comment: {
      path: string;
      line?: number;
      start_line?: number;
      side?: 'LEFT' | 'RIGHT';
      start_side?: 'LEFT' | 'RIGHT';
      body: string;
    }
  ): Promise<ReviewComment> {
    return this.rateLimiter.withBackoff(async () => {
      logger.debug({ owner, repo, pull_number, path: comment.path }, 'Creating review comment');
      
      const pr = await this.getPullRequest(owner, repo, pull_number);
      
      const { data, headers } = await this.octokit.pulls.createReviewComment({
        owner,
        repo,
        pull_number,
        body: comment.body,
        commit_id: pr.head.sha,
        path: comment.path,
        line: comment.line,
        start_line: comment.start_line,
        side: comment.side,
        start_side: comment.start_side
      });

      this.rateLimiter.updateFromHeaders(headers as any);

      return {
        id: data.id,
        path: data.path,
        line: data.line,
        start_line: data.start_line ?? undefined,
        original_line: data.original_line,
        original_start_line: data.original_start_line ?? undefined,
        side: data.side as ReviewComment['side'],
        start_side: data.start_side as ReviewComment['start_side'],
        body: data.body,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user: {
          login: data.user.login,
          avatar_url: data.user.avatar_url
        },
        in_reply_to_id: data.in_reply_to_id
      };
    });
  }

  async createReview(params: CreateReviewParams): Promise<Review> {
    return this.rateLimiter.withBackoff(async () => {
      logger.debug({
        owner: params.owner,
        repo: params.repo,
        pull_number: params.pull_number,
        event: params.event
      }, 'Creating review');
      
      const pr = await this.getPullRequest(params.owner, params.repo, params.pull_number);
      
      const { data, headers } = await this.octokit.pulls.createReview({
        owner: params.owner,
        repo: params.repo,
        pull_number: params.pull_number,
        commit_id: pr.head.sha,
        body: params.body,
        event: params.event === 'PENDING' ? undefined : params.event,
        comments: params.comments?.map(c => ({
          path: c.path,
          line: c.line,
          start_line: c.start_line,
          side: c.side,
          start_side: c.start_side,
          body: c.body
        }))
      });

      this.rateLimiter.updateFromHeaders(headers as any);

      return {
        id: data.id,
        body: data.body || '',
        state: data.state as Review['state'],
        user: {
          login: data.user?.login || 'unknown',
          avatar_url: data.user?.avatar_url || ''
        },
        created_at: (data as any).created_at || new Date().toISOString(),
        submitted_at: data.submitted_at
      };
    });
  }

  async createIssue(params: CreateIssueParams): Promise<GitHubIssue> {
    return this.rateLimiter.withBackoff(async () => {
      logger.debug({ 
        owner: params.owner, 
        repo: params.repo, 
        title: params.title 
      }, 'Creating GitHub issue');
      
      const { data, headers } = await this.octokit.issues.create({
        owner: params.owner,
        repo: params.repo,
        title: params.title,
        body: params.body,
        assignees: params.assignees,
        milestone: params.milestone,
        labels: params.labels
      });

      this.rateLimiter.updateFromHeaders(headers as any);

      return {
        id: data.id,
        number: data.number,
        title: data.title,
        body: data.body || null,
        state: data.state as GitHubIssue['state'],
        created_at: data.created_at,
        updated_at: data.updated_at,
        closed_at: data.closed_at,
        user: {
          login: data.user?.login || 'unknown',
          avatar_url: data.user?.avatar_url || ''
        },
        assignees: data.assignees?.map(assignee => ({
          login: assignee.login,
          avatar_url: assignee.avatar_url
        })) || [],
        labels: data.labels?.map(label => ({
          name: typeof label === 'string' ? label : (label.name || ''),
          color: typeof label === 'string' ? '' : (label.color || ''),
          description: typeof label === 'string' ? null : (label.description || null)
        })) || [],
        milestone: data.milestone ? {
          id: data.milestone.id,
          number: data.milestone.number,
          title: data.milestone.title
        } : undefined
      };
    });
  }

  async updateIssue(params: UpdateIssueParams): Promise<GitHubIssue> {
    return this.rateLimiter.withBackoff(async () => {
      logger.debug({ 
        owner: params.owner, 
        repo: params.repo, 
        issue_number: params.issue_number,
        updates: Object.keys(params).filter(key => !['owner', 'repo', 'issue_number'].includes(key))
      }, 'Updating GitHub issue');
      
      const updateData: any = {};
      if (params.title !== undefined) updateData.title = params.title;
      if (params.body !== undefined) updateData.body = params.body;
      if (params.state !== undefined) updateData.state = params.state;
      if (params.state_reason !== undefined) updateData.state_reason = params.state_reason;
      if (params.assignees !== undefined) updateData.assignees = params.assignees;
      if (params.milestone !== undefined) updateData.milestone = params.milestone;
      if (params.labels !== undefined) updateData.labels = params.labels;

      const { data, headers } = await this.octokit.issues.update({
        owner: params.owner,
        repo: params.repo,
        issue_number: params.issue_number,
        ...updateData
      });

      this.rateLimiter.updateFromHeaders(headers as any);

      return {
        id: data.id,
        number: data.number,
        title: data.title,
        body: data.body || null,
        state: data.state as GitHubIssue['state'],
        created_at: data.created_at,
        updated_at: data.updated_at,
        closed_at: data.closed_at,
        user: {
          login: data.user?.login || 'unknown',
          avatar_url: data.user?.avatar_url || ''
        },
        assignees: data.assignees?.map(assignee => ({
          login: assignee.login,
          avatar_url: assignee.avatar_url
        })) || [],
        labels: data.labels?.map(label => ({
          name: typeof label === 'string' ? label : (label.name || ''),
          color: typeof label === 'string' ? '' : (label.color || ''),
          description: typeof label === 'string' ? null : (label.description || null)
        })) || [],
        milestone: data.milestone ? {
          id: data.milestone.id,
          number: data.milestone.number,
          title: data.milestone.title
        } : undefined
      };
    });
  }

  async createIssueComment(params: CreateIssueCommentParams): Promise<{ id: number; body: string; created_at: string; user: { login: string; avatar_url: string } }> {
    return this.rateLimiter.withBackoff(async () => {
      logger.debug({ 
        owner: params.owner, 
        repo: params.repo, 
        issue_number: params.issue_number 
      }, 'Creating issue comment');
      
      const { data, headers } = await this.octokit.issues.createComment({
        owner: params.owner,
        repo: params.repo,
        issue_number: params.issue_number,
        body: params.body
      });

      this.rateLimiter.updateFromHeaders(headers as any);

      return {
        id: data.id,
        body: data.body || '',
        created_at: data.created_at,
        user: {
          login: data.user?.login || 'unknown',
          avatar_url: data.user?.avatar_url || ''
        }
      };
    });
  }

  async mergePullRequest(
    owner: string,
    repo: string,
    pull_number: number,
    merge_method: 'merge' | 'squash' | 'rebase' = 'merge',
    commit_title?: string,
    commit_message?: string
  ): Promise<{
    sha: string;
    merged: boolean;
    message: string;
  }> {
    return this.rateLimiter.withBackoff(async () => {
      logger.debug({
        owner,
        repo,
        pull_number,
        merge_method
      }, 'Merging pull request');
      
      const { data, headers } = await this.octokit.pulls.merge({
        owner,
        repo,
        pull_number,
        merge_method,
        commit_title,
        commit_message
      });

      this.rateLimiter.updateFromHeaders(headers as any);

      return {
        sha: data.sha,
        merged: data.merged,
        message: data.message
      };
    });
  }

  async checkPullRequestMergeability(
    owner: string,
    repo: string,
    pull_number: number
  ): Promise<{
    mergeable: boolean;
    mergeable_state: string;
    can_merge: boolean;
    merge_status_checks?: any[];
  }> {
    return this.rateLimiter.withBackoff(async () => {
      logger.debug({
        owner,
        repo,
        pull_number
      }, 'Checking pull request mergeability');
      
      // Get PR details
      const pr = await this.getPullRequest(owner, repo, pull_number);
      
      // Get status checks
      const { data: statusData, headers } = await this.octokit.repos.getCombinedStatusForRef({
        owner,
        repo,
        ref: pr.head.sha
      });

      this.rateLimiter.updateFromHeaders(headers as any);
      
      const can_merge = pr.mergeable === true && 
                       pr.state === 'open' && 
                       !pr.merged &&
                       (statusData.state === 'success' || statusData.state === 'pending');

      return {
        mergeable: pr.mergeable || false,
        mergeable_state: pr.mergeable ? 'clean' : 'dirty',
        can_merge,
        merge_status_checks: statusData.statuses
      };
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const { data } = await this.octokit.users.getAuthenticated();
      logger.info({ user: data.login }, 'GitHub connection successful');
      return true;
    } catch (error) {
      logger.error({ error }, 'GitHub connection failed');
      return false;
    }
  }
}
