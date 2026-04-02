'use client';

// ============================================
// Table — Full-featured Evolution Gaming style
// ============================================

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, useStoreHydration } from '@/hooks/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { useGameStoreBase } from '@/store/gameStore';
import { Info, Home, X, Coins, Shield, Spade, Timer, ClipboardList, Plus, Minus, ChevronsUp, ArrowLeftRight, Sparkles, User, BookOpen, Settings, LayoutGrid, Flag, ChevronLeft, ChevronRight } from 'lucide-react';
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
import TutorialGuide from './TutorialGuide';
import PayoutPanel from './PayoutPanel';
import StrategyModal from './StrategyModal';
import HandAdvisor from './HandAdvisor';
import CardCountingPanel from './CardCountingPanel';
import MatchDetailModal from './MatchDetailModal';
import SettingsModal from './SettingsModal';
import { MusicPlayer } from './MusicPlayer';
import { calculateMatchNetPnl, getRoomBadgeConfig, getMatchOverallStatus } from '@/utils/historyUtils';
import { useAudio } from '@/utils/audio';
import { useViewportScale } from '@/hooks/useViewportScale';
import { useGlobalHotkeys } from '@/hooks/useGlobalHotkeys';

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;
const ROOM_UI_SCALE = 1.08;

const compactClaimNumber = (value: number) => {
    if (Math.abs(value) < 1_000_000) return value.toLocaleString();
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
};

