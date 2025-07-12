# Claude Code Configuration

## Build Commands
- `npm run build`: Build the project
- `npm run test`: Run the full test suite
- `npm run lint`: Run ESLint and format checks
- `npm run typecheck`: Run TypeScript type checking
- `./claude-flow --help`: Show all available commands

## Claude-Flow Complete Command Reference

### Core System Commands
- `./claude-flow start [--ui] [--port 3000] [--host localhost]`: Start orchestration system with optional web UI
- `./claude-flow status`: Show comprehensive system status
- `./claude-flow monitor`: Real-time system monitoring dashboard
- `./claude-flow config <subcommand>`: Configuration management (show, get, set, init, validate)

### Agent Management
- `./claude-flow agent spawn <type> [--name <name>]`: Create AI agents (researcher, coder, analyst, etc.)
- `./claude-flow agent list`: List all active agents
- `./claude-flow spawn <type>`: Quick agent spawning (alias for agent spawn)

### Task Orchestration
- `./claude-flow task create <type> [description]`: Create and manage tasks
- `./claude-flow task list`: View active task queue
- `./claude-flow workflow <file>`: Execute workflow automation files

### Memory Management
- `./claude-flow memory store <key> <data>`: Store persistent data across sessions
- `./claude-flow memory get <key>`: Retrieve stored information
- `./claude-flow memory list`: List all memory keys
- `./claude-flow memory export <file>`: Export memory to file
- `./claude-flow memory import <file>`: Import memory from file
- `./claude-flow memory stats`: Memory usage statistics
- `./claude-flow memory cleanup`: Clean unused memory entries

### SPARC Development Modes
- `./claude-flow sparc "<task>"`: Run orchestrator mode (default)
- `./claude-flow sparc run <mode> "<task>"`: Run specific SPARC mode
- `./claude-flow sparc tdd "<feature>"`: Test-driven development mode
- `./claude-flow sparc modes`: List all 17 available SPARC modes

Available SPARC modes: orchestrator, coder, researcher, tdd, architect, reviewer, debugger, tester, analyzer, optimizer, documenter, designer, innovator, swarm-coordinator, memory-manager, batch-executor, workflow-manager

### Swarm Coordination
- `./claude-flow swarm "<objective>" [options]`: Multi-agent swarm coordination
- `--strategy`: research, development, analysis, testing, optimization, maintenance
- `--mode`: centralized, distributed, hierarchical, mesh, hybrid
- `--max-agents <n>`: Maximum number of agents (default: 5)
- `--parallel`: Enable parallel execution
- `--monitor`: Real-time monitoring
- `--output <format>`: json, sqlite, csv, html

### MCP Server Integration
- `./claude-flow mcp start [--port 3000] [--host localhost]`: Start MCP server
- `./claude-flow mcp status`: Show MCP server status
- `./claude-flow mcp tools`: List available MCP tools

### Claude Integration
- `./claude-flow claude auth`: Authenticate with Claude API
- `./claude-flow claude models`: List available Claude models
- `./claude-flow claude chat`: Interactive chat mode

### Session Management
- `./claude-flow session`: Manage terminal sessions
- `./claude-flow repl`: Start interactive REPL mode

### Enterprise Features
- `./claude-flow project <subcommand>`: Project management (Enterprise)
- `./claude-flow deploy <subcommand>`: Deployment operations (Enterprise)
- `./claude-flow cloud <subcommand>`: Cloud infrastructure management (Enterprise)
- `./claude-flow security <subcommand>`: Security and compliance tools (Enterprise)
- `./claude-flow analytics <subcommand>`: Analytics and insights (Enterprise)

### Project Initialization
- `./claude-flow init`: Initialize Claude-Flow project
- `./claude-flow init --sparc`: Initialize with full SPARC development environment

## Quick Start Workflows

### Research Workflow
```bash
# Start a research swarm with distributed coordination
./claude-flow swarm "Research modern web frameworks" --strategy research --mode distributed --parallel --monitor

# Or use SPARC researcher mode for focused research
./claude-flow sparc run researcher "Analyze React vs Vue vs Angular performance characteristics"

# Store findings in memory for later use
./claude-flow memory store "research_findings" "Key insights from framework analysis"
```

