# Product Requirements Document: LinkedIn Data Integration

## Project Overview

### Title
LinkedIn Data Integration for Guest Profiles

### Date
December 26, 2024

### Status
In Development

### Stakeholders
- Product Owner: CrocaFé SPARC Team
- Design Team: UX Specialist & Designer Agents
- Development Team: Engineering Team
- Content Team: Guest Profile Managers

## Executive Summary

This project enhances the CrocaFé SPARC guest experience by integrating LinkedIn profile data that has been collected and stored in our system. The integration will enrich guest cards and detail pages with professional information, making it easier for users to understand each guest's background and expertise.

## Problem Statement

Currently, guest profiles display limited information, potentially missing valuable context about guests' professional backgrounds. We have collected rich LinkedIn data including headlines, skills, experience, and location information that is not being utilized in the user interface. This creates a missed opportunity to provide users with comprehensive guest insights.

## Goals and Objectives

### Primary Goals
1. Enrich guest profiles with LinkedIn data to provide comprehensive professional context
2. Improve guest discovery through enhanced profile information
3. Maintain visual consistency while integrating new data elements
4. Ensure graceful degradation when LinkedIn data is incomplete

### Success Metrics
- Increased time spent on guest detail pages
- Higher click-through rates on guest cards
- Improved user satisfaction with guest information completeness
- Reduced bounce rates on guest pages

## Scope

### In Scope
- Integration of LinkedIn profile pictures from local storage
- Display of LinkedIn headlines on guest cards and detail pages
- Country/location display with flag indicators
- Skills visualization on guest detail pages
- Experience timeline on guest detail pages
- Responsive design for all new elements
- Dark mode support

### Out of Scope
- Real-time LinkedIn data fetching
- LinkedIn verification badges
- Data freshness indicators
- Profile completeness metrics
- Direct LinkedIn API integration
- User-generated content or reviews

## User Stories

### As a podcast listener
- I want to quickly understand a guest's professional background so I can decide which episodes to listen to
- I want to see guests' key skills so I can find experts in topics I'm interested in
- I want to know where guests are located for networking opportunities

### As a content creator
- I want rich guest profiles to showcase the caliber of my guests
- I want consistent visual presentation across all guest profiles
- I want the platform to handle missing data gracefully

## Functional Requirements

### 1. Profile Pictures

#### Requirements
- Display LinkedIn profile pictures stored locally at `public/images/guests/{guest-slug}.jpeg`
- Apply consistent visual treatment across all instances (guest cards and detail pages)
- Implement fallback strategy for missing images

#### Fallback Strategy
1. Primary: Local LinkedIn image (`/images/guests/{guest-slug}.jpeg`)
2. Secondary: Guest initials with gradient background
3. Tertiary: Generic user icon

#### Visual Specifications
- Use existing Tailwind classes: `rounded-full`, `shadow-sm`, `hover:scale-105`
- Extend Tailwind config for gradient borders if not available
- Leverage existing size utilities or extend config:
  - Guest cards: `w-16 h-16`
  - Guest lists: `w-24 h-24`
  - Detail pages: `w-48 h-48`

### 2. LinkedIn Headlines

#### Requirements
- Display LinkedIn headlines below existing role/company information
- Implement smart truncation for space-constrained contexts
- Provide expand/collapse functionality for long headlines
- Maintain readability across devices

#### Truncation Rules
- Guest cards: 60 characters (desktop), 45 characters (mobile)
- Detail pages: 200 characters (desktop), 120 characters (mobile)
- Always break at word boundaries
- Add "..." for truncated text
- Show full headline on hover (desktop) or tap to expand (mobile)

#### Visual Specifications
- Typography: Use Tailwind classes `text-sm italic font-medium`
- Color: `text-gray-600 dark:text-gray-300`
- Spacing: `mt-2 pl-3`
- Accent: Extend Tailwind with LinkedIn blue if needed, or use `border-l-2 border-blue-600`
- Apply existing dark mode utilities

### 3. Country/Location Display

#### Requirements
- Show guest location using country flags and names
- Implement accessible flag display using emoji
- Provide fallback for unknown countries
- Integrate seamlessly with existing metadata

#### Implementation
- Format: Flag emoji + country name (e.g., "🇳🇱 Netherlands")
- Compact format: Flag emoji only (for space-constrained views)
- Unknown countries: Globe emoji (🌍) as fallback
- Position: After company information in metadata row

#### Visual Specifications
- Container: `inline-flex gap-1.5`
- Background: `bg-gray-100 dark:bg-gray-700`
- Shape: `rounded-full`
- Spacing: `py-0.5 px-2`
- Typography: `text-xs`
- Interaction: `hover:shadow-sm transition-shadow`

### 4. Skills Display (Detail Page)

#### Requirements
- Display LinkedIn skills as visual tags
- Limit to top 10-15 skills for clarity
- Group related skills when possible
- Make skills visually scannable

#### Visual Specifications
- Layout: `flex flex-wrap gap-2`
- Tag style: `rounded-full px-3 py-1`
- Colors: Use existing brand colors from Tailwind config (teal variants)
- Background: `bg-teal-100 dark:bg-teal-900`
- Interaction: `hover:scale-105 transition-transform`

