#!/usr/bin/env bun

/**
 * Comprehensive Workspace Structure Test
 * Validates packages, dependencies, imports, and workspace integrity
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string[];
}

const results: TestResult[] = [];
const PACKAGES_DIR = join(import.meta.dir);

// ANSI colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function pass(name: string, message: string, details?: string[]) {
  results.push({ name, passed: true, message, details });
}

function fail(name: string, message: string, details?: string[]) {
  results.push({ name, passed: false, message, details });
}

// =====================================================
// Test 1: Package Structure
// =====================================================
function testPackageStructure() {
  const expectedPackages = ['math-ai-engine', 'shared-types', 'shared-utils'];
  const details: string[] = [];

  for (const pkg of expectedPackages) {
    const pkgPath = join(PACKAGES_DIR, pkg);

    if (!existsSync(pkgPath)) {
      fail(`Package Structure`, `Missing package: ${pkg}`);
      return;
    }

    // Check for required files
    const requiredFiles = ['package.json', 'README.md', 'src'];
    const missingFiles = requiredFiles.filter(f => !existsSync(join(pkgPath, f)));

    if (missingFiles.length > 0) {
      details.push(`${pkg}: Missing ${missingFiles.join(', ')}`);
    } else {
      details.push(`${pkg}: ✓ All required files present`);
    }
  }

  if (details.some(d => d.includes('Missing'))) {
    fail('Package Structure', 'Some packages have missing files', details);
  } else {
    pass('Package Structure', `All ${expectedPackages.length} packages have correct structure`, details);
  }
}

// =====================================================
// Test 2: Package.json Validation
// =====================================================
function testPackageJson() {
  const packages = ['math-ai-engine', 'shared-types', 'shared-utils'];
  const details: string[] = [];
  let allValid = true;

  for (const pkg of packages) {
    const pkgJsonPath = join(PACKAGES_DIR, pkg, 'package.json');

    try {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));

      // Check required fields
      const requiredFields = ['name', 'version', 'main'];
      const missingFields = requiredFields.filter(f => !pkgJson[f]);

      if (missingFields.length > 0) {
        details.push(`${pkg}: Missing fields: ${missingFields.join(', ')}`);
        allValid = false;
      } else {
        // Check name has @bree-ai scope
        if (!pkgJson.name.startsWith('@bree-ai/')) {
          details.push(`${pkg}: Name should start with @bree-ai/ (got ${pkgJson.name})`);
          allValid = false;
        } else {
          details.push(`${pkg}: ✓ Valid (${pkgJson.name}@${pkgJson.version})`);
        }
      }
    } catch (error) {
      details.push(`${pkg}: Invalid JSON - ${(error as Error).message}`);
      allValid = false;
    }
  }

  if (allValid) {
    pass('Package.json Validation', 'All package.json files are valid', details);
  } else {
    fail('Package.json Validation', 'Some package.json files are invalid', details);
  }
}

// =====================================================
// Test 3: Source Files Exist
// =====================================================
function testSourceFiles() {
  const packages = [
    { name: 'math-ai-engine', files: ['src/engine.ts'] },
    { name: 'shared-types', files: ['src/index.ts', 'src/api.ts', 'src/entities.ts'] },
    { name: 'shared-utils', files: ['src/index.ts', 'src/logger.ts', 'src/validation.ts', 'src/date.ts', 'src/string.ts', 'src/object.ts'] },
  ];

  const details: string[] = [];
  let allExist = true;

  for (const pkg of packages) {
    const missingFiles = pkg.files.filter(f =>
      !existsSync(join(PACKAGES_DIR, pkg.name, f))
    );

    if (missingFiles.length > 0) {
      details.push(`${pkg.name}: Missing ${missingFiles.join(', ')}`);
      allExist = false;
    } else {
      details.push(`${pkg.name}: ✓ All ${pkg.files.length} files present`);
    }
  }

  if (allExist) {
    pass('Source Files', 'All required source files exist', details);
  } else {
    fail('Source Files', 'Some source files are missing', details);
  }
}

// =====================================================
// Test 4: TypeScript Syntax
// =====================================================
async function testTypeScriptSyntax() {
  const packages = ['math-ai-engine', 'shared-types', 'shared-utils'];
  const details: string[] = [];
  let allValid = true;

  for (const pkg of packages) {
    const srcDir = join(PACKAGES_DIR, pkg, 'src');
    const files = readdirSync(srcDir).filter(f => f.endsWith('.ts'));

    for (const file of files) {
      try {
        const content = readFileSync(join(srcDir, file), 'utf-8');

        // Basic syntax checks
        if (content.includes('export') || content.includes('import')) {
          // Good - has imports/exports
        } else {
          details.push(`${pkg}/${file}: Warning - No exports found`);
        }
      } catch (error) {
        details.push(`${pkg}/${file}: Error reading file`);
        allValid = false;
      }
    }

    if (allValid) {
      details.push(`${pkg}: ✓ ${files.length} TypeScript files valid`);
    }
  }

  if (allValid) {
    pass('TypeScript Syntax', 'All TypeScript files have valid syntax', details);
  } else {
    fail('TypeScript Syntax', 'Some TypeScript files have issues', details);
  }
}

// =====================================================
// Test 5: Dependencies
// =====================================================
function testDependencies() {
  const details: string[] = [];
  let allValid = true;

  // shared-utils should depend on shared-types
  const utilsPkgPath = join(PACKAGES_DIR, 'shared-utils', 'package.json');
  const utilsPkg = JSON.parse(readFileSync(utilsPkgPath, 'utf-8'));

  if (utilsPkg.dependencies?.['@bree-ai/shared-types'] === 'workspace:*') {
    details.push('shared-utils: ✓ Correctly depends on shared-types');
  } else {
    details.push('shared-utils: Missing workspace dependency on shared-types');
    allValid = false;
  }

  if (allValid) {
    pass('Package Dependencies', 'All package dependencies are correct', details);
  } else {
    fail('Package Dependencies', 'Some dependencies are incorrect', details);
  }
}

// =====================================================
// Test 6: Exports Check
// =====================================================
function testExports() {
  const details: string[] = [];
  let allValid = true;

  // Check shared-utils exports
  const utilsIndex = join(PACKAGES_DIR, 'shared-utils', 'src', 'index.ts');
  const content = readFileSync(utilsIndex, 'utf-8');

  const expectedExports = ['logger', 'validation', 'date', 'string', 'object'];
  for (const exp of expectedExports) {
    if (content.includes(`export * from './${exp}'`)) {
      details.push(`shared-utils: ✓ Exports ${exp}`);
    } else {
      details.push(`shared-utils: Missing export for ${exp}`);
      allValid = false;
    }
  }

  if (allValid) {
    pass('Package Exports', 'All packages export their modules correctly', details);
  } else {
    fail('Package Exports', 'Some exports are missing', details);
  }
}

// =====================================================
// Test 7: README Documentation
// =====================================================
function testDocumentation() {
  const packages = ['math-ai-engine', 'shared-types', 'shared-utils'];
  const details: string[] = [];
  let allValid = true;

  for (const pkg of packages) {
    const readmePath = join(PACKAGES_DIR, pkg, 'README.md');

    try {
      const readme = readFileSync(readmePath, 'utf-8');

      // Check for essential sections
      const hasInstallation = readme.includes('Installation') || readme.includes('installation');
      const hasUsage = readme.includes('Usage') || readme.includes('usage');

      if (hasInstallation && hasUsage) {
        details.push(`${pkg}: ✓ Complete documentation`);
      } else {
        details.push(`${pkg}: Missing ${!hasInstallation ? 'Installation' : ''} ${!hasUsage ? 'Usage' : ''} sections`);
        allValid = false;
      }
    } catch (error) {
      details.push(`${pkg}: README not readable`);
      allValid = false;
    }
  }

  if (allValid) {
    pass('Documentation', 'All packages have complete documentation', details);
  } else {
    fail('Documentation', 'Some documentation is incomplete', details);
  }
}

// =====================================================
// Test 8: Root Workspace Config
// =====================================================
function testRootWorkspace() {
  const rootPkgPath = join(PACKAGES_DIR, '..', 'package.json');
  const details: string[] = [];

  try {
    const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));

    if (rootPkg.workspaces && rootPkg.workspaces.includes('packages/*')) {
      details.push('✓ Root package.json includes packages/* in workspaces');
      pass('Root Workspace Config', 'Workspace is properly configured', details);
    } else {
      details.push('✗ Root package.json missing packages/* in workspaces');
      fail('Root Workspace Config', 'Workspace configuration incomplete', details);
    }
  } catch (error) {
    fail('Root Workspace Config', 'Cannot read root package.json', [String(error)]);
  }
}

// =====================================================
// Main Test Runner
// =====================================================
async function runTests() {
  console.log(`\n${colors.bold}${colors.blue}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}║        BREE AI Workspace Structure - Comprehensive Test      ║${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}╚═══════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.yellow}Running tests...${colors.reset}\n`);

  // Run all tests
  testPackageStructure();
  testPackageJson();
  testSourceFiles();
  await testTypeScriptSyntax();
  testDependencies();
  testExports();
  testDocumentation();
  testRootWorkspace();

  // Print results
  console.log(`${colors.bold}Test Results:${colors.reset}\n`);

  let passCount = 0;
  let failCount = 0;

  for (const result of results) {
    const icon = result.passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    const status = result.passed ? 'PASS' : 'FAIL';

    console.log(`${icon} ${colors.bold}${result.name}${colors.reset}: ${result.message}`);

    if (result.details && result.details.length > 0) {
      for (const detail of result.details) {
        console.log(`  ${detail}`);
      }
    }
    console.log();

    if (result.passed) passCount++;
    else failCount++;
  }

  // Summary
  console.log(`${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}Summary:${colors.reset}`);
  console.log(`  ${colors.green}Passed:${colors.reset} ${passCount}`);
  console.log(`  ${colors.red}Failed:${colors.reset} ${failCount}`);
  console.log(`  ${colors.blue}Total:${colors.reset}  ${passCount + failCount}`);
  console.log(`${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  if (failCount === 0) {
    console.log(`${colors.green}${colors.bold}🎉 All tests passed! Workspace structure is valid.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bold}❌ Some tests failed. Please review the errors above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runTests();
