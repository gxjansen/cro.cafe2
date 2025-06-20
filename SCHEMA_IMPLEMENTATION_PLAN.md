# Schema.org Implementation Plan for CRO.CAFE

## Overview
Comprehensive structured data implementation to enhance search visibility, enable rich snippets, and improve podcast discovery across search engines.

## Schema Types & Implementation Strategy

### 🎯 Phase 1: Core Schemas (High Priority)

#### 1. WebSite + SearchAction Schema
**Location**: Homepage (`/` and language landing pages)
**Purpose**: Enable sitelinks search box in Google results
**Implementation**: BaseLayout component with conditional logic
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "CRO.CAFE Podcast",
  "url": "https://cro.cafe",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://cro.cafe/search/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

#### 2. Organization Schema
**Location**: All pages (BaseLayout)
**Purpose**: Establish brand authority and entity recognition
**Properties**: 
- name, url, logo, description
- sameAs (social media profiles)
- founder (Guido X Jansen)
- contactPoint

#### 3. PodcastSeries Schema
**Location**: Language-specific homepages (`/en/`, `/nl/`, `/de/`, `/es/`)
**Purpose**: Establish podcast series in Google's podcast ecosystem
**Properties**:
- name (language-specific)
- description, genre, language
- creator (Organization)
- webFeed (RSS feed)
- episodes (collection reference)

#### 4. PodcastEpisode Schema
**Location**: Individual episode pages (`/{lang}/episodes/{slug}/`)
**Purpose**: Rich episode snippets and podcast app discovery
**Properties**:
- name, description, duration
- datePublished, episodeNumber, seasonNumber
- partOfSeries (link to PodcastSeries)
- actor (hosts and guests)
- associatedMedia (AudioObject)
- transcript (if available)

### 🎯 Phase 2: Enhanced Schemas (Medium Priority)

#### 5. Person Schema
**Location**: Host profiles, guest profiles, about page
**Purpose**: Authority building and "hosted by" rich snippets
**Types**:
- **Hosts**: Guido X Jansen, Michael Witzenleiter, Yvonne Teufel, Ricardo Tayar
- **Guests**: All guest profile pages
**Properties**: name, jobTitle, worksFor, image, sameAs, alumniOf

#### 6. AudioObject Schema
**Location**: Episode pages (embedded within PodcastEpisode)
**Purpose**: Detailed audio metadata for better discovery
**Properties**: contentUrl, duration, encodingFormat, bitrate

#### 7. BreadcrumbList Schema
**Location**: All pages with breadcrumb navigation
**Purpose**: Enhanced SERP appearance and site structure
**Implementation**: Breadcrumb component enhancement

### 🎯 Phase 3: Supplementary Schemas (Lower Priority)

#### 8. VideoObject Schema
**Location**: Episodes with YouTube videos
**Purpose**: Video search optimization
**Conditional**: Only when episode has YouTube link
**Properties**: name, description, thumbnailUrl, uploadDate, duration

## Implementation Architecture

### 1. Schema Component Structure
```
src/components/schema/
├── SchemaWebsite.astro
├── SchemaOrganization.astro  
├── SchemaPodcastSeries.astro
├── SchemaPodcastEpisode.astro
├── SchemaPerson.astro
├── SchemaAudioObject.astro
├── SchemaBreadcrumbList.astro
└── SchemaVideoObject.astro
```

### 2. Integration Points
- **BaseLayout.astro**: WebSite, Organization schemas
- **Language landing pages**: PodcastSeries schema
- **Episode pages**: PodcastEpisode + AudioObject + VideoObject schemas
- **Guest/Host pages**: Person schema
- **All pages**: BreadcrumbList schema

### 3. Data Sources Integration
```typescript
// Schema data helpers
src/utils/schema.ts
├── generateWebsiteSchema()
├── generateOrganizationSchema()
├── generatePodcastSeriesSchema(language)
├── generatePodcastEpisodeSchema(episode)
├── generatePersonSchema(person)
├── generateBreadcrumbSchema(currentPath)
```

## Technical Implementation Details

### Multi-Language Considerations
- **Language-specific content**: Use `inLanguage` property
- **Localized names**: Different podcast series names per language
- **Canonical URLs**: Point to correct language version
- **Hreflang integration**: Align with existing hreflang setup

### Data Consistency
- **Person linking**: Consistent IDs between hosts, guests, and episodes
- **Series linking**: Episodes properly linked to their series
- **URL canonicalization**: All URLs use https://cro.cafe format

### Performance Optimization
- **JSON-LD format**: Clean, crawlable structured data
- **Conditional rendering**: Only include relevant schemas per page
- **Data caching**: Cache computed schema data where possible

## Validation & Testing Strategy

### Tools for Validation
1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Schema.org Validator**: https://validator.schema.org/
3. **Google Search Console**: Rich Results report monitoring
4. **Structured Data Testing Tool**: Legacy but still useful

### Testing Checklist
- [ ] All schemas validate without errors
- [ ] Rich results preview correctly in testing tools
- [ ] Conditional VideoObject only appears when YouTube link present
- [ ] Multi-language schemas use correct language codes
- [ ] Person schemas properly link to episodes
- [ ] SearchAction works with actual search functionality

## Success Metrics

### Expected Improvements
1. **Rich Snippets**: Episode cards with play buttons, ratings, duration
2. **Search Box**: Sitelinks search box in branded searches
3. **Podcast Discovery**: Better visibility in podcast-specific searches
4. **Voice Search**: Improved voice search optimization
5. **Click-Through Rate**: 15-25% improvement in SERP CTR

### Monitoring KPIs
- Rich Results impressions in Search Console
- Podcast-related organic traffic growth
- Branded search SERP feature appearances
- Voice search traffic (where detectable)

## Implementation Timeline

### Week 1: Foundation (Phase 1)
- Create schema component architecture
- Implement WebSite + SearchAction
- Implement Organization schema
- Implement PodcastSeries schema

### Week 2: Core Content (Phase 1 continued)
- Implement PodcastEpisode schema
- Integrate with existing episode data
- Test and validate core schemas

### Week 3: Enhancement (Phase 2)
- Implement Person schemas
- Implement AudioObject integration
- Implement BreadcrumbList schema

### Week 4: Polish & Validation (Phase 3)
- Add VideoObject conditional logic
- Comprehensive testing and validation
- Performance optimization
- Documentation updates

## Maintenance Considerations

### Ongoing Updates
- New episodes automatically get proper schema
- New hosts/guests get Person schemas
- Schema markup follows content updates
- Regular validation checks

### Schema Evolution
- Monitor Schema.org updates for podcasting
- Adapt to search engine changes
- Expand schema types as content grows

This implementation will significantly enhance CRO.CAFE's search presence and enable rich podcast discovery across all languages and platforms.