export default function Table({ roomId = 'classic' }: { roomId?: string }) {
    const room = getRoomConfig(roomId);
    const router = useRouter();

    const initializeShoe = useGameStore((s) => s.initializeShoe);
    const shoe = useGameStore(useShallow((s) => s.shoe));
    const gamePhase = useGameStore((s) => s.gamePhase);
    const bankroll = useGameStore((s) => s.bankroll);
    const tutorialBalance = useGameStore((s) => s.tutorialBalance);
    const seats = useGameStore(useShallow((s) => s.seats));
    const currentSeatIndex = useGameStore((s) => s.currentSeatIndex);
    const matchHistory = useGameStore(useShallow((s) => s.matchHistory));
    const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);
    const insufficientFundsWarning = useGameStore((s) => s.insufficientFundsWarning);
    const insuranceBets = useGameStore(useShallow((s) => s.insuranceBets));
    const sideBets = useGameStore(useShallow((s) => s.sideBets));
    const resetRound = useGameStore((s) => s.resetRound);
    const resetTutorialProgress = useGameStore((s) => s.resetTutorialProgress);
    const isHydrated = useStoreHydration();

    

    const showHandAdvisorState = useGameStore((s) => s.showHandAdvisor);
    const variantTutorials = [
        'tutorial_free_action', 'tutorial_zapout', 'tutorial_exchange',
        'tutorial_firecard', 'tutorial_madness', 'tutorial_iberian',
        'tutorial_european', 'tutorial_uk'
    ];
    const showHandAdvisor = showHandAdvisorState || roomId === 'tutorial_splitting' || roomId === 'tutorial_strategy' || variantTutorials.includes(roomId || '');
    const showCardCounting = useGameStore((s) => s.showCardCounting);
    const showStrategy = useGameStore((s) => s.isStrategyModalOpen);
    const setShowStrategy = useGameStore((s) => s.setStrategyModalOpen);
    const showSettings = useGameStore((s) => s.isSettingsModalOpen);
    const setShowSettings = useGameStore((s) => s.setSettingsModalOpen);


    const isInsurance = gamePhase === GamePhase.INSURANCE;
    const isPayout = gamePhase === GamePhase.PAYOUT;

    const totalBet = seats
        .filter((s) => s.isActive)
        .reduce((sum, s) => sum + s.hands.reduce((hSum, h) => hSum + h.betAmount, 0), 0) +
        Object.values(insuranceBets).reduce((sum, amount) => sum + amount, 0) +
        Object.values(sideBets || {}).reduce((sum, amount) => sum + amount, 0);

    const currentSeat = seats[currentSeatIndex];
    const lastOutcomeMatchIdRef = useRef<string | null>(null);

    // Set current room in store and reset tutorial if needed
    useEffect(() => {
        setCurrentRoom(roomId);
        if (room.isTutorial) {
            resetTutorialProgress(roomId);
        }
        return () => {
            setCurrentRoom('');
        };
    }, [roomId, setCurrentRoom, room.isTutorial, resetTutorialProgress]);

    const [winNotification, setWinNotification] = useState<{amount: number, isWin: boolean, isPush?: boolean} | null>(null);
    const [showLogoInfo, setShowLogoInfo] = useState(false);
    const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(null);
    const [showExitConfirmation, setShowExitConfirmation] = useState<{target: 'lobby'|'home'|null}>({target: null});
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const { playSound } = useAudio();

    const closeTransientLayers = () => {
        setSelectedMatchIndex(null);
        setShowSettings(false);
        setShowStrategy(false);
        setShowLogoInfo(false);
    };

    const returnToLobby = () => {
        if (room.isTutorial) {
            setShowExitConfirmation({ target: 'lobby' });
            return;
        }
        closeTransientLayers();
        resetRound();
        router.push('/lobby');
    };

    const returnHome = () => {
        if (room.isTutorial) {
            setShowExitConfirmation({ target: 'home' });
            return;
        }
        closeTransientLayers();
        resetRound();
        router.push('/');
    };

    const confirmExit = () => {
        const target = showExitConfirmation.target;
        setShowExitConfirmation({ target: null });
        closeTransientLayers();
        resetTutorialProgress();
        setCurrentRoom('');
        resetRound();
        if (target === 'lobby') {
            router.push('/lobby');
        } else {
            router.push('/');
        }
    };

    const toggleFullscreen = async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
                return;
            }

            await document.documentElement.requestFullscreen();
        } catch (error) {
            console.warn('[Table] Fullscreen toggle failed:', error);
        }
    };

    useEffect(() => {
        if (shoe.length === 0) {
            initializeShoe();
            playSound('shuffle', 0.5, { shortShuffle: true });
        }
    }, [shoe.length, initializeShoe, playSound]);

    useGlobalHotkeys({
        onEscape: () => {
            if (selectedMatchIndex !== null) {
                setSelectedMatchIndex(null);
                return;
            }
            if (showSettings) {
                setShowSettings(false);
                return;
            }
            if (showStrategy) {
                setShowStrategy(false);
                return;
            }
            if (showLogoInfo) {
                setShowLogoInfo(false);
                return;
            }
            returnToLobby();
        }
    });

    // Safety: recover from stuck DEALER_TURN (e.g. async error in dealerPlay)
    const dealerPlay = useGameStore((s) => s.dealerPlay);
    useEffect(() => {
        if (gamePhase !== GamePhase.DEALER_TURN) return;
        const safetyTimeout = setTimeout(() => {
            dealerPlay();
        }, 10_000);
        return () => clearTimeout(safetyTimeout);
    }, [gamePhase, dealerPlay]);

    // Win notification and outcome sound on payout
    const lastCompletedMatch = useGameStore((s) => s.lastCompletedMatch);
    useEffect(() => {
        if (isPayout) {
            const lastMatch = lastCompletedMatch;
            if (!lastMatch || lastOutcomeMatchIdRef.current === lastMatch.id) return;
            lastOutcomeMatchIdRef.current = lastMatch.id;

            const netRoundChange = calculateMatchNetPnl(lastMatch);

            if (netRoundChange > 0) {
                setWinNotification({ amount: netRoundChange, isWin: true });
                playSound('win');
            } else if (netRoundChange < 0) {
                setWinNotification({ amount: Math.abs(netRoundChange), isWin: false });
                playSound('lose');
            } else {
                // Pure push — clear any stale notification then show PUSH briefly
                setWinNotification({ amount: 0, isWin: false, isPush: true });
            }

            const t = setTimeout(() => setWinNotification(null), 4000);
            return () => clearTimeout(t);
        } else if (gamePhase === GamePhase.BETTING || gamePhase === GamePhase.DEALING) {
            lastOutcomeMatchIdRef.current = null;
            setWinNotification(null);
        }
    }, [isPayout, gamePhase, playSound, lastCompletedMatch]);


