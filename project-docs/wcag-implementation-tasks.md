# WCAG 2.1 AA Implementation Tasks

**Created**: 2025-06-27  
**Priority**: Fix critical issues first, then important, then nice-to-have

## 🔴 Critical Tasks (Must Fix for Compliance)

### 1. Fix Heading Hierarchy Issues

#### Task 1.1: Fix Multiple H1 Tags
- [ ] **File**: `src/pages/404.astro`
  - Change `<h2>Page Not Found</h2>` to be part of the h1
  - Combine into single h1: `<h1>404 - Page Not Found</h1>`

#### Task 1.2: Fix Skipped Heading Levels
- [ ] **File**: `src/components/CareerTimeline.astro`
  - Change `<h3>Career Journey</h3>` to `<h2>` or ensure parent provides h1/h2 context
  
- [ ] **File**: `src/components/Footer.astro`
  - Replace h3 tags with styled div/span elements for footer sections
  - These aren't document sections, just UI labels

#### Task 1.3: Review Component Heading Usage
- [ ] **Files**: `ThenNowCard.astro`, `GuestCard.astro`, `EpisodeCard.astro`
  - Document expected parent heading structure
  - Add comments indicating these components expect to be used where h1/h2 exist
  - Consider using h2 for section headers and h3 for cards

### 2. Add Missing Form Labels

#### Task 2.1: Fix Search Input Labels
- [ ] **Files**: `src/pages/search.astro`, `src/pages/[lang]/search.astro` (lines ~70-76)
  ```astro
  <!-- Add this before the input -->
  <label for="search-input" class="sr-only">Search episodes and guests</label>
  <input
    type="search"
    id="search-input"
    name="q"
    aria-describedby="search-hint"
    ...
  />
  <span id="search-hint" class="sr-only">Enter keywords to search across all languages</span>
  ```

#### Task 2.2: Fix Country Filter Label
- [ ] **File**: `src/components/GuestFilterBar.astro` (line ~163)
  ```astro
  <label for="countryFilter-${instanceId}" class="sr-only">Filter by country</label>
  <select id="countryFilter-${instanceId}" class="form-select" data-filter="country">
  ```

#### Task 2.3: Fix Skill Filter ARIA
- [ ] **File**: `src/components/GuestFilterBar.astro`
  ```astro
  <button
    id="skillFilterButton-${instanceId}"
    aria-label="Filter by expertise"
    aria-controls="skillFilterDropdown-${instanceId}"
    aria-expanded="false"
    ...>
  ```

#### Task 2.4: Add Search Results Live Region
- [ ] **Files**: `src/pages/search.astro`, `src/pages/[lang]/search.astro`
  ```astro
  <!-- Add after search form -->
  <div aria-live="polite" aria-atomic="true" id="search-status" class="sr-only">
    <!-- Update with JS: "Showing X results for 'query'" -->
  </div>
  ```

### 3. Fix Nested Interactive Elements

