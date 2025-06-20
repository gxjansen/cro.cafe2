# Webflow to Astro Migration Plan

## Overview

This document outlines the complete migration strategy from the current Webflow multi-domain setup to the unified Astro site structure.

## Current State

### Webflow Domains
- **English**: www.cro.cafe (main domain)
- **Dutch**: nl.cro.cafe (subdomain)
- **German**: de.cro.cafe (subdomain)
- **Spanish**: es.cro.cafe (subdomain)

### URL Patterns (Analyzed from Sitemaps)
- **English**: `/podcast/`, `/guest/`, `/event/`, `/subscribe/`
- **Dutch**: `/podcast/`, `/gast/`, `/subscribe/`
- **German**: `/podcast/`, `/guest/`, `/subscribe/`
- **Spanish**: `/podcast/`, `/invitados/`, `/suscribete/`

## Target State

### Unified Domain Structure
- **All languages**: cro.cafe (single domain)
- **Language URLs**: 
  - English: `/en/` (with fallback for root `/`)
  - Dutch: `/nl/`
  - German: `/de/`
  - Spanish: `/es/`
- **Global pages**: `/all/` for cross-language content

### New URL Structure
- Episodes: `/{language}/episodes/{slug}/`
- Guests: `/all/guests/{slug}/` (language-agnostic)
- Subscribe: `/{language}/subscribe/`
- Search: `/search/` (global) or `/{language}/search/`

## Implementation Steps

### Phase 1: Astro Configuration ✅

**Status**: Complete

1. **Redirects Configuration** - Updated `astro.config.mjs` with comprehensive redirect mappings:
   - English domain redirects (`/podcast/` → `/en/episodes/`)
   - Individual episode redirects
   - Guest profile redirects
   - Fallback and SEO-friendly redirects

2. **Sitemap Configuration** - Enhanced sitemap with:
   - Multi-language support (i18n)
   - Custom page inclusion
   - Test page exclusion filters

### Phase 2: Subdomain Redirect Files ✅

**Status**: Complete

Created redirect files for each subdomain:
- `subdomain-redirects/nl-cro-cafe-redirect.html`
- `subdomain-redirects/de-cro-cafe-redirect.html` 
- `subdomain-redirects/es-cro-cafe-redirect.html`

Each file includes:
- JavaScript-based URL parsing and redirection
- Meta refresh fallback
- User-friendly loading page
- SEO-optimized meta tags

### Phase 3: Implementation Deployment

**Status**: Pending

#### 3.1 Deploy New Astro Site
1. Build and deploy the Astro site to cro.cafe
2. Verify all language routes work correctly
3. Test redirect functionality locally

#### 3.2 Subdomain Redirect Setup
1. Upload redirect HTML files to each subdomain:
   - `nl.cro.cafe` → Upload `nl-cro-cafe-redirect.html` as `index.html`
   - `de.cro.cafe` → Upload `de-cro-cafe-redirect.html` as `index.html`
   - `es.cro.cafe` → Upload `es-cro-cafe-redirect.html` as `index.html`

#### 3.3 Server-Level Redirects (Recommended)
Configure 301 redirects at server level for optimal SEO:

**Apache (.htaccess)**:
```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} ^nl\.cro\.cafe$ [NC]
RewriteRule ^(.*)$ https://cro.cafe/nl/$1 [R=301,L]

RewriteCond %{HTTP_HOST} ^de\.cro\.cafe$ [NC]
RewriteRule ^(.*)$ https://cro.cafe/de/$1 [R=301,L]

RewriteCond %{HTTP_HOST} ^es\.cro\.cafe$ [NC]
RewriteRule ^(.*)$ https://cro.cafe/es/$1 [R=301,L]
```

**Cloudflare/Nginx**: Similar redirect rules

### Phase 4: Testing & Validation

