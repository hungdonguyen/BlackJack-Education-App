'use client';

// ============================================
// DealerArea — with card stacks left/right
// ============================================

import { motion } from 'framer-motion';
import { useGameStore } from '@/hooks/useGameStore';
import { GamePhase, HandStatus } from '@/types/enums';
import { getHandDisplayValue } from '@/utils/hand';
import { Spade } from 'lucide-react';
import CardComponent from './CardComponent';
import ScoreBadge from './ScoreBadge';

export default function DealerArea() {
    const dealerHand = useGameStore((s) => s.dealerHand);
    const gamePhase = useGameStore((s) => s.gamePhase);

    const hasCards = dealerHand.cards.length > 0;
    const showAllValues = gamePhase === GamePhase.DEALER_TURN || gamePhase === GamePhase.PAYOUT;

    const visibleCards = dealerHand.cards.filter(c => !c.isHidden);
    const totalValue = showAllValues
        ? getHandDisplayValue(dealerHand.cards)
        : visibleCards.length > 0
            ? getHandDisplayValue(visibleCards)
            : '';

    return (
        <motion.div
            className="flex items-start justify-center w-full gap-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >

            {/* Dealer center */}
            <div className="flex flex-col items-center gap-2">
                {/* Dealer label + score */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">
                        Dealer Hand
                    </span>
                    {hasCards && (
                        <ScoreBadge
                            value={totalValue}
                            delay={hasCards ? (dealerHand.cards.length - 1) * 0.18 + 0.4 : 0}
                            status={
                                showAllValues
                                    ? getHandDisplayValue(dealerHand.cards) === 'BUST'
                                        ? HandStatus.BUST
                                        : HandStatus.STAND
                                    : HandStatus.PLAYING
                            }
                        />
                    )}
                </div>

                {/* Dealer Cards */}
                <div
                    className="relative flex items-end justify-center"
                    style={{
                        minHeight: '123px',
                        minWidth: hasCards ? `${86 + (dealerHand.cards.length - 1) * 30}px` : '88px',
                    }}
                >
                    {dealerHand.cards.map((card, idx) => (
                        <CardComponent
                            key={`dealer-${idx}`}
                            card={card}
                            index={idx}
                            totalCards={dealerHand.cards.length}
                            animate={true}
                            size="md"
                        />
                    ))}

                    {/* Empty placeholder */}
                    {!hasCards && (
                        <div className="w-[86px] h-[123px] rounded-lg border border-dashed border-white/[0.08] flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.02)' }}
                        >
                            <span className="text-white/[0.08] text-2xl">🂠</span>
                        </div>
                    )}
                </div>

                {/* Card value breakdown */}
                {hasCards && showAllValues && (
                    <motion.div
                        className="flex items-center gap-1 text-[10px] text-white/30 font-mono"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    >
                        {dealerHand.cards.map((card, idx) => (
                            <span key={idx}>
                                {idx > 0 && <span className="mx-0.5 text-white/15">+</span>}
                                <span className="text-white/50">{card.value > 10 ? 10 : card.value}</span>
                            </span>
                        ))}
                        <span className="mx-1 text-amber-400/50">→</span>
                        <span className="text-amber-400 font-bold">{totalValue}</span>
                    </motion.div>
                )}
            </div>

        </motion.div>
    );
}