### 5. Experience Timeline (Detail Page)

#### Requirements
- Display career progression chronologically
- Show company, role, and duration
- Highlight current position
- Collapse older experiences by default

#### Visual Specifications
- Layout: Use existing card/list components with timeline modifier
- Current role: Apply primary brand color classes from Tailwind config
- Past roles: `opacity-75` or `text-gray-600`
- Expandable: Leverage existing collapse/expand patterns in codebase

## Technical Requirements

### Frontend Implementation
- Framework: Astro with existing component architecture
- Styling: Tailwind CSS with custom design tokens
- Image optimization: WebP with JPEG fallback
- Lazy loading: For images and non-critical content
- Accessibility: WCAG 2.1 AA compliance

### Data Integration
- Source: LinkedIn data from markdown frontmatter
- Image source: Local storage at `public/images/guests/`
- Fallback handling: Graceful degradation for missing data
- Type safety: TypeScript interfaces for LinkedIn data

### Performance Requirements
- Image loading: < 3 seconds on 3G connection
- Interaction feedback: < 100ms
- Page weight increase: < 200KB
- Lighthouse score: Maintain 90+ performance

## Design Specifications

### Component Updates

Components should leverage existing Tailwind utilities and only extend the configuration when necessary. Any new design tokens should be added to the Tailwind config file rather than component styles.

#### Tailwind Config Extensions Needed
```javascript
// tailwind.config.js extensions
module.exports = {
  extend: {
    colors: {
      linkedin: {
        DEFAULT: '#0077B5',
        dark: '#46A7C7', // for dark mode
      }
    },
    backgroundImage: {
      'gradient-teal': 'linear-gradient(135deg, #95c3c0 0%, #5a8a87 100%)',
    }
  }
}
```

#### Component Class Patterns
- Profile pictures: `rounded-full border-3 border-gradient-teal shadow-inner`
- Headlines: `text-sm italic font-medium text-gray-600 dark:text-gray-300 border-l-2 border-linkedin`
- Location badges: `inline-flex gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-full py-0.5 px-2 text-xs`
- Skills: `bg-teal-100 dark:bg-teal-900 rounded-full px-3 py-1 hover:scale-105`

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Dark Mode Adaptations
All dark mode styles should use Tailwind's built-in dark mode utilities:
- Use `dark:` prefix for dark mode variants
- Leverage existing color palette from Tailwind config
- No custom dark mode CSS needed - rely on Tailwind's dark mode system

## Testing Requirements

### Functional Testing
- Profile picture loading and fallbacks
- Headline truncation at various lengths
- Country flag display for all countries
- Dark mode visual consistency
- Responsive behavior across breakpoints

### Performance Testing
- Image optimization validation
- Lazy loading functionality
- Page speed impact measurement
- Memory usage with many profiles

### Accessibility Testing
- Screen reader compatibility
- Keyboard navigation
- Color contrast validation
- Alt text for all images
- ARIA labels for interactive elements

## Implementation Plan

### Phase 1: Foundation (Week 1)
- Update GuestCard component with profile pictures
- Implement image fallback system
- Add LinkedIn headline with truncation
- Deploy to staging for testing

### Phase 2: Enhancement (Week 2)
- Add country flags and location display
- Implement skills section on detail pages
- Create experience timeline component
- Integrate dark mode styles

### Phase 3: Polish (Week 3)
- Performance optimization
- Accessibility audit and fixes
- Cross-browser testing
- Documentation update

### Phase 4: Launch (Week 4)
- Production deployment
- Monitor performance metrics
- Gather user feedback
- Plan iteration improvements

## Risk Mitigation

### Technical Risks
- **Risk**: Large image files impacting performance
- **Mitigation**: Implement image optimization pipeline with WebP conversion

### Data Risks
- **Risk**: Incomplete LinkedIn data for some guests
- **Mitigation**: Robust fallback system ensuring no broken experiences

### Design Risks
- **Risk**: Information overload on guest cards
- **Mitigation**: Progressive disclosure with expandable content

## Success Criteria

### Launch Criteria
- All automated tests passing
- Lighthouse performance score > 90
- Zero accessibility violations
- Successful staging deployment for 48 hours

### Post-Launch Metrics (30 days)
- 20% increase in guest detail page engagement
- 15% increase in guest card click-through rate
- < 1% increase in page load time
- Positive user feedback score > 4/5

## Appendix

### LinkedIn Data Fields Available
- linkedin_url
- linkedin_full_name
- linkedin_headline
- linkedin_bio
- linkedin_profile_pic
- linkedin_current_role
- linkedin_current_company
- linkedin_country
- linkedin_skills
- linkedin_experiences
- linkedin_company_website
- linkedin_personal_website
- linkedin_publications
- last_linkedin_sync

### Design Assets Required
- Updated Figma components for guest cards
- Dark mode color palette extensions
- Country flag emoji reference sheet
- Interaction state documentation

### Technical Dependencies
- Astro framework (current version)
- Tailwind CSS configuration
- Image optimization pipeline
- TypeScript type definitions