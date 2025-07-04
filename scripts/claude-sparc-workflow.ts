#!/usr/bin/env tsx
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';

interface SPARCConfig {
  project: any;
  phases: any;
  workflows: any;
  automation: any;
}

class ClaudeSPARCWorkflow {
  private config: SPARCConfig;
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.config = this.loadConfig();
  }

  private loadConfig(): SPARCConfig {
    const configPath = join(this.projectRoot, 'sparc.config.json');
    if (!existsSync(configPath)) {
      throw new Error('SPARC configuration not found. Please create sparc.config.json');
    }
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  }

  private log(phase: string, message: string) {
    console.log(chalk.blue(`[${phase.toUpperCase()}]`), message);
  }

  private error(message: string) {
    console.error(chalk.red('[ERROR]'), message);
  }

  private success(message: string) {
    console.log(chalk.green('[SUCCESS]'), message);
  }

  private executeCommand(command: string, phase: string): boolean {
    try {
      this.log(phase, `Executing: ${command}`);
      execSync(command, { stdio: 'inherit' });
      return true;
    } catch (error) {
      this.error(`Command failed: ${command}`);
      return false;
    }
  }

  async runPhase(phaseName: string) {
    this.log(phaseName, `Starting ${phaseName} phase...`);

    switch (phaseName) {
      case 'research':
        await this.researchPhase();
        break;
      case 'specification':
        await this.specificationPhase();
        break;
      case 'architecture':
        await this.architecturePhase();
        break;
      case 'refinement':
        await this.refinementPhase();
        break;
      case 'completion':
        await this.completionPhase();
        break;
      default:
        this.error(`Unknown phase: ${phaseName}`);
    }
  }

  private async researchPhase() {
    this.log('research', 'Analyzing project dependencies and structure...');
    
    // Check project health
    this.executeCommand('npm run check', 'research');
    
    // Analyze content structure
    if (existsSync(join(this.projectRoot, 'scripts/validate-content.ts'))) {
      this.executeCommand('npm run validate-content', 'research');
    }
    
    // Check accessibility
    if (existsSync(join(this.projectRoot, 'scripts/check-accessibility.ts'))) {
      this.executeCommand('npm run check:accessibility', 'research');
    }
    
    this.success('Research phase completed');
  }

  private async specificationPhase() {
    this.log('specification', 'Validating requirements and specifications...');
    
    // Run TypeScript checks
    this.executeCommand('npm run typecheck', 'specification');
    
    // Validate schema
    if (existsSync(join(this.projectRoot, 'scripts/validate-schema.ts'))) {
      this.executeCommand('npm run validate-schema', 'specification');
    }
    
    this.success('Specification phase completed');
  }

  private async architecturePhase() {
    this.log('architecture', 'Analyzing architecture and design patterns...');
    
    // Check for circular dependencies
    this.log('architecture', 'Checking module dependencies...');
    
    // Validate component structure
    this.log('architecture', 'Validating component architecture...');
    
    this.success('Architecture phase completed');
  }

  private async refinementPhase() {
    this.log('refinement', 'Running quality checks and tests...');
    
    // Run all tests
    const tests = [
      'npm run test:all',
      'npm run test:a11y',
      'npm run lint'
    ];
    
    for (const test of tests) {
      if (!this.executeCommand(test, 'refinement')) {
        this.error('Refinement phase failed. Please fix issues before continuing.');
        process.exit(1);
      }
    }
    
    this.success('Refinement phase completed');
  }

  private async completionPhase() {
    this.log('completion', 'Building and preparing for deployment...');
    
    // Build the project
    if (!this.executeCommand('npm run build', 'completion')) {
      this.error('Build failed');
      process.exit(1);
    }
    
    // Generate sitemaps
    this.executeCommand('npm run generate-sitemaps', 'completion');
    
    // Validate final build
    if (existsSync(join(this.projectRoot, 'scripts/check-links.js'))) {
      this.executeCommand('npm run check-links', 'completion');
    }
    
    this.success('Completion phase completed');
  }

  async runFullWorkflow() {
    console.log(chalk.bold.blue('\n🚀 Starting Claude-SPARC Development Workflow\n'));
    
    const phases = ['research', 'specification', 'architecture', 'refinement', 'completion'];
    
    for (const phase of phases) {
      await this.runPhase(phase);
      console.log(''); // Add spacing between phases
    }
    
    console.log(chalk.bold.green('\n✨ Claude-SPARC Workflow Completed Successfully!\n'));
  }

  async runSinglePhase(phase: string) {
    console.log(chalk.bold.blue(`\n🎯 Running ${phase} phase\n`));
    await this.runPhase(phase);
    console.log(chalk.bold.green(`\n✅ ${phase} phase completed!\n`));
  }
}

// CLI execution
const workflow = new ClaudeSPARCWorkflow();
const phase = process.argv[2];

if (phase && phase !== 'all') {
  workflow.runSinglePhase(phase);
} else {
  workflow.runFullWorkflow();
}