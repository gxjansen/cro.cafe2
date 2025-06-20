# Language-Specific Accent Colors Guide

## Overview
We've implemented a centralized color system that automatically applies language-specific accent colors based on the current language context. This system uses CSS variables and Tailwind CSS to provide consistent theming across the entire website.

## Color Assignments
- **English (en)**: Blue (#3b82f6)
- **Dutch (nl)**: Orange (#f97316)
- **German (de)**: Teal (#14b8a6)
- **Spanish (es)**: Red (#ef4444)

## How It Works
1. The `BaseLayout` component adds a `data-lang` attribute to the HTML element
2. CSS variables in `global.css` define color palettes for each language
3. Tailwind's `lang-*` color utilities automatically use the appropriate colors

## Usage in Components

### Basic Usage
Simply replace `primary-*` or `accent-*` colors with `lang-*` colors where you want language-specific theming:

```astro
<!-- Before -->
<button class="bg-primary-600 hover:bg-primary-700 text-white">
  Subscribe
</button>

<!-- After -->
<button class="bg-lang-600 hover:bg-lang-700 text-white">
  Subscribe
</button>
```

### Common Patterns

#### Primary Buttons
```astro
<a class="bg-lang-600 hover:bg-lang-700 dark:bg-lang-500 dark:hover:bg-lang-600 text-white">
  Call to Action
</a>
```

#### Secondary Buttons
```astro
<button class="border-2 border-lang-600 text-lang-600 hover:bg-lang-50 dark:border-lang-400 dark:text-lang-400 dark:hover:bg-lang-900/20">
  Secondary Action
</button>
```

#### Links
```astro
<a class="text-lang-600 hover:text-lang-700 dark:text-lang-400 dark:hover:text-lang-300">
  Link text
</a>
```

#### Badges/Labels
```astro
<span class="bg-lang-100 text-lang-700 dark:bg-lang-900/30 dark:text-lang-300">
  New Episode
</span>
```

#### Hover States on Cards
```astro
<div class="border-2 border-transparent hover:border-lang-500 transition-colors">
  Card content
</div>
```

#### Focus States
```astro
<input class="focus:ring-2 focus:ring-lang-500 focus:border-lang-500" />
```

#### Gradients
```astro
<section class="bg-gradient-to-br from-lang-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-lang-900/10">
  Content
</section>
```

## Available Color Shades
All `lang-*` colors support the standard Tailwind shade scale:
- `lang-50` - Lightest (backgrounds)
- `lang-100` - Very light (hover backgrounds)
- `lang-200` - Light (dark mode text)
- `lang-300` - Medium light
- `lang-400` - Medium (hover states)
- `lang-500` - Base (primary actions)
- `lang-600` - Medium dark (primary hover)
- `lang-700` - Dark (pressed states)
- `lang-800` - Very dark
- `lang-900` - Darkest

## Best Practices

### DO:
- Use `lang-*` colors for interactive elements (buttons, links, form elements)
- Use `lang-*` colors for highlights and emphasis
- Use lighter shades (50-200) for backgrounds
- Use darker shades (600-900) for text on light backgrounds
- Use lighter shades (200-400) for text on dark backgrounds

### DON'T:
- Don't use `lang-*` colors for body text (keep using gray)
- Don't use `lang-*` colors for structural elements (borders, dividers)
- Don't override the brand logo colors
- Don't use too many accent colors in one section

## Accessibility Notes
All language colors have been tested for WCAG AA compliance:
- Use `lang-600` or darker on white backgrounds
- Use `lang-400` or lighter on dark backgrounds
- Always test color contrast when creating new combinations

## Migration Checklist
When updating a component to use language colors:

1. [ ] Replace `primary-*` colors with `lang-*` for CTAs
2. [ ] Update hover states to use `lang-*` variants
3. [ ] Update focus states to use `lang-*` colors
4. [ ] Test in all four languages
5. [ ] Test in both light and dark modes
6. [ ] Verify accessibility compliance

## Example Component Update

```astro
<!-- Before -->
<div class="bg-primary-50 border-primary-200">
  <h2 class="text-primary-800">Title</h2>
  <button class="bg-accent-500 hover:bg-accent-600 text-white">
    Subscribe
  </button>
</div>

<!-- After -->
<div class="bg-lang-50 border-lang-200">
  <h2 class="text-lang-800">Title</h2>
  <button class="bg-lang-500 hover:bg-lang-600 text-white">
    Subscribe
  </button>
</div>
```

## Testing
To test the color system:
1. Navigate to different language sections: `/en/`, `/nl/`, `/de/`, `/es/`
2. Verify that accent colors change appropriately
3. Toggle dark mode to ensure colors work in both themes
4. Use browser DevTools to inspect the CSS variables

The color system is now ready to use throughout the codebase without any additional configuration needed in individual components.