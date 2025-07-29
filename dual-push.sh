#!/bin/bash
# Dual Branch Push Script
# Usage: ./dual-push.sh "Your commit message"

set -e

COMMIT_MESSAGE="$1"
CURRENT_BRANCH=$(git branch --show-current)

if [ -z "$COMMIT_MESSAGE" ]; then
    echo "❌ Error: Please provide a commit message"
    echo "Usage: ./dual-push.sh \"Your commit message\""
    exit 1
fi

echo "🚀 Starting dual-branch push process..."
echo "📝 Commit message: $COMMIT_MESSAGE"
echo "🌟 Current branch: $CURRENT_BRANCH"

# Step 1: Commit changes to current branch
echo ""
echo "📦 Step 1: Committing to current branch ($CURRENT_BRANCH)..."
git add .
git commit -m "$COMMIT_MESSAGE"
git push origin $CURRENT_BRANCH

# Get the commit hash
COMMIT_HASH=$(git rev-parse HEAD)
echo "✅ Committed to $CURRENT_BRANCH: $COMMIT_HASH"

# Step 2: Cherry-pick to main branch
echo ""
echo "🍒 Step 2: Cherry-picking to main branch..."
git stash push -m "temp-stash-$(date +%s)" || echo "Nothing to stash"
git checkout main
git pull origin main

echo "🍒 Cherry-picking commit $COMMIT_HASH..."
if git cherry-pick $COMMIT_HASH; then
    echo "✅ Successfully cherry-picked to main"
    git push origin main
    echo "✅ Pushed to main branch"
else
    echo "❌ Cherry-pick failed. You may need to resolve conflicts manually."
    echo "🔧 Run: git cherry-pick --continue after resolving conflicts"
    exit 1
fi

# Step 3: Return to original branch
echo ""
echo "🔄 Step 3: Returning to $CURRENT_BRANCH..."
git checkout $CURRENT_BRANCH
git stash pop || echo "No stash to restore"

echo ""
echo "🎉 SUCCESS! Changes pushed to both branches:"
echo "   ✅ $CURRENT_BRANCH: $COMMIT_HASH"
echo "   ✅ main: (cherry-picked)"
echo ""
echo "🌐 Both branches are now updated on GitHub!"
