# Team Familiarization Index

Purpose: fast, evidence-based onboarding for engineers joining this repository.

Repository paths:
- Repo root: /Users/anhbien/Documents/Code/propai
- API: /Users/anhbien/Documents/Code/propai/apps/api
- Web: /Users/anhbien/Documents/Code/propai/apps/web
- Mobile (future): /Users/anhbien/Documents/Code/propai/apps/mobile
- Deployment guide: /Users/anhbien/Documents/Code/propai/DEPLOY_GUIDE.md

## Documents

- API familiarization: ./api-familiarization.md
- Frontend familiarization: ./frontend-familiarization.md
- Security familiarization: ./security-familiarization.md
- Testing familiarization: ./testing-familiarization.md

## How to Use This Set

1. Read API familiarization first to understand route boundaries and data model.
2. Read frontend familiarization second to understand UI shell and AI chat state model.
3. Read security familiarization before shipping changes that touch auth, AI, or mutations.
4. Read testing familiarization before opening PRs to align with existing automation and known gaps.

## Maintenance Rule

Keep these docs evidence-based:
- cite current file paths as proof points
- avoid speculative roadmap claims
- update when route contracts, middleware, schema, or scripts change