### Development Workflow
```bash
# Start orchestration system with web UI
./claude-flow start --ui --port 3000

# Run TDD workflow for new feature (see TDD Methodology section for details)
./claude-flow sparc tdd "User authentication system with JWT tokens"

# Development swarm for complex projects
./claude-flow swarm "Build e-commerce API with payment integration" --strategy development --mode hierarchical --max-agents 8 --monitor

# Check system status
./claude-flow status
```

### Analysis Workflow
```bash
# Analyze codebase performance
./claude-flow sparc run analyzer "Identify performance bottlenecks in current codebase"

# Data analysis swarm
./claude-flow swarm "Analyze user behavior patterns from logs" --strategy analysis --mode mesh --parallel --output sqlite

# Store analysis results
./claude-flow memory store "performance_analysis" "Bottlenecks identified in database queries"
```

### Maintenance Workflow
```bash
# System maintenance with safety controls
./claude-flow swarm "Update dependencies and security patches" --strategy maintenance --mode centralized --monitor

# Security review
./claude-flow sparc run reviewer "Security audit of authentication system"

# Export maintenance logs
./claude-flow memory export maintenance_log.json
```

### TDD Workflow
```bash
# Complete Test-Driven Development workflow
./claude-flow sparc run researcher "Research feature best practices"
./claude-flow memory store "feature_patterns" "Key patterns and practices"
./claude-flow sparc tdd "Implement feature using TDD methodology"
./claude-flow sparc run reviewer "Review TDD implementation"
```

## Integration Patterns

### Memory-Driven Coordination
Use Memory to coordinate information across multiple SPARC modes and swarm operations:

```bash
# Store architecture decisions
./claude-flow memory store "system_architecture" "Microservices with API Gateway pattern"

# All subsequent operations can reference this decision
./claude-flow sparc run coder "Implement user service based on system_architecture in memory"
./claude-flow sparc run tester "Create integration tests for microservices architecture"
```

### Multi-Stage Development
Coordinate complex development through staged execution:

```bash
# Stage 1: Research and planning
./claude-flow sparc run researcher "Research authentication best practices"
./claude-flow sparc run architect "Design authentication system architecture"

# Stage 2: Implementation
./claude-flow sparc tdd "User registration and login functionality"  # Uses TDD methodology
./claude-flow sparc run coder "Implement JWT token management"

# Stage 3: Testing and deployment
./claude-flow sparc run tester "Comprehensive security testing"
./claude-flow swarm "Deploy authentication system" --strategy maintenance --mode centralized
```

### Enterprise Integration
For enterprise environments with additional tooling:

```bash
# Project management integration
./claude-flow project create "authentication-system"
./claude-flow project switch "authentication-system"

# Security compliance
./claude-flow security scan
./claude-flow security audit

# Analytics and monitoring
./claude-flow analytics dashboard
./claude-flow deploy production --monitor
```

## Advanced Batch Tool Patterns

### TodoWrite Coordination
Always use TodoWrite for complex task coordination:

```javascript
TodoWrite([
  {
    id: "architecture_design",
    content: "Design system architecture and component interfaces",
    status: "pending",
    priority: "high",
    dependencies: [],
    estimatedTime: "60min",
    assignedAgent: "architect"
  },
  {
    id: "frontend_development", 
    content: "Develop React components and user interface",
    status: "pending",
    priority: "medium",
    dependencies: ["architecture_design"],
    estimatedTime: "120min",
    assignedAgent: "frontend_team"
  }
]);

// TDD-specific TodoWrite pattern
TodoWrite([
  {
    id: "tdd_generate_tests",
    content: "Generate test suite using TDD methodology",
    status: "pending",
    priority: "high",
    tags: ["tdd", "testing"]
  },
  {
    id: "tdd_implement",
    content: "Generate implementation to pass all tests",
    status: "pending",
    priority: "high",
    dependencies: ["tdd_generate_tests"],
    tags: ["tdd", "implementation"]
  }
]);
```

### Task and Memory Integration
Launch coordinated agents with shared memory:

```javascript
// Store architecture in memory
Task("System Architect", "Design architecture and store specs in Memory");

// Other agents use memory for coordination
Task("Frontend Team", "Develop UI using Memory architecture specs");
Task("Backend Team", "Implement APIs according to Memory specifications");
```

