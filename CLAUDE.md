# Mind Fitness — Claude Code Instructions

## Git workflow
- Remote: https://github.com/MaksimVeretennikov/mind-fitness
- Authentication: Personal Access Token (already configured in remote URL)
- Vercel auto-deploys on every push to main
- Always work in feature branches, merge to main only after approval

### Branch workflow
1. Create a new branch: `git checkout -b feature/feature-name`
2. Make changes and commit regularly
3. Push the branch: `git push -u origin feature/feature-name`
4. After approval, merge into main: `git checkout main && git merge feature/feature-name && git push origin main`
5. Never commit directly to main

## Current status
- Project is live on Vercel at mind-fitness.vercel.app
- Git push is working correctly
