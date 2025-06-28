# WCAG Components Reference Guide

**Created**: 2025-06-27  
**Purpose**: Quick reference for using WCAG-compliant components

## Component Usage Guide

### 1. Skip Links Component

**File**: `src/components/SkipLink.astro`

```astro
---
import SkipLink from '../components/SkipLink.astro';
---

<!-- Include at the very beginning of your layout -->
<SkipLink 
  includeNavigation={true}
  includeSearch={true}
  includeFooter={true}
/>
```

**Required IDs in your layout**:
- `id="main-content"` - Main content area
- `id="main-navigation"` - Navigation element
- `id="search-section"` - Search area
- `id="footer"` - Footer element

### 2. Episode Transcript Component

**File**: `src/components/EpisodeTranscript.astro`

```astro
---
import EpisodeTranscript from '../components/EpisodeTranscript.astro';
---

<!-- Inline transcript -->
<EpisodeTranscript 
  transcript={episode.data.transcript}
  episodeTitle={episode.data.title}
/>

<!-- Download link -->
<EpisodeTranscript 
  transcriptUrl="/transcripts/episode-1.pdf"
  episodeTitle={episode.data.title}
/>
```

### 3. Loading Announcer Component

**File**: `src/components/LoadingAnnouncer.astro`

```astro
---
import LoadingAnnouncer from '../components/LoadingAnnouncer.astro';
---

<!-- Basic usage -->
<LoadingAnnouncer />

<!-- Custom messages -->
<LoadingAnnouncer 
  message="Loading search results..."
  completedMessage="Search complete"
  errorMessage="Search failed"
/>
```

**JavaScript usage**:
```javascript
// Announce loading state
window.announceLoadingState('loading', 'Fetching user data...');

// Announce success
window.announceLoadingState('success', 'User data loaded');

// Announce error
window.announceLoadingState('error', 'Failed to load user data');
```

### 4. Focus Trap Utility

**File**: `src/utils/focus-trap.ts`

```typescript
import { FocusTrap, trapFocus } from '../utils/focus-trap';

// Method 1: Using the class
const modal = document.querySelector('.modal');
const trap = new FocusTrap(modal, {
  onEscape: () => closeModal(),
  initialFocus: '.modal-close-button',
  returnFocus: true,
  allowOutsideClick: true
});

// Activate when modal opens
trap.activate();

// Deactivate when modal closes
trap.deactivate();

// Method 2: Using the convenience function
const trap = trapFocus(modal, {
  onEscape: () => closeModal()
});
```

### 5. Enhanced Image Components

#### Guest Profile Picture
```astro
<GuestProfilePictureOptimized 
  guest={guestData}
  size="lg"
  loading="lazy"
  grayscale={true}
/>
```

#### Episode Image with Context
```astro
<EpisodeImage 
  imageUrl={episode.data.imageUrl}
  alt="Episode cover"
  episodeTitle={episode.data.title}
  episodeNumber={episode.data.episode}
  season={episode.data.season}
  guestName={episode.data.guest}
/>
```

## Accessibility Patterns

### Form Labels

```astro
<!-- Visible label -->
<label for="email">Email Address</label>
<input type="email" id="email" name="email" />

<!-- Screen reader only label -->
<label for="search" class="sr-only">Search episodes</label>
<input type="search" id="search" name="q" />

<!-- With description -->
<label for="password">Password</label>
<input 
  type="password" 
  id="password" 
  aria-describedby="password-help"
/>
<span id="password-help" class="text-sm">
  Must be at least 8 characters
</span>
```

### Live Regions

```astro
<!-- Polite announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  <span id="status-message"></span>
</div>

<!-- Assertive announcements -->
<div aria-live="assertive" aria-atomic="true" class="sr-only">
  <span id="error-message"></span>
</div>
```

### Keyboard Navigation

```typescript
// Add to interactive elements
element.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      handleActivation();
      break;
    case 'Escape':
      e.preventDefault();
      handleEscape();
      break;
  }
});
```

### ARIA Attributes Reference

```astro
<!-- Button with expanded state -->
<button
  aria-expanded="false"
  aria-controls="menu-items"
  aria-label="Open navigation menu"
>
  Menu
</button>

<!-- Current page indicator -->
<a 
  href="/about" 
  aria-current="page"
>
  About
</a>

<!-- Loading state -->
<button 
  aria-busy="true"
  aria-label="Saving changes"
>
  <span aria-hidden="true">💾</span>
  Saving...
</button>

<!-- Required field -->
<input 
  type="text"
  required
  aria-required="true"
  aria-invalid="false"
/>
```

## CSS Utilities

### Screen Reader Only
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Focus Visible
```css
/* Remove default outline */
*:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

/* Add custom focus indicator */
*:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### Reduced Motion
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

## Testing Snippets

### Check Focus Order
```javascript
// Log all focusable elements in order
const focusable = document.querySelectorAll(
  'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
);
console.log('Focus order:', Array.from(focusable));
```

### Test Announcements
```javascript
// Test screen reader announcements
const testAnnouncement = (message) => {
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;
  document.body.appendChild(announcer);
  setTimeout(() => document.body.removeChild(announcer), 1000);
};

testAnnouncement('This is a test announcement');
```

### Validate ARIA
```javascript
// Check for common ARIA mistakes
const checkARIA = () => {
  // Check for missing labels
  const unlabeled = document.querySelectorAll(
    'input:not([aria-label]):not([aria-labelledby]):not([id])'
  );
  console.log('Unlabeled inputs:', unlabeled);
  
  // Check for invalid ARIA references
  const ariaRefs = document.querySelectorAll('[aria-labelledby], [aria-describedby]');
  ariaRefs.forEach(el => {
    const ids = el.getAttribute('aria-labelledby') || el.getAttribute('aria-describedby');
    ids.split(' ').forEach(id => {
      if (!document.getElementById(id)) {
        console.error('Invalid ARIA reference:', id, 'on', el);
      }
    });
  });
};
```

## Common Pitfalls to Avoid

1. **Don't use positive tabindex values**
   ```astro
   <!-- Bad -->
   <button tabindex="1">Click me</button>
   
   <!-- Good -->
   <button tabindex="0">Click me</button>
   ```

2. **Don't hide focus indicators**
   ```css
   /* Bad */
   *:focus { outline: none; }
   
   /* Good - provide alternative */
   *:focus { outline: none; box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5); }
   ```

3. **Don't forget empty alt text for decorative images**
   ```astro
   <!-- Bad -->
   <img src="decoration.png" />
   
   <!-- Good -->
   <img src="decoration.png" alt="" role="presentation" />
   ```

4. **Don't nest interactive elements**
   ```astro
   <!-- Bad -->
   <a href="/page">
     Link text <button>Action</button>
   </a>
   
   <!-- Good -->
   <a href="/page">Link text</a>
   <button>Action</button>
   ```