## Code Style Preferences
- Use ES modules (import/export) syntax
- Destructure imports when possible
- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Use async/await instead of Promise chains
- Prefer const/let over var
- Follow SOLID principles in component/class design
- Use ESLint with the project's configuration
- Follow the Prettier configuration for code formatting
- Prefer const over let, avoid var
- Use early returns to reduce nesting
- Implement proper error boundaries and error handling
- Use meaningful error messages that aid debugging

## Workflow Guidelines
- Always run typecheck after making code changes
- Run tests before committing changes
- Use meaningful commit messages
- Create feature branches for new functionality
- Ensure all tests pass before merging
- Follow Test-Driven Development (TDD) methodology for all new features
- Always generate tests before implementation code

## Test-Driven Development (TDD) Methodology

### TDD Philosophy: TDD for AI

Test-Driven Development in the context of AI-assisted development extends traditional TDD principles. As Chanwit describes it: "TDD is a human development practice, TDG (Test-Driven Generation) is the same but for AI." This approach enables "Vibe Coding without Chaos" - high-quality code generation through structured, test-first development with you (Claude) as the AI pair programmer.

### Core Principles

1. **AI follows TDD discipline**: You generate tests first, then implementation
2. **Human-in-the-loop**: Users provide specifications and guide the process
3. **Semantic clarity**: Test names and descriptions directly influence code quality
4. **Iterative refinement**: Continuous test-code-refactor cycles

### TDD Implementation Process

When implementing features using TDD:

1. **Specification Phase** - User provides requirements
2. **Test Generation Phase** - Create comprehensive tests BEFORE any implementation
3. **Code Generation Phase** - Generate code that passes all tests
4. **Verification Phase** - Run tests and ensure all pass
5. **Refinement Phase** - Refactor while maintaining test coverage

### Integration with Claude-Flow SPARC

The existing TDD mode is your primary tool for TDD:

```bash
# Launch TDD workflow for a feature
./claude-flow sparc tdd "User authentication with JWT tokens"
```

For complex TDD workflows, combine multiple SPARC modes:

```bash
# Research best practices first
./claude-flow sparc run researcher "Research secure authentication patterns"

# Store patterns in memory for TDD reference
./claude-flow memory store "auth_patterns" "JWT with refresh tokens, bcrypt for passwords"

# Execute TDD with context from memory
./claude-flow sparc tdd "Authentication system using patterns from auth_patterns memory"

# Review the generated code
./claude-flow sparc run reviewer "Security review of authentication implementation"
```

### TDD Best Practices

#### 1. Semantic Test Design
Based on TD-GPT findings, test names significantly impact implementation quality:

```typescript
// GOOD: Descriptive test that guides implementation
describe('PasswordResetToken', () => {
  it('should generate cryptographically secure 32-character alphanumeric token', async () => {
    const token = await generateResetToken('user@example.com');
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[a-zA-Z0-9]+$/);
    expect(await crypto.subtle.digest('SHA-256', token)).toBeDefined();
  });
});

// POOR: Vague test leads to uncertain implementation
it('should work', async () => {
  expect(generateResetToken('user@example.com')).toBeDefined();
});
```

#### 2. Edge Case Coverage
Always include tests for error conditions and edge cases:

```typescript
describe('Cell', () => {
  // Happy path
  it('should calculate density as weight divided by volume', () => {
    const cell = new Cell(10, 5); // weight: 10, volume: 5
    expect(cell.getDensity()).toBe(2);
  });
  
  // Edge case
  it('should handle zero volume by returning Infinity', () => {
    const cell = new Cell(10, 0);
    expect(cell.getDensity()).toBe(Infinity);
  });
  
  // Error case
  it('should throw error for negative volume', () => {
    expect(() => new Cell(10, -5)).toThrow('Volume must be positive');
  });
});
```

#### 3. Behavioral Testing
Focus on behaviors, not implementation details:

```typescript
// Test behavior, not internals
describe('Mitosis', () => {
  it('should create two cells with half the original weight each', () => {
    const parent = new Cell(20, 10);
    const [cell1, cell2] = parent.mitosis();
    
    expect(cell1.getWeight()).toBe(10);
    expect(cell2.getWeight()).toBe(10);
    expect(cell1.getVolume()).toBe(5);
    expect(cell2.getVolume()).toBe(5);
  });
});
```

