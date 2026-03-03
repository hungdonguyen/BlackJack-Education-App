'use client';

// ============================================
// ActionPanel — hide buttons until bet placed, circular action buttons
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/hooks/useGameStore';
import { GamePhase, HandStatus } from '@/types/enums';
import { calculateHandValue, canSplit, canDoubleDown, getHandDisplayValue } from '@/utils/hand';
import { Shield, Check, X, Undo2, Spade, Home, Sparkles } from 'lucide-react';
import { getRules } from '@/rules';

export default function ActionPanel({ timer }: { timer?: number }) {
    const gamePhase = useGameStore((s) => s.gamePhase);
    const seats = useGameStore((s) => s.seats);
    const currentSeatIndex = useGameStore((s) => s.currentSeatIndex);
    const bankroll = useGameStore((s) => s.bankroll);
    const betHistory = useGameStore((s) => s.betHistory);
    const hit = useGameStore((s) => s.hit);
    const stand = useGameStore((s) => s.stand);
    const doubleDown = useGameStore((s) => s.doubleDown);
    const split = useGameStore((s) => s.split);
    const startDeal = useGameStore((s) => s.startDeal);
    const resetRound = useGameStore((s) => s.resetRound);
    const undoBet = useGameStore((s) => s.undoBet);
    const clearAllBets = useGameStore((s) => s.clearAllBets);
    const rebet = useGameStore((s) => s.rebet);
    const acceptInsurance = useGameStore((s) => s.acceptInsurance);
    const declineInsurance = useGameStore((s) => s.declineInsurance);

    const isPlayerTurn = gamePhase === GamePhase.PLAYER_TURN;
    const isBetting = gamePhase === GamePhase.BETTING;
    const isPayout = gamePhase === GamePhase.PAYOUT;
    const isDealing = gamePhase === GamePhase.DEALING;
    const isDealerTurn = gamePhase === GamePhase.DEALER_TURN;
    const isInsurance = gamePhase === GamePhase.INSURANCE;

    const currentSeat = seats[currentSeatIndex];
    const currentHand = currentSeat?.hands[currentSeat.currentHandIndex];
    const isPlaying = currentHand?.status === HandStatus.PLAYING;

    const currentRoom = useGameStore((s) => s.currentRoom);
    const rules = getRules(currentRoom);

    let canHit = isPlayerTurn && isPlaying;
    let canStand = isPlayerTurn && isPlaying;

    let canDbl = false;
    if (isPlayerTurn && isPlaying && currentHand) {
        const result = rules.canDoubleDown(currentHand);
        canDbl = result.allowed && bankroll >= result.cost;
    }

    let canSpl = false;
    if (isPlayerTurn && isPlaying && currentHand) {
        const result = rules.canSplit(currentHand, currentSeat?.hands.length || 0);
        canSpl = result.allowed && bankroll >= result.cost;
    }

    const hasBets = seats.some((s) => s.isActive && s.hands.some((h) => h.betAmount > 0));
    const hasUndo = betHistory.length > 0;
    const previousBets = useGameStore((s) => s.previousBets);
    const hasPreviousBets = previousBets && previousBets.length > 0;

    // Calculate total insurance cost for display
    const totalInsuranceCost = isInsurance
        ? seats.filter(s => s.isActive).reduce((total, seat) => {
            const mainBet = seat.hands[0]?.betAmount ?? 0;
            return total + Math.floor(mainBet / 2);
        }, 0)
        : 0;

    return (
        <div className="flex flex-col items-center" style={{ minHeight: '80px', justifyContent: 'center' }}>
            <AnimatePresence mode="wait">
                {/* ── Player Turn: Circular Action Buttons ── */}
                {isPlayerTurn && (
                    <motion.div
                        key="player-turn"
                        className="flex flex-col items-center gap-3"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        <div className="flex items-center gap-3">
                            <CircleButton label="DOUBLE DOWN" icon="2x" color="#f39c12" hoverColor="#f1c40f"
                                onClick={doubleDown} disabled={!canDbl} size={56} />

                            <CircleButton label="HIT" icon="+" color="#2ecc71" hoverColor="#27ae60"
                                onClick={hit} disabled={!canHit} size={66} />
                            <CircleButton label="STAND" icon="−" color="#e74c3c" hoverColor="#c0392b"
                                onClick={stand} disabled={!canStand} size={66} />

                            <CircleButton label="SPLIT" icon="⟺" color="#3498db" hoverColor="#2980b9"
                                onClick={split} disabled={!canSpl} size={56} />
                        </div>

                        {timer !== undefined && (
                            <motion.div
                                className={`flex items-center justify-center rounded-full border-2 bg-black/80 backdrop-blur-md shadow-xl
                                    ${timer <= 5 ? 'border-red-500/80' : timer <= 10 ? 'border-yellow-500/80 text-yellow-500' : 'border-emerald-500/80 text-emerald-400'}`}
                                style={{ width: 46, height: 46 }}
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
                            >
                                <span className={`text-lg font-black tabular-nums ${timer <= 5 ? 'text-red-500 animate-pulse' : ''}`}>{timer}</span>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* ── Insurance Choice ── */}
                {isInsurance && (
                    <motion.div
                        key="insurance"
                        className="flex flex-col items-center gap-3"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        <div className="px-6 py-3 rounded-xl bg-black/60 backdrop-blur-md border border-yellow-400/20 text-center"
                            style={{ boxShadow: '0 0 30px rgba(250, 204, 21, 0.15)' }}
                        >
                            <p className="text-yellow-400 text-sm flex items-center justify-center font-extrabold uppercase tracking-[0.2em] mb-1">
                                <Shield className="w-4 h-4 mr-1.5" /> Insurance?
                            </p>
                            <p className="text-white/40 text-[10px] mb-3">
                                Dealer shows Ace · Pays 2:1 if dealer has Blackjack
                            </p>
                            <p className="text-amber-300 text-xs font-bold mb-3 tabular-nums">
                                Cost: ${totalInsuranceCost} (half your bet)
                            </p>
                            <div className="flex items-center gap-3 justify-center">
                                <motion.button
                                    onClick={acceptInsurance}
                                    className="px-6 py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider cursor-pointer
                                        bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30
                                        hover:shadow-emerald-500/50 transition-all"
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                >
                                    <Check className="w-3.5 h-3.5 mr-1" /> Accept
                                </motion.button>
                                <motion.button
                                    onClick={declineInsurance}
                                    className="px-6 py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider cursor-pointer
                                        bg-white/5 border border-white/15 text-white/60 hover:bg-white/10 hover:text-white/80 transition-all"
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                >
                                    <X className="w-3.5 h-3.5 mr-1" /> No Thanks
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Betting Phase: Betting controls ── */}
                {isBetting && (
                    <motion.div
                        key="betting"
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        {hasBets ? (
                            <>
                                <SmallButton label="UNDO" icon={<Undo2 className="w-3.5 h-3.5" />} onClick={undoBet} disabled={!hasUndo} variant="ghost" />
                                <SmallButton label="CLEAR" icon={<X className="w-3.5 h-3.5" />} onClick={clearAllBets} disabled={!hasBets} variant="danger" />
                                <SmallButton label="x2" icon={<span className="text-sm">2x</span>} onClick={rebet} disabled={false} variant="ghost" />
                                <motion.button
                                    onClick={startDeal}
                                    disabled={!hasBets}
                                    className="px-8 py-3 rounded-full font-extrabold text-sm uppercase tracking-[0.2em] cursor-pointer
                                        bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30
                                        hover:shadow-emerald-500/50 hover:from-emerald-400 hover:to-emerald-500
                                        transition-all duration-300"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <div className="flex items-center justify-center"><Spade className="w-4 h-4 fill-current mr-1.5" /> DEAL</div>
                                </motion.button>
                            </>
                        ) : (
                            <div className="flex items-center" style={{ minHeight: '48px' }}>
                                <SmallButton label="REBET" icon={<Undo2 className="w-3.5 h-3.5" />} onClick={rebet} disabled={!hasPreviousBets} variant="ghost" />
                            </div>
                        )}
                    </motion.div>
                )}

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
                            {isDealing ? <div className="flex items-center"><Spade className="w-4 h-4 fill-current mr-2 animate-pulse" /> Dealing...</div> : <div className="flex items-center"><Home className="w-4 h-4 fill-current mr-2" /> Dealer Playing...</div>}
                        </motion.span>
                    </motion.div>
                )}

                {/* ── Payout ── */}
                {isPayout && (
                    <motion.button
                        key="payout"
                        onClick={resetRound}
                        className="px-8 py-3 rounded-full font-extrabold text-sm uppercase tracking-[0.2em] cursor-pointer
                            bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30
                            hover:shadow-amber-500/50 hover:from-amber-400 hover:to-amber-500
                            transition-all duration-300"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        🔄 NEW ROUND
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── CircleButton ──
interface CircleButtonProps {
    label: string; icon: React.ReactNode; color: string; hoverColor: string;
    onClick: () => void; disabled: boolean; size: number;
}

function CircleButton({ label, icon, color, hoverColor, onClick, disabled, size }: CircleButtonProps) {
    return (
        <motion.button
            onClick={onClick} disabled={disabled}
            className="flex flex-col items-center gap-1.5 cursor-pointer"
            style={{ opacity: disabled ? 0.2 : 1 }}
            whileHover={disabled ? {} : { scale: 1.12, y: -4 }}
            whileTap={disabled ? {} : { scale: 0.9 }}
        >
            <motion.div
                className="rounded-full flex items-center justify-center shadow-xl transition-shadow duration-300"
                style={{
                    width: size, height: size,
                    background: disabled ? 'rgba(100,100,100,0.3)' : `radial-gradient(circle at 35% 35%, ${hoverColor}, ${color})`,
                    boxShadow: disabled ? 'none' : `0 4px 20px ${color}66, 0 0 40px ${color}22, inset 0 1px 0 rgba(255,255,255,0.3)`,
                    border: `2px solid ${disabled ? 'rgba(100,100,100,0.2)' : color}`,
                }}
            >
                <span className="text-white font-black drop-shadow-md" style={{ fontSize: size * 0.35 }}>{icon}</span>
            </motion.div>
            <span className="text-[8px] font-bold text-white/50 uppercase tracking-wider whitespace-nowrap">{label}</span>
        </motion.button>
    );
}

// ── SmallButton ──
function SmallButton({ label, icon, onClick, disabled, variant }: {
    label: string; icon: React.ReactNode; onClick: () => void; disabled: boolean; variant: 'ghost' | 'danger';
}) {
    const styles = variant === 'danger'
        ? 'border-red-500/30 text-red-400/70 hover:bg-red-500/10 hover:text-red-400'
        : 'border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60';

    return (
        <motion.button
            onClick={onClick} disabled={disabled}
            className={`px-4 py-2 rounded-full border text-[11px] font-bold uppercase tracking-wider
                transition-all duration-200 cursor-pointer
                ${disabled ? 'opacity-20 cursor-not-allowed' : styles}`}
            whileHover={disabled ? {} : { scale: 1.05 }}
            whileTap={disabled ? {} : { scale: 0.95 }}
        >
            <span className="mr-1 flex items-center justify-center">{icon}</span>{label}
        </motion.button>
    );
}

// ── SquareFreeButton ──
function SquareFreeButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
    return (
        <motion.button
            onClick={onClick} disabled={disabled}
            className={`flex items-center justify-center w-24 h-24 rounded-2xl cursor-pointer border-4 
                ${disabled ? 'bg-zinc-800/80 border-zinc-700 text-white/30' : 'bg-yellow-400 border-yellow-300 text-black shadow-[0_0_30px_rgba(250,204,21,0.5)]'}`}
            style={{ opacity: disabled ? 0.5 : 1 }}
            whileHover={disabled ? {} : { scale: 1.05, y: -4 }}
            whileTap={disabled ? {} : { scale: 0.95 }}
        >
            <span className="font-black text-center leading-tight uppercase tracking-wider text-sm drop-shadow-sm px-2">
                {label.split(' ').map((word, i) => <span key={i} className="block">{word}</span>)}
            </span>
        </motion.button>
    );
}
