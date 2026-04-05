import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, X } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { useAudio } from '@/utils/audio';
import { InsuranceTimer } from '../ActionTimers';
import { SmallButton } from './ActionButtons';

export function InsuranceControls({ currentInsuranceSeat }: { currentInsuranceSeat?: number }) {
    const { playSound } = useAudio();
    const bankroll = useGameStore((s) => s.bankroll);
    const tutorialBalance = useGameStore((s) => s.tutorialBalance);
    const currentRoom = useGameStore((s) => s.currentRoom);
    const seats = useGameStore((s) => s.seats);
    const currentSeatIndex = useGameStore((s) => s.currentSeatIndex);
    const acceptInsurance = useGameStore((s) => s.acceptInsurance);
    const declineInsurance = useGameStore((s) => s.declineInsurance);
    const hoveredAction = useGameStore((s) => s.hoveredAction);

    const isTutorial = currentRoom?.startsWith('tutorial_');
    const currentBalance = (isTutorial ? tutorialBalance : bankroll) ?? 0;
    const currentSeat = seats[currentSeatIndex];

    const totalInsuranceCost = currentSeat ? (currentSeat.hands[0]?.betAmount ?? 0) / 2 : 0;
    const canInsurance = currentBalance >= totalInsuranceCost;

    return (
        <motion.div
            key="insurance"
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
            <InsuranceTimer />
            <div className="px-6 py-3 rounded-xl bg-black/60 backdrop-blur-md border border-yellow-400/20 text-center"
                style={{ boxShadow: '0 0 30px rgba(250, 204, 21, 0.15)' }}
            >
                <p className="text-yellow-400 text-sm flex items-center justify-center font-extrabold uppercase tracking-[0.2em] mb-1">
                    <Shield className="w-4 h-4 mr-1.5" /> Insurance?
                </p>
                {currentInsuranceSeat && (
                    <p className="text-amber-300/80 text-[11px] font-bold uppercase tracking-wider mb-1">
                        🎯 Seat {currentInsuranceSeat}
                    </p>
                )}
                <p className="text-white/40 text-[10px] mb-3">
                    Dealer shows Ace · Pays 2:1 if dealer has Blackjack
                </p>
                <p className="text-amber-300 text-xs font-bold mb-3 tabular-nums">
                    Cost: ${totalInsuranceCost} (half your bet)
                </p>
                <div className="flex items-center gap-3 justify-center">
                    <SmallButton 
                        id="insurance-accept" 
                        label="Accept" 
                        icon={<Check className="w-3.5 h-3.5" />} 
                        onClick={() => { playSound('click'); acceptInsurance(); }} 
                        disabled={!canInsurance} 
                        variant="confirm" 
                        isFocused={hoveredAction === 'insurance-accept'} 
                    />
                    <SmallButton 
                        id="insurance-decline" 
                        label="No Thanks" 
                        icon={<X className="w-3.5 h-3.5" />} 
                        onClick={() => { playSound('click'); declineInsurance(); }} 
                        disabled={false} 
                        variant="ghost" 
                        isFocused={hoveredAction === 'insurance-decline'} 
                    />
                </div>
            </div>
        </motion.div>
    );
}
