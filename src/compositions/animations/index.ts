/**
 * Animation Components Registry
 *
 * This file exports all available animation components and provides
 * a registry for dynamic component lookup.
 *
 * To add a new animation:
 * 1. Create the component in this folder
 * 2. Add its type to types.ts
 * 3. Export it here
 * 4. Register it in ANIMATION_REGISTRY
 * 5. Document it in docs/ANIMATION_COMPONENTS.md
 */

import React from 'react';
import type { AnimationType, AnimationParams, BaseAnimationProps } from './types';

// Export types
export * from './types';

// Export components
export { Counter } from './Counter';
export { StackingObjects } from './StackingObjects';
export { ProgressBar } from './ProgressBar';
export { LineChart } from './LineChart';
export { BarChart } from './BarChart';
export { IconGrid } from './IconGrid';
export { ScaleComparison } from './ScaleComparison';

// Import components for registry
import { Counter } from './Counter';
import { StackingObjects } from './StackingObjects';
import { ProgressBar } from './ProgressBar';
import { LineChart } from './LineChart';
import { BarChart } from './BarChart';
import { IconGrid } from './IconGrid';
import { ScaleComparison } from './ScaleComparison';

/**
 * Animation Component Registry
 *
 * Maps animation type strings to their React components.
 * Components receive params + BaseAnimationProps.
 */
export const ANIMATION_REGISTRY: Record<
  AnimationType,
  React.ComponentType<any>
> = {
  counter: Counter,
  stacking: StackingObjects,
  progress_bar: ProgressBar,
  line_chart: LineChart,
  bar_chart: BarChart,
  icon_grid: IconGrid,
  scale_comparison: ScaleComparison,
  // Placeholders for future animations
  pie_chart: Counter, // TODO: Implement PieChart
  flow_diagram: Counter, // TODO: Implement FlowDiagram
};

/**
 * Get animation component by type
 */
export function getAnimationComponent(type: AnimationType): React.ComponentType<any> | null {
  return ANIMATION_REGISTRY[type] || null;
}

/**
 * Check if animation type is registered
 */
export function isValidAnimationType(type: string): type is AnimationType {
  return type in ANIMATION_REGISTRY;
}

/**
 * List all available animation types
 */
export function getAvailableAnimationTypes(): AnimationType[] {
  return Object.keys(ANIMATION_REGISTRY) as AnimationType[];
}