#### 4.1 Redirect Testing
- [ ] Test homepage redirects for each subdomain
- [ ] Test deep link redirects (episodes, guests)
- [ ] Test JavaScript-disabled fallbacks
- [ ] Verify 301 status codes (if server-level redirects implemented)

#### 4.2 SEO Validation
- [ ] Verify new sitemaps are generated and accessible
- [ ] Check canonical URLs are correct
- [ ] Validate hreflang attributes
- [ ] Monitor 404 errors in first weeks

#### 4.3 Performance Testing
- [ ] Test site speed on new unified domain
- [ ] Validate CDN performance
- [ ] Check mobile performance

### Phase 5: Go-Live Checklist

#### Pre-Launch
- [ ] Final testing of all redirects
- [ ] Backup current Webflow sites
- [ ] Coordinate with DNS provider if needed
- [ ] Set up monitoring/analytics

#### Launch Day
- [ ] Deploy Astro site to production
- [ ] Upload subdomain redirect files
- [ ] Configure server-level redirects
- [ ] Monitor for issues

#### Post-Launch (Week 1)
- [ ] Monitor 404 errors and fix missing redirects
- [ ] Check search console for crawl errors
- [ ] Verify analytics tracking
- [ ] Monitor site performance

## SEO Impact Mitigation

### Redirect Strategy
1. **301 Redirects**: All old URLs redirect with 301 status codes
2. **Preserve URL Structure**: Episode and guest slugs remain unchanged
3. **Canonical URLs**: Point to new unified structure
4. **Hreflang**: Properly configured for multi-language content

### Content Preservation
- All existing episodes, guests, and content preserved
- Metadata and SEO data maintained
- Social sharing links updated

### Search Console Actions
1. Submit new sitemaps to Google Search Console
2. Monitor for crawl errors and index status
3. Update any hardcoded links in external sources

## Risk Assessment

### High Risk
- **Temporary traffic dips**: Expected during search engine reindexing
- **Missing redirects**: Some edge case URLs might need additional redirects

### Medium Risk
- **Mobile performance**: Ensure mobile experience is not degraded
- **Social media links**: Update any hardcoded social media links

### Low Risk
- **CDN performance**: Should improve with unified domain
- **Maintenance**: Simplified with single domain structure

## Monitoring & Metrics

### KPIs to Track
- **404 Error Rate**: Should decrease after full migration
- **Organic Traffic**: Monitor for temporary dips and recovery
- **Page Load Speed**: Should improve with unified architecture
- **Redirect Success Rate**: Monitor redirect completion rates

### Tools
- Google Search Console: Crawl errors, index status
- Google Analytics: Traffic patterns, source tracking
- Server logs: 404 errors, redirect patterns
- Lighthouse: Performance monitoring

## Rollback Plan

If critical issues arise:
1. **Immediate**: Remove subdomain redirect files
2. **Short-term**: Revert DNS if changed
3. **Long-term**: Restore Webflow sites if necessary

## Timeline Estimate

- **Phase 1-2**: Complete ✅
- **Phase 3**: 1-2 days (deployment)
- **Phase 4**: 3-5 days (testing)
- **Phase 5**: 1 day (go-live)
- **Monitoring**: 2-4 weeks (post-launch)

**Total Timeline**: 1-2 weeks for complete migration

## Success Criteria

✅ **Technical Success**:
- All redirects working correctly
- No increase in 404 errors
- Site performance maintained or improved

✅ **SEO Success**:
- Organic traffic recovers within 2-4 weeks
- Search rankings maintained
- New sitemap indexed successfully

✅ **User Experience Success**:
- Seamless transition for users
- All old bookmarks and links work
- Mobile experience preserved

## Additional Notes

- **Content Strategy**: Consider creating migration announcement content
- **Social Media**: Update social media profiles with new URLs
- **External Links**: Identify and update any external backlinks where possible
- **Email Campaigns**: Update any email templates with old URLs

This migration strategy ensures minimal SEO impact while providing a better unified user experience across all languages.