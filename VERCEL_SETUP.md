# Vercel Deployment Setup Guide

## Overview

This project is configured for automatic deployment to Vercel via GitHub integration. The CI/CD pipeline is split:

- **GitHub Actions**: Handles testing, linting, and code quality checks
- **Vercel**: Handles building and deploying the application

## Setup Steps

### 1. Connect GitHub Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project settings:
   - Framework Preset: `Next.js`
   - Root Directory: `./` (or leave blank)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

### 2. Configure Environment Variables in Vercel

In your Vercel project settings, add these environment variables:

```
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api/v1
```

**Note**: The Supabase variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are not currently used since the backend handles all Supabase communication.

### 3. Configure Deployment Branches

By default, Vercel will:

- Deploy `main` branch to production
- Create preview deployments for all pull requests
- Create preview deployments for other branches

You can customize this in Project Settings → Git.

## How It Works

### GitHub Actions CI (.github/workflows/ci.yml)

- Runs on every push and pull request
- Performs:
  - Type checking
  - ESLint validation
  - Security audits
  - Dependency checks
  - Tests (when available)

### Vercel Deployments

- **Production**: Automatic deployment when pushing to `main`
- **Preview**: Automatic deployment for every pull request
- **URLs**: Each deployment gets a unique URL for testing

## Benefits of This Setup

1. **Faster Deployments**: Vercel's infrastructure is optimized for Next.js
2. **Preview URLs**: Every PR gets a preview deployment automatically
3. **Rollbacks**: Easy rollback to previous deployments via Vercel dashboard
4. **Edge Functions**: Can leverage Vercel's edge runtime if needed
5. **Analytics**: Built-in web vitals and analytics
6. **No Secret Management**: No need to manage deployment tokens in GitHub

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run type checks
npm run type-check

# Run linting
npm run lint

# Build locally
npm run build
```

## Monitoring Deployments

- **Vercel Dashboard**: View all deployments at vercel.com/dashboard
- **GitHub PR Comments**: Vercel bot comments on PRs with preview URLs
- **Build Logs**: Available in Vercel dashboard for debugging

## Troubleshooting

### Build Failures

1. Check Vercel dashboard for detailed build logs
2. Ensure environment variables are set correctly in Vercel
3. Test build locally with `npm run build`

### Type/Lint Errors

1. These are caught by GitHub Actions before Vercel deployment
2. Fix locally and push changes
3. CI must pass before merging to main

## Migration from GitHub Actions Deployment

We've migrated from using GitHub Actions for deployment (via `deploy.yml`) to direct Vercel integration because:

- Eliminates duplicate builds
- Faster deployment times
- Better developer experience with preview deployments
- No need to manage Vercel tokens as GitHub secrets
