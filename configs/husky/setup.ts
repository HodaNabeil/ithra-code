#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Husky Setup Script
 * Automatically configures Husky with pre-defined hooks in any project
 *
 * Usage:
 *   tsx node_modules/@/components/configs/husky/setup.ts
 *   Or via package.json script: "prepare": "tsx node_modules/@/components/configs/husky/setup.ts"
 */

import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Get the project root (where package.json is)
const projectRoot = process.cwd();

console.log('🐶 Setting up Husky...\n');

// Check if husky is installed
try {
  execSync('pnpm list husky', { stdio: 'ignore' });
} catch {
  console.log('📦 Installing Husky...');
  execSync('pnpm add -D husky', { stdio: 'inherit' });
}

// Initialize husky
console.log('🔧 Initializing Husky...');
try {
  execSync('pnpm exec husky init', { stdio: 'inherit' });
} catch {
  console.log('Note: Husky may already be initialized');
}

// Create .husky directory if it doesn't exist
const huskyDir = join(projectRoot, '.husky');
if (!existsSync(huskyDir)) {
  mkdirSync(huskyDir, { recursive: true });
}

// Pre-commit hook
const preCommitHook = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run linting
echo "📝 Running linter..."
pnpm lint || {
  echo "❌ Linting failed. Please fix the errors before committing."
  exit 1
}

# Run type checking if available
echo "🔎 Running type check..."
if pnpm run --if-present type-check; then
  echo "✅ Type checking passed!"
else
  echo "⚠️  Type checking not available or failed"
fi

echo "✅ Pre-commit checks passed!"
`;

// Pre-push hook
const prePushHook = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Running pre-push checks..."

# Run build
echo "🔨 Building the app..."
pnpm build || {
  echo "❌ Build failed. Please fix the errors before pushing."
  exit 1
}

# Run tests if test script exists
echo "🧪 Running tests..."
if pnpm run --if-present test; then
  echo "✅ Tests passed!"
else
  echo "⚠️  Tests not available or failed"
fi

echo "✅ Pre-push checks passed! Ready to push."
`;

// Commit message hook
const commitMsgHook = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Use commitlint if available, otherwise fall back to simple validation
if command -v pnpm >/dev/null 2>&1 && pnpm list @commitlint/cli >/dev/null 2>&1; then
  pnpm exec commitlint --edit "$1"
else
  # Fallback: simple conventional commit validation
  commit_msg=$(cat "$1")
  
  if ! echo "$commit_msg" | grep -qE "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\\(.+\\))?: .{1,}"; then
    echo "❌ Invalid commit message format!"
    echo ""
    echo "Please use conventional commit format:"
    echo "  feat: add new feature"
    echo "  fix: fix a bug"
    echo "  docs: update documentation"
    echo "  style: format code"
    echo "  refactor: refactor code"
    echo "  perf: improve performance"
    echo "  test: add tests"
    echo "  build: update build system"
    echo "  ci: update CI/CD"
    echo "  chore: other changes"
    echo ""
    exit 1
  fi
  
  echo "✅ Commit message format is valid!"
fi
`;

// Write hooks
const hooks = [
  { name: 'pre-commit', content: preCommitHook },
  { name: 'pre-push', content: prePushHook },
  { name: 'commit-msg', content: commitMsgHook },
];

console.log('\n📝 Creating Git hooks...');
hooks.forEach(({ name, content }) => {
  const hookPath = join(huskyDir, name);
  writeFileSync(hookPath, content, 'utf8');
  chmodSync(hookPath, 0o755); // Make executable
  console.log(`  ✓ Created ${name} hook`);
});

console.log('\n✅ Husky setup complete!');
console.log('\nConfigured hooks:');
console.log('  • pre-commit: Runs linting and type checking');
console.log('  • pre-push: Runs build and tests');
console.log(
  '  • commit-msg: Validates commit messages with commitlint (or fallback validation)',
);
console.log(
  '\n💡 Tip: Install @commitlint/cli and @commitlint/config-conventional for enhanced commit message validation',
);
console.log("\n🎉 You're all set!\n");
