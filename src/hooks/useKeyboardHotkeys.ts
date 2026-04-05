import { useEffect, useRef } from 'react';
import { useGameStoreBase } from '@/store/gameStore';
import { GamePhase, HandStatus } from '@/types/enums';
import { CHIP_VALUES } from '@/utils/constants';
import { getRules } from '@/rules';
import { getRoomConfig } from '@/utils/rooms';
import { getLessons } from '@/store/tutorialSlice';

// ============================================
// Keyboard Hotkeys for Blackjack Gameplay
// ============================================
//
// | Key       | BETTING      | PLAYER_TURN       | INSURANCE | PAYOUT    | Modal    |
// |-----------|--------------|-------------------|-----------|-----------|----------|
// | H         | —            | Hit               | —         | —         | —        |
// | S         | —            | Stand             | —         | —         | —        |
// | D         | —            | Double Down       | —         | —         | —        |
// | P         | —            | Split             | —         | —         | —        |
// | R         | —            | Surrender         | —         | —         | —        |
// | Q         | —            | Zap/Switch/Burn*  | —         | —         | —        |
// | Space     | Place Bet    | (Focus Confirm)   | (Confirm) | New Round | (Confirm)|
// | Enter     | Deal         | (Focus Confirm)   | (Confirm) | New Round | (Confirm)|
// | Backspace | Undo Bet     | —                 | —         | —         | —        |
// | Delete    | Clear All    | —                 | —         | —         | —        |
// | T         | Rebet        | —                 | —         | —         | —        |
// | Y         | —            | —                 | Accept    | —         | —        |
// | N         | —            | —                 | Decline   | —         | —        |
// | ↑ / ↓     | Chip ±       | —                 | —         | —         | —        |
// | ← / →     | Seat ±/Focus | Focus Navigation  | Focus Nav | —         | —        |
// | 1-0       | Quick Chip   | —                 | —         | —         | —        |
// | L         | Lobby        | Lobby             | Lobby     | Lobby     | —        |
// | Home      | Home Page    | Home Page         | Home Page | Home Page | —        |
// | F1        | Strategy     | Strategy          | Strategy  | —         | Close    |
// | F2        | Settings     | Settings          | Settings  | —         | Close    |
//
// * Q = Zap Out / Switch Cards / Burn Card — whichever the current room supports.

const QUICK_CHIP_MAP: Record<string, number> = {
    '`': 0,     // $0.5
    '1': 1,     // $1
    '2': 2,     // $5
    '3': 3,     // $25
    '4': 4,     // $100
    '5': 5,     // $500
    '6': 6,     // $1,000
    '7': 7,     // $5,000
    '8': 8,     // $25,000
    '9': 9,     // $100,000
    '0': 10,    // $500,000
    '-': 11,    // $1,000,000
};

type HoveredAction = 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'zap' | 'switch' | 'burn' | 'rebet' | 'deal' | 'clear' | 'undo' | 'insurance-accept' | 'insurance-decline' | 'new-round' | 'finish-tutorial' | null;

interface KeyboardHotkeyCallbacks {
    onLobby?: () => void;
    onHome?: () => void;
    onFinishTutorial?: () => void;
}