### TDD with TodoWrite Integration

Always track TDD steps using TodoWrite:

```javascript
TodoWrite([
  {
    id: "research_patterns",
    content: "Research best practices for feature implementation",
    status: "pending",
    priority: "high"
  },
  {
    id: "generate_test_suite",
    content: "Generate comprehensive test suite covering all requirements",
    status: "pending",
    priority: "high",
    dependencies: ["research_patterns"]
  },
  {
    id: "implement_feature",
    content: "Generate implementation that passes all tests",
    status: "pending",
    priority: "high",
    dependencies: ["generate_test_suite"]
  },
  {
    id: "run_tests",
    content: "Execute test suite and verify 100% pass rate",
    status: "pending",
    priority: "high",
    dependencies: ["implement_feature"]
  },
  {
    id: "security_review",
    content: "Review implementation for security vulnerabilities",
    status: "pending",
    priority: "medium",
    dependencies: ["run_tests"]
  }
]);
```

### Swarm Coordination for TDD

For large-scale TDD projects, use swarm coordination:

```bash
# TDD swarm for complex feature development
./claude-flow swarm "Implement complete authentication system with TDD" \
  --strategy development \
  --mode hierarchical \
  --parallel \
  --monitor

# The swarm will coordinate:
# - Researcher agents for best practices
# - TDD agents for test generation
# - Coder agents for implementation
# - Tester agents for verification
```

### Multi-Agent TDD Pattern

Leverage multiple agents for comprehensive TDD:

```javascript
// Coordinate specialized agents for TDD phases
Task("Test Designer", "Create comprehensive test suite for authentication feature");
Task("Implementation Coder", "Generate code that passes all tests from Test Designer");
Task("Security Reviewer", "Audit generated code for vulnerabilities");
Task("Performance Optimizer", "Optimize code while maintaining test coverage");
```

### Memory-Driven TDD

Use memory to maintain TDD context across sessions:

```bash
# Store test patterns
./claude-flow memory store "test_patterns" "Use arrange-act-assert pattern, test edge cases"

# Store implementation decisions
./claude-flow memory store "impl_decisions" "Use bcrypt for passwords, JWT for sessions"

# Reference in future TDD sessions
./claude-flow sparc tdd "Extend auth system using test_patterns and impl_decisions from memory"
```

### Common TDD Patterns

Based on TD-GPT experiments, these patterns emerge:

1. **Simple Logic (FizzBuzz-style)**
   - Tests drive branching logic
   - Edge cases define behavior
   - Test names guide implementation

2. **Object Modeling (Cell example)**
   - Behavioral tests define class structure
   - Tests for mutations guide state management
   - Complex behaviors emerge from simple test specifications

3. **Inheritance Hierarchies (Object Zoo)**
   - Tests for shared behaviors create base classes
   - Specific tests drive subclass implementations
   - Composition emerges from behavioral requirements

### When to Use TDD

Apply TDD for:
- ✅ New feature development
- ✅ Bug fixes (write failing test first)
- ✅ API endpoint development
- ✅ Refactoring with confidence
- ✅ Complex business logic
- ✅ Security-critical code

Avoid TDD for:
- ❌ Exploratory prototyping
- ❌ UI-only changes
- ❌ Simple configuration updates

### TDD Workflow Example

Complete example using all claude-flow features:

```bash
# 1. Initialize TDD project
./claude-flow init --sparc

# 2. Research phase
./claude-flow sparc run researcher "Research payment processing best practices"
./claude-flow memory store "payment_research" "Use Stripe, implement idempotency, handle webhooks"

# 3. Architecture phase
./claude-flow sparc run architect "Design payment system architecture"
./claude-flow memory store "payment_architecture" "Service pattern with webhook handlers"

# 4. TDD Implementation
./claude-flow sparc tdd "Payment processing service with Stripe integration"

# 5. Parallel testing and review
./claude-flow swarm "Test and review payment implementation" \
  --strategy testing \
  --mode distributed \
  --parallel

# 6. Monitor results
./claude-flow monitor
```

### TDD Rules for Claude

