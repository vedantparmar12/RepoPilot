import { Octokit } from '@octokit/rest';
import { logger } from '../utils/logger';

interface CreatePRArgs {
  owner: string;
  repo: string;
  title?: string;
  head: string;
  base: string;
  body?: string;
  draft?: boolean;
  auto_generate?: boolean;
}

interface FileChange {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status: string;
}

interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export class CreatePRTool {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async execute(args: CreatePRArgs) {
    try {
      const { owner, repo, head, base, draft = false } = args;
      let { title, body, auto_generate = true } = args;

      // If auto_generate is true, analyze changes and create professional PR
      if (auto_generate) {
        const analysis = await this.analyzeChanges(owner, repo, head, base);
        
        if (!title) {
          title = this.generateTitle(analysis);
        }
        
        if (!body) {
          body = this.generateProfessionalBody(analysis);
        }
      }

      // Fallback if no title provided
      if (!title) {
        title = `Merge ${head} into ${base}`;
      }

      // Create the pull request
      const response = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        head,
        base,
        body: body || '',
        draft,
      });

      logger.info(`Created PR #${response.data.number}: ${response.data.html_url}`);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              pr_number: response.data.number,
              url: response.data.html_url,
              title: response.data.title,
              body: response.data.body,
              state: response.data.state,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      logger.error('Failed to create PR:', error);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2),
          },
        ],
      };
    }
  }

  private async analyzeChanges(owner: string, repo: string, head: string, base: string) {
    try {
      // Get commit comparison
      const comparison = await this.octokit.repos.compareCommits({
        owner,
        repo,
        base,
        head,
      });

      // Get file changes
      const fileChanges: FileChange[] = comparison.data.files?.map(file => ({
        filename: file.filename,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        status: file.status,
      })) || [];

      // Get commit information
      const commits: CommitInfo[] = comparison.data.commits.map(commit => ({
        sha: commit.sha.substring(0, 7),
        message: commit.commit.message,
        author: commit.commit.author?.name || 'Unknown',
        date: commit.commit.author?.date || '',
      }));

      // Categorize file changes
      const categories = this.categorizeFiles(fileChanges);
      
      // Analyze commit types
      const commitTypes = this.analyzeCommitTypes(commits);

      return {
        fileChanges,
        commits,
        categories,
        commitTypes,
        stats: {
          filesChanged: fileChanges.length,
          additions: fileChanges.reduce((sum, f) => sum + f.additions, 0),
          deletions: fileChanges.reduce((sum, f) => sum + f.deletions, 0),
          totalCommits: commits.length,
        },
      };
    } catch (error) {
      logger.error('Failed to analyze changes:', error);
      return {
        fileChanges: [],
        commits: [],
        categories: {},
        commitTypes: {},
        stats: {
          filesChanged: 0,
          additions: 0,
          deletions: 0,
          totalCommits: 0,
        },
      };
    }
  }

  private categorizeFiles(files: FileChange[]): Record<string, FileChange[]> {
    const categories: Record<string, FileChange[]> = {};

    files.forEach(file => {
      let category = 'Other Files';
      
      // Categorize based on file path and extension
      if (file.filename.includes('test') || file.filename.includes('spec')) {
        category = 'Tests';
      } else if (file.filename.match(/\.(md|txt|rst)$/i)) {
        category = 'Documentation';
      } else if (file.filename.match(/\.(ts|tsx|js|jsx)$/i)) {
        if (file.filename.includes('component') || file.filename.includes('Component')) {
          category = 'UI Components';
        } else if (file.filename.includes('util') || file.filename.includes('helper')) {
          category = 'Utilities';
        } else if (file.filename.includes('api') || file.filename.includes('service')) {
          category = 'API/Services';
        } else {
          category = 'Source Code';
        }
      } else if (file.filename.match(/\.(css|scss|sass|less)$/i)) {
        category = 'Styles';
      } else if (file.filename.match(/package\.json|yarn\.lock|package-lock\.json/)) {
        category = 'Dependencies';
      } else if (file.filename.match(/\.(yml|yaml|json)$/i)) {
        category = 'Configuration';
      }

      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(file);
    });

    return categories;
  }

  private analyzeCommitTypes(commits: CommitInfo[]): Record<string, number> {
    const types: Record<string, number> = {
      feat: 0,
      fix: 0,
      docs: 0,
      style: 0,
      refactor: 0,
      test: 0,
      chore: 0,
      other: 0,
    };

    commits.forEach(commit => {
      const message = commit.message.toLowerCase();
      if (message.startsWith('feat') || message.includes('add') || message.includes('implement')) {
        types.feat++;
      } else if (message.startsWith('fix') || message.includes('bug') || message.includes('resolve')) {
        types.fix++;
      } else if (message.startsWith('docs') || message.includes('documentation')) {
        types.docs++;
      } else if (message.startsWith('style') || message.includes('format')) {
        types.style++;
      } else if (message.startsWith('refactor') || message.includes('refactor')) {
        types.refactor++;
      } else if (message.startsWith('test') || message.includes('test')) {
        types.test++;
      } else if (message.startsWith('chore') || message.includes('update')) {
        types.chore++;
      } else {
        types.other++;
      }
    });

    return types;
  }

  private generateTitle(analysis: any): string {
    const { commitTypes, stats, categories } = analysis;
    
    // Determine primary change type
    const sortedTypes = Object.entries(commitTypes as Record<string, number>)
      .sort(([, a], [, b]) => b - a);
    const mainType = sortedTypes.length > 0 ? sortedTypes[0][0] : 'update';

    // Determine primary category
    const mainCategory = Object.keys(categories)[0] || 'changes';

    // Generate professional title without emojis
    if (mainType === 'feat' && stats.filesChanged > 5) {
      return `Feature: Implement new ${mainCategory.toLowerCase()} functionality`;
    } else if (mainType === 'fix') {
      return `Fix: Resolve issues in ${mainCategory.toLowerCase()}`;
    } else if (mainType === 'refactor') {
      return `Refactor: Improve ${mainCategory.toLowerCase()} structure`;
    } else if (mainType === 'docs') {
      return `Documentation: Update project documentation`;
    } else if (stats.filesChanged === 1) {
      const firstCategory = Object.values(categories as Record<string, FileChange[]>)[0];
      const fileName = firstCategory?.[0]?.filename || 'file';
      return `Update: Modify ${fileName.split('/').pop()}`;
    } else {
      return `Update: ${stats.filesChanged} files changed across ${Object.keys(categories).length} categories`;
    }
  }

  private generateProfessionalBody(analysis: any): string {
    const { commits, categories, stats } = analysis;

    let body = `## Summary\n\n`;
    
    // Add natural language summary
    body += this.generateNaturalSummary(analysis);
    body += '\n\n';

    // Add statistics in a clean format
    body += `## Changes Overview\n\n`;
    body += `This pull request includes **${stats.filesChanged} file${stats.filesChanged !== 1 ? 's' : ''}** `;
    body += `with **${stats.additions} addition${stats.additions !== 1 ? 's' : ''}** `;
    body += `and **${stats.deletions} deletion${stats.deletions !== 1 ? 's' : ''}** `;
    body += `across **${stats.totalCommits} commit${stats.totalCommits !== 1 ? 's' : ''}**.\n\n`;

    // Add categorized file changes
    if (Object.keys(categories).length > 0) {
      body += `## Modified Files\n\n`;
      
      Object.entries(categories as Record<string, FileChange[]>).forEach(([category, files]) => {
        body += `### ${category}\n\n`;
        files.forEach((file: FileChange) => {
          const statusText = this.getFileStatusText(file.status);
          body += `- **${file.filename}** - ${statusText} `;
          body += `(+${file.additions}, -${file.deletions})\n`;
        });
        body += '\n';
      });
    }

    // Add commit information
    if (commits.length > 0) {
      body += `## Commit History\n\n`;
      
      if (commits.length <= 8) {
        commits.forEach((commit: CommitInfo) => {
          const shortMessage = commit.message.split('\n')[0];
          body += `- \`${commit.sha}\` - ${shortMessage}\n`;
        });
      } else {
        // Show first 5 commits and collapse the rest
        const firstCommits = commits.slice(0, 5);
        const remainingCommits = commits.slice(5);
        
        firstCommits.forEach((commit: CommitInfo) => {
          const shortMessage = commit.message.split('\n')[0];
          body += `- \`${commit.sha}\` - ${shortMessage}\n`;
        });
        
        body += `\n<details>\n<summary>View ${remainingCommits.length} more commits</summary>\n\n`;
        remainingCommits.forEach((commit: CommitInfo) => {
          const shortMessage = commit.message.split('\n')[0];
          body += `- \`${commit.sha}\` - ${shortMessage}\n`;
        });
        body += `\n</details>`;
      }
      body += '\n';
    }

    // Add testing checklist
    body += `\n## Testing Checklist\n\n`;
    body += `- [ ] Code has been self-reviewed\n`;
    body += `- [ ] Code follows project style guidelines\n`;
    body += `- [ ] Changes generate no new warnings\n`;
    
    if (Object.keys(categories).includes('Tests')) {
      body += `- [ ] Tests have been added/updated\n`;
      body += `- [ ] All tests are passing\n`;
    } else if (stats.filesChanged > 3) {
      body += `- [ ] Consider adding tests for new functionality\n`;
    }
    
    if (Object.keys(categories).includes('Documentation')) {
      body += `- [ ] Documentation has been updated\n`;
    }
    
    if (Object.keys(categories).includes('API/Services')) {
      body += `- [ ] API changes are backward compatible\n`;
    }
    
    body += `- [ ] Changes have been tested locally\n`;

    // Add review notes section
    body += `\n## Notes for Reviewers\n\n`;
    body += this.generateReviewNotes(analysis);

    return body;
  }

  private generateNaturalSummary(analysis: any): string {
    const { commitTypes, stats, categories } = analysis;
    
    let summary = 'This pull request ';
    
    // Determine the primary action
    const sortedTypes = Object.entries(commitTypes as Record<string, number>)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a);
    
    if (sortedTypes.length === 0) {
      summary += 'includes various updates';
    } else if (sortedTypes[0][0] === 'feat') {
      summary += 'introduces new functionality';
    } else if (sortedTypes[0][0] === 'fix') {
      summary += 'addresses and fixes issues';
    } else if (sortedTypes[0][0] === 'refactor') {
      summary += 'refactors existing code for better maintainability';
    } else if (sortedTypes[0][0] === 'docs') {
      summary += 'updates documentation';
    } else {
      summary += 'includes maintenance updates';
    }
    
    // Add category information
    const categoryList = Object.keys(categories);
    if (categoryList.length === 1) {
      summary += ` in the ${categoryList[0].toLowerCase()}`;
    } else if (categoryList.length === 2) {
      summary += ` across ${categoryList[0].toLowerCase()} and ${categoryList[1].toLowerCase()}`;
    } else if (categoryList.length > 2) {
      summary += ` across multiple areas including ${categoryList.slice(0, 2).join(', ').toLowerCase()}, and others`;
    }
    
    summary += '.';
    
    // Add impact statement
    if (stats.additions > 500) {
      summary += ' This is a substantial change that adds significant new code.';
    } else if (stats.deletions > stats.additions * 2) {
      summary += ' The changes primarily focus on code cleanup and removal.';
    } else if (stats.filesChanged === 1) {
      summary += ' The change is focused on a single file.';
    }
    
    return summary;
  }

  private generateReviewNotes(analysis: any): string {
    const { stats, categories } = analysis;
    let notes = '';
    
    // Provide context-specific review guidance
    if (stats.additions > 500) {
      notes += 'This PR contains substantial additions. Please review the architectural decisions and ensure the new code follows project patterns.\n\n';
    }
    
    if (stats.deletions > 200) {
      notes += 'Significant code has been removed. Please verify that no essential functionality has been lost.\n\n';
    }
    
    if (Object.keys(categories).includes('API/Services')) {
      notes += 'API changes are included. Please verify backward compatibility and update any affected clients.\n\n';
    }
    
    if (Object.keys(categories).includes('Dependencies')) {
      notes += 'Dependencies have been modified. Please review for security implications and compatibility.\n\n';
    }
    
    if (Object.keys(categories).includes('Configuration')) {
      notes += 'Configuration files have been changed. Please ensure environment-specific settings are properly handled.\n\n';
    }
    
    if (notes === '') {
      notes = 'Please review the changes for code quality, adherence to project standards, and potential impacts on existing functionality.';
    }
    
    return notes.trim();
  }

  private getFileStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      added: 'Added',
      modified: 'Modified',
      removed: 'Removed',
      renamed: 'Renamed',
    };
    return statusMap[status] || 'Changed';
  }

}

// Tool definition for MCP
export const createPRTool = {
  name: 'create-pr',
  description: 'Create a new pull request with automatic professional formatting based on file changes',
  inputSchema: {
    type: 'object',
    properties: {
      owner: {
        type: 'string',
        description: 'Repository owner',
      },
      repo: {
        type: 'string',
        description: 'Repository name',
      },
      title: {
        type: 'string',
        description: 'PR title (auto-generated if not provided)',
      },
      head: {
        type: 'string',
        description: 'Branch to merge from',
      },
      base: {
        type: 'string',
        description: 'Branch to merge into',
      },
      body: {
        type: 'string',
        description: 'PR description (auto-generated if not provided)',
      },
      draft: {
        type: 'boolean',
        description: 'Create as draft PR',
      },
      auto_generate: {
        type: 'boolean',
        description: 'Auto-generate title and body from changes (default: true)',
      },
    },
    required: ['owner', 'repo', 'head', 'base'],
  },
  handler: async (args: CreatePRArgs) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN not configured');
    }
    const tool = new CreatePRTool(token);
    return tool.execute(args);
  },
};