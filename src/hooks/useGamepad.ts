import { useEffect, useRef } from 'react';
import { useGameStoreBase } from '@/store/gameStore';
import { GamePhase } from '@/types/enums';
import { CHIP_VALUES } from '@/utils/constants';
import { getRules } from '@/rules';
import { getRoomConfig } from '@/utils/rooms';
import { getLessons } from '@/store/tutorialSlice';

// ============================================
// Gamepad Button Mapping (Xbox / PlayStation layout)
// ============================================
const BUTTONS = {
    A: 0,      // Cross / A
    B: 1,      // Circle / B
    X: 2,      // Square / X
    Y: 3,      // Triangle / Y
    LB: 4,     // Left Bumper
    RB: 5,     // Right Bumper
    LT: 6,     // Left Trigger
    RT: 7,     // Right Trigger
    BACK: 8,   // Share / View
    START: 9,  // Options / Menu
    LS: 10,    // Left Stick Press
    RS: 11,    // Right Stick Press
    UP: 12,    // D-pad Up
    DOWN: 13,  // D-pad Down
    LEFT: 14,  // D-pad Left
    RIGHT: 15, // D-pad Right
    HOME: 16,  // Guide / PS
};

const ANALOG_DEADZONE = 0.5;
const ANALOG_COOLDOWN_MS = 200;

type HoveredAction = 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'zap' | 'switch' | 'burn' | 'rebet' | 'deal' | 'clear' | 'undo' | 'insurance-accept' | 'insurance-decline' | 'new-round' | 'finish-tutorial' | null;

interface GamepadCallbacks {
    onLobby?: () => void;
    onHome?: () => void;
    onFinishTutorial?: () => void;
}

