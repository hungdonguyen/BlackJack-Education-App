import { IRules } from './types';
import { ClassicRules } from './ClassicRules';
import { VegasStripRules } from './VegasStripRules';
import { VegasDowntownRules } from './VegasDowntownRules';
import { AtlanticCityRules } from './AtlanticCityRules';
import { FreeActionRules } from './FreeActionRules';
import { Iberian21Rules } from './Iberian21Rules';
import { EuropeanRules } from './EuropeanRules';
import { UKRules } from './UKRules';
import { ZapOut21Rules } from './ZapOut21Rules';
import { Exchange21Rules } from './Exchange21Rules';
import { FireCardRules } from './FireCardRules';

import { getRoomConfig } from '@/utils/rooms';

export function getRules(roomId: string): IRules {
    const config = getRoomConfig(roomId);
    return new config.rulesClass();
}

export * from './types';
export * from './ClassicRules';
export * from './VegasStripRules';
export * from './VegasDowntownRules';
export * from './AtlanticCityRules';
export * from './FreeActionRules';
export * from './Iberian21Rules';
export * from './Iberian21Rules';
export * from './EuropeanRules';
export * from './UKRules';
export * from './ZapOut21Rules';
export * from './Exchange21Rules';
export * from './FireCardRules';
export * from './Madness21Rules';
