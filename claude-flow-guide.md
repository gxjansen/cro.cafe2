# Claude Code Flow Integration Guide for CRO.cafe2

## Overview
Claude Code Flow (v1.0.72) is installed and ready to use. This guide provides practical workflows for refactoring, optimization, and feature development in the CRO.cafe2 project.

## Available SPARC Development Modes

### Core Modes for Development
- **orchestrator**: Multi-agent task orchestration
- **coder**: Autonomous code generation
- **architect**: System design and planning
- **tdd**: Test-driven development
- **researcher**: Deep research and analysis
- **optimizer**: Performance optimization

## Practical Workflows for CRO.cafe2

### 1. Refactoring a Component

#### Example: Refactoring the Episode Card Component

```bash
# Step 1: Research current implementation
claude-flow sparc run researcher "analyze episode card component structure and patterns in cro.cafe2"

# Step 2: Design improved architecture
claude-flow sparc run architect "refactor episode card for better maintainability and accessibility" --memory-key episode-card-refactor

# Step 3: Implement with TDD
claude-flow sparc run tdd "refactor src/components/EpisodeCard.astro following new architecture" --memory-key episode-card-refactor

# Step 4: Code review
claude-flow sparc run reviewer "review refactored episode card implementation"
```

### 2. Performance Optimization

#### Example: Optimizing Image Loading

```bash
# Step 1: Analyze current performance
claude-flow sparc run analyzer "identify image loading bottlenecks in cro.cafe2"

# Step 2: Research optimization strategies
claude-flow sparc run researcher "best practices for image optimization in Astro projects"

# Step 3: Implement optimizations
claude-flow sparc run optimizer "optimize image loading performance" --parallel --batch

# Step 4: Test implementation
claude-flow sparc run tester "verify image optimization improvements"
```

### 3. Building New Features

#### Example: Adding Search Functionality

```bash
# Step 1: Full SPARC workflow with swarm deployment
claude-flow sparc swarm deploy \
  --agents "researcher,architect,coder,tdd,reviewer" \
  --task "implement search functionality for episodes and guests" \
  --memory-key search-feature

# Alternative: Step-by-step approach
# Research phase
claude-flow sparc run researcher "search implementation patterns for Astro static sites"

# Architecture design
claude-flow sparc run architect "design search feature with Fuse.js integration"

# Implementation
claude-flow sparc run coder "implement search component and API" --batch

# Testing
claude-flow sparc run tdd "create tests for search functionality"

# Integration
claude-flow sparc run orchestrator "integrate search feature with existing components"
```

## Advanced Patterns

### Parallel Development
```bash
# Deploy multiple agents for comprehensive feature development
claude-flow sparc batch \
  --agents "coder,tester,documenter" \
  --task "implement dark mode toggle with tests and documentation" \
  --parallel
```

### Memory-Based Coordination
```bash
# Store architectural decisions
claude-flow memory store architecture "component patterns and conventions"

# Use stored knowledge in development
claude-flow sparc run coder "implement new component" --memory-key architecture
```

### Iterative Refinement (Boomerang Pattern)
```bash
# Initial implementation
claude-flow sparc run coder "create initial guest profile component"

# Review and refine
claude-flow sparc run reviewer "analyze guest profile component" --memory-key guest-profile

# Optimize based on review
claude-flow sparc run optimizer "refine guest profile based on review" --memory-key guest-profile
```

## Integration Tips for CRO.cafe2

### 1. Maintain Project Standards
- Always include `--memory-key` to preserve context
- Use TDD mode for critical components
- Run reviewer mode before merging changes

### 2. Leverage Existing Configuration
- Claude Code Flow respects CLAUDE.md instructions
- Integrates with existing test suite
- Follows Tailwind v4 and TypeScript patterns

### 3. Workflow Automation
Create custom workflows in `.claude/workflows/`:
```yaml
name: component-refactor
steps:
  - mode: researcher
    task: "analyze {{component}} patterns"
  - mode: architect
    task: "design refactored {{component}}"
  - mode: tdd
    task: "implement and test {{component}}"
```

Run with: `claude-flow workflow run component-refactor --component EpisodeCard`

## Best Practices

1. **Start Small**: Use single agents for simple tasks
2. **Scale Up**: Deploy swarms for complex features
3. **Preserve Knowledge**: Use memory keys consistently
4. **Validate Changes**: Always run through reviewer mode
5. **Test Everything**: Leverage TDD mode for reliability

## Common Commands Reference

```bash
# Check system status
claude-flow status

# View stored memory
claude-flow memory list

# Monitor active agents
claude-flow monitor

# Get help for specific mode
claude-flow help sparc

# View detailed mode descriptions
claude-flow sparc modes --detailed
```

## Troubleshooting

If agents fail or timeout:
1. Check logs: `claude-flow status --verbose`
2. Adjust timeout: `--timeout 120` (minutes)
3. Use smaller tasks with `--batch` for file operations
4. Clear memory if needed: `claude-flow memory clear`

This guide provides practical patterns for integrating Claude Code Flow into your CRO.cafe2 development workflow.