# Animation Components Guide

> Create Ray Dalio-style explanatory animations that sync with voiceover

## Overview

Animation components are React-based visual effects that render programmatically in Remotion. They're perfect for:

- **Counters**: Numbers ticking up/down (e.g., "100 million users")
- **Stacking**: Objects piling up (e.g., debt accumulating)
- **Progress bars**: Percentages filling (e.g., "80% of GDP")
- **Charts**: Data visualizing over time
- **Icon grids**: "1 in 10 people" style statistics
- **Scale comparisons**: "10x bigger" visualizations

## Quick Start

### 1. Add to script.json

```json
{
  "type": "speech",
  "text": "100 millions d'utilisateurs en deux mois.",
  "scene_type": "animated",
  "animation": {
    "type": "counter",
    "params": {
      "start": 0,
      "end": 100000000,
      "format": "millions",
      "suffix": " utilisateurs"
    }
  }
}
```

### 2. Run prepare and render

```bash
npm run prepare -- --project=myproject
npm run render -- --project=myproject
```

That's it! The animation will sync with the voiceover automatically.

---

## Available Animations

### 1. Counter (`counter`)

Numbers counting up or down with dramatic styling.

```json
{
  "type": "counter",
  "params": {
    "start": 0,
    "end": 100000000,
    "format": "millions",
    "prefix": "$",
    "suffix": "",
    "color": "#FFFFFF",
    "fontSize": 160,
    "easing": "easeOut"
  }
}
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `start` | number | 0 | Starting value |
| `end` | number | **required** | Ending value |
| `format` | string | "number" | `"number"`, `"millions"`, `"milliards"`, `"percent"`, `"currency"`, `"compact"` |
| `prefix` | string | "" | Text before number (e.g., "$", "€") |
| `suffix` | string | "" | Text after number (e.g., " users", "%") |
| `color` | string | "#FFFFFF" | Text color |
| `fontSize` | number | 160 | Font size in px |
| `easing` | string | "easeOut" | `"linear"`, `"easeOut"`, `"easeInOut"`, `"bounce"` |

**Use cases**:
- User counts: `"100M utilisateurs"`
- Money: `"$1.5B"`
- Percentages: `"85%"`

---

### 2. Stacking Objects (`stacking`)

Objects visually piling up.

```json
{
  "type": "stacking",
  "params": {
    "object": "bill",
    "count": 20,
    "direction": "up",
    "showCount": true,
    "color": "#85bb65"
  }
}
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `object` | string | "bill" | `"bill"`, `"coin"`, `"document"`, `"box"`, `"person"`, `"custom"` |
| `customIcon` | string | - | Emoji/icon if object is "custom" |
| `count` | number | **required** | How many objects to stack |
| `direction` | string | "up" | `"up"`, `"down"`, `"left"`, `"right"` |
| `showCount` | boolean | false | Show count label below |
| `color` | string | violet | Color theme |

**Use cases**:
- Debt accumulating: bills stacking up
- Resources depleting: coins disappearing
- Documents piling: bureaucracy visualized

---

### 3. Progress Bar (`progress_bar`)

Horizontal or vertical filling bar.

```json
{
  "type": "progress_bar",
  "params": {
    "startPercent": 0,
    "endPercent": 80,
    "label": "Dette / PIB",
    "showLabel": true,
    "color": "#667eea",
    "orientation": "horizontal"
  }
}
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `startPercent` | number | 0 | Starting percentage (0-100) |
| `endPercent` | number | **required** | Ending percentage (0-100) |
| `orientation` | string | "horizontal" | `"horizontal"`, `"vertical"` |
| `color` | string | violet | Bar fill color (turns red >80%) |
| `backgroundColor` | string | "rgba(255,255,255,0.2)" | Bar background |
| `showLabel` | boolean | true | Show percentage label |
| `label` | string | - | Text label above bar |
| `size` | number | 60 | Bar thickness in px |

**Use cases**:
- Debt to GDP ratio
- Market share
- Completion percentage

---

### 4. Line Chart (`line_chart`)

Animated line graph that draws over time.

```json
{
  "type": "line_chart",
  "params": {
    "data": [10, 25, 15, 40, 35, 60, 55, 80, 95],
    "xLabels": ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"],
    "color": "#667eea",
    "fill": true,
    "showDots": true
  }
}
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `data` | number[] | **required** | Y-values for each point |
| `xLabels` | string[] | - | Labels for X-axis |
| `yLabel` | string | - | Label for Y-axis |
| `color` | string | violet | Line color |
| `showDots` | boolean | true | Show dots on data points |
| `fill` | boolean | false | Fill area under line |
| `animationStyle` | string | "draw" | `"draw"`, `"reveal"`, `"grow"` |

