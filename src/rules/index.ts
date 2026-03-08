import { IRules } from './types';
import { ClassicRules } from './ClassicRules';
import { VegasStripRules } from './VegasStripRules';
import { VegasDowntownRules } from './VegasDowntownRules';
import { AtlanticCityRules } from './AtlanticCityRules';
import { FreeActionRules } from './FreeActionRules';
import { Iberian21Rules } from './Iberian21Rules';

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
