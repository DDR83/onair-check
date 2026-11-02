import * as safeAreas from './safe-areas.js';
import * as legalLevels from './legal-levels.js';
import * as interlaceFlicker from './interlace-flicker.js';
import * as textSize from './text-size.js';
import * as textContrast from './text-contrast.js';
import * as network from './network.js';
import * as transparency from './transparency.js';

/** Every check module exports { id, title, scope: 'frame' | 'page', run(ctx) }. */
export const CHECKS = [safeAreas, legalLevels, interlaceFlicker, textSize, textContrast, network, transparency];

export const STATUS_ORDER = ['skip', 'pass', 'warn', 'fail'];

export function worst(statuses) {
  return statuses.reduce((a, b) => (STATUS_ORDER.indexOf(b) > STATUS_ORDER.indexOf(a) ? b : a), 'skip');
}
