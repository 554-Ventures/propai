#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <git-remote-url>"
  echo "Example: $0 git@github.com:your-org/propai.git"
  exit 1
fi

remote_url="$1"

if [ ! -d .git ]; then
  git init
fi

git add -A

git commit -m "chore: initialize PropAI repository" || true

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$remote_url"
else
  git remote add origin "$remote_url"
fi

git branch -M main

git push -u origin main
