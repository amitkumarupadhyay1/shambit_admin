# CI/CD Pipeline Documentation

## 🚀 Overview

This project uses GitHub Actions for continuous integration and deployment. The pipeline automatically runs tests, builds, and deploys the application.

## 📋 Workflows

### 1. Main CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**

#### Lint & Format Check
- Runs ESLint
- Checks code formatting with Prettier
- Ensures code quality standards

#### TypeScript Type Check
- Validates TypeScript types
- Catches type errors before deployment

#### Run Tests
- Executes unit tests with Vitest
- Uploads coverage reports
- Ensures code functionality

#### Build Application
- Builds Next.js application
- Validates build process
- Uploads build artifacts

#### Security Audit
- Runs npm audit
- Checks for vulnerabilities
- Generates security report

#### Deploy to Production
- **Trigger**: Push to `main` branch
- **Target**: Production environment
- **Tool**: Vercel
- **URL**: https://admin.shambit.com

#### Deploy to Staging
- **Trigger**: Push to `develop` branch
- **Target**: Staging environment
- **Tool**: Vercel
- **URL**: https://staging-admin.shambit.com

### 2. Pull Request Checks (`pr-checks.yml`)

**Triggers:**
- Pull request opened, synchronized, or reopened

**Actions:**
- Runs all quality checks
- Validates PR title (semantic versioning)
- Comments on PR with results

### 3. Dependency Review (`dependency-review.yml`)

**Triggers:**
- Changes to `package.json` or `package-lock.json`

**Actions:**
- Reviews dependency changes
- Checks for security vulnerabilities
- Comments on PR with findings

## 🔧 Setup Instructions

### 1. GitHub Secrets

Add these secrets in GitHub repository settings:

**Required for Vercel Deployment:**
```
VERCEL_TOKEN          # Vercel authentication token
VERCEL_ORG_ID         # Vercel organization ID
VERCEL_PROJECT_ID     # Vercel project ID
```

**Required for Application:**
```
NEXT_PUBLIC_API_URL          # Backend API URL
NEXT_PUBLIC_API_BASE_URL     # Backend base URL
NEXTAUTH_URL                 # Admin app URL
NEXTAUTH_SECRET              # NextAuth secret key
```

### 2. Get Vercel Credentials

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Get credentials
vercel env pull .env.vercel
```

The credentials will be in `.vercel/project.json`:
- `orgId` → `VERCEL_ORG_ID`
- `projectId` → `VERCEL_PROJECT_ID`

Get token from: https://vercel.com/account/tokens

### 3. Configure GitHub Environments

**Production Environment:**
1. Go to Settings → Environments
2. Create "production" environment
3. Add protection rules:
   - Required reviewers (optional)
   - Wait timer (optional)
4. Add environment secrets

**Staging Environment:**
1. Create "staging" environment
2. Configure as needed

## 🔄 Workflow Diagram

```
┌─────────────────┐
│  Push to main   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Lint Check    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Type Check     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Run Tests     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Build       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Security Audit  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy to Prod  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Notify       │
└─────────────────┘
```

## 📊 Pipeline Status

Check pipeline status:
- **Actions Tab**: https://github.com/amitkumarupadhyay1/shambit_admin/actions
- **Badge**: Add to README.md

```markdown
![CI/CD](https://github.com/amitkumarupadhyay1/shambit_admin/workflows/CI%2FCD%20Pipeline/badge.svg)
```

## 🧪 Testing the Pipeline

### Test Locally

```bash
# Run all CI checks locally
npm run ci

# Individual checks
npm run lint
npm run type-check
npm test
npm run build
```

### Test on GitHub

1. **Create a test branch:**
```bash
git checkout -b test/ci-pipeline
```

2. **Make a small change:**
```bash
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "test: CI/CD pipeline"
```

3. **Push to GitHub:**
```bash
git push origin test/ci-pipeline
```

4. **Create Pull Request:**
- Go to GitHub
- Create PR from `test/ci-pipeline` to `main`
- Watch the checks run

5. **Verify:**
- All checks should pass
- PR should show green checkmarks
- Review the Actions tab

## 🔍 Monitoring

### View Logs

1. Go to Actions tab
2. Click on workflow run
3. Click on job to see logs
4. Download artifacts if needed

### Artifacts

The pipeline generates:
- Build artifacts (`.next` folder)
- Test coverage reports
- Security audit reports

Download from: Actions → Workflow Run → Artifacts

## 🚨 Troubleshooting

### Build Fails

**Check:**
- Environment variables are set
- Dependencies are up to date
- TypeScript errors are fixed

**Fix:**
```bash
npm run type-check
npm run build
```

### Tests Fail

**Check:**
- Tests pass locally
- Test environment is configured

**Fix:**
```bash
npm test
```

### Deployment Fails

**Check:**
- Vercel token is valid
- Project is linked correctly
- Environment variables are set

**Fix:**
```bash
vercel --prod
```

## 📈 Performance

**Average Pipeline Duration:**
- Lint: ~30 seconds
- Type Check: ~20 seconds
- Tests: ~15 seconds
- Build: ~2 minutes
- Deploy: ~1 minute

**Total: ~4 minutes**

## 🔐 Security

**Best Practices:**
- Never commit secrets
- Use GitHub Secrets for sensitive data
- Enable branch protection rules
- Require status checks before merge
- Enable dependency scanning

## 📝 Maintenance

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Update major versions
npx npm-check-updates -u
npm install
```

### Update Workflows

1. Edit `.github/workflows/*.yml`
2. Test changes on a branch
3. Create PR
4. Merge after verification

## 🎯 Best Practices

1. **Always run checks locally first**
   ```bash
   npm run ci
   ```

2. **Write meaningful commit messages**
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug"
   git commit -m "docs: update documentation"
   ```

3. **Keep PRs small and focused**
   - One feature per PR
   - Easy to review
   - Faster to merge

4. **Monitor pipeline regularly**
   - Check for failures
   - Review security alerts
   - Update dependencies

## 📞 Support

For CI/CD issues:
1. Check workflow logs
2. Review this documentation
3. Test locally first
4. Check GitHub Actions status

## 🎉 Success Criteria

Pipeline is successful when:
- ✅ All lint checks pass
- ✅ Type checking passes
- ✅ All tests pass
- ✅ Build completes successfully
- ✅ No security vulnerabilities
- ✅ Deployment succeeds

---

**Last Updated**: 2024
**Maintained By**: ShamBit Development Team
