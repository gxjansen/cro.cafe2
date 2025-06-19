# Teal & Coral Implementation Guide

## Quick Reference
- **Primary (Teal)**: `primary-300` (#95c3c0) - Links, secondary actions, labels
- **Accent (Coral)**: `secondary-300` (#dd8e91) - Primary CTAs only (one per viewport)

## Component Classes

### 1. Primary CTA Button (Coral)
```html
<!-- Default Primary CTA -->
<button class="
  bg-secondary-300 
  hover:bg-secondary-400 
  active:bg-secondary-500
  disabled:bg-secondary-100
  text-white 
  font-semibold 
  px-6 py-3 
  rounded-md 
  transition-all 
  duration-200
  hover:shadow-lg
  focus:outline-none 
  focus:ring-2 
  focus:ring-secondary-300 
  focus:ring-offset-2
">
  Primary Action
</button>

<!-- Large Primary CTA -->
<button class="
  bg-secondary-300 
  hover:bg-secondary-400 
  text-white 
  font-bold 
  px-8 py-4 
  text-lg
  rounded-lg 
  transition-all 
  duration-200
  hover:shadow-xl
  hover:scale-105
">
  Get Started Now
</button>
```

### 2. Secondary Button (Teal)
```html
<!-- Filled Secondary -->
<button class="
  bg-primary-300 
  hover:bg-primary-400 
  text-gray-900
  font-semibold 
  px-6 py-3 
  rounded-md 
  transition-colors
  focus:outline-none 
  focus:ring-2 
  focus:ring-primary-400 
  focus:ring-offset-2
">
  Secondary Action
</button>

<!-- Outline Secondary -->
<button class="
  border-2 
  border-primary-300 
  text-primary-600
  hover:bg-primary-50
  font-semibold 
  px-6 py-3 
  rounded-md 
  transition-colors
">
  Learn More
</button>
```

### 3. Link Styles
```html
<!-- Inline Link -->
<a href="#" class="
  text-primary-600 
  hover:text-primary-700 
  underline 
  underline-offset-2
  transition-colors
">
  Read more
</a>

<!-- Navigation Link -->
<a href="#" class="
  text-gray-700 
  hover:text-primary-600
  font-medium
  transition-colors
">
  Episodes
</a>

<!-- Active Navigation -->
<a href="#" class="
  text-primary-600
  font-semibold
  border-b-2 
  border-primary-300
">
  Current Page
</a>
```

### 4. Card Components
```html
<!-- Episode Card with Teal Accents -->
<div class="
  bg-white 
  rounded-lg 
  shadow-md 
  overflow-hidden
  hover:shadow-lg
  transition-shadow
">
  <img src="..." class="w-full h-48 object-cover" />
  <div class="p-6">
    <span class="
      text-primary-600 
      text-sm 
      font-medium
      uppercase
      tracking-wide
    ">
      Episode 42
    </span>
    <h3 class="text-xl font-bold mt-2 mb-3">Episode Title</h3>
    <p class="text-gray-600 mb-4">Description...</p>
    <a href="#" class="
      text-primary-600 
      hover:text-primary-700
      font-medium
      inline-flex 
      items-center
    ">
      Listen Now →
    </a>
  </div>
</div>
```

### 5. Hero Section Example
```html
<section class="py-20 bg-gray-50">
  <div class="container mx-auto px-4 text-center">
    <h1 class="text-4xl md:text-5xl font-heading font-bold mb-6">
      Welcome to Our Podcast
    </h1>
    <p class="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
      Join us for weekly conversations with industry leaders.
    </p>
    <!-- One coral CTA per viewport -->
    <button class="
      bg-secondary-300 
      hover:bg-secondary-400 
      text-white 
      font-bold 
      px-8 py-4 
      text-lg
      rounded-lg 
      transition-all 
      duration-200
      hover:shadow-xl
      mb-4
    ">
      Browse Episodes
    </button>
    <!-- Secondary action in smaller text -->
    <p class="text-sm text-gray-500">
      or 
      <a href="#" class="text-primary-600 hover:text-primary-700 underline">
        subscribe to our newsletter
      </a>
    </p>
  </div>
</section>
```

### 6. Form Elements
```html
<!-- Input with Teal Focus -->
<input 
  type="email" 
  class="
    w-full 
    px-4 py-2 
    border 
    border-gray-300 
    rounded-md
    focus:ring-2 
    focus:ring-primary-300 
    focus:border-primary-300
    transition-colors
  "
  placeholder="Enter your email"
/>

<!-- Submit Button (Coral for primary forms) -->
<button type="submit" class="
  bg-secondary-300 
  hover:bg-secondary-400 
  text-white 
  font-semibold 
  px-6 py-2 
  rounded-md
  w-full
  transition-colors
">
  Subscribe
</button>
```

### 7. Badge/Label Components
```html
<!-- Teal Badge -->
<span class="
  inline-flex 
  items-center 
  px-3 py-1 
  rounded-full 
  text-sm 
  font-medium
  bg-primary-100 
  text-primary-700
">
  New Episode
</span>

<!-- Coral Badge (use sparingly) -->
<span class="
  inline-flex 
  items-center 
  px-3 py-1 
  rounded-full 
  text-sm 
  font-medium
  bg-secondary-100 
  text-secondary-700
">
  Featured
</span>
```

## Dark Mode Implementations

### Dark Mode Color Adjustments
```html
<!-- Coral CTA in Dark Mode -->
<button class="
  bg-secondary-300 
  dark:bg-secondary-400
  hover:bg-secondary-400 
  dark:hover:bg-secondary-500
  text-white 
  font-semibold 
  px-6 py-3 
  rounded-md
">
  Primary Action
</button>

<!-- Teal Elements in Dark Mode -->
<a href="#" class="
  text-primary-600 
  dark:text-primary-200
  hover:text-primary-700 
  dark:hover:text-primary-100
">
  Link Text
</a>
```

## Implementation Checklist

### Header
- [ ] "Browse Episodes" button uses `bg-secondary-300`
- [ ] Navigation links use `text-gray-700 hover:text-primary-600`
- [ ] Active nav item uses `text-primary-600`

### Homepage
- [ ] Hero CTA uses `bg-secondary-300` (only one)
- [ ] Secondary CTAs use `border-primary-300` or `bg-primary-300`
- [ ] Links use `text-primary-600`

### Episode Pages
- [ ] "Listen Now" as primary coral CTA
- [ ] "Subscribe" or "Share" as secondary teal actions
- [ ] Episode metadata uses `text-primary-600` for labels

### Footer
- [ ] Newsletter signup uses coral submit button
- [ ] Footer links use `text-gray-600 hover:text-primary-600`
- [ ] Social icons use teal on hover

## Utility Classes for Quick Implementation

```css
/* Add to your global CSS */
.btn-primary {
  @apply bg-secondary-300 hover:bg-secondary-400 text-white font-semibold px-6 py-3 rounded-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-secondary-300 focus:ring-offset-2;
}

.btn-secondary {
  @apply bg-primary-300 hover:bg-primary-400 text-gray-900 font-semibold px-6 py-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2;
}

.btn-outline {
  @apply border-2 border-primary-300 text-primary-600 hover:bg-primary-50 font-semibold px-6 py-3 rounded-md transition-colors;
}

.link-primary {
  @apply text-primary-600 hover:text-primary-700 underline underline-offset-2 transition-colors;
}
```

## Remember the Rules
1. **One coral CTA per viewport** - This is the most important rule
2. **Coral = Primary desired action** - What you want users to do most
3. **Teal = Supporting actions** - Everything else
4. **Sufficient whitespace** - Give coral elements breathing room
5. **Consistent meaning** - Don't swap color meanings between pages