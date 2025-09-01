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
  patch?: string;
}

interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
}

interface CodePattern {
  pattern: string;
  type: string;
  impact: string;
}

export class CreatePRTool {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async execute(args: CreatePRArgs) {
    try {
      const { owner, repo, head, base, draft = false, auto_generate = true } = args;
      let { title, body } = args;

      if (auto_generate) {
        const analysis = await this.analyzeChanges(owner, repo, head, base);
        
        if (!title) {
          title = this.generateProfessionalTitle(analysis);
        }
        
        if (!body) {
          body = this.generateComprehensiveBody(analysis);
        }
      }

      if (!title) {
        title = `Merge ${head} into ${base}`;
      }

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
        isError: true
      };
    }
  }

  private async analyzeChanges(owner: string, repo: string, head: string, base: string) {
    try {
      const comparison = await this.octokit.repos.compareCommits({
        owner,
        repo,
        base,
        head,
      });

      const fileChanges: FileChange[] = comparison.data.files?.map(file => ({
        filename: file.filename,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        status: file.status,
        patch: file.patch,
      })) || [];

      const commits: CommitInfo[] = comparison.data.commits.map(commit => ({
        sha: commit.sha.substring(0, 7),
        message: commit.commit.message,
        author: commit.commit.author?.name || 'Unknown',
        date: commit.commit.author?.date || '',
      }));

      const categories = this.categorizeFiles(fileChanges);
      const commitTypes = this.analyzeCommitTypes(commits);
      const codePatterns = this.analyzeCodePatterns(fileChanges);
      const impactAnalysis = this.analyzeImpact(fileChanges, codePatterns);
      const features = this.extractFeatures(commits, fileChanges);
      const technicalChanges = this.analyzeTechnicalChanges(fileChanges);
      const dependencies = this.analyzeDependencies(fileChanges);

      return {
        fileChanges,
        commits,
        categories,
        commitTypes,
        codePatterns,
        impactAnalysis,
        features,
        technicalChanges,
        dependencies,
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
        codePatterns: [],
        impactAnalysis: {},
        features: [],
        technicalChanges: {},
        dependencies: { added: [], removed: [], updated: [] },
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
      
      if (file.filename.includes('test') || file.filename.includes('spec')) {
        category = 'Test Files';
      } else if (file.filename.match(/\.(md|txt|rst)$/i)) {
        category = 'Documentation';
      } else if (file.filename.match(/\.(ts|tsx)$/i)) {
        if (file.filename.includes('component') || file.filename.includes('Component')) {
          category = 'React Components';
        } else if (file.filename.includes('hook')) {
          category = 'React Hooks';
        } else if (file.filename.includes('util') || file.filename.includes('helper')) {
          category = 'Utility Functions';
        } else if (file.filename.includes('api') || file.filename.includes('service')) {
          category = 'API Services';
        } else if (file.filename.includes('type') || file.filename.includes('interface')) {
          category = 'Type Definitions';
        } else if (file.filename.includes('model')) {
          category = 'Data Models';
        } else if (file.filename.includes('controller')) {
          category = 'Controllers';
        } else if (file.filename.includes('middleware')) {
          category = 'Middleware';
        } else {
          category = 'Source Code';
        }
      } else if (file.filename.match(/\.(js|jsx)$/i)) {
        category = 'JavaScript Files';
      } else if (file.filename.match(/\.(css|scss|sass|less)$/i)) {
        category = 'Stylesheets';
      } else if (file.filename.match(/package\.json|yarn\.lock|package-lock\.json/)) {
        category = 'Package Dependencies';
      } else if (file.filename.match(/\.(yml|yaml)$/i)) {
        category = 'YAML Configuration';
      } else if (file.filename.match(/\.(json)$/i)) {
        category = 'JSON Configuration';
      } else if (file.filename.match(/Dockerfile|docker-compose/)) {
        category = 'Docker Configuration';
      } else if (file.filename.match(/\.(sql)$/i)) {
        category = 'Database Migrations';
      }

      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(file);
    });

    return categories;
  }

  private analyzeCommitTypes(commits: CommitInfo[]): Record<string, CommitInfo[]> {
    const types: Record<string, CommitInfo[]> = {
      features: [],
      fixes: [],
      refactoring: [],
      performance: [],
      documentation: [],
      testing: [],
      configuration: [],
      dependencies: [],
      other: [],
    };

    commits.forEach(commit => {
      const message = commit.message.toLowerCase();
      
      if (message.match(/feat|feature|add|implement|create/)) {
        types.features.push(commit);
      } else if (message.match(/fix|bug|resolve|patch|correct/)) {
        types.fixes.push(commit);
      } else if (message.match(/refactor|restructure|reorganize|improve structure/)) {
        types.refactoring.push(commit);
      } else if (message.match(/perf|performance|optimize|speed|faster/)) {
        types.performance.push(commit);
      } else if (message.match(/docs|documentation|readme|comment/)) {
        types.documentation.push(commit);
      } else if (message.match(/test|spec|coverage/)) {
        types.testing.push(commit);
      } else if (message.match(/config|build|ci|cd|pipeline/)) {
        types.configuration.push(commit);
      } else if (message.match(/deps|dependencies|upgrade|update package/)) {
        types.dependencies.push(commit);
      } else {
        types.other.push(commit);
      }
    });

    return types;
  }

  private analyzeCodePatterns(fileChanges: FileChange[]): CodePattern[] {
    const patterns: CodePattern[] = [];

    fileChanges.forEach(file => {
      if (!file.patch) return;

      if (file.patch.includes('async') || file.patch.includes('await')) {
        patterns.push({
          pattern: 'Asynchronous Operations',
          type: 'async-await',
          impact: 'Changes to asynchronous code flow',
        });
      }

      if (file.patch.match(/try\s*{|catch\s*\(|finally\s*{/)) {
        patterns.push({
          pattern: 'Error Handling',
          type: 'exception-handling',
          impact: 'Modified error handling logic',
        });
      }

      if (file.patch.includes('useState') || file.patch.includes('useEffect')) {
        patterns.push({
          pattern: 'React Hooks',
          type: 'react-hooks',
          impact: 'State management or side effects changes',
        });
      }

      if (file.patch.match(/class\s+\w+|interface\s+\w+|type\s+\w+/)) {
        patterns.push({
          pattern: 'Type System',
          type: 'type-definitions',
          impact: 'Type safety improvements or API contract changes',
        });
      }

      if (file.patch.match(/SELECT|INSERT|UPDATE|DELETE|JOIN/i)) {
        patterns.push({
          pattern: 'Database Queries',
          type: 'sql-queries',
          impact: 'Database interaction changes',
        });
      }

      if (file.patch.match(/import\s+.*from|export\s+(default|{)/)) {
        patterns.push({
          pattern: 'Module System',
          type: 'imports-exports',
          impact: 'Module dependency changes',
        });
      }
    });

    const uniquePatterns = patterns.filter((pattern, index, self) =>
      index === self.findIndex(p => p.type === pattern.type)
    );

    return uniquePatterns;
  }

  private analyzeImpact(fileChanges: FileChange[], patterns: CodePattern[]): Record<string, any> {
    const impact = {
      riskLevel: 'Low',
      affectedAreas: [] as string[],
      testingRequired: [] as string[],
      potentialBreaking: [] as string[],
      performanceImpact: 'Minimal',
    };

    const totalChanges = fileChanges.reduce((sum, f) => sum + f.changes, 0);
    if (totalChanges > 1000) {
      impact.riskLevel = 'High';
    } else if (totalChanges > 300) {
      impact.riskLevel = 'Medium';
    }

    fileChanges.forEach(file => {
      if (file.filename.includes('api')) {
        impact.affectedAreas.push('API endpoints');
        impact.testingRequired.push('API integration tests');
      }
      if (file.filename.includes('database') || file.filename.includes('model')) {
        impact.affectedAreas.push('Database layer');
        impact.testingRequired.push('Database migrations and queries');
      }
      if (file.filename.includes('auth')) {
        impact.affectedAreas.push('Authentication system');
        impact.testingRequired.push('Security and authentication flows');
        impact.riskLevel = 'High';
      }
      if (file.filename.includes('config')) {
        impact.affectedAreas.push('Application configuration');
        impact.testingRequired.push('Configuration validation');
      }
    });

    fileChanges.forEach(file => {
      if (file.status === 'removed') {
        impact.potentialBreaking.push(`Removed file: ${file.filename}`);
      }
      if (file.patch && file.patch.includes('BREAKING')) {
        impact.potentialBreaking.push(`Breaking change noted in: ${file.filename}`);
      }
    });

    const hasPerformancePatterns = patterns.some(p => 
      p.type === 'sql-queries' || p.pattern.includes('Performance')
    );
    if (hasPerformancePatterns) {
      impact.performanceImpact = 'Potential performance implications - review required';
    }

    return impact;
  }

  private extractFeatures(commits: CommitInfo[], fileChanges: FileChange[]): string[] {
    const features: string[] = [];

    commits.forEach(commit => {
      const message = commit.message;
      
      const featureMatch = message.match(/(?:feat|feature|add|implement)(?:\(.*?\))?:\s*(.+)/i);
      if (featureMatch) {
        features.push(featureMatch[1].trim());
      }

      const bulletPoints = message.match(/[-*]\s+(.+)/g);
      if (bulletPoints) {
        bulletPoints.forEach(point => {
          features.push(point.replace(/^[-*]\s+/, '').trim());
        });
      }
    });

    const fileGroups = this.categorizeFiles(fileChanges);
    
    if (fileGroups['React Components'] && fileGroups['React Components'].length > 0) {
      const componentNames = fileGroups['React Components'].map(f => {
        const match = f.filename.match(/([A-Z][a-zA-Z]+)\.tsx?$/);
        return match ? match[1] : null;
      }).filter(Boolean);
      
      if (componentNames.length > 0) {
        features.push(`New React components: ${componentNames.join(', ')}`);
      }
    }

    if (fileGroups['API Services'] && fileGroups['API Services'].length > 0) {
      features.push(`API service modifications in ${fileGroups['API Services'].length} files`);
    }

    return [...new Set(features)];
  }

  private analyzeTechnicalChanges(fileChanges: FileChange[]): Record<string, any> {
    const technical = {
      architecturalChanges: [] as string[],
      newPatterns: [] as string[],
      refactoredAreas: [] as string[],
      addedFunctionality: [] as string[],
      removedFunctionality: [] as string[],
    };

    fileChanges.forEach(file => {
      if (!file.patch) return;

      const newClasses = file.patch.match(/\+\s*(?:export\s+)?(?:class|interface)\s+(\w+)/g);
      if (newClasses) {
        newClasses.forEach(match => {
          const className = match.match(/(\w+)$/)?.[0];
          if (className) {
            technical.architecturalChanges.push(`New ${match.includes('interface') ? 'interface' : 'class'}: ${className}`);
          }
        });
      }

      const newFunctions = file.patch.match(/\+\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/g);
      if (newFunctions) {
        technical.addedFunctionality.push(`New functions in ${file.filename}`);
      }

      const removedFunctions = file.patch.match(/-\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)|-\s*(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/g);
      if (removedFunctions) {
        technical.removedFunctionality.push(`Removed functions from ${file.filename}`);
      }

      if (file.patch.includes('Observer') || file.patch.includes('Subject')) {
        technical.newPatterns.push('Observer pattern implementation');
      }
      if (file.patch.includes('Factory')) {
        technical.newPatterns.push('Factory pattern implementation');
      }
      if (file.patch.includes('Singleton')) {
        technical.newPatterns.push('Singleton pattern implementation');
      }
    });

    return technical;
  }

  private analyzeDependencies(fileChanges: FileChange[]): Record<string, string[]> {
    const dependencies = {
      added: [] as string[],
      removed: [] as string[],
      updated: [] as string[],
    };

    const packageFile = fileChanges.find(f => f.filename === 'package.json');
    if (packageFile && packageFile.patch) {
      const addedDeps = packageFile.patch.match(/\+\s*'([^']+)':\s*'[^']+'/g);
      if (addedDeps) {
        addedDeps.forEach(dep => {
          const match = dep.match(/'([^']+)':/);
          if (match) dependencies.added.push(match[1]);
        });
      }

      const removedDeps = packageFile.patch.match(/-\s*'([^']+)':\s*'[^']+'/g);
      if (removedDeps) {
        removedDeps.forEach(dep => {
          const match = dep.match(/'([^']+)':/);
          if (match) dependencies.removed.push(match[1]);
        });
      }

      const lines = packageFile.patch.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        if (lines[i].startsWith('-') && lines[i + 1].startsWith('+')) {
          const oldMatch = lines[i].match(/'([^']+)':\s*'([^']+)'/);
          const newMatch = lines[i + 1].match(/'([^']+)':\s*'([^']+)'/);
          if (oldMatch && newMatch && oldMatch[1] === newMatch[1] && oldMatch[2] !== newMatch[2]) {
            dependencies.updated.push(`${oldMatch[1]}: ${oldMatch[2]} → ${newMatch[2]}`);
          }
        }
      }
    }

    return dependencies;
  }

  private generateProfessionalTitle(analysis: any): string {
    const { commitTypes, stats, categories, features } = analysis;
    
    const primaryType = Object.entries(commitTypes as Record<string, any[]>)
      .filter(([_, commits]) => commits.length > 0)
      .sort(([_, a], [__, b]) => b.length - a.length)[0];

    if (!primaryType) {
      return `Update: ${stats.filesChanged} files modified`;
    }

    const [type] = primaryType;
    
    switch (type) {
      case 'features':
        if (features && features.length > 0) {
          return `Feature: ${features[0].substring(0, 60)}${features[0].length > 60 ? '...' : ''}`;
        }
        return `Feature: Add new functionality (${stats.filesChanged} files)`;
      
      case 'fixes':
        return `Fix: Resolve issues in ${Object.keys(categories)[0] || 'application'}`;
      
      case 'refactoring':
        return `Refactor: Improve code structure and maintainability`;
      
      case 'performance':
        return `Performance: Optimize application performance`;
      
      case 'documentation':
        return `Documentation: Update project documentation`;
      
      case 'testing':
        return `Testing: Add/update test coverage`;
      
      case 'configuration':
        return `Configuration: Update project configuration`;
      
      case 'dependencies':
        if (analysis.dependencies.added.length > 0) {
          return `Dependencies: Add ${analysis.dependencies.added[0]}${analysis.dependencies.added.length > 1 ? ' and others' : ''}`;
        }
        return `Dependencies: Update project dependencies`;
      
      default:
        return `Update: ${stats.filesChanged} files changed`;
    }
  }

  private generateComprehensiveBody(analysis: any): string {
    const { categories, commitTypes, stats, impactAnalysis, features, technicalChanges, dependencies } = analysis;

    let body = '## Executive Summary\n\n';
    body += this.generateExecutiveSummary(analysis);
    body += '\n\n';

    if (features && features.length > 0) {
      body += '## Features and Improvements\n\n';
      features.forEach((feature: string) => {
        body += `- ${feature}\n`;
      });
      body += '\n';
    }

    if (technicalChanges && Object.values(technicalChanges).some((arr: any) => arr.length > 0)) {
      body += '## Technical Changes\n\n';
      
      if (technicalChanges.architecturalChanges?.length > 0) {
        body += '### Architectural Updates\n';
        technicalChanges.architecturalChanges.forEach((change: string) => {
          body += `- ${change}\n`;
        });
        body += '\n';
      }

      if (technicalChanges.newPatterns?.length > 0) {
        body += '### Design Patterns\n';
        technicalChanges.newPatterns.forEach((pattern: string) => {
          body += `- ${pattern}\n`;
        });
        body += '\n';
      }

      if (technicalChanges.addedFunctionality?.length > 0) {
        body += '### Added Functionality\n';
        technicalChanges.addedFunctionality.forEach((func: string) => {
          body += `- ${func}\n`;
        });
        body += '\n';
      }

      if (technicalChanges.removedFunctionality?.length > 0) {
        body += '### Removed/Deprecated\n';
        technicalChanges.removedFunctionality.forEach((func: string) => {
          body += `- ${func}\n`;
        });
        body += '\n';
      }
    }

    body += '## Changed Files Analysis\n\n';
    body += `Total: **${stats.filesChanged} files** | **+${stats.additions} additions** | **-${stats.deletions} deletions**\n\n`;
    
    Object.entries(categories as Record<string, FileChange[]>).forEach(([category, files]) => {
      const categoryStats = {
        additions: files.reduce((sum, f) => sum + f.additions, 0),
        deletions: files.reduce((sum, f) => sum + f.deletions, 0),
      };
      
      body += `### ${category} (${files.length} file${files.length !== 1 ? 's' : ''})\n\n`;
      body += `Changes: +${categoryStats.additions} / -${categoryStats.deletions}\n\n`;
      
      const filesByDir: Record<string, FileChange[]> = {};
      files.forEach((file: FileChange) => {
        const dir = file.filename.substring(0, file.filename.lastIndexOf('/')) || 'root';
        if (!filesByDir[dir]) filesByDir[dir] = [];
        filesByDir[dir].push(file);
      });

      Object.entries(filesByDir).forEach(([dir, dirFiles]) => {
        body += `**${dir}/**\n`;
        dirFiles.forEach(file => {
          const status = this.getFileStatusIndicator(file.status);
          const changeIndicator = this.getChangeIndicator(file.additions, file.deletions);
          body += `- \`${file.filename.split('/').pop()}\` ${status} ${changeIndicator}\n`;
        });
        body += '\n';
      });
    });

    if (impactAnalysis) {
      body += '## Impact Analysis\n\n';
      body += `**Risk Level:** ${impactAnalysis.riskLevel}\n`;
      body += `**Performance Impact:** ${impactAnalysis.performanceImpact}\n\n`;
      
      if (impactAnalysis.affectedAreas?.length > 0) {
        body += '### Affected Areas\n';
        impactAnalysis.affectedAreas.forEach((area: string) => {
          body += `- ${area}\n`;
        });
        body += '\n';
      }

      if (impactAnalysis.potentialBreaking?.length > 0) {
        body += `### Potential Breaking Changes\n`;

        impactAnalysis.potentialBreaking.forEach((change: string) => {
          body += `- ${change}\n`;
        });
        body += '\n';
      }
    }

    if (dependencies && Object.values(dependencies).some((arr: any) => arr.length > 0)) {
      body += '## Dependencies\n\n';
      
      if (dependencies.added?.length > 0) {
        body += '### Added\n';
        dependencies.added.forEach((dep: string) => {
          body += `- \`${dep}\`\n`;
        });
        body += '\n';
      }

      if (dependencies.removed?.length > 0) {
        body += '### Removed\n';
        dependencies.removed.forEach((dep: string) => {
          body += `- \`${dep}\`\n`;
        });
        body += '\n';
      }

      if (dependencies.updated?.length > 0) {
        body += '### Updated\n';
        dependencies.updated.forEach((dep: string) => {
          body += `- ${dep}\n`;
        });
        body += '\n';
      }
    }

    if (impactAnalysis?.testingRequired?.length > 0) {
      body += '## Testing Requirements\n\n';
      body += 'The following areas require thorough testing:\n\n';
      impactAnalysis.testingRequired.forEach((test: string) => {
        body += `- ${test}\n`;
      });
      body += '\n';
    }

    if (impactAnalysis?.potentialBreaking?.length > 0 || dependencies?.removed?.length > 0) {
      body += '## Migration Guide\n\n';
      body += 'This PR contains changes that may require updates to existing code:\n\n';
      
      if (dependencies?.removed?.length > 0) {
        body += '1. **Removed Dependencies:** Ensure alternative implementations for removed packages\n';
      }
      if (impactAnalysis?.potentialBreaking?.length > 0) {
        body += '2. **Breaking Changes:** Review and update affected code areas\n';
      }
      body += '3. **Testing:** Run comprehensive test suite before deployment\n';
      body += '4. **Documentation:** Update relevant documentation to reflect changes\n\n';
    }

    body += '## Commit Details\n\n';
    
    Object.entries(commitTypes as Record<string, CommitInfo[]>).forEach(([type, typeCommits]) => {
      if (typeCommits.length === 0) return;
      
      const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
      body += `### ${typeLabel} (${typeCommits.length})\n\n`;
      
      typeCommits.slice(0, 5).forEach((commit: CommitInfo) => {
        const shortMessage = commit.message.split('\n')[0];
        body += `- \`${commit.sha}\` ${shortMessage} - *${commit.author}*\n`;
      });
      
      if (typeCommits.length > 5) {
        body += `- ... and ${typeCommits.length - 5} more\n`;
      }
      body += '\n';
    });

    body += '## Pre-Merge Checklist\n\n';
    body += '- [ ] Code review completed\n';
    body += '- [ ] All tests passing\n';
    body += '- [ ] Documentation updated\n';
    body += '- [ ] No console errors or warnings\n';
    body += '- [ ] Performance impact assessed\n';
    
    if (impactAnalysis?.riskLevel === 'High') {
      body += '- [ ] Security review completed\n';
      body += '- [ ] Rollback plan prepared\n';
    }
    
    if (dependencies?.added?.length > 0) {
      body += '- [ ] New dependencies reviewed for security\n';
      body += '- [ ] License compatibility verified\n';
    }
    
    body += '- [ ] Deployment plan prepared\n';
    
    body += '\n## Deployment Notes\n\n';
    
    if (dependencies?.added?.length > 0 || dependencies?.updated?.length > 0) {
      body += '- Run `npm install` or `yarn install` to update dependencies\n';
    }
    
    if (categories['Database Migrations']) {
      body += '- Execute database migrations before deployment\n';
    }
    
    if (categories['Configuration'] || categories['YAML Configuration'] || categories['JSON Configuration']) {
      body += '- Review and update configuration settings\n';
    }
    
    body += '- Monitor application logs after deployment\n';
    body += '- Be prepared to rollback if issues arise\n';

    return body;
  }

  private generateExecutiveSummary(analysis: any): string {
    const { stats, commitTypes, impactAnalysis, features } = analysis;
    
    let summary = 'This pull request ';
    
    const commitCounts = Object.entries(commitTypes as Record<string, any[]>)
      .map(([type, commits]) => ({ type, count: commits.length }))
      .sort((a, b) => b.count - a.count);
    
    if (commitCounts.length === 0 || commitCounts[0].count === 0) {
      summary += 'contains miscellaneous updates';
    } else {
      const primary = commitCounts[0];
      const secondary = commitCounts[1];
      
      switch (primary.type) {
        case 'features':
          summary += `introduces ${primary.count} new feature${primary.count !== 1 ? 's' : ''}`;
          if (features && features.length > 0) {
            summary += `, primarily ${features[0].toLowerCase()}`;
          }
          break;
        case 'fixes':
          summary += `addresses ${primary.count} issue${primary.count !== 1 ? 's' : ''}`;
          break;
        case 'refactoring':
          summary += 'refactors existing code for improved maintainability';
          break;
        case 'performance':
          summary += 'includes performance optimizations';
          break;
        default:
          summary += 'includes various improvements';
      }
      
      if (secondary && secondary.count > 0) {
        summary += ` along with ${secondary.count} ${secondary.type.replace(/s$/, '')}${secondary.count !== 1 ? 's' : ''}`;
      }
    }
    
    summary += `. The changes span ${stats.filesChanged} files with ${stats.additions} insertions and ${stats.deletions} deletions`;
    
    if (impactAnalysis) {
      summary += `. Risk assessment: **${impactAnalysis.riskLevel}**`;
      
      if (impactAnalysis.potentialBreaking?.length > 0) {
        summary += '. **Note:** This PR contains potential breaking changes that require careful review';
      }
    }
    
    summary += '.';
    
    return summary;
  }

  private getFileStatusIndicator(status: string): string {
    const indicators: Record<string, string> = {
      added: '[NEW]',
      modified: '[MOD]',
      removed: '[DEL]',
      renamed: '[REN]',
    };
    return indicators[status] || '[CHG]';
  }

  private getChangeIndicator(additions: number, deletions: number): string {
    const total = additions + deletions;
    if (total === 0) return '';
    
    if (total < 10) return '(minor changes)';
    if (total < 50) return '(moderate changes)';
    if (total < 200) return '(significant changes)';
    return '(major changes)';
  }
}

export const createPRTool = {
  name: 'create-pr',
  description: 'Create a comprehensive pull request with detailed analysis of changes',
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
        description: 'Auto-generate comprehensive title and body from changes (default: true)',
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
