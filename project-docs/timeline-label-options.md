# Timeline Label Options for Career Journey Component

## Context
We need labels to indicate the progression from past to present on the career timeline. The timeline shows jobs from the guest's first podcast appearance to the present day.

## Label Options

### Option 1: Time-based (Recommended)
- **Left/Bottom**: "First episode"
- **Right/Top**: "Today"

*Pros*: Clear, concise, directly relates to the podcast context
*Cons*: None significant

### Option 2: Recording-focused
- **Left/Bottom**: "At time of recording"
- **Right/Top**: "Present day"

*Pros*: Explicitly mentions recording, formal tone
*Cons*: "At time of recording" is longer, might be confusing if multiple episodes

### Option 3: Journey-focused
- **Left/Bottom**: "Then"
- **Right/Top**: "Now"

*Pros*: Very concise, universal understanding
*Cons*: Perhaps too minimal, lacks context

### Option 4: Career-focused
- **Left/Bottom**: "Career start"
- **Right/Top**: "Current role"

*Pros*: Focus on career progression
*Cons*: "Career start" might be misleading as we only show from first episode

### Option 5: Episode-specific
- **Left/Bottom**: "Since [Year]"
- **Right/Top**: "Today"

*Pros*: Provides specific timeframe
*Cons*: Requires dynamic year calculation

## Recommendation
**Option 1** ("First episode" → "Today") is recommended because it:
- Clearly indicates the timeline scope
- Relates directly to the podcast context
- Is concise and scannable
- Works in all languages with simple translations

## Implementation Notes
- Labels should be subtle, not competing with the timeline content
- Use smaller, muted text (e.g., 0.75rem, gray-600)
- Position above the timeline on desktop, beside on mobile
- Include in translations for internationalization