**Use cases**:
- Growth over time
- Price history
- Trend visualization

---

### 5. Bar Chart (`bar_chart`)

Animated bar graph comparing categories.

```json
{
  "type": "bar_chart",
  "params": {
    "data": [
      { "label": "France", "value": 65, "color": "#667eea" },
      { "label": "USA", "value": 120, "color": "#ef4444" },
      { "label": "Chine", "value": 180, "color": "#10b981" }
    ],
    "orientation": "vertical",
    "showValues": true,
    "animationStyle": "sequential"
  }
}
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `data` | array | **required** | Array of `{ label, value, color? }` |
| `orientation` | string | "vertical" | `"vertical"`, `"horizontal"` |
| `showValues` | boolean | true | Show value labels |
| `color` | string | violet | Default bar color |
| `animationStyle` | string | "sequential" | `"sequential"`, `"simultaneous"` |

**Use cases**:
- Country comparisons
- Category rankings
- Before/after comparisons

---

### 6. Icon Grid (`icon_grid`)

Icons appearing in a grid pattern - perfect for "1 in 10" statistics.

```json
{
  "type": "icon_grid",
  "params": {
    "total": 10,
    "highlighted": 3,
    "icon": "person",
    "columns": 5,
    "highlightColor": "#ef4444"
  }
}
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `total` | number | **required** | Total number of icons |
| `highlighted` | number | **required** | Number to highlight |
| `icon` | string | "person" | `"person"`, `"circle"`, `"square"`, `"star"`, `"dollar"`, `"custom"` |
| `customIcon` | string | - | Emoji if icon is "custom" |
| `columns` | number | 5 | Grid columns |
| `color` | string | gray | Default icon color |
| `highlightColor` | string | violet | Highlighted icon color |
| `animationStyle` | string | "sequential" | `"fade"`, `"scale"`, `"sequential"` |

**Use cases**:
- "3 in 10 people..."
- Population statistics
- Survey results

---

### 7. Scale Comparison (`scale_comparison`)

Objects at different scales to show relative size.

```json
{
  "type": "scale_comparison",
  "params": {
    "items": [
      { "label": "2020", "scale": 1 },
      { "label": "2023", "scale": 10, "color": "#667eea" }
    ],
    "object": "circle",
    "showLabels": true,
    "layout": "horizontal"
  }
}
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `items` | array | **required** | Array of `{ label, scale, color? }` |
| `object` | string | "circle" | `"circle"`, `"square"`, `"bar"`, `"custom"` |
| `customIcon` | string | - | Emoji if object is "custom" |
| `showLabels` | boolean | true | Show labels and scale |
| `layout` | string | "horizontal" | `"horizontal"`, `"vertical"` |

**Use cases**:
- "10x growth"
- Size comparisons
- Before/after

---

## Creating New Animation Components

### Step 1: Create the Component

Create `src/compositions/animations/MyAnimation.tsx`:

```tsx
import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import type { BaseAnimationProps } from './types';
import { FONTS, COLORS } from '../../brand';

// Define params interface
export interface MyAnimationParams {
  type: 'my_animation';
  // Add your params here
  value: number;
  label?: string;
}

type Props = Omit<MyAnimationParams, 'type'> & BaseAnimationProps;

export const MyAnimation: React.FC<Props> = ({
  value,
  label,
  durationInFrames,
  delayFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delayFrames);

  // Animation logic using interpolate/spring
  const progress = interpolate(
    adjustedFrame,
    [0, durationInFrames * 0.7],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div style={{ /* your styles */ }}>
      {/* Your animation */}
    </div>
  );
};
```

### Step 2: Add Type Definition

Add to `src/compositions/animations/types.ts`:

```typescript
export interface MyAnimationParams {
  type: 'my_animation';
  value: number;
  label?: string;
}

// Add to AnimationType union
export type AnimationType =
  | 'counter'
  | 'stacking'
  // ... existing types
  | 'my_animation';

// Add to AnimationParams union
export type AnimationParams =
  | CounterParams
  // ... existing params
  | MyAnimationParams;
```

### Step 3: Register in Index

Update `src/compositions/animations/index.ts`:

```typescript
// Add import
import { MyAnimation } from './MyAnimation';

// Add export
export { MyAnimation } from './MyAnimation';

