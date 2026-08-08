/**
 * Husky configuration module
 * Exports pre-defined Git hooks for consistent workflow across projects
 */

/**
 * Pre-commit hook
 * Runs linting and type checking before commit
 */
export const preCommit = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run linting
echo "📝 Running linter..."
pnpm lint || {
  echo "❌ Linting failed. Please fix the errors before committing."
  exit 1
}

# Run type checking
echo "🔎 Running type check..."
pnpm type-check || {
  echo "❌ Type checking failed. Please fix the errors before committing."
  exit 1
}

echo "✅ Pre-commit checks passed!"
`;

/**
 * Pre-push hook
 * Runs build before pushing to remote
 */
export const prePush = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Running pre-push checks..."

# Run build
echo "🔨 Building the app..."
pnpm build || {
  echo "❌ Build failed. Please fix the errors before pushing."
  exit 1
}

echo "✅ Pre-push checks passed! Ready to push."
`;

/**
 * Commit message hook
 * Validates commit message format using commitlint
 */
export const commitMsg = `#!/usr/bin/env sh
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

const huskyConfig = {
  preCommit,
  prePush,
  commitMsg,
};

export default huskyConfig;