export function useGamepad(callbacks?: GamepadCallbacks) {
    const callbacksRef = useRef(callbacks);
    const requestRef = useRef<number>(0);
    const lastButtonsRef = useRef<boolean[]>([]);
    const pulseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const focusedSeatRef = useRef<number>(3);

    useEffect(() => {
        callbacksRef.current = callbacks;
    }, [callbacks]);

    // Analog stick state
    const analogAxisActiveRef = useRef<{ x: boolean; y: boolean }>({ x: false, y: false });
    const analogLastActionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    useEffect(() => {
        const getAvailableActions = (): HoveredAction[] => {
            const state = useGameStoreBase.getState();
            const phase = state.gamePhase;
            const rules = getRules(state.currentRoom);
            const roomConfig = getRoomConfig(state.currentRoom);
            
            if (phase === GamePhase.BETTING) {
                const results: HoveredAction[] = ['undo', 'clear', 'deal'];
                if (!roomConfig.isTutorial) results.push('rebet');
                return results;
            }

            if (phase === GamePhase.PLAYER_TURN) {
                const actions: HoveredAction[] = ['double', 'hit', 'stand', 'split'];
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

        const isAnyModalOpen = () => {
            const state = useGameStoreBase.getState();
            return state.isSettingsModalOpen || state.isStrategyModalOpen;
        };
        const closeAllModals = () => {
            const state = useGameStoreBase.getState();
            if (state.isSettingsModalOpen) state.setSettingsModalOpen(false);
            if (state.isStrategyModalOpen) state.setStrategyModalOpen(false);
        };

        const handleButtonA = () => {
            if (isAnyModalOpen()) return;
            const state = useGameStoreBase.getState();
            if (state.hoveredAction) {
                executeAction(state.hoveredAction as HoveredAction);
            } else {
                // Default actions
                if (state.gamePhase === GamePhase.BETTING) state.placeBet(getFocusedActiveSeatId(), state.selectedChipValue);
                else if (state.gamePhase === GamePhase.PAYOUT) {
                    const available = getAvailableActions();
                    if (available[0]) executeAction(available[0]);
                }
                else if (state.gamePhase === GamePhase.PLAYER_TURN) executeAction('hit');
                else if (state.gamePhase === GamePhase.INSURANCE) executeAction('insurance-accept');
            }
        };

        const handleButtonB = () => {
            if (isAnyModalOpen()) { closeAllModals(); return; }
            const state = useGameStoreBase.getState();
            if (state.gamePhase === GamePhase.PLAYER_TURN) executeAction('stand');
            else if (state.gamePhase === GamePhase.INSURANCE) executeAction('insurance-decline');
        };

        const handleDpadLeft = () => cycleHoveredAction(-1);
        const handleDpadRight = () => cycleHoveredAction(1);
        const handleDpadUp = () => cycleChip(1);
        const handleDpadDown = () => cycleChip(-1);

        const updateLoop = () => {
            const gp = Array.from(navigator.getGamepads()).find((pad): pad is Gamepad => !!pad);
            if (gp) {
                const now = Date.now();
                const currentButtons = gp.buttons.map((b) => b.pressed);
                const isPressed = (i: number) => currentButtons[i] && !lastButtonsRef.current[i];
                const state = useGameStoreBase.getState();
                const roomConfig = getRoomConfig(state.currentRoom);

                // Button Handlers
                if (isPressed(BUTTONS.A)) handleButtonA();
                if (isPressed(BUTTONS.B)) handleButtonB();
                if (isPressed(BUTTONS.X) && state.gamePhase === GamePhase.PLAYER_TURN) executeAction('double');
                if (isPressed(BUTTONS.Y) && state.gamePhase === GamePhase.PLAYER_TURN) executeAction('split');
                if (isPressed(BUTTONS.START)) state.setSettingsModalOpen(!state.isSettingsModalOpen);
                if (isPressed(BUTTONS.BACK)) callbacksRef.current?.onLobby?.();
                if (isPressed(BUTTONS.HOME)) callbacksRef.current?.onHome?.();
                if (isPressed(BUTTONS.LEFT)) handleDpadLeft();
                if (isPressed(BUTTONS.RIGHT)) handleDpadRight();
                if (isPressed(BUTTONS.UP)) handleDpadUp();
                if (isPressed(BUTTONS.DOWN)) handleDpadDown();
                if (isPressed(BUTTONS.LS)) cycleFocusedSeat(-1);
                if (isPressed(BUTTONS.RS)) cycleFocusedSeat(1);

                // Advanced Actions (LB/RB/RT/LT)
                if (isPressed(BUTTONS.LB)) {
                    if (state.gamePhase === GamePhase.BETTING) executeAction('undo');
                    else {
                        const rules = getRules(state.currentRoom);
                        if (rules.canZap) executeAction('zap');
                    }
                }
                if (isPressed(BUTTONS.RB)) {
                    if (state.gamePhase === GamePhase.BETTING) executeAction('deal');
                    else {
                        const rules = getRules(state.currentRoom);
                        if (rules.canSwitch) executeAction('switch');
                    }
                }
                if (isPressed(BUTTONS.RT)) {
                    if (state.gamePhase === GamePhase.BETTING && !roomConfig.isTutorial) executeAction('rebet');
                    else {
                        const rules = getRules(state.currentRoom);
                        if (rules.canBurn) executeAction('burn');
                    }
                }
                if (isPressed(BUTTONS.LT) && state.gamePhase === GamePhase.PLAYER_TURN) executeAction('surrender');

                // Analog Navigation
                if (gp.axes.length >= 2) {
                    const lx = gp.axes[0];
                    const ly = gp.axes[1];
                    if (Math.abs(lx) > ANALOG_DEADZONE) {
                        if (!analogAxisActiveRef.current.x || (now - analogLastActionRef.current.x > ANALOG_COOLDOWN_MS)) {
                            cycleHoveredAction(lx > 0 ? 1 : -1);
                            analogAxisActiveRef.current.x = true;
                            analogLastActionRef.current.x = now;
                        }
                    } else analogAxisActiveRef.current.x = false;

                    if (Math.abs(ly) > ANALOG_DEADZONE) {
                        if (!analogAxisActiveRef.current.y || (now - analogLastActionRef.current.y > ANALOG_COOLDOWN_MS)) {
                            cycleChip(ly < 0 ? 1 : -1);
                            analogAxisActiveRef.current.y = true;
                            analogLastActionRef.current.y = now;
                        }
                    } else analogAxisActiveRef.current.y = false;
                }

                lastButtonsRef.current = currentButtons;
            }
            requestRef.current = requestAnimationFrame(updateLoop);
        };

        requestRef.current = requestAnimationFrame(updateLoop);
        return () => {
            cancelAnimationFrame(requestRef.current);
            if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
        };
    }, []);
}
