'use client';

// ============================================
// Table — Full-featured Evolution Gaming style
// ============================================

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, useStoreHydration } from '@/hooks/useGameStore';
import { GamePhase, HandStatus } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';
import { calculateHandValue, canSplit, canDoubleDown } from '@/utils/hand';
import { getRules } from '@/rules';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Coins, Spade, Shield, Home, Timer, Sparkles, Gift, Info, X, ClipboardList, User } from 'lucide-react';
import DealerArea from './DealerArea';
import Seat from './Seat';
import ChipRack from './ChipRack';
import ActionPanel from './ActionPanel';
import DevTools from './DevTools';
import PortraitOverlay from './PortraitOverlay';
import PayoutPanel from './PayoutPanel';

const TURN_TIMER_SECONDS = 30;

export default function Table({ roomId = 'classic' }: { roomId?: string }) {
    const room = getRoomConfig(roomId);
    const router = useRouter();

    const initializeShoe = useGameStore((s) => s.initializeShoe);
    const shoe = useGameStore((s) => s.shoe);
    const gamePhase = useGameStore((s) => s.gamePhase);
    const bankroll = useGameStore((s) => s.bankroll);
    const seats = useGameStore((s) => s.seats);
    const stand = useGameStore((s) => s.stand);
    const currentSeatIndex = useGameStore((s) => s.currentSeatIndex);
    const matchHistory = useGameStore((s) => s.matchHistory);
    const lastDailyClaim = useGameStore((s) => s.lastDailyClaim);
    const claimDaily = useGameStore((s) => s.claimDaily);
    const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);
    const isHydrated = useStoreHydration();

    const [showRules, setShowRules] = useState(false);
    const [showLogoInfo, setShowLogoInfo] = useState(false);
    const [timer, setTimer] = useState(TURN_TIMER_SECONDS);
    const [winNotification, setWinNotification] = useState<{ amount: number; isWin: boolean } | null>(null);
    const [claimCooldown, setClaimCooldown] = useState('');

    const isPlayerTurn = gamePhase === GamePhase.PLAYER_TURN;
    const isPayout = gamePhase === GamePhase.PAYOUT;
    const isFreeBet = roomId === 'freebet';

    const totalBet = seats
        .filter((s) => s.isActive)
        .reduce((sum, s) => sum + s.hands.reduce((hSum, h) => hSum + h.betAmount, 0), 0) +
        Object.values(useGameStore((s) => s.insuranceBets)).reduce((sum, amount) => sum + amount, 0);

    // Detect free double/split eligibility using rules engine
    const currentSeat = seats[currentSeatIndex];
    const currentHand = currentSeat?.hands[currentSeat.currentHandIndex];
    const freeStatus = useMemo(() => {
        if (!isPlayerTurn || !currentHand || currentHand.status !== HandStatus.PLAYING) {
            return { freeDouble: false, freeSplit: false };
        }

        const rules = getRules(roomId);
        const doubleResult = rules.canDoubleDown(currentHand);
        const splitResult = rules.canSplit(currentHand, currentSeat?.hands.length || 0);

        return {
            freeDouble: doubleResult.isFree,
            freeSplit: splitResult.isFree
        };
    }, [isPlayerTurn, currentHand, roomId, currentSeat?.hands.length]);

    // Set current room in store
    useEffect(() => {
        setCurrentRoom(roomId);
    }, [roomId, setCurrentRoom]);

    useEffect(() => {
        if (shoe.length === 0) initializeShoe();
    }, [shoe.length, initializeShoe]);

    // 30-second turn timer (FIXED MEMORY LEAK)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlayerTurn) {
            setTimer(TURN_TIMER_SECONDS);
            interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        stand();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setTimer(TURN_TIMER_SECONDS);
        }
        return () => clearInterval(interval);
    }, [isPlayerTurn, stand, currentSeatIndex, currentSeat?.currentHandIndex]);

    // Win notification on payout
    useEffect(() => {
        if (isPayout && matchHistory.length > 0) {
            const lastMatch = matchHistory[matchHistory.length - 1];

            // Calculate total bets and total payouts from the match record
            let totalBets = 0;
            let totalPayouts = 0;

            lastMatch.seats.forEach(seat => {
                seat.hands.forEach(hand => {
                    totalBets += hand.betAmount;

                    // The payout in matchHistory is the *net* payout (e.g., +100 for win, -100 for loss, 0 for push)
                    // If they win, they get back their bet + payout. 
                    // However, we just want to know if the round as a whole had a net positive or negative result.
                    totalPayouts += hand.payout;
                });

                if (seat.insuranceCost) {
                    totalPayouts -= seat.insuranceCost;
                }
                if (seat.insurancePayout) {
                    totalPayouts += seat.insurancePayout;
                }
            });

            if (totalPayouts > 0) {
                setWinNotification({ amount: totalPayouts, isWin: true });
            } else if (totalPayouts < 0) {
                setWinNotification({ amount: Math.abs(totalPayouts), isWin: false });
            }

            const t = setTimeout(() => setWinNotification(null), 4000);
            return () => clearTimeout(t);
        } else if (gamePhase === GamePhase.BETTING || gamePhase === GamePhase.DEALING) {
            setWinNotification(null);
        }
    }, [isPayout, gamePhase, matchHistory.length]);

    // Claim cooldown timer (FIXED HOURS DISPLAY)
    useEffect(() => {
        const interval = setInterval(() => {
            const TWO_HOURS = 2 * 60 * 60 * 1000;
            const elapsed = Date.now() - lastDailyClaim;
            if (elapsed >= TWO_HOURS) {
                setClaimCooldown('');
            } else {
                const remaining = TWO_HOURS - elapsed;
                const h = Math.floor(remaining / 3600000);
                const m = Math.floor((remaining % 3600000) / 60000);
                const s = Math.floor((remaining % 60000) / 1000);
                setClaimCooldown(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lastDailyClaim]);

    const handleClaimDaily = () => {
        const success = claimDaily();
        if (!success) return;
    };

    // Logo paths
    const logoPath = isFreeBet ? '/images/logo/freebet_blackjack_logo.png' : '/images/logo/blackjack_vip_logo.avif';

    if (!isHydrated) {
        return (
            <div className="w-screen h-screen flex items-center justify-center" style={{ background: '#1a0e0a' }}>
                <motion.div className="text-amber-400/50 text-lg font-bold tracking-[0.3em] uppercase"
                    animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
                >Loading Table...</motion.div>
            </div>
        );
    }

    return (
        <>
            <PortraitOverlay />
            <DevTools />

            <div className="relative w-screen h-screen overflow-hidden select-none"
                style={{ background: room.bgGradient }}
            >
                {/* Ambient lighting */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(180, 100, 40, 0.05) 0%, transparent 70%)' }}
                />

                {/* ─── Felt Table Surface ─── */}
                <div className="absolute left-1/2 -translate-x-1/2"
                    style={{ bottom: '60px', width: '110%', maxWidth: '1560px', height: '58%' }}
                >
                    <div className="relative w-full h-full overflow-hidden"
                        style={{
                            borderRadius: '50% 50% 4px 4px / 70% 70% 4px 4px',
                            background: room.feltGradient,
                            boxShadow: 'inset 0 0 80px 30px rgba(0,0,0,0.5), inset 0 -10px 40px rgba(0,0,0,0.3)',
                            border: `3px solid ${room.borderColor}`,
                        }}
                    >
                        <div className="absolute inset-0 opacity-[0.03]" style={{
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23ffffff\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
                        }} />

                        {/* Table text — white */}
                        <div className="absolute top-[28%] left-1/2 -translate-x-1/2 text-center pointer-events-none">
                            <p className="text-white/40 text-2xl font-black tracking-[0.3em] uppercase font-serif pb-2 border-b border-white/10 mb-2">
                                {room.rules.blackjackPays}
                            </p>
                            <p className="text-white/30 text-xs font-black tracking-[0.4em] uppercase font-serif mb-1.5">
                                {room.rules.dealerStands}
                            </p>
                            <p className="text-white/20 text-[10px] font-black tracking-[0.5em] uppercase font-serif">
                                {room.rules.insurancePays}
                            </p>
                            <p className="text-white/20 text-[10px] font-extrabold tracking-[0.2em] uppercase font-sans mt-4">
                                THIS IS A STRICTLY EDUCATIONAL PROJECT. NO REAL MONEY GAMBLING IS INVOLVED.
                            </p>
                        </div>
                    </div>
                    <div className="absolute -inset-[2px] pointer-events-none"
                        style={{
                            borderRadius: '50% 50% 6px 6px / 70% 70% 6px 6px',
                            border: `2px solid ${room.borderColor}`,
                        }}
                    />
                </div>

                {/* ─── Gameplay Content ─── */}
                <div className="absolute inset-0 z-10">
                    {/* Top HUD bar */}
                    <div className="absolute top-0 left-0 right-0 z-20">
                        <div className="flex items-center justify-between px-4 py-2"
                            style={{ background: 'linear-gradient(180deg, rgba(10,6,4,0.95) 0%, rgba(10,6,4,0.7) 70%, transparent 100%)' }}
                        >
                            <div className="flex items-center gap-4">
                                <GamePhaseIndicator phase={gamePhase} />
                            </div>
                            <div className="flex flex-1 items-center justify-end gap-3">
                                {/* Logo fixed on right - Increased size 150% and made clickable */}
                                <div
                                    className="relative w-[480px] h-[120px] cursor-pointer hover:scale-105 transition-transform origin-right"
                                    onClick={() => setShowLogoInfo(true)}
                                >
                                    <Image src={logoPath} alt={room.name} fill className="object-contain drop-shadow-xl" sizes="480px" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Logo Info Popup */}
                    <AnimatePresence>
                        {showLogoInfo && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <motion.div
                                    className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                                    style={{
                                        background: 'rgba(15, 10, 8, 0.98)',
                                        border: `1px solid ${room.borderColor}`,
                                        boxShadow: `0 0 60px ${room.accentColor}44`,
                                    }}
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                >
                                    <button
                                        onClick={() => setShowLogoInfo(false)}
                                        className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/50 hover:bg-black/80 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10"
                                    >
                                        <X size={18} />
                                    </button>

                                    {/* Preview Header */}
                                    <div className="h-[120px] relative flex items-center justify-center"
                                        style={{ background: room.feltGradient }}
                                    >
                                        <div className="absolute inset-0 border-b border-white/10" />
                                        <div className="relative w-3/4 h-3/4">
                                            <Image
                                                src={logoPath}
                                                alt={room.name}
                                                fill
                                                className="object-contain drop-shadow-2xl"
                                            />
                                        </div>
                                    </div>

                                    {/* Info Body */}
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-black text-white/90 tracking-wide">{room.name}</h3>
                                                <p className="text-xs font-bold uppercase tracking-[0.2em]"
                                                    style={{ color: room.accentColor }}
                                                >
                                                    {room.subtitle}
                                                </p>
                                            </div>
                                            <span className="text-3xl drop-shadow-md">{room.icon}</span>
                                        </div>

                                        <p className="text-white/60 text-sm leading-relaxed mb-6">
                                            {room.description}
                                        </p>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                                <span className="text-xs text-white/40 font-bold uppercase tracking-wider flex items-center gap-2">
                                                    <Coins size={14} /> Bet Limits
                                                </span>
                                                <span className="text-sm font-black text-white/90">
                                                    ${room.betRange[0]} - ${room.betRange[1].toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                                <span className="text-xs text-white/40 font-bold uppercase tracking-wider flex items-center gap-2">
                                                    <Info size={14} /> Rules
                                                </span>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-white/70">{room.rules.blackjackPays}</p>
                                                    <p className="text-xs font-bold text-white/70">{room.rules.dealerStands}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Button */}
                                    <div className="p-4 bg-black/40 border-t border-white/10">
                                        <button
                                            onClick={() => setShowLogoInfo(false)}
                                            className="w-full py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all text-black hover:scale-[1.02] active:scale-95"
                                            style={{ background: room.accentColor }}
                                        >
                                            Close Info
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Dealer Area — top center */}
            <div className="absolute top-[45px] left-1/2 -translate-x-1/2 z-15">
                <DealerArea />
            </div>

            {/* Payout Panel — left side */}
            <div className="absolute top-[100px] left-[20px] z-15">
                <PayoutPanel roomConfig={room} />
            </div>

            {/* Match History — right side */}
            <div className="absolute top-[100px] right-[20px] z-15">
                <HistoryPanel />
            </div>

            {/* Action Buttons — center */}
            <div className="absolute left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4" style={{ top: '22%' }}>
                <ActionPanel timer={timer} />
            </div>

            {/* 5 Seats — inverted arc (middle lowest) */}
            <div className="absolute left-0 right-0 z-15" style={{ bottom: '65px' }}>
                <div className="relative w-full max-w-[1200px] mx-auto" style={{ height: '240px' }}>
                    {[1, 2, 3, 4, 5].map((seatId) => {
                        const cfg = SEAT_ARC[seatId];
                        return (
                            <Seat key={seatId} seatId={seatId}
                                style={{
                                    position: 'absolute',
                                    left: cfg.x, bottom: cfg.y,
                                    transform: `translateX(-50%) scale(${cfg.scale})`,
                                    transformOrigin: 'bottom center',
                                    zIndex: cfg.z,
                                }}
                            />
                        );
                    })}
                </div>
            </div>


            {/* ─── Win/Lose Notification ─── */}
            <AnimatePresence>
                {
                    winNotification && (
                        <motion.div
                            className="absolute left-1/2 -translate-x-1/2 z-[100]"
                            style={{ top: '38%' }}
                            initial={{ opacity: 0, scale: 0.5, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: -20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            <div className={`px-8 py-4 rounded-xl backdrop-blur-md border ${winNotification.isWin
                                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-yellow-400/40'
                                : 'bg-gradient-to-r from-red-500/20 to-red-700/20 border-red-400/30'
                                }`}
                                style={{
                                    boxShadow: winNotification.isWin
                                        ? '0 0 60px rgba(250, 204, 21, 0.3), 0 0 120px rgba(250, 204, 21, 0.1)'
                                        : '0 0 40px rgba(220, 50, 50, 0.2)'
                                }}
                            >
                                <p className={`text-center text-sm font-bold uppercase tracking-[0.3em] mb-1
                                        ${winNotification.isWin ? 'text-yellow-300' : 'text-red-300'}`}>
                                    {winNotification.isWin ? 'YOU WIN' : 'YOU LOSE'}
                                </p>
                                <p className={`text-center text-3xl font-black tabular-nums
                                        ${winNotification.isWin ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {winNotification.isWin ? '+' : '-'}${winNotification.amount.toLocaleString()}
                                </p>
                            </div>
                        </motion.div>
                    )}
            </AnimatePresence>

            {/* ─── Bottom HUD Bar ─── */}
            <div className="absolute bottom-0 left-0 right-0 z-50">
                <div className="flex items-center justify-between px-6 py-3"
                    style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(10,6,4,0.8) 20%, rgba(10,6,4,0.95) 100%)' }}
                >
                    <div className="flex items-center gap-5">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-white/30 uppercase tracking-[0.2em]">Balance</span>
                            <span className="text-lg font-black tabular-nums leading-tight" style={{ color: room.accentColor }}>
                                ${bankroll.toLocaleString()}
                            </span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col">
                            <span className="text-[9px] text-white/30 uppercase tracking-[0.2em]">Total Bet</span>
                            <span className="text-lg font-black text-white/80 tabular-nums leading-tight">
                                ${totalBet.toLocaleString()}
                            </span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        {/* Daily Claim */}
                        <button onClick={handleClaimDaily} disabled={!!claimCooldown}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer
                                    ${claimCooldown
                                    ? 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 animate-pulse'
                                }`}
                        >
                            {claimCooldown ? <><Gift size={15} className="mr-1.5 inline" /> {claimCooldown}</> : <><Gift size={15} className="mr-1.5 inline" /> Claim $200</>}
                        </button>
                    </div>

                    <ChipRack />

                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowRules(true)}
                            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-[11px] font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white/70 transition-all cursor-pointer"
                        ><Info size={14} className="mr-1 inline -mt-0.5" /> Rules</button>
                        <button onClick={() => router.push('/lobby')}
                            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-[11px] font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white/70 transition-all cursor-pointer"
                        ><Home size={14} className="mr-1 inline -mt-0.5" /> Lobby</button>
                        <button onClick={() => router.push('/')}
                            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-[11px] font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white/70 transition-all cursor-pointer"
                        ><Home size={14} className="mr-1 inline -mt-0.5" /> Home</button>
                    </div>
                </div>
            </div>

            {/* Rules Modal */}
            <AnimatePresence>
                {showRules && <RulesModal room={room} onClose={() => setShowRules(false)} />}
            </AnimatePresence>
        </>
    );
}

/* ─── Seat positions: inverted arc (edges higher, center lower) ─── */
const SEAT_ARC: Record<number, { x: string; y: string; scale: number; z: number }> = {
    1: { x: '8%', y: '100px', scale: 1.125, z: 1 },  // 0.75 * 1.5
    2: { x: '25%', y: '45px', scale: 1.275, z: 2 },  // 0.85 * 1.5
    3: { x: '50%', y: '15px', scale: 1.425, z: 3 },  // 0.95 * 1.5
    4: { x: '75%', y: '45px', scale: 1.275, z: 2 },  // 0.85 * 1.5
    5: { x: '92%', y: '100px', scale: 1.125, z: 1 },  // 0.75 * 1.5
};

/* ─── Sub-components ─── */

function GamePhaseIndicator({ phase }: { phase: GamePhase }) {
    // FIXED: Added Partial typing and fallback to avoid crash when IDLE or unknown phase
    const config: Partial<Record<GamePhase, { label: string; color: string; icon: React.ReactNode }>> = {
        [GamePhase.BETTING]: { label: 'PLACE YOUR BETS', color: 'text-amber-400', icon: <Coins size={14} /> },
        [GamePhase.DEALING]: { label: 'DEALING', color: 'text-sky-400', icon: <Spade size={14} /> },
        [GamePhase.INSURANCE]: { label: 'INSURANCE?', color: 'text-yellow-400', icon: <Shield size={14} /> },
        [GamePhase.PLAYER_TURN]: { label: 'MAKE YOUR DECISION', color: 'text-emerald-400', icon: <User size={14} /> },
        [GamePhase.DEALER_TURN]: { label: 'DEALER PLAYING', color: 'text-red-400', icon: <Home size={14} /> },
        [GamePhase.PAYOUT]: { label: 'RESULTS', color: 'text-purple-400', icon: <ClipboardList size={14} /> },
    };

    const defaultPhase = { label: 'LOADING...', color: 'text-white/50', icon: <Timer size={14} /> };
    const { label, color, icon } = config[phase] || defaultPhase;

    return (
        <motion.div key={phase} className={`flex items-center gap-2 ${color}`}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        >
            <span className="text-sm">{icon}</span>
            <span className="text-xs font-extrabold uppercase tracking-[0.2em]">{label}</span>
        </motion.div>
    );
}

function HistoryPanel() {
    const matchHistory = useGameStore((s) => s.matchHistory);
    const lastMatches = matchHistory.slice(-8).reverse();

    if (lastMatches.length === 0) return null;

    return (
        <motion.div className="w-[200px] rounded-xl overflow-hidden"
            style={{ background: 'rgba(10, 6, 4, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
        >
            <div className="px-3 py-2 border-b border-white/5 flex items-center">
                <ClipboardList size={12} className="mr-1.5 text-white/40" />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/40">History</span>
            </div>
            <div className="p-2 space-y-1 max-h-[250px] overflow-y-auto">
                {lastMatches.map((match) => {
                    const result = match.seats[0]?.hands[0];
                    if (!result) return null;

                    let diff = 0;
                    match.seats.forEach(s => {
                        s.hands.forEach(h => {
                            diff += h.payout;
                        });

                        if (s.insuranceCost) {
                            diff -= s.insuranceCost;
                        }
                        if (s.insurancePayout) {
                            diff += s.insurancePayout;
                        }
                    });

                    const roomLabel = match.roomId === 'freebet' ? 'FB' : 'VIP';

                    // Determine overall label character based on net profit diff
                    let labelStr = 'P';
                    let colorClass = 'text-white/40';

                    if (diff > 0) {
                        labelStr = result.result === HandStatus.BLACKJACK ? 'BJ' : 'W';
                        colorClass = 'text-emerald-400';
                    } else if (diff < 0) {
                        labelStr = 'L';
                        colorClass = 'text-red-400';
                    }

                    return (
                        <div key={match.id} className="flex items-center justify-between px-1.5 py-1 rounded bg-white/[0.02]">
                            <div className="flex items-center gap-1.5">
                                <span className={`text-[7px] font-bold px-1 py-0.5 rounded
                                    ${match.roomId === 'freebet' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}
                                >{roomLabel}</span>
                                <span className={`text-[9px] font-bold uppercase ${colorClass}`}>
                                    {labelStr}
                                </span>
                            </div>
                            <span className={`text-[9px] font-bold tabular-nums ${diff >= 0 ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                                {diff >= 0 ? '+' : ''}{diff}
                            </span>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}

function RulesModal({ room, onClose }: { room: ReturnType<typeof getRoomConfig>; onClose: () => void }) {
    return (
        <motion.div className="absolute inset-0 z-[200] flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                className="relative w-[480px] max-h-[80vh] overflow-y-auto rounded-2xl border border-amber-500/15"
                style={{ background: 'rgba(20, 12, 8, 0.95)', backdropFilter: 'blur(20px)' }}
                initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-extrabold text-amber-400 uppercase tracking-[0.15em] flex items-center justify-center"><Info size={20} className="mr-2" /> {room.name} Rules</h2>
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer transition-all"
                        ><X size={16} /></button>
                    </div>
                    <div className="space-y-4 text-sm text-white/60">
                        <RuleSection title="Objective" content="Beat the dealer without going over 21." />
                        <RuleSection title="Card Values" content="2-10 = face value. J/Q/K = 10. Ace = 1 or 11." />
                        <RuleSection title="Gameplay">
                            <ul className="space-y-1.5 list-disc list-inside text-white/50 text-xs">
                                <li><strong className="text-white/70">Hit</strong> — Take another card</li>
                                <li><strong className="text-white/70">Stand</strong> — Keep hand</li>
                                <li><strong className="text-white/70">Double Down</strong> — Double bet, take one card</li>
                                <li><strong className="text-white/70">Split</strong> — Split a pair into two hands</li>
                                <li><Timer size={14} className="inline mr-1 text-amber-400 -mt-0.5" /> <strong className="text-amber-400">30 seconds</strong> per hand, auto-stand on timeout</li>
                            </ul>
                        </RuleSection>
                        <RuleSection title="Payouts">
                            <ul className="space-y-1 list-disc list-inside text-white/50 text-xs">
                                <li>{room.rules.blackjackPays}</li>
                                <li>{room.rules.insurancePays}</li>
                                <li>Regular win 1:1 · Push returns bet</li>
                            </ul>
                        </RuleSection>
                        <RuleSection title="Dealer Rules" content={room.rules.dealerStands} />
                        {room.id === 'freebet' && (
                            <RuleSection title="Free Bet Rules">
                                <ul className="space-y-1 list-disc list-inside text-white/50 text-xs">
                                    <li className="text-emerald-400">Free doubles on hard 9, 10, 11</li>
                                    <li className="text-emerald-400">Free splits on all pairs (except 10s)</li>
                                    <li className="text-amber-400">Dealer 22 pushes all non-busted hands</li>
                                </ul>
                            </RuleSection>
                        )}
                    </div>
                </div>
                {/* Educational Disclaimer */}
                <div className="absolute bottom-2 left-0 right-0 text-center z-50 pointer-events-none">
                    <p className="text-[10px] text-white/30 font-medium uppercase tracking-[0.1em] drop-shadow-md">
                        This is a strictly educational project. No real money gambling is involved.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}

function RuleSection({ title, content, children }: { title: string; content?: string; children?: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-xs font-bold text-white/80 uppercase tracking-[0.15em] mb-1.5">{title}</h3>
            {content && <p className="text-xs text-white/50 leading-relaxed">{content}</p>}
            {children}
        </div>
    );
}