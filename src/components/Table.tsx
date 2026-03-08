'use client';

// ============================================
// Table — Full-featured Evolution Gaming style
// ============================================

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, useStoreHydration } from '@/hooks/useGameStore';
import { Info, Home, X, Coins, Shield, Spade, Timer, Gift, ClipboardList, Plus, Minus, ChevronsUp, ArrowLeftRight, Sparkles, User, BookOpen, Settings, LayoutGrid, Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import { GamePhase, HandStatus } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';
import { calculateHandValue, canSplit, canDoubleDown } from '@/utils/hand';
import { getRules } from '@/rules';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import DealerArea from './DealerArea';
import Seat from './Seat';
import ChipRack from './ChipRack';
import ActionPanel from './ActionPanel';
import DevTools from './DevTools';
import PortraitOverlay from './PortraitOverlay';
import PayoutPanel from './PayoutPanel';
import StrategyModal from './StrategyModal';
import HandAdvisor from './HandAdvisor';
import CardCountingPanel from './CardCountingPanel';
import MatchDetailModal from './MatchDetailModal';
import SettingsModal from './SettingsModal';
import { calculateMatchNetPnl, getRoomBadgeConfig, getMatchOverallStatus } from '@/utils/historyUtils';

const TURN_TIMER_SECONDS = 30;
const INSURANCE_TIMER_SECONDS = 10;

export default function Table({ roomId = 'classic' }: { roomId?: string }) {
    const room = getRoomConfig(roomId);
    const router = useRouter();

    const initializeShoe = useGameStore((s) => s.initializeShoe);
    const shoe = useGameStore((s) => s.shoe);
    const declineInsurance = useGameStore((s) => s.declineInsurance);
    const gamePhase = useGameStore((s) => s.gamePhase);
    const bankroll = useGameStore((s) => s.bankroll);
    const seats = useGameStore((s) => s.seats);
    const stand = useGameStore((s) => s.stand);
    const currentSeatIndex = useGameStore((s) => s.currentSeatIndex);
    const actionCounter = useGameStore((s) => s.actionCounter);
    const matchHistory = useGameStore((s) => s.matchHistory);
    const setMatchHistory = useGameStore((s) => s.setMatchHistory);
    const lastDailyClaim = useGameStore((s) => s.lastDailyClaim);
    const claimDaily = useGameStore((s) => s.claimDaily);
    const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);
    const insufficientFundsWarning = useGameStore((s) => s.insufficientFundsWarning);
    const dailyClaimCount = useGameStore((s) => s.dailyClaimCount);
    const triggerInsufficientFunds = useGameStore((s) => s.triggerInsufficientFunds);
    const insuranceBets = useGameStore((s) => s.insuranceBets);
    const isHydrated = useStoreHydration();

    const [showRules, setShowRules] = useState(false);
    const [showStrategy, setShowStrategy] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showLogoInfo, setShowLogoInfo] = useState(false);
    const [timer, setTimer] = useState(TURN_TIMER_SECONDS);
    const [insuranceTimer, setInsuranceTimer] = useState(INSURANCE_TIMER_SECONDS);
    const [winNotification, setWinNotification] = useState<{ amount: number; isWin: boolean; isPush?: boolean } | null>(null);
    const [claimCooldown, setClaimCooldown] = useState('');
    const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(null);

    const showHandAdvisor = useGameStore((s) => s.showHandAdvisor);
    const showCardCounting = useGameStore((s) => s.showCardCounting);


    const isPlayerTurn = gamePhase === GamePhase.PLAYER_TURN;
    const isInsurance = gamePhase === GamePhase.INSURANCE;
    const isPayout = gamePhase === GamePhase.PAYOUT;
    const isVegasStrip = roomId === 'vegas_strip';
    const isVegasDowntown = roomId === 'vegas_downtown';

    const totalBet = seats
        .filter((s) => s.isActive)
        .reduce((sum, s) => sum + s.hands.reduce((hSum, h) => hSum + h.betAmount, 0), 0) +
        Object.values(insuranceBets).reduce((sum, amount) => sum + amount, 0);

    const currentSeat = seats[currentSeatIndex];
    const currentHand = currentSeat?.hands[currentSeat.currentHandIndex];

    // Set current room in store
    useEffect(() => {
        setCurrentRoom(roomId);
    }, [roomId, setCurrentRoom]);

    useEffect(() => {
        if (shoe.length === 0) initializeShoe();
    }, [shoe.length, initializeShoe]);

    // 30-second turn timer — stand() deferred via setTimeout to avoid
    // calling Zustand mutations inside a React state updater (batch context).
    useEffect(() => {
        let interval: NodeJS.Timeout;
        let expired = false;

        if (isPlayerTurn) {
            setTimer(TURN_TIMER_SECONDS);
            interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        if (!expired) {
                            expired = true;
                            // Defer outside React's batch so advanceToNextHand
                            // sees fully committed Zustand state
                            setTimeout(() => stand(), 0);
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setTimer(TURN_TIMER_SECONDS);
        }
        return () => clearInterval(interval);
    }, [isPlayerTurn, stand, currentSeatIndex, currentSeat?.currentHandIndex, actionCounter]);

    // 10-second insurance timer — auto-decline if expired
    useEffect(() => {
        let interval: NodeJS.Timeout;
        let expired = false;

        if (isInsurance) {
            setInsuranceTimer(INSURANCE_TIMER_SECONDS);
            interval = setInterval(() => {
                setInsuranceTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        if (!expired) {
                            expired = true;
                            setTimeout(() => declineInsurance(), 0);
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setInsuranceTimer(INSURANCE_TIMER_SECONDS);
        }
        return () => clearInterval(interval);
    }, [isInsurance, declineInsurance, currentSeatIndex]);

    // Safety: recover from stuck DEALER_TURN (e.g. async error in dealerPlay)
    const dealerPlay = useGameStore((s) => s.dealerPlay);
    useEffect(() => {
        if (gamePhase !== GamePhase.DEALER_TURN) return;
        const safetyTimeout = setTimeout(() => {
            dealerPlay();
        }, 10_000);
        return () => clearTimeout(safetyTimeout);
    }, [gamePhase, dealerPlay]);

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
                // Include side bet results in the notification
                if (seat.sideBetAmount) {
                    totalPayouts -= seat.sideBetAmount;
                }
                if (seat.sideBetPayout) {
                    totalPayouts += seat.sideBetPayout;
                }
            });

            if (totalPayouts > 0) {
                setWinNotification({ amount: totalPayouts, isWin: true });
            } else if (totalPayouts < 0) {
                setWinNotification({ amount: Math.abs(totalPayouts), isWin: false });
            } else {
                // Pure push — clear any stale notification then show PUSH briefly
                setWinNotification({ amount: 0, isWin: false, isPush: true });
            }

            const t = setTimeout(() => setWinNotification(null), 4000);
            return () => clearTimeout(t);
        } else if (gamePhase === GamePhase.BETTING || gamePhase === GamePhase.DEALING) {
            setWinNotification(null);
        }
    }, [isPayout, gamePhase, matchHistory.length]);

    // Claim cooldown timer — only runs when a cooldown is actually active
    useEffect(() => {
        const THIRTY_MIN = 30 * 60 * 1000;

        const tick = () => {
            const elapsed = Date.now() - lastDailyClaim;
            if (elapsed >= THIRTY_MIN) {
                setClaimCooldown('');
                return true; // cooldown expired — stop the interval
            }
            const remaining = THIRTY_MIN - elapsed;
            const m = Math.floor(remaining / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            setClaimCooldown(`${m}m ${s}s`);
            return false;
        };

        // If no cooldown is active right now, clear display and skip interval entirely
        if (tick()) return;

        const interval = setInterval(() => {
            if (tick()) clearInterval(interval);
        }, 1000);
        return () => clearInterval(interval);
    }, [lastDailyClaim]);

    const handleClaimDaily = () => {
        const success = claimDaily();
        if (!success) {
            triggerInsufficientFunds(); // Reuse visual warning here temporarily if claim fails validation unexpectedly
            return;
        }
    };

    // Logo path from room config
    const logoPath = room.logoPath;

    const isBonusClaim = (dailyClaimCount + 1) % 3 === 0;

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
                        <div className="flex items-start px-4 py-2"
                            style={{ background: 'linear-gradient(180deg, rgba(10,6,4,0.95) 0%, rgba(10,6,4,0.7) 70%, transparent 100%)' }}
                        >
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-4">
                                    <GamePhaseIndicator phase={gamePhase} />
                                </div>
                                <div className="flex items-center gap-3 pl-0.5 mt-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: room.accentColor }}>
                                        {room.name}
                                    </span>
                                    <span className="text-white/20 text-[9px]">|</span>
                                    <span className="text-[9px] text-white/35 uppercase tracking-wider">
                                        ${room.betRange[0].toLocaleString()} – ${room.betRange[1].toLocaleString()}
                                    </span>
                                    <span className="text-white/20 text-[9px]">|</span>
                                    <span className="text-[9px] text-white/35 uppercase tracking-wider">5 Seats</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Logo — top-right corner */}
                    <div
                        className="absolute top-2 right-3 z-20 cursor-pointer hover:scale-105 transition-transform origin-top-right"
                        style={{ width: '170px', height: '75px' }}
                        onClick={() => setShowLogoInfo(true)}
                    >
                        <Image src={logoPath} alt={room.name} fill className="object-contain" sizes="170px" unoptimized />
                    </div>

                </div>
            </div>

            {/* Logo Info Popup — outside z-10 layer so it renders above all game UI */}
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

                                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                        <span className="text-xs text-white/40 font-bold uppercase tracking-wider flex items-center gap-2">
                                            <Sparkles size={14} /> RTP
                                        </span>
                                        <div className="text-right">
                                            {room.hasSideBet && room.baseGameRtp && room.sideBetRtp ? (
                                                <>
                                                    <p className="text-[11px] font-bold text-white/50">
                                                        Base Game: <span className="font-black" style={{ color: room.accentColor }}>{room.baseGameRtp}</span>
                                                    </p>
                                                    <p className="text-[11px] font-bold text-white/50">
                                                        Side Bet: <span className="font-black text-red-400">{room.sideBetRtp}</span>
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-sm font-black" style={{ color: room.accentColor }}>{room.rtp}</p>
                                            )}
                                            <p className="text-[10px] text-white/30">Theoretical Return to Player</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Dealer Area — top center */}
            <div className="absolute top-[45px] left-1/2 -translate-x-1/2 z-15">
                <DealerArea />
            </div>

            {/* Payout Panel — left side */}
            <div className="absolute top-[45px] left-[20px] z-15">
                <PayoutPanel roomConfig={room} />
            </div>

            {/* Hand Advisor — next to PayoutPanel */}
            {showHandAdvisor && (
                <div className="absolute top-[45px] left-[285px] z-15">
                    <HandAdvisor roomId={roomId} accentColor={room.accentColor} borderColor={room.borderColor} />
                </div>
            )}

            {/* Card Counting Panel — symmetric to Hand Advisor */}
            {showCardCounting && (
                <div className="absolute top-[45px] right-[285px] z-15">
                    <CardCountingPanel numDecks={room.gameRules.numberOfDecks} accentColor={room.accentColor} borderColor={room.borderColor} />
                </div>
            )}

            {/* Match History — right side, always below logo */}
            <div className="absolute top-[88px] right-[12px] z-15">
                <HistoryPanel onMatchClick={(idx) => setSelectedMatchIndex(idx)} />
            </div>

            {/* Action Buttons — center */}
            <div className="absolute left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4" style={{ top: '33%' }}>
                <ActionPanel timer={timer} insuranceTimer={isInsurance ? insuranceTimer : undefined} currentInsuranceSeat={isInsurance ? seats[currentSeatIndex]?.id : undefined} />
            </div>

            {/* 5 Seats — inverted arc (middle lowest) */}
            <div className="absolute left-0 right-0 z-15" style={{ bottom: '65px' }}>
                <div className="relative w-full max-w-[1500px] mx-auto" style={{ height: '240px' }}>
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


            {/* ─── Insufficient Funds Warning ─── */}
            <AnimatePresence>
                {insufficientFundsWarning && (
                    <motion.div
                        className="absolute top-[15%] left-1/2 -translate-x-1/2 z-[100]"
                        initial={{ opacity: 0, scale: 0.8, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -10 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-900/90 to-rose-900/90 border border-red-500/50 flex items-center gap-3 backdrop-blur-md shadow-[0_0_40px_rgba(220,38,38,0.3)]">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                <span className="text-red-400 font-extrabold text-lg">!</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-red-100 font-bold uppercase tracking-widest text-sm">Insufficient Funds</span>
                                <span className="text-red-400/80 text-[10px] uppercase font-semibold">Please claim or deposit more chips</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Win Notification Overlay ─── */}
            <AnimatePresence>
                {
                    winNotification && (
                        <motion.div
                            className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                            style={{ top: '25%' }}
                            initial={{ opacity: 0, scale: 0.5, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: -20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            <div className={`px-8 py-4 rounded-xl backdrop-blur-md border ${winNotification.isPush
                                ? 'bg-gradient-to-r from-slate-500/15 to-gray-500/15 border-slate-400/30'
                                : winNotification.isWin
                                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-yellow-400/40'
                                    : 'bg-gradient-to-r from-red-500/20 to-red-700/20 border-red-400/30'
                                }`}
                                style={{
                                    boxShadow: winNotification.isPush
                                        ? '0 0 40px rgba(148, 163, 184, 0.2)'
                                        : winNotification.isWin
                                            ? '0 0 60px rgba(250, 204, 21, 0.3), 0 0 120px rgba(250, 204, 21, 0.1)'
                                            : '0 0 40px rgba(220, 50, 50, 0.2)'
                                }}
                            >
                                <p className={`text-center text-sm font-bold uppercase tracking-[0.3em] mb-1 ${winNotification.isPush
                                    ? 'text-slate-300'
                                    : winNotification.isWin ? 'text-yellow-300' : 'text-red-300'
                                    }`}>
                                    {winNotification.isPush ? 'TIE' : winNotification.isWin ? 'YOU WIN' : 'YOU LOSE'}
                                </p>
                                {!winNotification.isPush && (
                                    <p className={`text-center text-3xl font-black tabular-nums
                                            ${winNotification.isWin ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {winNotification.isWin ? '+' : '-'}${winNotification.amount.toLocaleString()}
                                    </p>
                                )}
                                {winNotification.isPush && (
                                    <p className="text-center text-xl font-bold text-slate-400/80">
                                        Bet returned
                                    </p>
                                )}
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
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer relative overflow-hidden group
                                    ${claimCooldown
                                    ? 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'
                                    : isBonusClaim
                                        ? 'bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/30 animate-pulse'
                                        : 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 animate-pulse'
                                }`}
                        >
                            {!claimCooldown && isBonusClaim && (
                                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                    animate={{ left: ['-100%', '200%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                />
                            )}
                            {claimCooldown ? (
                                <><Gift size={15} className="mr-1.5 inline" /> {claimCooldown}</>
                            ) : (
                                <><Gift size={15} className={`mr-1.5 inline ${isBonusClaim ? 'text-yellow-300' : ''}`} /> Claim ${isBonusClaim ? '1,000' : '500'}{isBonusClaim && ' 🎯'}</>
                            )}
                        </button>
                    </div>

                    <ChipRack />

                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowStrategy(true)}
                            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-wider hover:bg-white/20 hover:text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                        ><BookOpen size={16} className="mr-1.5 flex-shrink-0 inline -mt-0.5" /> Strategy</button>
                        <button onClick={() => setShowRules(true)}
                            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-wider hover:bg-white/20 hover:text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                        ><Info size={16} className="mr-1.5 flex-shrink-0 inline -mt-0.5" /> Rules</button>
                        <button onClick={() => setShowSettings(true)}
                            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-wider hover:bg-white/20 hover:text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                        ><Settings size={16} className="mr-1.5 flex-shrink-0 inline -mt-0.5" /> Settings</button>
                        <button onClick={() => router.push('/lobby')}
                            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-wider hover:bg-white/20 hover:text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                        ><LayoutGrid size={16} className="mr-1.5 flex-shrink-0 inline -mt-0.5" /> Lobby</button>
                        <button onClick={() => router.push('/')}
                            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-wider hover:bg-white/20 hover:text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                        ><Home size={16} className="mr-1.5 flex-shrink-0 inline -mt-0.5" /> Home</button>
                    </div>
                </div>
            </div>

            {/* Rules Modal */}
            <AnimatePresence>
                {showRules && <RulesModal room={room} onClose={() => setShowRules(false)} />}
            </AnimatePresence>

            {/* Strategy Modal */}
            <AnimatePresence>
                {showStrategy && <StrategyModal room={room} onClose={() => setShowStrategy(false)} />}
            </AnimatePresence>

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && <SettingsModal accentColor={room.accentColor} borderColor={room.borderColor} onClose={() => setShowSettings(false)} />}
            </AnimatePresence>

            {/* Match Detail Modal */}
            <AnimatePresence>
                {selectedMatchIndex !== null && matchHistory[selectedMatchIndex] && (
                    <MatchDetailModal
                        match={matchHistory[selectedMatchIndex]}
                        allMatches={matchHistory}
                        currentIndex={selectedMatchIndex}
                        onNavigate={(idx) => setSelectedMatchIndex(idx)}
                        onClose={() => setSelectedMatchIndex(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

/* ─── Seat positions: inverted arc (edges higher, center lower) ─── */
const SEAT_ARC: Record<number, { x: string; y: string; scale: number; z: number }> = {
    1: { x: '8%', y: '80px', scale: 0.9, z: 1 },
    2: { x: '26%', y: '36px', scale: 1.02, z: 2 },
    3: { x: '50%', y: '12px', scale: 1.14, z: 3 },
    4: { x: '74%', y: '36px', scale: 1.02, z: 2 },
    5: { x: '92%', y: '80px', scale: 0.9, z: 1 },
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

function HistoryPanel({ onMatchClick }: { onMatchClick: (index: number) => void }) {
    const [page, setPage] = useState(1);
    const matchHistory = useGameStore((s) => s.matchHistory);
    const totalLen = matchHistory.length;
    const ITEMS_PER_PAGE = 8;
    const totalPages = Math.max(1, Math.ceil(totalLen / ITEMS_PER_PAGE));

    // Ensure page is bounds-checked
    const currentPage = Math.min(Math.max(1, page), totalPages);

    // Sort history by timestamp descending to show latest first reliably
    const sortedHistory = useMemo(() => {
        return [...matchHistory].sort((a, b) => b.timestamp - a.timestamp);
    }, [matchHistory]);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentMatches = sortedHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    if (totalLen === 0) return null;

    return (
        <motion.div className="w-[200px] rounded-xl overflow-hidden flex flex-col"
            style={{ background: 'rgba(10, 6, 4, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '310px' }}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
        >
            <div className="px-3 py-2 border-b border-white/5 flex items-center shrink-0">
                <ClipboardList size={12} className="mr-1.5 text-white/40" />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/40">History</span>
            </div>
            <div className="p-2 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
                {currentMatches.map((match, displayIdx) => {
                    const result = match.seats[0]?.hands[0];
                    if (!result) return null;

                    // Real index in the matchHistory array
                    const realIdx = totalLen - 1 - (startIndex + displayIdx);

                    const diff = calculateMatchNetPnl(match);
                    const { shortLabel, color: accentColor } = getRoomBadgeConfig(match.roomId);
                    const hadInsurance = match.seats.some(s => s.insuranceCost && s.insuranceCost > 0);
                    const { labelStr, colorClass } = getMatchOverallStatus(match, diff);

                    return (
                        <div key={match.id} onClick={() => onMatchClick(realIdx)}
                            className="flex items-center justify-between px-1.5 py-1 rounded bg-white/2 hover:bg-white/5 cursor-pointer transition-colors border border-white/0 hover:border-white/5">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[7px] font-bold px-1 py-0.5 rounded tracking-wider border"
                                    style={{
                                        backgroundColor: `${accentColor}1A`, // 10% opacity 
                                        color: accentColor,
                                        borderColor: `${accentColor}33` // 20% opacity border
                                    }}
                                >
                                    {shortLabel}
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${colorClass}`}>
                                    {labelStr}
                                </span>
                                {hadInsurance && (
                                    <span className="text-[7px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/20 font-bold" title="Insurance purchased">🛡</span>
                                )}
                            </div>
                            <span className={`text-[9px] font-bold tabular-nums tracking-widest ${diff > 0 ? 'text-emerald-400/90' : diff < 0 ? 'text-red-400/90' : 'text-slate-400/80'}`}>
                                {diff >= 0 ? '+' : ''}{diff}
                            </span>
                        </div>
                    );
                })}
            </div>
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-1.5 border-t border-white/5 bg-white/5 shrink-0">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 text-white/40 hover:text-white disabled:opacity-20 cursor-pointer transition-colors hover:bg-white/10 rounded"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-[9px] font-bold text-white/30 tracking-widest">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1 text-white/40 hover:text-white disabled:opacity-20 cursor-pointer transition-colors hover:bg-white/10 rounded"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
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
                className="relative w-[480px] max-h-[80vh] rounded-2xl border border-amber-500/15 flex flex-col overflow-hidden"
                style={{ background: 'rgba(20, 12, 8, 0.95)', backdropFilter: 'blur(20px)' }}
                initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
            >
                <div className="p-6 flex-1 overflow-y-auto pb-10">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-extrabold text-amber-400 uppercase tracking-[0.15em] flex items-center justify-center"><Info size={20} className="mr-2" /> {room.name} Rules</h2>
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer transition-all"
                        ><X size={16} /></button>
                    </div>
                    <div className="space-y-4 text-sm text-white/60">
                        <RuleSection title="Objective" content="Beat the dealer's hand without going over 21. Face cards are worth 10. Aces are worth 1 or 11, whichever makes a better hand." />

                        <RuleSection title="Actions & Glossary">
                            <div className="grid grid-cols-1 gap-2 mt-1">
                                <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                    <strong className="text-white/80 block mb-0.5 text-xs"><Plus size={12} className="inline text-emerald-400 mr-1" />Hit</strong>
                                    <p className="text-[10px] text-white/40 leading-snug">Take another card from the dealer to improve your hand total. You can hit as many times as you want until you reach 21 or Bust.</p>
                                </div>
                                <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                    <strong className="text-white/80 block mb-0.5 text-xs"><Minus size={12} className="inline text-amber-400 mr-1" />Stand</strong>
                                    <p className="text-[10px] text-white/40 leading-snug">Keep your current hand and end your turn. The dealer will then play their hand.</p>
                                </div>
                                <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                    <strong className="text-white/80 block mb-0.5 text-xs"><ChevronsUp size={12} className="inline text-blue-400 mr-1" />Double Down</strong>
                                    <p className="text-[10px] text-white/40 leading-snug">Double your initial bet in exchange for receiving exactly ONE more card, after which you automatically stand.</p>
                                </div>
                                <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                    <strong className="text-white/80 block mb-0.5 text-xs"><ArrowLeftRight size={12} className="inline text-purple-400 mr-1" />Split</strong>
                                    <p className="text-[10px] text-white/40 leading-snug">
                                        {room.id === 'vegas_strip' || room.id === 'vegas_downtown'
                                            ? 'If your first two cards have the same point value (e.g. 8–8 or J–K), double your bet to split them into two separate hands. Aces may only be split once and receive one card each. Double after split is allowed. Maximum 4 hands per seat.'
                                            : 'If your first two cards are the same rank (e.g. 8–8, J–J, K–K), double your bet to split them into two separate hands. Aces may be re-split. Maximum 4 hands per seat.'}
                                    </p>
                                </div>
                                <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                    <strong className="text-white/80 block mb-0.5 text-xs"><Shield size={12} className="inline text-yellow-400 mr-1" />Insurance</strong>
                                    <p className="text-[10px] text-white/40 leading-snug">Offered when the dealer's face-up card is an Ace. Costs half your main bet. Pays 2:1 if the dealer's hidden card makes a Blackjack.</p>
                                </div>
                                {room.gameRules.allowSurrender && (
                                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                        <strong className="text-white/80 block mb-0.5 text-xs"><Flag size={12} className="inline text-orange-400 mr-1" />Surrender</strong>
                                        <p className="text-[10px] text-white/40 leading-snug">Forfeit your hand and lose half your initial bet. Available on your first two cards before any other actions are taken.</p>
                                    </div>
                                )}
                            </div>
                        </RuleSection>

                        <RuleSection title="Payouts">
                            <ul className="space-y-1 mt-1 list-disc list-inside text-white/50 text-xs bg-white/5 rounded-lg border border-white/5 p-3">
                                <li><strong className="text-white/70">{room.rules.blackjackPays}</strong></li>
                                <li><strong className="text-white/70">{room.rules.insurancePays}</strong></li>
                                <li>Regular hand win pays <strong className="text-white/70">1 to 1</strong> (evens)</li>
                                <li><strong>Push (Tie):</strong> You and the dealer have the same total. Your bet is returned to you.</li>
                                <li><strong>Bust:</strong> A hand total exceeds 21. Automatic loss, regardless of the dealer's hand.</li>
                            </ul>
                        </RuleSection>

                        <RuleSection title="Dealer Rules">
                            <p className="text-xs text-white/50 leading-relaxed font-bold mb-1">Plays with {room.gameRules.numberOfDecks} Decks</p>
                            <p className="text-xs text-white/50 leading-relaxed">{room.rules.dealerStands}</p>

                            <p className="text-xs text-white/40 leading-relaxed mt-1">
                                {room.gameRules.dealerHitsSoft17
                                    ? <span>The dealer must draw cards until reaching 17 or higher. On a <strong className="text-white/60">Soft 17</strong> (Ace + 6), the dealer <strong className="text-white/60">must hit</strong> again.</span>
                                    : <span>The dealer stands on <strong className="text-white/60">all 17s</strong>, including Soft 17 (Ace + 6).</span>
                                }
                            </p>
                        </RuleSection>
                    </div>
                </div>
                {/* Educational Disclaimer */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-center z-50 pointer-events-none">
                    <p className="text-[9px] text-white/30 font-medium uppercase tracking-[0.1em] drop-shadow-md">
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