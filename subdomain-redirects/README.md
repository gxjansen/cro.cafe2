# Subdomain Redirect Files

This directory contains redirect HTML files for migrating from the old Webflow subdomain structure to the new unified Astro site.

## Files

- `nl-cro-cafe-redirect.html` - Redirect file for Dutch subdomain (nl.cro.cafe → cro.cafe/nl/)
- `de-cro-cafe-redirect.html` - Redirect file for German subdomain (de.cro.cafe → cro.cafe/de/)  
- `es-cro-cafe-redirect.html` - Redirect file for Spanish subdomain (es.cro.cafe → cro.cafe/es/)

## Implementation Instructions

### Step 1: Upload to Subdomains
Upload each redirect file to its respective subdomain as the index.html file:

1. **Dutch (nl.cro.cafe)**: Upload `nl-cro-cafe-redirect.html` as `index.html`
2. **German (de.cro.cafe)**: Upload `de-cro-cafe-redirect.html` as `index.html`
3. **Spanish (es.cro.cafe)**: Upload `es-cro-cafe-redirect.html` as `index.html`

### Step 2: Configure Server-Side Redirects (Recommended)
For optimal SEO, configure 301 redirects at the server level (Apache/Nginx):

#### Apache (.htaccess)
```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} ^nl\.cro\.cafe$ [NC]
RewriteRule ^(.*)$ https://cro.cafe/nl/$1 [R=301,L]

RewriteCond %{HTTP_HOST} ^de\.cro\.cafe$ [NC]
RewriteRule ^(.*)$ https://cro.cafe/de/$1 [R=301,L]

RewriteCond %{HTTP_HOST} ^es\.cro\.cafe$ [NC]
RewriteRule ^(.*)$ https://cro.cafe/es/$1 [R=301,L]
```

#### Nginx
```nginx
server {
    server_name nl.cro.cafe;
    return 301 https://cro.cafe/nl$request_uri;
}

server {
    server_name de.cro.cafe;
    return 301 https://cro.cafe/de$request_uri;
}

server {
    server_name es.cro.cafe;
    return 301 https://cro.cafe/es$request_uri;
}
```

### Step 3: Update DNS (If Needed)
If moving hosting providers, update DNS records for subdomains to point to the new server.

## Redirect Logic

Each redirect file includes:

1. **Immediate JavaScript redirect** - Handles most users
2. **Meta refresh fallback** - For users with JavaScript disabled
3. **URL path mapping** - Converts old paths to new structure:
   - `/` → `/{language}/`
   - `/podcast/episode-slug` → `/{language}/episodes/episode-slug/`
   - `/guest/guest-slug` or `/gast/guest-slug` or `/invitados/guest-slug` → `/all/guests/guest-slug/`
   - `/subscribe` → `/{language}/subscribe/`

## SEO Considerations

- All redirect files include `noindex, nofollow` to prevent indexing
- Canonical URLs point to the new structure
- Social media meta tags updated for new URLs
- Analytics tracking for redirect events (if GA is configured)

## Testing

After implementation, test:

1. **Homepage redirects**: `nl.cro.cafe` → `cro.cafe/nl/`
2. **Deep link redirects**: `nl.cro.cafe/podcast/episode-name` → `cro.cafe/nl/episodes/episode-name/`
3. **Guest page redirects**: Language-specific guest URLs → `/all/guests/`
4. **Fallback behavior**: JavaScript disabled scenarios

## Monitoring

Monitor 404 errors and redirect patterns to identify any missed URLs that need additional redirect rules.