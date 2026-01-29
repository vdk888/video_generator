/**
 * Animation Types - Shared type definitions for all animation components
 */

export type AnimationType =
  | 'counter'
  | 'stacking'
  | 'progress_bar'
  | 'line_chart'
  | 'bar_chart'
  | 'icon_grid'
  | 'scale_comparison'
  | 'pie_chart'
  | 'flow_diagram';

/**
 * Base props all animations receive
 */
export interface BaseAnimationProps {
  /** Duration in frames */
  durationInFrames: number;
  /** Optional delay before animation starts (frames) */
  delayFrames?: number;
}

/**
 * Counter Animation - Numbers counting up/down
 * Example: "100 millions d'utilisateurs"
 */
export interface CounterParams {
  type: 'counter';
  start: number;
  end: number;
  /** Display format */
  format?: 'number' | 'millions' | 'milliards' | 'percent' | 'currency' | 'compact';
  /** Prefix text (e.g., "$", "€") */
  prefix?: string;
  /** Suffix text (e.g., " users", "%") */
  suffix?: string;
  /** Locale for number formatting */
  locale?: string;
  /** Color of the number */
  color?: string;
  /** Font size in px */
  fontSize?: number;
  /** Easing: 'linear' | 'easeOut' | 'easeInOut' | 'bounce' */
  easing?: 'linear' | 'easeOut' | 'easeInOut' | 'bounce';
}

/**
 * Stacking Animation - Objects piling up
 * Example: Bills stacking, coins piling
 */
export interface StackingParams {
  type: 'stacking';
  /** What to stack */
  object: 'bill' | 'coin' | 'document' | 'box' | 'person' | 'custom';
  /** Custom emoji or icon if object is 'custom' */
  customIcon?: string;
  /** How many objects to stack */
  count: number;
  /** Stack direction */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Color theme */
  color?: string;
  /** Show count label */
  showCount?: boolean;
}

/**
 * Progress Bar Animation - Horizontal/vertical filling bar
 * Example: "La dette atteint 80% du PIB"
 */
export interface ProgressBarParams {
  type: 'progress_bar';
  /** Start percentage (0-100) */
  startPercent: number;
  /** End percentage (0-100) */
  endPercent: number;
  /** Bar orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Bar color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Show percentage label */
  showLabel?: boolean;
  /** Label text (overrides percentage) */
  label?: string;
  /** Bar height/width in px */
  size?: number;
}

/**
 * Line Chart Animation - Animated line graph
 * Example: "La croissance au fil du temps"
 */
export interface LineChartParams {
  type: 'line_chart';
  /** Data points as [x, y] or just y values */
  data: number[] | [number, number][];
  /** X-axis labels */
  xLabels?: string[];
  /** Y-axis label */
  yLabel?: string;
  /** Line color */
  color?: string;
  /** Show dots on data points */
  showDots?: boolean;
  /** Fill area under line */
  fill?: boolean;
  /** Animate drawing or reveal */
  animationStyle?: 'draw' | 'reveal' | 'grow';
}

/**
 * Bar Chart Animation - Animated bar graph
 * Example: Comparing values across categories
 */
export interface BarChartParams {
  type: 'bar_chart';
  /** Data as { label, value, color? }[] */
  data: { label: string; value: number; color?: string }[];
  /** Bar orientation */
  orientation?: 'vertical' | 'horizontal';
  /** Show value labels */
  showValues?: boolean;
  /** Default bar color */
  color?: string;
  /** Animate bars sequentially or together */
  animationStyle?: 'sequential' | 'simultaneous';
}

/**
 * Icon Grid Animation - Icons appearing in grid
 * Example: "1 personne sur 10" - show 10 person icons, highlight 1
 */
export interface IconGridParams {
  type: 'icon_grid';
  /** Total number of icons */
  total: number;
  /** Number of highlighted icons */
  highlighted: number;
  /** Icon type */
  icon: 'person' | 'circle' | 'square' | 'star' | 'dollar' | 'custom';
  /** Custom emoji/icon if icon is 'custom' */
  customIcon?: string;
  /** Grid columns */
  columns?: number;
  /** Default color */
  color?: string;
  /** Highlighted color */
  highlightColor?: string;
  /** Animation style */
  animationStyle?: 'fade' | 'scale' | 'sequential';
}

/**
 * Scale Comparison Animation - Objects growing/shrinking
 * Example: "10x plus grand"
 */
export interface ScaleComparisonParams {
  type: 'scale_comparison';
  /** Objects to compare: { label, scale, color? }[] */
  items: { label: string; scale: number; color?: string }[];
  /** What object to scale */
  object?: 'circle' | 'square' | 'bar' | 'custom';
  /** Custom icon */
  customIcon?: string;
  /** Show labels */
  showLabels?: boolean;
  /** Layout */
  layout?: 'horizontal' | 'vertical';
}

/**
 * Pie Chart Animation
 */
export interface PieChartParams {
  type: 'pie_chart';
  /** Data as { label, value, color }[] */
  data: { label: string; value: number; color?: string }[];
  /** Show labels */
  showLabels?: boolean;
  /** Inner radius for donut chart (0 = full pie) */
  innerRadius?: number;
  /** Animation style */
  animationStyle?: 'spin' | 'expand' | 'sequential';
}

/**
 * Flow Diagram Animation - Arrows showing flow
 * Example: Money flowing from A to B
 */
export interface FlowDiagramParams {
  type: 'flow_diagram';
  /** Nodes */
  nodes: { id: string; label: string; icon?: string; color?: string }[];
  /** Connections between nodes */
  flows: { from: string; to: string; label?: string; value?: number }[];
  /** Layout */
  layout?: 'horizontal' | 'vertical' | 'circular';
  /** Animate flow lines */
  animateFlow?: boolean;
}

/**
 * Union type of all animation params
 */
export type AnimationParams =
  | CounterParams
  | StackingParams
  | ProgressBarParams
  | LineChartParams
  | BarChartParams
  | IconGridParams
  | ScaleComparisonParams
  | PieChartParams
  | FlowDiagramParams;

/**
 * Animation config as stored in script.json
 */
export interface AnimationConfig {
  type: AnimationType;
  params: Omit<AnimationParams, 'type'>;
}
