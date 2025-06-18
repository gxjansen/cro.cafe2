# CROCAFE Deployment Guide

## Environment Strategy

CROCAFE uses a **single Netlify environment** for both development and production phases:

- **Development Phase**: `https://crocafe2.netlify.app/` (Netlify subdomain)
- **Production Phase**: `https://cro.cafe` (custom domain pointing to same Netlify site)

## Current Setup

### Netlify Environment Variables
Set these **production values** in Netlify dashboard now:

```env
PUBLIC_SITE_URL=https://cro.cafe
PUBLIC_SITE_NAME=CROCAFE
```

### Why Production Values During Development
1. **SEO Consistency** - Sitemap and RSS feeds generate correct final URLs
2. **No Environment Switch** - No config changes needed when going live
3. **Search Engine Prep** - Google indexes correct canonical URLs from start
4. **Simple Transition** - Only DNS changes required, no environment updates

## Deployment Workflow

### Current Status: Development Phase
- ✅ **Netlify Site**: `https://crocafe2.netlify.app/`
- ✅ **Auto-deployment**: GitHub pushes trigger builds
- ✅ **Environment**: Configured for production URLs
- ✅ **Build Process**: `npm run build` → `dist/` → static hosting

### Production Transition Process

When ready to go live:

1. **Add Custom Domain in Netlify**
   - Go to Netlify dashboard → Site settings → Domain management
   - Add custom domain: `cro.cafe`
   - Netlify provides DNS targets

2. **Update DNS at Domain Registrar**
   - Point `cro.cafe` to Netlify's servers
   - Typically: CNAME record or A records provided by Netlify

3. **Automatic HTTPS Setup**
   - Netlify automatically provisions SSL certificate
   - Forces HTTPS redirects

4. **Verify Transition**
   - `https://cro.cafe` serves same content as development site
   - Development URL continues to work for testing

### No Code Changes Required
- ✅ Environment variables already set for production
- ✅ Astro config already points to `cro.cafe`
- ✅ Sitemap/RSS feeds already generate correct URLs
- ✅ GitHub Actions continue to work unchanged

## Architecture Benefits

### Single Environment Approach
- **Simplified Operations**: One deployment pipeline
- **Cost Effective**: No separate staging environment costs
- **Consistent Testing**: What you test is what goes live
- **Easy Rollbacks**: Standard Netlify deployment history

### Auto-Deployment Pipeline
```
GitHub Repository → Netlify Build → Static Site Deploy
     ↓                    ↓               ↓
- Push to main     - npm run build    - Instant global
- Webhook trigger  - Astro generates   - CDN deployment
- Build starts      static files      - HTTPS enabled
```

## Monitoring & Maintenance

### Build Status
- **Netlify Dashboard**: Monitor build success/failures
- **GitHub Actions**: RSS sync and content generation
- **Performance**: Lighthouse scores via Netlify

### Domain Management
- **Development**: `crocafe2.netlify.app` (always available)
- **Production**: `cro.cafe` (when DNS configured)
- **Redirects**: Configure in `netlify.toml` if needed

## Security & Performance

### Automatic Optimizations
- **Asset Optimization**: Images, CSS, JS minification
- **CDN Distribution**: Global edge locations
- **Caching Headers**: Configured in `netlify.toml`
- **Security Headers**: X-Frame-Options, CSP, etc.

### SSL/TLS
- **Free SSL**: Let's Encrypt certificates
- **Auto-Renewal**: Netlify handles certificate lifecycle
- **HTTPS Redirect**: Forces secure connections

## Content Update Flow

### Data Sources
1. **Transistor.fm** → **NocoDB** (podcast data sync)
2. **NocoDB** → **GitHub Actions** → **Content Files** (MDX generation)
3. **GitHub** → **Netlify** → **Live Site** (auto-deployment)

### Update Triggers
- **Manual**: Push code changes to GitHub
- **Automatic**: NocoDB content changes trigger GitHub Actions
- **Scheduled**: RSS sync runs periodically

## Backup & Recovery

### Code Backup
- **Primary**: GitHub repository
- **Deployment**: Netlify deployment history (30+ versions)
- **Content**: NocoDB database (separate backup strategy)

### Recovery Options
- **Rollback**: Previous Netlify deployment (instant)
- **Rebuild**: Trigger fresh build from any Git commit
- **Content Restore**: Regenerate from NocoDB backup

---

**Last Updated**: 2025-01-18  
**Environment**: Netlify Site ID `5a20ec24-b427-4971-a742-f3f5c443143e`  
**Repository**: `https://github.com/gxjansen/cro.cafe2`