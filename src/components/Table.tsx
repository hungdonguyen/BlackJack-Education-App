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
import dynamic from 'next/dynamic';
import PortraitOverlay from './PortraitOverlay';
import TutorialGuide from './TutorialGuide';
import PayoutPanel from './PayoutPanel';

// --- Dynamic Imports for Heavy/Modal Components ---
const StrategyModal = dynamic(() => import('./StrategyModal'));
const HandAdvisor = dynamic(() => import('./HandAdvisor'));
const CardCountingPanel = dynamic(() => import('./CardCountingPanel'));
const MatchDetailModal = dynamic(() => import('./MatchDetailModal'));
const SettingsModal = dynamic(() => import('./SettingsModal'));
const ControlsModal = dynamic(() => import('./ControlsModal'));

import { MusicPlayer } from './MusicPlayer';
import { calculateMatchNetPnl, getRoomBadgeConfig, getMatchOverallStatus } from '@/utils/historyUtils';
import { useAudio } from '@/utils/audio';
import { useViewportScale } from '@/hooks/useViewportScale';

import { useTableController } from '@/hooks/useTableController';

// Import newly extracted subcomponents
import { TopHUD } from './table/TopHUD';
import { BottomHUD } from './table/BottomHUD';
import { HistoryPanel } from './table/HistoryPanel';
import { WinNotificationOverlay } from './table/WinNotificationOverlay';
import { ExitConfirmationModal } from './table/ExitConfirmationModal';
import { InsufficientFundsWarning } from './table/InsufficientFundsWarning';

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

    const gamePhase = useGameStore((s) => s.gamePhase);
    const bankroll = useGameStore((s) => s.bankroll);
    const tutorialBalance = useGameStore((s) => s.tutorialBalance);
    const seats = useGameStore(useShallow((s) => s.seats));
    const currentSeatIndex = useGameStore((s) => s.currentSeatIndex);
    const matchHistory = useGameStore(useShallow((s) => s.matchHistory));
    const insufficientFundsWarning = useGameStore((s) => s.insufficientFundsWarning);
    const insuranceBets = useGameStore(useShallow((s) => s.insuranceBets));
    const sideBets = useGameStore(useShallow((s) => s.sideBets));
    const isHydrated = useStoreHydration();

    

    const showHandAdvisorState = useGameStore((s) => s.showHandAdvisor);
    const variantTutorials = [
        'tutorial_free_action', 'tutorial_zapout', 'tutorial_exchange',
        'tutorial_firecard', 'tutorial_infinity_double_down', 'tutorial_iberian',
        'tutorial_european', 'tutorial_uk'
    ];
    const showHandAdvisor = showHandAdvisorState || roomId === 'tutorial_splitting' || roomId === 'tutorial_strategy' || variantTutorials.includes(roomId || '');
    const showCardCounting = useGameStore((s) => s.showCardCounting);
    const showStrategy = useGameStore((s) => s.isStrategyModalOpen);
    const setShowStrategy = useGameStore((s) => s.setStrategyModalOpen);
    const showSettings = useGameStore((s) => s.isSettingsModalOpen);
    const setShowSettings = useGameStore((s) => s.setSettingsModalOpen);
    const showControls = useGameStore((s) => s.isControlsModalOpen);
    const setShowControls = useGameStore((s) => s.setControlsModalOpen);


    const isInsurance = gamePhase === GamePhase.INSURANCE;
    const isPayout = gamePhase === GamePhase.PAYOUT;

    const totalBet = seats
        .filter((s) => s.isActive)
        .reduce((sum, s) => sum + s.hands.reduce((hSum, h) => hSum + h.betAmount, 0), 0) +
        Object.values(insuranceBets).reduce((sum, amount) => sum + amount, 0) +
        Object.values(sideBets || {}).reduce((sum, amount) => sum + amount, 0);

    const currentSeat = seats[currentSeatIndex];

    const { playSound } = useAudio();

    const {
        winNotification,
        showLogoInfo,
        setShowLogoInfo,
        selectedMatchIndex,
        setSelectedMatchIndex,
        showExitConfirmation,
        setShowExitConfirmation,
        isFullscreen,
        returnToLobby,
        returnHome,
        confirmExit,
        toggleFullscreen,
    } = useTableController(roomId || 'classic', room);


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
                                <TopHUD gamePhase={gamePhase} room={room} />

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
                            {/* Tutorial Exit Confirmation */}
                            <ExitConfirmationModal 
                                showExitConfirmation={showExitConfirmation}
                                setShowExitConfirmation={setShowExitConfirmation}
                                confirmExit={confirmExit}
                            />
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
                            <InsufficientFundsWarning show={insufficientFundsWarning} />
                        </AnimatePresence>

                        {/* ─── Win Notification Overlay ─── */}
                        <AnimatePresence>
                            <WinNotificationOverlay winNotification={winNotification} />
                        </AnimatePresence>


                        {/* ─── Bottom HUD Bar ─── */}
                        <BottomHUD 
                            room={room} 
                            tutorialBalance={tutorialBalance} 
                            bankroll={bankroll} 
                            totalBet={totalBet} 
                            setShowStrategy={setShowStrategy} 
                            setShowSettings={setShowSettings} 
                            setShowControls={setShowControls}
                            returnToLobby={returnToLobby} 
                            returnHome={returnHome} 
                        />

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

                        {/* Controls Modal */}
                        <AnimatePresence>
                            {showControls && (
                                <ControlsModal
                                    roomId={roomId}
                                    accentColor={room.accentColor}
                                    borderColor={room.borderColor}
                                    onClose={() => setShowControls(false)}
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

