1. **Never skip test generation**: Even for "simple" features
2. **Tests before code**: No exceptions to this rule
3. **Run tests immediately**: After generating implementation
4. **Track with TodoWrite**: Every TDD step must be tracked
5. **Use Memory**: Store patterns and decisions for consistency
6. **Leverage SPARC modes**: Combine researcher, tdd, reviewer, tester
7. **Enable parallelism**: Use swarms for complex TDD workflows

## Available MCP Tools & Capabilities

### MCP Tools Overview
I have access to multiple MCP (Model Context Protocol) servers that enable direct actions. **Always use these tools when the action is needed instead of asking the user to perform it manually**, unless explicitly instructed otherwise.

### GitHub MCP (`mcp__github__`)
Full GitHub API integration for repository management:
- **Repository Operations**: Create, fork, search repos
- **File Management**: Get/create/update/delete files, get file contents
- **Issues**: Create, update, list, search, comment on issues
- **Pull Requests**: Create, update, merge PRs; add reviews and comments
- **Branches & Commits**: Create branches, list commits, get commit details
- **Workflow Integration**: Use for all GitHub operations during development

### Netlify MCP (`mcp__netlify__`)
Complete Netlify platform control:
- **Site Management**: Get projects, update settings, manage forms
- **Deployment**: Deploy sites, get deploy status
- **Environment Variables**: Manage env vars across contexts
- **Access Control**: Update visitor access, passwords, SSO
- **Extensions**: Install/manage Netlify extensions
- **Database**: Initialize and manage Netlify databases

### NocoDB MCP (`mcp__nocodb__`)
Database operations for NocoDB:
- **Records**: Get, create, update, delete records (single or bulk)
- **Tables**: List, create tables, get metadata
- **Schema**: Add/remove columns, alter table structure
- **Querying**: Filter, sort, paginate records with complex conditions

### n8n MCP (`mcp__n8n__`)
Workflow automation platform:
- **Workflow Management**: Create, update, delete, validate workflows
- **Node Operations**: List nodes, get node info, validate configurations
- **Execution**: Trigger webhooks, get execution status
- **Templates**: Search and use workflow templates
- **Documentation**: Get node documentation and examples

### Web Research MCPs
- **Tavily** (`mcp__tavily__`): Advanced web search, content extraction, deep research
- **Firecrawl** (`mcp__firecrawl__`): Web scraping, crawling, content extraction
- **Puppeteer** (`mcp__puppeteer__`): Browser automation, screenshots, page interaction

### Content & Media MCPs
- **Transistor** (`mcp__transistor__`): Podcast management, episode creation, analytics
- **Peekaboo** (`mcp__peekaboo__`): Screen capture, image analysis, system inspection

### Project Management MCPs
- **Asana** (`mcp__asana__`): Full Asana integration for tasks, projects, teams
- **Serena** (`mcp__serena__`): Code analysis, symbol search, memory management

### Development & Monitoring MCPs
- **Sentry** (`mcp__sentry__`): Error tracking and performance monitoring
  - **Error Management**: Find issues, get error details, analyze stack traces
  - **Project Setup**: Create projects, configure DSNs, manage teams
  - **Analysis**: AI-powered error analysis with Seer, search documentation
  - **Performance**: Find transactions, analyze performance patterns
- **Context7** (`mcp__context7__`): Documentation retrieval for libraries
  - **Library Search**: Resolve package names to Context7 IDs
  - **Documentation**: Get up-to-date docs for any supported library
  - **Version Support**: Access specific version documentation

### MCP Usage Guidelines

1. **Always prefer MCP tools over manual instructions**:
   ```bash
   # DON'T: "Please run git commands to create a branch"
   # DO: Use mcp__github__create_branch directly
   ```

2. **Chain MCP operations for complex workflows**:
   ```javascript
   // Example: Fix bug and create PR
   // 1. Create branch
   mcp__github__create_branch({branch: "fix/issue-123"})
   // 2. Update files
   mcp__github__create_or_update_file({...})
   // 3. Create PR
   mcp__github__create_pull_request({...})
   ```

3. **Use appropriate MCPs for deployment**:
   - GitHub Actions: Use GitHub MCP to trigger/monitor
   - Netlify deploys: Use Netlify MCP to trigger builds
   - Database updates: Use NocoDB MCP directly

