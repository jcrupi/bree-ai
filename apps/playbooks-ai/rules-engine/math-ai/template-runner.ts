#!/usr/bin/env bun

import { MathEngine } from './engine';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Math Template Runner — Execute math-ai templates with dynamic variables
 *
 * Usage:
 *   Run template:      bun run template-runner.ts <template-id> <formula> [var=val ...]
 *   List templates:    bun run template-runner.ts --list
 *   Template examples: bun run template-runner.ts <template-id> --examples
 *
 * Examples:
 *   bun run template-runner.ts algebraic-notation-solver "a - 15 * (19 - b)" a=101 b=2
 *   bun run template-runner.ts bmi-standard W=75 H=1.75
 *   bun run template-runner.ts mean-arterial-pressure SBP=120 DBP=80
 */

const TEMPLATES_DIR = join(import.meta.dir, '../../agentx/apps/math-ai/math-ai-lib');

interface TemplateMetadata {
  id: string;
  name: string;
  type: string;
  description?: string;
  variables?: Record<string, any>;
}

function listTemplates() {
  console.log('\n📚 Available Math AI Templates:\n');

  const files = readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.template.algos.agentx.md'));

  files.forEach(file => {
    const content = readFileSync(join(TEMPLATES_DIR, file), 'utf8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (frontmatterMatch) {
      const lines = frontmatterMatch[1].split('\n');
      const metadata: any = {};

      lines.forEach(line => {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
          metadata[match[1]] = match[2];
        }
      });

      console.log(`  \x1b[36m${metadata.id || file}\x1b[0m`);
      if (metadata.name) {
        console.log(`    Name: ${metadata.name}`);
      }
    }
  });

  console.log('\n💡 Usage:');
  console.log('  bun run template-runner.ts <template-id> <formula> [var=val ...]');
  console.log('  bun run template-runner.ts <template-id> --examples\n');
}

function showTemplateExamples(templateId: string) {
  const file = `${templateId}.template.algos.agentx.md`;
  const path = join(TEMPLATES_DIR, file);

  try {
    const content = readFileSync(path, 'utf8');

    console.log(`\n📖 Template: ${templateId}\n`);

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      console.log('Metadata:');
      frontmatterMatch[1].split('\n').forEach(line => {
        if (line.trim()) console.log(`  ${line}`);
      });
      console.log();
    }

    // Extract example sections
    const exampleMatch = content.match(/## Example Data([\s\S]*?)(?=##|$)/);
    if (exampleMatch) {
      console.log('Examples:');
      console.log(exampleMatch[1].trim());
      console.log();
    }

    // Extract interface
    const interfaceMatch = content.match(/## Interface[\s\S]*?\n\|([\s\S]*?)\n\n/);
    if (interfaceMatch) {
      console.log('Interface:');
      console.log('|' + interfaceMatch[1]);
      console.log();
    }

  } catch (error) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Template not found: ${templateId}`);
    console.log('\nUse --list to see available templates');
    process.exit(1);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Math Template Runner — Execute math-ai templates with dynamic variables

Usage:
  List templates:    bun run template-runner.ts --list
  Show examples:     bun run template-runner.ts <template-id> --examples
  Run template:      bun run template-runner.ts <template-id> <formula> [var=val ...]

Examples:
  bun run template-runner.ts --list
  bun run template-runner.ts algebraic-notation-solver --examples
  bun run template-runner.ts algebraic-notation-solver "a - 15 * (19 - b)" a=101 b=2
  bun run template-runner.ts bmi-standard W=75 H=1.75
  bun run template-runner.ts mean-arterial-pressure SBP=120 DBP=80
`);
    process.exit(0);
  }

  if (args[0] === '--list') {
    listTemplates();
    process.exit(0);
  }

  const templateId = args[0];

  if (args[1] === '--examples') {
    showTemplateExamples(templateId);
    process.exit(0);
  }

  if (args.length < 2) {
    console.error('\x1b[31m[ERROR]\x1b[0m Missing formula or variables');
    console.log('Usage: bun run template-runner.ts <template-id> <formula> [var=val ...]');
    process.exit(1);
  }

  // For algebraic-notation-solver, first arg is formula
  const formula = args[1];
  const variables: Record<string, number> = {};

  // Parse var=value pairs
  for (let i = 2; i < args.length; i++) {
    const match = args[i].match(/^([a-zA-Z_]\w*)=(-?\d+(?:\.\d+)?)$/);
    if (match) {
      const [, key, value] = match;
      variables[key] = parseFloat(value);
    } else {
      console.error(`\x1b[31m[ERROR]\x1b[0m Invalid variable format: "${args[i]}"`);
      console.error('Expected format: variable=value (e.g., a=101 or x_val=3.14)');
      process.exit(1);
    }
  }

  return { templateId, formula, variables };
}

function loadTemplate(templateId: string): string {
  const file = `${templateId}.template.algos.agentx.md`;
  const path = join(TEMPLATES_DIR, file);

  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Template not found: ${templateId}`);
    console.log('Use --list to see available templates');
    process.exit(1);
  }
}

function runTemplate(templateId: string, formula: string, variables: Record<string, number>) {
  console.log(`\n🧮 Running Template: ${templateId}\n`);

  // Special handling for algebraic-notation-solver (filename: algebraic-notation)
  if (templateId === 'algebraic-notation-solver' || templateId === 'algebraic-notation') {
    console.log(`\x1b[36m[FORMULA]\x1b[0m ${formula}`);

    if (Object.keys(variables).length > 0) {
      console.log(`\x1b[35m[VARIABLES]\x1b[0m ${JSON.stringify(variables)}`);
    }

    const engine = new MathEngine(variables);
    const model = engine.parseExpression(formula);
    const result = engine.run(model);

    console.log(`\x1b[32m[RESULT]\x1b[0m \x1b[1m${result.lastResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}\x1b[0m\n`);

    return result;
  }

  // For other templates, use runTemplate method
  const templateContent = loadTemplate(templateId);
  const engine = new MathEngine();

  console.log(`\x1b[35m[VARIABLES]\x1b[0m ${JSON.stringify(variables)}`);

  try {
    const result = engine.runTemplate(templateContent, variables);

    console.log(`\x1b[32m[RESULT]\x1b[0m \x1b[1m${result.lastResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}\x1b[0m`);

    if (result.finalResultId) {
      console.log(`\x1b[2m[FINAL VARIABLE]\x1b[0m ${result.finalResultId} = ${result.allResults[result.finalResultId]}\n`);
    }

    return result;
  } catch (error) {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${(error as Error).message}\n`);
    process.exit(1);
  }
}

// Main execution
const { templateId, formula, variables } = parseArgs();
runTemplate(templateId, formula, variables);
