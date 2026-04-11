'use client';

// ============================================
// DealerArea — with card stacks left/right
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/hooks/useGameStore';
import { GamePhase, HandStatus } from '@/types/enums';
import { getHandDisplayValue } from '@/utils/hand';
import { getCardBackImage } from '@/utils/cardImages';
import { getRoomConfig } from '@/utils/rooms';

import { Shuffle } from 'lucide-react';
import CardComponent from './CardComponent';
import ScoreBadge from './ScoreBadge';

// ─── Shoe Indicator ───────────────────────────────────────────────────────────

function ShoeIndicator() {
    const shoe = useGameStore((s) => s.shoe);
    const currentRoom = useGameStore((s) => s.currentRoom);
    const gamePhase = useGameStore((s) => s.gamePhase);
    const initializeShoe = useGameStore((s) => s.initializeShoe);
    const activeDeck = useGameStore((s) => s.activeDeck) || 'default';
    const cardBackPath = getCardBackImage(activeDeck);
    const roomCfg = getRoomConfig(currentRoom);
    const isBetting = gamePhase === GamePhase.BETTING;
    const numDecks = roomCfg.gameRules.numberOfDecks;
    const totalCards = numDecks * 52;
    const remaining = shoe.length;
    const pct = totalCards > 0 ? remaining / totalCards : 1;
    const reshufflePct = roomCfg.gameRules.reshuffleThreshold ?? 0.25;
    const warningPct = reshufflePct + 0.15;
    const reshuffleAt = Math.floor(totalCards * reshufflePct);

    const isUrgent = pct <= reshufflePct;
    const isWarning = !isUrgent && pct <= warningPct;

    const barColor = isUrgent
        ? '#ef4444'
        : isWarning
            ? '#f59e0b'
            : '#22c55e';

    const glowColor = isUrgent
        ? 'rgba(239,68,68,0.35)'
        : isWarning
            ? 'rgba(245,158,11,0.25)'
            : 'rgba(34,197,94,0.18)';

    // Stacked card backs: realistically we want more layers to show a thick deck
    // 1 layer per 30 cards, max 12 layers to avoid getting too high.
    const layers = Math.min(12, Math.max(1, Math.ceil(remaining / 30)));
    const maxLayers = Math.min(12, Math.max(1, Math.ceil(totalCards / 30)));
    
    // Card size to match "md" CardComponent exactly
    const CARD_WIDTH = 92;
    const CARD_HEIGHT = 133;
    const Y_OFFSET_PER_LAYER = 1; // Slight vertical stacking
    const X_OFFSET_PER_LAYER = 0; // Straight stack, no diagonal skew

    return (
        <motion.div
            className="flex flex-col items-center gap-1.5"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
        >
            {/* Card stack images */}
            <div 
                className="relative mt-2" 
                style={{ 
                    width: CARD_WIDTH, 
                    height: CARD_HEIGHT + maxLayers * Y_OFFSET_PER_LAYER 
                }}
            >
                {Array.from({ length: layers }).map((_, i) => {
                    return (
                        <div
                            key={i}
                            className="absolute rounded-lg"
                            style={{
                                width: CARD_WIDTH,
                                height: CARD_HEIGHT,
                                bottom: i * Y_OFFSET_PER_LAYER,
                                left: 0,
                                zIndex: i,
                                boxShadow: i === layers - 1
                                    ? `0 0 10px ${glowColor}, -1px 2px 4px rgba(0,0,0,0.5)`
                                    : '-1px 1px 2px rgba(0,0,0,0.6)',
                            }}
                        >
                            <img 
                                src={cardBackPath} 
                                alt="Deck layer" 
                                className="w-full h-full object-contain rounded-lg" 
                            />
                            {/* Card back tint on top layer to warn about reshuffle */}
                            {i === layers - 1 && isUrgent && (
                                <div className="absolute inset-0 rounded-lg bg-red-500/20 mix-blend-overlay pointer-events-none" />
                            )}
                            {i === layers - 1 && isWarning && (
                                <div className="absolute inset-0 rounded-lg bg-amber-500/20 mix-blend-overlay pointer-events-none" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Remaining count */}
            <div className="flex flex-col items-center gap-0.5 mt-1">
                <span
                    className="text-[14px] font-black tabular-nums leading-none"
                    style={{ color: barColor, textShadow: `0 0 8px ${glowColor}` }}
                >
                    {remaining}
                </span>
                <span className="text-[7px] text-white/25 font-bold uppercase tracking-[0.15em]">
                    cards left
                </span>
            </div>

            {/* Progress bar */}
            <div className="w-9 h-1 rounded-full overflow-hidden bg-white/5">
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: barColor, boxShadow: `0 0 4px ${glowColor}` }}
                    initial={false}
                    animate={{ width: `${pct * 100}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                />
            </div>

            {/* Reshuffle threshold line label */}
            <span
                className="text-[6.5px] font-bold uppercase tracking-[0.1em] text-center leading-tight"
                style={{ color: isUrgent ? '#ef4444' : 'rgba(255,255,255,0.18)' }}
            >
                {isUrgent ? '⚠ shuffle soon' : `shuffle at ${reshuffleAt}`}
            </span>

            {/* Force reshuffle button — only during betting */}
            <AnimatePresence>
                {isBetting && (
                    <motion.button
                        key="reshuffle-btn"
                        onClick={initializeShoe}
                        title="Force reshuffle shoe"
                        className="flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer
                            border transition-all duration-200"
                        style={{
                            background: isUrgent
                                ? 'rgba(239,68,68,0.15)'
                                : 'rgba(255,255,255,0.05)',
                            borderColor: isUrgent
                                ? 'rgba(239,68,68,0.45)'
                                : 'rgba(255,255,255,0.12)',
                        }}
                        initial={{ opacity: 0, scale: 0.8, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 4 }}
                        whileHover={{
                            scale: 1.08,
                            backgroundColor: isUrgent ? 'rgba(239,68,68,0.28)' : 'rgba(255,255,255,0.10)'
                        }}
                        whileTap={{ scale: 0.92 }}
                    >
                        <Shuffle
                            style={{
                                width: 9, height: 9,
                                color: isUrgent ? '#ef4444' : 'rgba(255,255,255,0.4)'
                            }}
                        />
                        <span
                            className="text-[7px] font-bold uppercase tracking-wide"
                            style={{ color: isUrgent ? '#ef4444' : 'rgba(255,255,255,0.35)' }}
                        >
                            Shuffle
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── DealerArea ───────────────────────────────────────────────────────────────

export default function DealerArea() {
    const dealerHand = useGameStore((s) => s.dealerHand);
    const gamePhase = useGameStore((s) => s.gamePhase);
    const currentRoom = useGameStore((s) => s.currentRoom);
    const isTutorial = getRoomConfig(currentRoom).isTutorial;

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
            className="flex items-start justify-center w-full"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
            {/* Left spacer — mirrors ShoeIndicator width so dealer hand stays centered */}
            <div style={{ width: 108 }} />

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
                        minHeight: '160px',
                        minWidth: hasCards ? `${116 + (dealerHand.cards.length - 1) * 40}px` : '116px',
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
                        <div className="w-[116px] h-[160px] rounded-lg border border-dashed border-white/[0.08] flex items-center justify-center"
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

            {/* Shoe indicator — right of dealer hand, flex sibling */}
            {!isTutorial && (
                <div className="flex items-start pt-0 pl-8">
                    <ShoeIndicator />
                </div>
            )}

        </motion.div>
    );
}
