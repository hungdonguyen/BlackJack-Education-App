'use client';

// ============================================
// ActionPanel — Refactored to act as a switchboard
// ============================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Spade, Home } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { GamePhase } from '@/types/enums';

// Subcomponents
import { PlayControls } from './action-panel/PlayControls';
import { InsuranceControls } from './action-panel/InsuranceControls';
import { BettingControls } from './action-panel/BettingControls';
import { PayoutControls } from './action-panel/PayoutControls';

const ActionPanel = React.memo(function ActionPanel({ currentInsuranceSeat }: { currentInsuranceSeat?: number }) {
    const gamePhase = useGameStore((s) => s.gamePhase);

    const isPlayerTurn = gamePhase === GamePhase.PLAYER_TURN;
    const isBetting = gamePhase === GamePhase.BETTING;
    const isPayout = gamePhase === GamePhase.PAYOUT;
    const isDealing = gamePhase === GamePhase.DEALING;
    const isDealerTurn = gamePhase === GamePhase.DEALER_TURN;
    const isInsurance = gamePhase === GamePhase.INSURANCE;

    return (
        <div className="flex flex-col items-center" style={{ minHeight: '80px', justifyContent: 'center' }}>
            <AnimatePresence mode="wait">
                {/* ── Player Turn: Circular Action Buttons ── */}
                {isPlayerTurn && <PlayControls />}

                {/* ── Insurance Choice ── */}
                {isInsurance && <InsuranceControls currentInsuranceSeat={currentInsuranceSeat} />}

                {/* ── Betting Phase: Betting controls ── */}
                {isBetting && <BettingControls />}

                {/* ── Dealing / Dealer Turn ── */}
                {(isDealing || isDealerTurn) && (
                    <motion.div
                        key="waiting"
                        className="px-6 py-3 rounded-full bg-black/50 backdrop-blur-sm border border-white/10"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        <motion.span
                            className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400/80"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            {isDealing 
                                ? <div className="flex items-center"><Spade className="w-4 h-4 fill-current mr-2 animate-pulse" /> Dealing...</div> 
                                : <div className="flex items-center"><Home className="w-4 h-4 fill-current mr-2" /> Dealer Playing...</div>
                            }
                        </motion.span>
                    </motion.div>
                )}

                {/* ── Payout ── */}
                {isPayout && <PayoutControls />}
            </AnimatePresence>
        </div>
    );
});

export default ActionPanel;