4. **Combine MCPs for full automation**:
   - Research with Tavily/Firecrawl
   - Implement changes with GitHub MCP
   - Deploy with Netlify MCP
   - Update data with NocoDB MCP

## Performance & Accessibility
- Implement proper loading states for async operations
- Use proper semantic HTML elements
- Follow WCAG 2.2 AA standards
- Include proper ARIA labels and roles
- Ensure proper color contrast (minimum 4.5:1 for normal text)
- Implement keyboard navigation support
- Optimize images and assets
- Implement proper code splitting
- Use proper caching strategies

## Write valid Typescript code that uses state-of-the-art Node.js v24 features and follows best practices:
- Always use ES6+ syntax
- Always use the built-in 'fetch' for HTTP requests, rather than using the 'node-fetch' package
- Always use Node.js 'import', never use 'require'
- Use TypeScript strict mode with no any types
- Implement proper type guards and type narrowing
- Use discriminated unions for complex state management

## Active Project Integrations

### LinkedIn Profile Scraping (In Progress - 2025-06-22)
- **Goal**: Enrich guest profile data using Apify LinkedIn scraper + NocoDB storage
- **Selected Actor**: `dev_fusion/linkedin-profile-scraper` (added to Apify account)
- **MCP Configuration**: LinkedIn scraper configured and tested successfully
- **NocoDB Fields**: ✅ All 14 LinkedIn fields added to Guests table
- **n8n Workflow**: ✅ Created "LinkedIn Profile Enrichment v2" (ID: fo3no0RhZlZA90s3)
- **Status**: Ready for testing - Configure n8n credentials and run workflow
- **Documentation**: 
  - `/docs/linkedin-scraping-integration.md` - Full integration overview
  - `/docs/n8n-linkedin-enrichment-workflow.md` - n8n workflow setup guide

### MCP Server Setup
Current Apify MCP configuration requires LinkedIn scraper addition:
```bash
claude mcp add-json apify --scope user '{
     "command": "npx",
     "args": ["-y", "@apify/actors-mcp-server", "--actors", "dev_fusion/linkedin-profile-scraper"],
     "env": {
        "APIFY_TOKEN": "YOUR_APIFY_TOKEN_HERE"
     }
}'
```

### NocoDB Integration
- **Database**: Guest profiles stored in NocoDB
- **LinkedIn Fields**: ✅ Successfully added 14 LinkedIn fields to Guests table
- **Data Flow**: LinkedIn URL → Apify Scraper → NocoDB → Website Display
- **Next Step**: Implement data transformation and enrichment script

## Important Notes
- **Use TodoWrite extensively** for all complex task coordination
- **Leverage Task tool** for parallel agent execution on independent work
- **Store all important information in Memory** for cross-agent coordination
- **Use batch file operations** whenever reading/writing multiple files
- **Check .claude/commands/** for detailed command documentation
- **All swarm operations include automatic batch tool coordination**
- **Monitor progress** with TodoRead during long-running operations
- **Enable parallel execution** with --parallel flags for maximum efficiency
- **Use MCP tools directly** instead of asking users to perform manual actions (see MCP Tools section)

This configuration ensures optimal use of Claude Code's batch tools for swarm orchestration and parallel task execution with full Claude-Flow capabilities.

## Solving Issues
When the user tells you to fix a bug/errer or when you encounter an error yourself, I want you to:
#1 implement a fix
#2 test the netlify build locally
#3 If #2 fails: take the errors and go back to #1. If #2 succeeds: go to next step
#4 commit and sync
#5 If needed, trigger the relevant Github action and wait for it to complete
#6 If #5 fails: take the error log go back to #1. If #5 succeeds: go to next step
#7 If needed, use the Github MCP to validate if the Github action succesfully updated the episode files.
#8 If the Github Action updated the files correctly: go to next step. If not: go back to step #1
#9 Use the Netlify MCP to trigger a new Netlify build. If it completes succesfully: you are done! If not: fetch the error log and rturn to #1

## Important: Content Files Are Generated
When an issue is found with any markdown file in src/content, editing the markdown file will NOT resolve the issue. These files are generated regularly by Github actions, so you need to update and run the relevant Github action instead.

## Production Website
This is now a production website hosted at https://www.cro.cafe. All changes should be carefully tested before deployment.