export function useKeyboardHotkeys(callbacks?: KeyboardHotkeyCallbacks) {
    const callbacksRef = useRef(callbacks);
    const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        callbacksRef.current = callbacks;
    }, [callbacks]);

    const focusedSeatRef = useRef<number>(3);

    useEffect(() => {
        const store = useGameStoreBase.getState();

        const getAvailableActions = (): HoveredAction[] => {
            const state = useGameStoreBase.getState();
            const phase = state.gamePhase;
            const rules = getRules(state.currentRoom);
            const currentSeat = state.seats[state.currentSeatIndex];
            const currentHand = currentSeat?.hands[currentSeat.currentHandIndex];
            
            if (phase === GamePhase.BETTING) {
                const roomConfig = getRoomConfig(state.currentRoom);
                const results: HoveredAction[] = ['undo', 'clear', 'deal'];
                if (!roomConfig.isTutorial) results.push('rebet');
                return results;
            }

            if (phase === GamePhase.PLAYER_TURN) {
                const roomConfig = getRoomConfig(state.currentRoom);
                const actions: HoveredAction[] = [];
                // Logic check matching ActionPanel visibility
                actions.push('double');
                actions.push('hit');
                actions.push('stand');
                actions.push('split');
                if (roomConfig.gameRules.allowSurrender) actions.push('surrender');
                if (rules.canZap) actions.push('zap');
                if (rules.canSwitch) actions.push('switch');
                if (rules.canBurn) actions.push('burn');
                return actions;
            }

            if (phase === GamePhase.INSURANCE) {
                return ['insurance-accept', 'insurance-decline'];
            }

            if (phase === GamePhase.PAYOUT) {
                const roomConfig = getRoomConfig(state.currentRoom);
                const lessons = getLessons(state.currentRoom);
                const isLastTutorialLesson = roomConfig.isTutorial && state.tutorialRound >= lessons.length - 1;
                return [isLastTutorialLesson ? 'finish-tutorial' : 'new-round'];
            }

            return [];
        };

        const cycleHoveredAction = (step: -1 | 1) => {
            const state = useGameStoreBase.getState();
            const available = getAvailableActions();
            if (available.length === 0) return;

            const current = state.hoveredAction;
            let nextIndex = 0;
            
            if (current) {
                const currentIndex = available.indexOf(current as HoveredAction);
                if (currentIndex !== -1) {
                    nextIndex = (currentIndex + step + available.length) % available.length;
                }
            } else {
                nextIndex = step === 1 ? 0 : available.length - 1;
            }

            state.setHoveredAction(available[nextIndex]);
        };

        const executeAction = (actionId: HoveredAction) => {
            const state = useGameStoreBase.getState();
            if (!actionId) return;

            // Visual feedback pulse
            state.setHoveredAction(actionId);
            if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
            pulseTimeoutRef.current = setTimeout(() => {
                state.setHoveredAction(null);
            }, 150);

            switch (actionId) {
                case 'hit': state.hit(); break;
                case 'stand': state.stand(); break;
                case 'double': state.doubleDown(); break;
                case 'split': state.split(); break;
                case 'surrender': state.surrender(); break;
                case 'zap': state.zap(); break;
                case 'switch': state.switchCards(); break;
                case 'burn': state.burn(); break;
                case 'undo': state.undoBet(); break;
                case 'clear': state.clearAllBets(); break;
                case 'rebet': state.rebet(); break;
                case 'deal': state.startDeal(); break;
                case 'insurance-accept': state.acceptInsurance(); break;
                case 'insurance-decline': state.declineInsurance(); break;
                case 'new-round': state.resetRound(); break;
                case 'finish-tutorial': {
                    if (callbacksRef.current?.onFinishTutorial) {
                        callbacksRef.current.onFinishTutorial();
                    } else {
                        state.markTutorialCompleted(state.currentRoom);
                        state.resetTutorialProgress();
                        state.resetRound();
                    }
                    break;
                }
            }
        };

        const getFocusedActiveSeatId = () => {
            const state = useGameStoreBase.getState();
            const activeSeatIds = state.seats.filter((seat) => seat.isActive).map((seat) => seat.id);
            if (activeSeatIds.length === 0) return 3;
            if (activeSeatIds.includes(focusedSeatRef.current)) return focusedSeatRef.current;
            return activeSeatIds[0];
        };

        const cycleFocusedSeat = (step: -1 | 1) => {
            const state = useGameStoreBase.getState();
            if (state.gamePhase !== GamePhase.BETTING) return;
            const activeSeatIds = state.seats.filter((seat) => seat.isActive).map((seat) => seat.id);
            if (activeSeatIds.length <= 1) return;
            const current = getFocusedActiveSeatId();
            const currentIndex = Math.max(0, activeSeatIds.indexOf(current));
            const nextIndex = (currentIndex + step + activeSeatIds.length) % activeSeatIds.length;
            focusedSeatRef.current = activeSeatIds[nextIndex];
        };

        const cycleChip = (step: -1 | 1) => {
            const state = useGameStoreBase.getState();
            if (state.gamePhase !== GamePhase.BETTING) return;
            const currentIndex = CHIP_VALUES.findIndex((v) => v === state.selectedChipValue);
            const safeIndex = currentIndex === -1 ? 0 : currentIndex;
            const nextIndex = Math.min(CHIP_VALUES.length - 1, Math.max(0, safeIndex + step));
            state.selectChip(CHIP_VALUES[nextIndex]);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            const tag = (event.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if (event.key === 'Escape') return;

            const state = useGameStoreBase.getState();
            const phase = state.gamePhase;
            const key = event.key;

            // Modals
            if (key === 'F1') {
                event.preventDefault();
                state.setStrategyModalOpen(!state.isStrategyModalOpen);
                return;
            }
            if (key === 'F2') {
                event.preventDefault();
                state.setSettingsModalOpen(!state.isSettingsModalOpen);
                return;
            }
            if (state.isSettingsModalOpen || state.isStrategyModalOpen) return;

            // Navigation
            if (key.toLowerCase() === 'l') { callbacksRef.current?.onLobby?.(); return; }
            if (key === 'Home') { callbacksRef.current?.onHome?.(); return; }

            // Spatial Navigation / Confirm
            if (key === 'ArrowLeft') { 
                event.preventDefault(); 
                if (phase === GamePhase.BETTING && !state.hoveredAction) cycleFocusedSeat(-1);
                else cycleHoveredAction(-1);
                return; 
            }
            if (key === 'ArrowRight') { 
                event.preventDefault(); 
                if (phase === GamePhase.BETTING && !state.hoveredAction) cycleFocusedSeat(1);
                else cycleHoveredAction(1);
                return; 
            }
            if (key === ' ') {
                event.preventDefault();
                if (state.hoveredAction) {
                    executeAction(state.hoveredAction as HoveredAction);
                } else if (phase === GamePhase.BETTING) {
                    state.placeBet(getFocusedActiveSeatId(), state.selectedChipValue);
                } else if (phase === GamePhase.PAYOUT) {
                    const available = getAvailableActions();
                    if (available[0]) executeAction(available[0]);
                } else if (phase === GamePhase.PLAYER_TURN) {
                    executeAction('hit');
                }
                return;
            }

            if (key === 'Enter') {
                event.preventDefault();
                if (state.hoveredAction) {
                    executeAction(state.hoveredAction as HoveredAction);
                } else if (phase === GamePhase.BETTING) {
                    executeAction('deal');
                } else if (phase === GamePhase.PAYOUT) {
                    const available = getAvailableActions();
                    if (available[0]) executeAction(available[0]);
                } else if (phase === GamePhase.PLAYER_TURN) {
                    executeAction('hit');
                }
                return;
            }

            // Direct mapping with pulse feedback
            if (phase === GamePhase.PLAYER_TURN) {
                switch (key.toLowerCase()) {
                    case 'h': executeAction('hit'); return;
                    case 's': executeAction('stand'); return;
                    case 'd': executeAction('double'); return;
                    case 'p': executeAction('split'); return;
                    case 'r': executeAction('surrender'); return;
                    case 'q': {
                        const rules = getRules(state.currentRoom);
                        if (rules.canZap) executeAction('zap');
                        else if (rules.canSwitch) executeAction('switch');
                        else if (rules.canBurn) executeAction('burn');
                        return;
                    }
                }
            }

            if (phase === GamePhase.BETTING) {
                if (QUICK_CHIP_MAP[key] !== undefined) {
                    store.selectChip(CHIP_VALUES[QUICK_CHIP_MAP[key]]);
                    return;
                }
                switch (key.toLowerCase()) {
                    case 'arrowup': event.preventDefault(); cycleChip(1); return;
                    case 'arrowdown': event.preventDefault(); cycleChip(-1); return;
                    case 'backspace': event.preventDefault(); executeAction('undo'); return;
                    case 'delete': executeAction('clear'); return;
                    case 't': executeAction('rebet'); return;
                    case 'd': executeAction('deal'); return;
                }
            }

            if (phase === GamePhase.INSURANCE) {
                if (key.toLowerCase() === 'y') executeAction('insurance-accept');
                if (key.toLowerCase() === 'n') executeAction('insurance-decline');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
        };
    }, []);
}
