import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/hooks/useGameStore';
import { useAudio } from '@/utils/audio';
import { GamePhase } from '@/types/enums';
import { calculateMatchNetPnl } from '@/utils/historyUtils';
import { useGamepad } from '@/hooks/useGamepad';
import { useKeyboardHotkeys } from '@/hooks/useKeyboardHotkeys';
import { useGlobalHotkeys } from '@/hooks/useGlobalHotkeys';
import { RoomConfig } from '@/utils/rooms/types';
import { toAppHref } from '@/utils/platform';

export interface UseTableControllerReturn {
    winNotification: { amount: number; isWin: boolean; isPush?: boolean } | null;
    showLogoInfo: boolean;
    setShowLogoInfo: (val: boolean) => void;
    selectedMatchIndex: number | null;
    setSelectedMatchIndex: (idx: number | null) => void;
    showExitConfirmation: { target: 'lobby' | 'home' | null };
    setShowExitConfirmation: (val: { target: 'lobby' | 'home' | null }) => void;
    isFullscreen: boolean;
    returnToLobby: () => void;
    returnHome: () => void;
    confirmExit: () => void;
    toggleFullscreen: () => void;
}

export function useTableController(roomId: string, room: RoomConfig): UseTableControllerReturn {
    const router = useRouter();
    const { playSound } = useAudio();

    // Zustand actions & state
    const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);
    const resetRound = useGameStore((s) => s.resetRound);
    const resetTutorialProgress = useGameStore((s) => s.resetTutorialProgress);
    const markTutorialCompleted = useGameStore((s) => s.markTutorialCompleted);
    const dealerPlay = useGameStore((s) => s.dealerPlay);
    const initializeShoe = useGameStore((s) => s.initializeShoe);
    const shoeLength = useGameStore((s) => s.shoe.length);
    const gamePhase = useGameStore((s) => s.gamePhase);
    const lastCompletedMatch = useGameStore((s) => s.lastCompletedMatch);

    const showStrategy = useGameStore((s) => s.isStrategyModalOpen);
    const setShowStrategy = useGameStore((s) => s.setStrategyModalOpen);
    const showSettings = useGameStore((s) => s.isSettingsModalOpen);
    const setShowSettings = useGameStore((s) => s.setSettingsModalOpen);
    const showControls = useGameStore((s) => s.isControlsModalOpen);
    const setShowControls = useGameStore((s) => s.setControlsModalOpen);

    // Local state for Modals and HUD
    const [winNotification, setWinNotification] = useState<{ amount: number; isWin: boolean; isPush?: boolean } | null>(null);
    const [showLogoInfo, setShowLogoInfo] = useState(false);
    const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(null);
    const [showExitConfirmation, setShowExitConfirmation] = useState<{ target: 'lobby' | 'home' | null }>({ target: null });
    const [isFullscreen, setIsFullscreen] = useState(false);

    const lastOutcomeMatchIdRef = useRef<string | null>(null);

    // Initial setup
    useEffect(() => {
        setCurrentRoom(roomId);
        if (room.isTutorial) {
            resetTutorialProgress(roomId);
        }
        return () => {
            setCurrentRoom('');
        };
    }, [roomId, setCurrentRoom, room.isTutorial, resetTutorialProgress]);

    useEffect(() => {
        if (shoeLength === 0) {
            initializeShoe();
            playSound('shuffle', 0.5, { shortShuffle: true });
        }
    }, [shoeLength, initializeShoe, playSound]);

    // Fullscreen listener
    useEffect(() => {
        const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    // Actions
    const closeTransientLayers = () => {
        setSelectedMatchIndex(null);
        setShowSettings(false);
        setShowControls(false);
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
        router.push(toAppHref('/lobby'));
    };

    const returnHome = () => {
        if (room.isTutorial) {
            setShowExitConfirmation({ target: 'home' });
            return;
        }
        closeTransientLayers();
        resetRound();
        router.push(toAppHref('/'));
    };

    const finishTutorialFromHotkey = () => {
        markTutorialCompleted(roomId);
        resetTutorialProgress();
        closeTransientLayers();
        router.push(toAppHref('/tutorial-lobby'));
    };

    const confirmExit = () => {
        const target = showExitConfirmation.target;
        setShowExitConfirmation({ target: null });
        closeTransientLayers();
        resetTutorialProgress();
        setCurrentRoom('');
        resetRound();
        if (target === 'lobby') {
            router.push(toAppHref('/lobby'));
        } else {
            router.push(toAppHref('/'));
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

    // Hotkeys setup
    const hotkeyHandlers = {
        onLobby: returnToLobby,
        onHome: returnHome,
        onFinishTutorial: finishTutorialFromHotkey,
    };
    useGamepad(hotkeyHandlers);
    useKeyboardHotkeys(hotkeyHandlers);

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
            if (showControls) {
                setShowControls(false);
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

    // Safety: recover from stuck DEALER_TURN
    useEffect(() => {
        if (gamePhase !== GamePhase.DEALER_TURN) return;
        const safetyTimeout = setTimeout(() => {
            dealerPlay();
        }, 10_000);
        return () => clearTimeout(safetyTimeout);
    }, [gamePhase, dealerPlay]);

    // Win notification and payout sound
    const isPayout = gamePhase === GamePhase.PAYOUT;
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
                setWinNotification({ amount: 0, isWin: false, isPush: true });
            }

            const t = setTimeout(() => setWinNotification(null), 4000);
            return () => clearTimeout(t);
        } else if (gamePhase === GamePhase.BETTING || gamePhase === GamePhase.DEALING) {
            lastOutcomeMatchIdRef.current = null;
            setWinNotification(null);
        }
    }, [isPayout, gamePhase, playSound, lastCompletedMatch]);

    return {
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
    };
}
