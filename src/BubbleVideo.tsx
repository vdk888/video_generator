/**
 * Main Remotion composition for Bubble Video Engine
 * Orchestrates the full video rendering pipeline
 */

import React from 'react';
import { BubbleVideoComposition } from './compositions/BubbleVideoComposition';
import type { BubbleVideoInputProps } from './types';

export const BubbleVideo: React.FC<BubbleVideoInputProps> = (props) => {
  return <BubbleVideoComposition {...props} />;
};
