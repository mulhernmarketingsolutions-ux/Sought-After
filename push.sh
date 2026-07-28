#!/bin/bash
# Stages, commits, and pushes every change in this folder to GitHub,
# which triggers Cloudflare Pages to deploy automatically.
set -e
git add -A
git commit -m "Update $(date '+%Y-%m-%d %H:%M')" || echo "Nothing new to commit."
git push
echo "Pushed. Cloudflare will deploy in a minute or two."
