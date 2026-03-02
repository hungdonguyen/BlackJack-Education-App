import { IRules } from './types';
import { ClassicRules } from './ClassicRules';
import { FreeBetRules } from './FreeBetRules';

export function getRules(roomId: string): IRules {
    switch (roomId) {
        case 'freebet':
            return new FreeBetRules();
        case 'classic':
        default:
            return new ClassicRules();
    }
}

export * from './types';
export * from './ClassicRules';
export * from './FreeBetRules';