// Logo path from room config
const logoPath = room.logoPath;

    const roomBasePercent = 100 / ROOM_UI_SCALE;

    if (!isHydrated) {
        return (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

            {/* Table layout canvas */}
            <div style={{ width: '100%', height: '100%', position: 'relative', background: '#1a0e0a' }}>
                    <div
                        className="room-text-scale"
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: `${roomBasePercent}%`,
                            height: `${roomBasePercent}%`,
                            transform: `translate(-50%, -50%) scale(${ROOM_UI_SCALE})`,
                            transformOrigin: 'center center',
                            fontSize: 'calc(1rem + 7px)',
                            ['--room-text-scale' as string]: 1.1,
                        }}
                    >

                        <div className="relative w-full h-full overflow-hidden select-none"
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
                                <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
                                    <div className="flex items-center justify-start px-4 h-[70px] pl-6"
                                        style={{ background: 'linear-gradient(180deg, rgba(10,6,4,0.95) 0%, rgba(10,6,4,0.7) 70%, transparent 100%)' }}
                                    >
                                        <div className="flex flex-col items-start gap-0 pointer-events-auto">
                                            <div className="flex items-center gap-4">
                                                <GamePhaseIndicator phase={gamePhase} />
                                            </div>
                                            <div className="flex items-center gap-3 pl-0.5 mt-0.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: room.accentColor }}>
                                                    {room.name}
                                                </span>
                                                <span className="text-white/20 text-[9px]">|</span>
                                                <span className="text-[9px] text-white/35 uppercase tracking-wider">
                                                    ${room.betRange[0].toLocaleString()} – {room.betRange[1] >= 1000000 ? 'Unlimited' : `$${room.betRange[1].toLocaleString()}`}
                                                </span>
                                                <span className="text-white/20 text-[9px]">|</span>
                                                <span className="text-[9px] text-white/35 uppercase tracking-wider">5 Seats</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Resized Logo — moved to table felt area (blue box in user request) */}
                                <div
                                    className="absolute z-20 cursor-pointer hover:scale-105 transition-all origin-center group"
                                    style={{
                                        top: '45px',
                                        left: '510px',
                                        width: '250px',
                                        height: '200px',
                                        filter: 'drop-shadow(0 0 30px rgba(0,0,0,0.5))'
                                    }}
                                    onClick={() => { playSound('click'); setShowLogoInfo(true); }}
                                >
                                    <Image
                                        src={logoPath}
                                        alt={room.name}
                                        fill
                                        className="object-contain opacity-85 group-hover:opacity-100 transition-opacity"
                                        sizes="210px"
                                        unoptimized
                                    />
                                    {/* Subtle glow effect behind logo */}
                                    <div className="absolute inset-0 -z-10 bg-white/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {/* Music Player — top-right corner */}
                                <div className="absolute top-0 right-4 z-20">
                                    <MusicPlayer roomId={roomId} />
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
                                            onClick={() => { playSound('click'); setShowLogoInfo(false); }}
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
                                                        ${room.betRange[0]} - {room.betRange[1] >= 1000000 ? 'Unlimited' : `$${room.betRange[1].toLocaleString()}`}
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

                            {/* Tutorial Exit Confirmation */}
                            {showExitConfirmation.target && (
                                <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                                    <motion.div
                                        className="relative w-full max-w-sm rounded-2xl p-8 border border-white/10 shadow-2xl text-center"
                                        style={{ background: 'rgba(15, 10, 8, 0.98)' }}
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    >
                                        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                                            <Flag size={28} className="text-red-500" />
                                        </div>

                                        <h3 className="text-2xl font-black text-white/95 mb-2">Leave Tutorial?</h3>
                                        <p className="text-white/50 text-sm leading-relaxed mb-8">
                                            Are you sure you want to exit? Your tutorial progress will be lost and you'll have to start over next time.
                                        </p>

                                        <div className="flex flex-col gap-3">
                                            <motion.button
                                                onClick={() => { playSound('click'); confirmExit(); }}
                                                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider shadow-lg shadow-red-600/20 transition-colors cursor-pointer"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                Confirm Exit
                                            </motion.button>
                                            <motion.button
                                                onClick={() => { playSound('click'); setShowExitConfirmation({ target: null }); }}
                                                className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-bold uppercase tracking-widest transition-colors mb-2 cursor-pointer"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                Keep Learning
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* Dealer Area — top center */}
                        <div className="absolute top-[45px] left-1/2 -translate-x-1/2 z-15">
                            <DealerArea />
                        </div>

                        {/* Payout stack — left side */}
                        <div className="absolute top-[85px] left-[15px] z-15 flex w-[250px] flex-col gap-2">
                            <PayoutPanel roomConfig={room} />
                        </div>


                        {/* Hand Advisor — right of PayoutPanel */}
                        {showHandAdvisor && (
                            <div className="absolute top-[85px] left-[275px] z-15">
                                <HandAdvisor roomId={roomId} accentColor={room.accentColor} borderColor={room.borderColor} onOpenStrategy={() => setShowStrategy(true)} />
                            </div>
                        )}

                        {/* Card Counting Panel — right side next to history */}
                        {showCardCounting && (!room.isTutorial || roomId === 'tutorial_counting') && (
                            <div className="absolute top-[85px] z-15" style={{ right: 216 }}>
                                <CardCountingPanel roomId={roomId} numDecks={room.gameRules.numberOfDecks} accentColor={room.accentColor} borderColor={room.borderColor} onOpenSettings={() => setShowSettings(true)} onOpenStrategy={() => setShowStrategy(true)} />
                            </div>
                        )}

                        {/* Match History — right side */}
                        <div className="absolute top-[85px] right-[12px] z-15">
                            <HistoryPanel onMatchClick={(idx) => setSelectedMatchIndex(idx)} />
                        </div>

                        {/* Action Buttons — center */}
                        <div className="absolute left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4" style={{ top: 'calc(33% + 25px)' }}>
                            <ActionPanel
                                currentInsuranceSeat={isInsurance ? seats[currentSeatIndex]?.id : undefined} />
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
                                            <span className="text-red-400/80 text-[10px] uppercase font-semibold">Please wait claim daily to continue</span>
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
                                            ${((room.isTutorial ? tutorialBalance : bankroll) ?? 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-white/30 uppercase tracking-[0.2em]">Total Bet</span>
                                        <span className="text-lg font-black text-white/80 tabular-nums leading-tight">
                                            ${(totalBet ?? 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                </div>

                                <ChipRack />

                                <div className="flex items-center gap-3">
                                    <button id="strategy-button" onClick={() => { playSound('click'); setShowStrategy(true); }}
                                        className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-wider hover:bg-white/20 hover:text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                                    ><BookOpen size={16} className="mr-1.5 flex-shrink-0 inline -mt-0.5" /> Rule & Strategy</button>
                                    <button onClick={() => { playSound('click'); setShowSettings(true); }}
                                        className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-wider hover:bg-white/20 hover:text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                                    ><Settings size={16} className="mr-1.5 flex-shrink-0 inline -mt-0.5" /> Settings</button>
                                    <button onClick={() => { playSound('click'); returnToLobby(); }}
                                        className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-wider hover:bg-white/20 hover:text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                                    ><LayoutGrid size={16} className="mr-1.5 flex-shrink-0 inline -mt-0.5" /> Lobby</button>
                                    <button onClick={() => { playSound('click'); returnHome(); }}
                                        className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-wider hover:bg-white/20 hover:text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                                    ><Home size={16} className="mr-1.5 flex-shrink-0 inline -mt-0.5" /> Home</button>
                                </div>
                            </div>
                        </div>

                        {/* Strategy Modal */}
                        <AnimatePresence>
                            {showStrategy && <StrategyModal room={room} onClose={() => setShowStrategy(false)} />}
                        </AnimatePresence>

                        {/* Settings Modal */}
                        <AnimatePresence>
                            {showSettings && (
                                <SettingsModal
                                    roomId={roomId}
                                    accentColor={room.accentColor}
                                    borderColor={room.borderColor}
                                    isFullscreen={isFullscreen}
                                    onClose={() => setShowSettings(false)}
                                    onToggleFullscreen={toggleFullscreen}
                                    onSaveAndExit={returnToLobby}
                                />
                            )}
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

                    </div>{/* end room scale wrapper */}

                    {/* Tutorial Guide dialogue — OUTSIDE room scale wrapper for stable positioning */}
                    <TutorialGuide show={!showExitConfirmation.target} />
                </div>{/* end table wrapper */}
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
    const { playSound } = useAudio();
    const [page, setPage] = useState(1);
    const matchHistory = useGameStore(useShallow((s) => s.matchHistory));
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
                        <div key={match.id} onClick={() => { playSound('click'); onMatchClick(realIdx); }}
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
                        onClick={() => { playSound('click'); setPage(p => Math.max(1, p - 1)); }}
                        disabled={currentPage === 1}
                        className="p-1 text-white/40 hover:text-white disabled:opacity-20 cursor-pointer transition-colors hover:bg-white/10 rounded"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-[9px] font-bold text-white/30 tracking-widest">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => { playSound('click'); setPage(p => Math.min(totalPages, p + 1)); }}
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













