/**
 * WB Guides - Public API
 * 
 * Exports for alignment guides and snapping system
 */

export { GuideCalculator, guideCalculator } from './guide-calculator';
export { SnapEngine, snapEngine } from './snap-engine';
export type { Guide, SnapPoint, GuidesConfig, SnapResult, AlignmentType } from '../../types/guides';
export { GuideError, DEFAULT_GUIDES_CONFIG } from '../../types/guides';