#### Task 3.1: Refactor Guest Card LinkedIn Buttons
- [ ] **File**: `src/components/GuestCardHorizontalImproved.astro` (lines 136-150)
  
  **Option A - CSS Solution** (Recommended):
  ```astro
  <!-- Remove tabindex and role from LinkedIn icon -->
  <div class="linkedin-wrapper absolute top-2 right-2 z-10">
    <a 
      href={linkedInUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      class="linkedin-link"
      aria-label={`View ${name}'s LinkedIn profile`}
      onClick={(e) => e.stopPropagation()}
    >
      <LinkedInIcon />
    </a>
  </div>
  
  <!-- Main card link should not include LinkedIn area -->
  <a href={guestUrl} class="card-link block" style="clip-path: inset(0 48px 0 0)">
    <!-- Card content -->
  </a>
  ```

  **Option B - JavaScript Solution**:
  ```javascript
  // Handle card click with exception for LinkedIn
  cardElement.addEventListener('click', (e) => {
    if (e.target.closest('.linkedin-link')) return;
    window.location.href = guestUrl;
  });
  ```

## 🟡 Important Tasks (Should Fix)

### 4. Audio Player Accessibility

#### Task 4.1: Make Progress Bar Keyboard Accessible
- [ ] **File**: `src/components/SimpleAudioPlayer.astro`
  ```astro
  <input
    type="range"
    class="progress-bar"
    min="0"
    max="100"
    value="0"
    aria-label="Seek audio position"
    aria-valuetext="0% played"
    role="slider"
  />
  ```
  - Add keyboard event handlers for arrow keys
  - Update aria-valuetext dynamically

#### Task 4.2: Add Episode Transcripts
- [ ] **Files**: Episode MDX files
  - Add `transcript` field to episode frontmatter
  - Add transcript link in episode player UI
  - Create transcript display component

### 5. Dynamic Content Announcements

#### Task 5.1: Add Form Validation Announcements
- [ ] **File**: Newsletter form (when re-enabled)
  ```astro
  <span 
    id="email-error" 
    class="error-message" 
    aria-live="polite"
    aria-atomic="true"
  >
    <!-- Error messages appear here -->
  </span>
  ```

#### Task 5.2: Add Loading State Announcements
- [ ] **Component**: Create `LoadingAnnouncer.astro`
  ```astro
  <div aria-live="polite" aria-atomic="true" class="sr-only">
    {loading && "Loading content, please wait..."}
    {!loading && "Content loaded"}
  </div>
  ```

### 6. Focus Management Improvements

#### Task 6.1: Remove Positive Tabindex Values
- [ ] **All files**: Search and replace `tabindex="1"` or any positive values
  - Replace with `tabindex="0"` for focusable elements
  - Use `tabindex="-1"` only for programmatic focus

#### Task 6.2: Implement Focus Trap Utility
- [ ] **File**: Create `src/utils/focus-trap.ts`
  ```typescript
  export function trapFocus(element: HTMLElement) {
    const focusableElements = element.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    });
  }
  ```

## 🟢 Nice to Have Tasks

### 7. Enhanced Accessibility Features

#### Task 7.1: Add Skip to Content Links for Major Sections
- [ ] **File**: Update `src/components/SkipLink.astro`
  - Add "Skip to navigation"
  - Add "Skip to search"
  - Add "Skip to footer"

#### Task 7.2: Improve Alt Text Context
- [ ] **Files**: `GuestImage.astro`, `EpisodeImage.astro`
  - Include more context in alt text when available
  - Example: `${name}, ${role} at ${company} - CRO.CAFE guest`

#### Task 7.3: Add Reduced Motion Support
- [ ] **File**: `src/styles/global.css`
  ```css
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

## Testing Checklist

After implementing each task:

### Manual Testing
- [ ] Test with keyboard only (Tab, Shift+Tab, Enter, Space, Arrow keys)
- [ ] Test with screen reader (NVDA or VoiceOver)
- [ ] Test color contrast with browser tools
- [ ] Test at 200% zoom level
- [ ] Test with browser's reader mode

### Automated Testing
- [ ] Run axe DevTools browser extension
- [ ] Run WAVE browser extension
- [ ] Run Lighthouse accessibility audit
- [ ] Add accessibility tests to CI/CD pipeline

### Component-Specific Testing
- [ ] Test all form submissions with screen reader
- [ ] Test all interactive elements with keyboard
- [ ] Test dynamic content updates are announced
- [ ] Test focus remains visible at all times
- [ ] Test error messages are announced

## Implementation Order

1. **Week 1**: Complete all Critical Tasks (🔴)
   - Fix heading hierarchy (1 day)
   - Add form labels (1 day)
   - Fix nested interactive elements (2 days)
   - Test and verify fixes (1 day)

2. **Week 2**: Complete Important Tasks (🟡)
   - Audio player accessibility (1 day)
   - Dynamic content announcements (2 days)
   - Focus management improvements (2 days)

3. **Week 3**: Nice to Have & Testing (🟢)
   - Enhanced accessibility features (2 days)
   - Comprehensive testing (2 days)
   - Documentation updates (1 day)

## Code Review Checklist

Before merging any accessibility fixes:
- [ ] All automated tests pass
- [ ] Manual keyboard navigation tested
- [ ] Screen reader tested on at least one page
- [ ] No new accessibility errors introduced
- [ ] Documentation updated if needed

## Resources

- [MDN ARIA Authoring Practices](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Deque University](https://dequeuniversity.com/)

---

**Note**: Each task includes specific line numbers and code examples. Test thoroughly after each change to ensure no regressions.