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

export function getRules(roomId: string): IRules {
    switch (roomId) {
        case 'vegas_strip':
            return new VegasStripRules();
        case 'vegas_downtown':
            return new VegasDowntownRules();
        case 'atlantic_city':
            return new AtlanticCityRules();
        case 'free_action':
            return new FreeActionRules();
        case 'iberian_21':
            return new Iberian21Rules();
        case 'european':
            return new EuropeanRules();
        case 'uk':
            return new UKRules();
        case 'zapout_21':
            return new ZapOut21Rules();
        case 'exchange_21':
            return new Exchange21Rules();
        case 'firecard_21':
            return new FireCardRules();
        case 'classic':
        default:
            return new ClassicRules();
    }
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
