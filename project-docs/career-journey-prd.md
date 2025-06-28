# Career Journey Component - Product Requirements Document

## Overview
This PRD outlines improvements to the Career Journey component displayed on guest detail pages. The component visualizes a guest's career progression using data from LinkedIn profiles.

## Current Issues
1. **Empty Component Display**: The component header shows even when there's no career data (e.g., /guests/lonneke-spinhof/)
2. **Incorrect Chronological Order**: Jobs are displayed oldest-to-newest instead of newest-to-oldest (LinkedIn standard)
3. **Arrow Alignment**: Timeline arrow is not properly aligned with the connecting line
4. **Unnecessary Label**: "Career Progression" label at bottom adds no value
5. **Unrelated Content**: Episode name/link appears within the career block
6. **Irrelevant Historical Data**: Shows all historical jobs instead of focusing on relevant timeframe

## Requirements

### 1. Conditional Rendering
- **Only display the component when experiences array has content**
  - Check if `parsedExperiences.length > 0` before rendering
  - Remove the entire Career Journey section if no data exists

### 2. Reverse Chronological Order
- **Display most recent experience first** (like LinkedIn)
  - Current sorting is correct (newest first) but visual display needs to be reversed
  - Most recent job should appear at the top/left
  - Oldest relevant job should appear at the bottom/right

### 3. Timeline Arrow Fixes
- **Ensure arrow points from older to newer positions**
  - Arrow direction should flow from past to present
  - Arrow must be precisely aligned on the connecting line
  - Consider using CSS pseudo-elements for better alignment

### 4. Remove Redundant Elements
- **Remove "Career Progression" label** from the bottom
- **Remove episode information** from the career timeline block
  - This information belongs in the episodes section, not career journey

### 5. Smart Date Filtering
- **Show only relevant career history**
  - Determine the date of the guest's first episode appearance
  - Display the job they held during their first episode
  - Show all subsequent positions up to the present
  - This creates a "career journey since appearing on the podcast" view

## Technical Implementation Details

### Data Structure
```typescript
interface CareerTimelineProps {
  experiences: string; // JSON string of LinkedInExperience[]
  firstEpisodeDate: string; // ISO date of first podcast appearance
  guestName: string; // For accessibility
}
```

### Filtering Logic
```typescript
// Filter experiences to show only from first episode onwards
const relevantExperiences = sortedExperiences.filter(exp => {
  const expStartDate = exp.startDate ? new Date(exp.startDate) : new Date();
  const firstEpisode = new Date(firstEpisodeDate);
  
  // Include if:
  // 1. Job started after first episode, OR
  // 2. Job was active during first episode (no end date or ended after episode)
  return expStartDate >= firstEpisode || 
         (!exp.endDate || new Date(exp.endDate) >= firstEpisode);
});
```

### Visual Timeline Updates
- Reverse the visual order while maintaining logical sort
- Update CSS flexbox/grid direction
- Ensure arrow SVG points in correct direction
- Test on both mobile (vertical) and desktop (horizontal) layouts

## Success Criteria
1. Component only renders when career data exists
2. Jobs display in reverse chronological order (newest first)
3. Timeline arrow is perfectly aligned with connecting line
4. No redundant labels or unrelated content
5. Timeline shows career progression from first podcast appearance to present
6. Component is accessible with proper ARIA labels
7. Responsive design works correctly on all screen sizes

## Testing Requirements
1. Test with guests who have no LinkedIn data
2. Test with guests who have extensive career history
3. Test with guests who changed jobs after appearing on podcast
4. Verify mobile and desktop layouts
5. Check dark mode compatibility
6. Validate accessibility with screen readers

## Future Enhancements (Out of Scope)
- Interactive timeline with hover effects
- Integration with episode dates as markers
- Animated transitions between jobs
- Company logos from LinkedIn data