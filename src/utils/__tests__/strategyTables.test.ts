import { describe, it, expect } from 'vitest';
import { ACTION_META, AdviceAction } from '../strategyTables';

describe('Strategy Tables', () => {
    describe('ACTION_META reasoning', () => {
        it('should return valid reasoning strings for H', () => {
            expect(ACTION_META['H'].reasoning(13, true, '6')).toContain('Soft 13');
            expect(ACTION_META['H'].reasoning(14, false, 'A')).toContain('Dealer shows a strong');
            expect(ACTION_META['H'].reasoning(14, false, '6')).toContain('too weak');
        });

        it('should return valid reasoning strings for S', () => {
            expect(ACTION_META['S'].reasoning(18, true, '6')).toContain('18 soft');
            expect(ACTION_META['S'].reasoning(15, false, '6')).toContain('Dealer shows a weak');
            expect(ACTION_META['S'].reasoning(15, false, '10')).toContain('statistically better');
        });

        it('should return valid reasoning strings for D', () => {
            expect(ACTION_META['D'].reasoning(11, false, '6')).toContain('mathematically powerful hand');
            expect(ACTION_META['D'].reasoning(9, false, '6')).toContain('Dealer shows a weak');
        });

        it('should return valid reasoning strings for SP', () => {
            expect(ACTION_META['SP'].reasoning(22, false, '6')).toContain('Pair of Aces');
            expect(ACTION_META['SP'].reasoning(16, false, '6')).toContain('Pair of 8s');
            expect(ACTION_META['SP'].reasoning(12, false, '6')).toContain('Splitting capitalizes');
        });

        it('should return valid reasoning strings for SU', () => {
            expect(ACTION_META['SU'].reasoning(16, false, '10')).toContain('terrible odds');
        });

        it('should return valid reasoning strings for RS', () => {
            expect(ACTION_META['RS'].reasoning(16, false, '10')).toContain('highly unfavorable');
        });

        it('should return valid reasoning strings for FD', () => {
            expect(ACTION_META['FD'].reasoning(11, false, '6')).toContain('Free Action Double');
        });

        it('should return valid reasoning strings for B', () => {
            expect(ACTION_META['B'].reasoning(16, false, '10')).toContain('chance to improve');
        });

        it('should execute remaining reasoning functions unconditionally', () => {
            // These reasoning functions ignore their parameters and return a static explanation
            const keys: AdviceAction[] = ['DS', 'FSP', 'Z', 'S4', 'S5', 'S6', 'PS', 'D3', 'D4', 'D5', 'D6', 'R', 'RH', 'INS', 'NINS'];
            keys.forEach(key => {
                expect(ACTION_META[key].reasoning(0, false, '0')).toBeTypeOf('string');
                expect(ACTION_META[key].reasoning(0, false, '0').length).toBeGreaterThan(0);
            });
        });
    });
});
