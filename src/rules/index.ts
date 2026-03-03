import { IRules } from './types';
import { ClassicRules } from './ClassicRules';
import { VegasStripRules } from './VegasStripRules';

export function getRules(roomId: string): IRules {
    switch (roomId) {
        case 'vegas_strip':
            return new VegasStripRules();
        case 'classic':
        default:
            return new ClassicRules();
    }
}

export * from './types';
export * from './ClassicRules';
export * from './VegasStripRules';