// Add to registry
export const ANIMATION_REGISTRY: Record<AnimationType, React.ComponentType<any>> = {
  // ... existing entries
  my_animation: MyAnimation,
};
```

### Step 4: Document It

Add documentation to this file in the "Available Animations" section.

---

## Animation Design Guidelines

### 1. Timing

- **Complete animation at 70-75%** of scene duration (leave time for hold)
- Use `interpolate` with `extrapolateRight: 'clamp'` to prevent overshoot
- Sequential animations should stagger with delays

### 2. Entrance Animation

Always add an entrance animation:

```tsx
const entranceSpring = spring({
  frame: adjustedFrame,
  fps,
  config: { damping: 20, stiffness: 150 },
});

const scale = interpolate(entranceSpring, [0, 1], [0.9, 1]);
const opacity = interpolate(entranceSpring, [0, 1], [0, 1]);
```

### 3. Colors

Use brand colors from `src/brand.ts`:

```tsx
import { COLORS, FONTS } from '../../brand';

// Primary violet: COLORS.ACCENT_VIOLET (#667eea)
// White text: '#FFFFFF'
// For danger/warning: '#ef4444'
// For success/growth: '#10b981'
```

### 4. Typography

Use Inter font family:

```tsx
fontFamily: FONTS.FAMILY,
fontWeight: 900, // For big numbers
```

### 5. Glow Effects

Add glow for emphasis:

```tsx
textShadow: `
  0 0 20px ${color}66,
  0 0 40px ${COLORS.ACCENT_VIOLET}88,
  0 4px 20px rgba(0, 0, 0, 0.5)
`,
```

### 6. Background

AnimatedScene provides a dark gradient background automatically. Design your animations for dark backgrounds.

---

## Examples from Real Scripts

### Example 1: User Growth Counter

```json
{
  "type": "speech",
  "text": "100 millions d'utilisateurs en deux mois. Record absolu.",
  "scene_type": "animated",
  "animation": {
    "type": "counter",
    "params": {
      "start": 0,
      "end": 100000000,
      "format": "millions",
      "suffix": " utilisateurs",
      "easing": "easeOut"
    }
  }
}
```

### Example 2: Debt Visualization

```json
{
  "type": "speech",
  "text": "La dette s'accumule de jour en jour.",
  "scene_type": "animated",
  "animation": {
    "type": "stacking",
    "params": {
      "object": "bill",
      "count": 30,
      "direction": "up",
      "showCount": true
    }
  }
}
```

### Example 3: Market Share Chart

```json
{
  "type": "speech",
  "text": "La Chine domine le marché.",
  "scene_type": "animated",
  "animation": {
    "type": "bar_chart",
    "params": {
      "data": [
        { "label": "Chine", "value": 180, "color": "#ef4444" },
        { "label": "USA", "value": 120, "color": "#3b82f6" },
        { "label": "Europe", "value": 80, "color": "#667eea" }
      ],
      "orientation": "horizontal",
      "animationStyle": "sequential"
    }
  }
}
```

### Example 4: "1 in 3" Statistic

```json
{
  "type": "speech",
  "text": "Une personne sur trois utilise l'IA quotidiennement.",
  "scene_type": "animated",
  "animation": {
    "type": "icon_grid",
    "params": {
      "total": 9,
      "highlighted": 3,
      "icon": "person",
      "columns": 3,
      "highlightColor": "#667eea"
    }
  }
}
```

---

## Troubleshooting

### Animation not appearing
- Check `scene_type` is `"animated"`
- Verify `animation` object has `type` and `params`
- Check for typos in animation type name

### Animation timing off
- Adjust the `0.7` multiplier in interpolate to end earlier/later
- Add `delayFrames` in params if needed

### Colors not showing
- Ensure hex colors include `#` prefix
- Check opacity values (use `88` suffix for transparency)

### Performance issues
- Reduce `count` for stacking animations
- Simplify SVG paths for charts
- Use fewer grid items

---

## File Structure

```
src/compositions/animations/
├── index.ts              # Registry and exports
├── types.ts              # Type definitions
├── Counter.tsx           # Number counter
├── StackingObjects.tsx   # Piling objects
├── ProgressBar.tsx       # Filling bars
├── LineChart.tsx         # Line graphs
├── BarChart.tsx          # Bar graphs
├── IconGrid.tsx          # Icon grids
├── ScaleComparison.tsx   # Size comparisons
└── [YourAnimation].tsx   # Add new ones here
```
