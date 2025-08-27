# GitHub PR Manager for MCP

A powerful Model Context Protocol (MCP) server that lets AI assistants interact with GitHub pull requests. Whether you're using Cursor, VS Code, or Claude Desktop, this tool enables smart code reviews, commenting, and PR management - all while handling large files intelligently through automatic pagination.

## What This Does

Imagine having an AI assistant that can:
- Browse through massive pull requests without breaking a sweat
- Add thoughtful comments exactly where they're needed in the code
- Submit comprehensive reviews with specific feedback
- Handle files with thousands of lines by automatically chunking them into digestible pieces

All of this happens seamlessly within your favorite AI-powered IDE!

## Features at a Glance

- **Smart PR Reading**: Get detailed info about any pull request
- **Intelligent File Browsing**: Navigate through changed files with automatic pagination
- **Context-Aware Chunking**: Large files are automatically split to fit AI token limits
- **Precise Commenting**: Add inline comments to specific lines
- **Full Review Capability**: Submit complete reviews with approval/change requests
- **Secure State Management**: Encrypted tokens maintain your position across requests
- **Rate Limit Protection**: Built-in safeguards against hitting GitHub API limits

## Prerequisites

Before we begin, make sure you have:
- Node.js 18 or newer (check with `node --version`)
- A GitHub Personal Access Token ([create one here](https://github.com/settings/tokens))
  - For private repos: Select the `repo` scope
  - For public repos only: `public_repo` is enough
- An MCP-compatible IDE (Cursor, VS Code with MCP extension, or Claude Desktop)

## Installation Guide

### Step 1: Get the Code

First, let's get the project on your machine:

```bash
# Clone the repository
git clone https://github.com/your-org/mcp-github-pr.git
cd mcp-github-pr

# Install all the dependencies
npm install

# Build the project (this creates the dist folder)
npm run build
```

### Step 2: Set Up Your GitHub Token

The server needs your GitHub token to work. Here's how to set it up on different systems:

#### On Windows

Create a `.env` file in the project folder:
```env
GITHUB_TOKEN=ghp_YourGitHubTokenHere
MCP_SERVER_PORT=3000
MAX_TOKENS_PER_CHUNK=4000
```

#### On macOS/Linux

You can either use the `.env` file method above, or export it in your shell:
```bash
export GITHUB_TOKEN="ghp_YourGitHubTokenHere"
```

To make it permanent, add the export line to your `~/.bashrc` (Linux) or `~/.zshrc` (Mac).

## Setting Up Your IDE

Now comes the fun part - connecting this to your AI assistant! The setup varies slightly depending on which tool you're using.

### For Cursor Users (Verified Working Configuration)

Cursor needs to know about our MCP server. Here's the exact configuration that works:

#### Windows (Tested and Working ✅)

1. Create or edit the file at:
   ```
   %APPDATA%\Cursor\User\globalStorage\saoud.claude-dev-experimental\settings\claude-dev.json
   ```

2. **Use this exact configuration with absolute paths** (this is what fixes the red error):
   ```json
   {
     "mcpServers": {
       "github-pr": {
         "command": "node",
         "args": ["C:\\Users\\YourName\\path\\to\\mcp-github-pr\\dist\\index.js"],
         "env": {
           "GITHUB_TOKEN": "ghp_YourGitHubTokenHere",
           "MCP_SERVER_PORT": "3000",
           "MAX_TOKENS_PER_CHUNK": "4000"
         }
       }
     }
   }
   ```

   **Important**: Replace `C:\\Users\\YourName\\path\\to\\mcp-github-pr` with your actual full path. Use double backslashes `\\` in Windows paths.

3. **Restart Cursor completely** (close all windows and reopen)

4. **Verify it's working**: The red error should be gone, and you should see "github-pr" in your MCP connections.

#### Alternative Windows Setup (If Above Doesn't Work)

If you still see issues, try using a batch file:

1. Create a file called `start-server.bat` in your project folder:
   ```batch
   @echo off
   cd /d "C:\Users\YourName\path\to\mcp-github-pr"
   node dist\index.js
   ```

2. Update your Cursor configuration to:
   ```json
   {
     "mcpServers": {
       "github-pr": {
         "command": "C:\\Users\\YourName\\path\\to\\mcp-github-pr\\start-server.bat",
         "env": {
           "GITHUB_TOKEN": "ghp_YourGitHubTokenHere",
           "MCP_SERVER_PORT": "3000"
         }
       }
     }
   }
   ```

#### macOS
1. Create or edit the file at:
   ```
   ~/Library/Application Support/Cursor/User/globalStorage/saoud.claude-dev-experimental/settings/claude-dev.json
   ```

2. Add this configuration (use absolute paths for best results):
   ```json
   {
     "mcpServers": {
       "github-pr": {
         "command": "node",
         "args": ["/Users/YourName/path/to/mcp-github-pr/dist/index.js"],
         "env": {
           "GITHUB_TOKEN": "ghp_YourGitHubTokenHere",
           "MCP_SERVER_PORT": "3000",
           "MAX_TOKENS_PER_CHUNK": "4000"
         }
       }
     }
   }
   ```

#### Linux
1. Create or edit the file at:
   ```
   ~/.config/Cursor/User/globalStorage/saoud.claude-dev-experimental/settings/claude-dev.json
   ```

2. Add this configuration (use absolute paths for best results):
   ```json
   {
     "mcpServers": {
       "github-pr": {
         "command": "node",
         "args": ["/home/YourName/path/to/mcp-github-pr/dist/index.js"],
         "env": {
           "GITHUB_TOKEN": "ghp_YourGitHubTokenHere",
           "MCP_SERVER_PORT": "3000",
           "MAX_TOKENS_PER_CHUNK": "4000"
         }
       }
     }
   }
   ```

### For VS Code Users

If you're using VS Code with the MCP extension:

1. Open VS Code settings (Ctrl/Cmd + ,)
2. Search for "mcp"
3. Click "Edit in settings.json"
4. Add this configuration (use absolute paths):

```json
{
  "mcp.servers": {
    "github-pr": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-github-pr/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_YourGitHubTokenHere",
        "MCP_SERVER_PORT": "3000"
      }
    }
  }
}
```

### For Claude Desktop Users

Claude Desktop configuration varies by platform:

#### Windows
Edit the file at:
```
%APPDATA%\Claude\claude_desktop_config.json
```

#### macOS
Edit the file at:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

#### Linux
Edit the file at:
```
~/.config/claude/claude_desktop_config.json
```

Add this configuration (adjust paths as needed):

```json
{
  "mcpServers": {
    "github-pr": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-github-pr/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_YourGitHubTokenHere"
      }
    }
  }
}
```

## Verifying Your Setup

After configuration, here's how to verify everything is working:

### For Cursor Users
1. **Restart Cursor completely** (close all windows)
2. Open Cursor and look for MCP status in the bottom status bar
3. You should see "github-pr" listed without any red errors
4. Try asking Claude: "Can you list the available MCP tools?"
5. Claude should respond with tools like `read-pr`, `list-files`, etc.

### Testing the Connection
Ask your AI assistant to test the connection:
```
"Can you use the github-pr MCP server to read PR #1 from octocat/Hello-World?"
```

If successful, the AI will fetch and display information about that pull request.

## Quick Start - Try It Out!

Once everything is set up, restart your IDE and try these commands with your AI assistant:

### Example 1: Read a Pull Request
Ask your AI: "Can you read PR #123 from facebook/react and summarize the changes?"

The AI will use the MCP server to fetch and analyze the PR.

### Example 2: Review Code Changes
Ask: "Show me the changes in the main component file from that PR"

The AI will retrieve the specific file changes, automatically handling pagination if the file is large.

### Example 3: Add a Comment
Ask: "Add a comment on line 42 of src/App.js suggesting to use useMemo for that calculation"

The AI will post your comment directly to the PR.

### Example 4: Submit a Review
Ask: "Submit an approving review for this PR with a comment about the excellent test coverage"

## Troubleshooting Common Issues

### Cursor-Specific: Red Error on "node dist/index.js"

**Problem**: Cursor shows a red error even though the file exists.

**Solution**: This is almost always a path issue on Windows. The fix is to use absolute paths:

1. **Don't use relative paths** like `dist/index.js`
2. **Use absolute paths** like `C:\\Users\\YourName\\project\\dist\\index.js`
3. **Use double backslashes** in Windows paths: `\\` not single `\`
4. **Restart Cursor completely** after changing configuration

Example of what works:
```json
"args": ["C:\\Users\\vedan\\Desktop\\mcp-rag\\Github-MCP\\dist\\index.js"]
```

Example of what doesn't work:
```json
"args": ["dist/index.js"]  // ❌ Relative path
"args": ["./dist/index.js"]  // ❌ Still relative
"cwd": "C:\\path", "args": ["dist/index.js"]  // ❌ Sometimes fails
```

### "Command not found" or "Cannot find module"

**Problem**: The server won't start.

**Solution**: 
1. Make sure you've run `npm run build` after cloning
2. The `dist` folder must exist and contain `index.js`
3. Use absolute paths in your configuration

### "Authentication failed"

**Problem**: GitHub API returns 401 errors.

**Solutions**:
1. Check your token is valid: Go to GitHub Settings > Developer settings > Personal access tokens
2. Make sure the token has the right permissions (`repo` for private repos)
3. Verify the token is correctly set in your configuration (no extra spaces or quotes)

### "Rate limit exceeded"

**Problem**: Too many API calls to GitHub.

**Solutions**:
1. Wait an hour (rate limits reset hourly)
2. Use a personal access token instead of unauthenticated requests
3. Reduce `MAX_TOKENS_PER_CHUNK` to create fewer requests

### MCP Server Not Connecting

**Platform-specific solutions**:

#### Windows
- **Use absolute paths with double backslashes**: `C:\\Users\\Name\\path`
- Check Windows Defender isn't blocking Node.js
- Try running your IDE as administrator if permission issues occur
- Make sure Node.js is in your PATH: run `where node` in cmd

#### macOS
- Grant Terminal/IDE full disk access in System Preferences > Security & Privacy
- Check that Node.js was installed via official installer or Homebrew, not just `nvm`
- Use absolute paths starting with `/Users/`

#### Linux
- Ensure the user has execute permissions: `chmod +x dist/index.js`
- Check SELinux/AppArmor isn't blocking the execution
- Use absolute paths starting with `/home/` or `/`

### Large Files Timing Out

**Problem**: Files with thousands of lines fail to load.

**Solution**: Reduce the chunk size in your configuration:
```json
"MAX_TOKENS_PER_CHUNK": "2000"
```

## Configuration Options Explained

Here's what each setting does:

- **GITHUB_TOKEN**: Your personal access token for GitHub API authentication
- **MCP_SERVER_PORT**: Port the server listens on (default: 3000)
- **MAX_TOKENS_PER_CHUNK**: Maximum size of each chunk when splitting large files (default: 4000)
  - Lower values = more chunks but better compatibility
  - Higher values = fewer requests but might hit token limits
- **CONTEXT_TTL_MINUTES**: How long pagination contexts remain valid (default: 30)
- **LOG_LEVEL**: Verbosity of logs: `error`, `warn`, `info`, or `debug`

## How It Works Under the Hood

### The Pagination Magic

When you request a large file, here's what happens:

1. **File Analysis**: The server calculates the file's token count
2. **Smart Chunking**: If it exceeds the limit, it splits at logical boundaries (never mid-function!)
3. **Context Preservation**: Each chunk includes a few lines from the previous chunk for continuity
4. **Secure Tokens**: An encrypted token lets you fetch the next chunk without re-processing

### Token Estimation

The server estimates tokens using a formula based on:
- Character count (roughly 3.5 characters per token)
- Special characters and syntax elements
- Code complexity and formatting

This ensures chunks stay within AI model limits while maximizing information per request.

## Development and Testing

Want to contribute or just tinker? Here's how:

### Running in Development Mode

```bash
# Start with hot reload
npm run dev

# Run tests
npm test

# Check code style
npm run lint

# Format code
npm run format
```

### Project Structure

```
mcp-github-pr/
├── src/               # TypeScript source code
│   ├── tools/         # MCP tool implementations
│   ├── github/        # GitHub API client
│   └── pagination/    # Chunking logic
├── dist/              # Compiled JavaScript (generated)
├── tests/             # Test files
└── config/            # Configuration files
```

## Getting Help

Running into issues? Here's where to get help:

1. **Check the logs**: Set `LOG_LEVEL=debug` for detailed output
2. **Verify your setup**: Make sure `dist/index.js` exists after building
3. **Test manually**: Run `node dist/index.js` in the project folder - it should start without errors
4. **GitHub Issues**: Report bugs or request features
5. **Community Discord**: Get real-time help from other users

## License

MIT License - feel free to use this in your own projects!

## Acknowledgments

Built with love using:
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- [Octokit](https://github.com/octokit/rest.js) for GitHub API
- Coffee ☕ and late nights 

---

**Happy reviewing!** May your PRs be swift and your reviews be helpful! 