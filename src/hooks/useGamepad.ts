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

        const getFocusedSeatId = () => {
            const state = useGameStoreBase.getState();
            return state.focusedSeatId !== null ? state.focusedSeatId : 3;
        };

        const cycleFocusedSeat = (step: -1 | 1) => {
            const state = useGameStoreBase.getState();
            if (state.gamePhase !== GamePhase.BETTING) return;
            const current = getFocusedSeatId();
            let nextId = current + step;
            // 1 to 5
            if (nextId > 5) nextId = 1;
            if (nextId < 1) nextId = 5;
            state.setFocusedSeatId(nextId);
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
                if (state.gamePhase === GamePhase.BETTING) {
                    const focusedId = getFocusedSeatId();
                    const seat = state.seats.find((s) => s.id === focusedId);
                    if (seat) {
                        if (!seat.isActive) {
                            state.toggleSeat(focusedId);
                        } else {
                            state.placeBet(focusedId, state.selectedChipValue);
                        }
                    }
                }
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
            else if (state.gamePhase === GamePhase.BETTING) {
                const focusedId = getFocusedSeatId();
                const seat = state.seats.find(s => s.id === focusedId);
                if (seat && seat.isActive) {
                    const mainBet = seat.hands.reduce((sum, h) => sum + h.betAmount, 0);
                    if (mainBet > 0) state.clearBet(focusedId);
                    else state.toggleSeat(focusedId);
                }
            }
        };

        const handleDpadLeft = () => {
            const state = useGameStoreBase.getState();
            if (state.gamePhase === GamePhase.BETTING && !state.hoveredAction) cycleFocusedSeat(-1);
            else cycleHoveredAction(-1);
        };
        const handleDpadRight = () => {
            const state = useGameStoreBase.getState();
            if (state.gamePhase === GamePhase.BETTING && !state.hoveredAction) cycleFocusedSeat(1);
            else cycleHoveredAction(1);
        };
        const handleDpadUp = () => {
            const state = useGameStoreBase.getState();
            state.setHoveredAction(null);
            cycleChip(1);
        };
        const handleDpadDown = () => {
            const state = useGameStoreBase.getState();
            state.setHoveredAction(null);
            cycleChip(-1);
        };

        const updateLoop = () => {
            const gp = Array.from(navigator.getGamepads()).find((pad): pad is Gamepad => !!pad);
            if (gp) {
                const now = Date.now();
                const currentButtons = gp.buttons.map((b) => b.pressed);
                const isPressed = (i: number) => currentButtons[i] && !lastButtonsRef.current[i];
                const state = useGameStoreBase.getState();
                const roomConfig = getRoomConfig(state.currentRoom);

                const mapping = state.gamepadMapping;

                // Hit / Generic Confirm
                if (isPressed(mapping.hit)) handleButtonA();
                // Stand / Generic Cancel
                if (isPressed(mapping.stand)) handleButtonB();
                
                if (isPressed(mapping.double) && state.gamePhase === GamePhase.PLAYER_TURN) executeAction('double');
                if (isPressed(mapping.split) && state.gamePhase === GamePhase.PLAYER_TURN) executeAction('split');

                // System Actions (Fixed mapping)
                if (isPressed(BUTTONS.START)) state.setSettingsModalOpen(!state.isSettingsModalOpen);
                if (isPressed(BUTTONS.BACK)) callbacksRef.current?.onLobby?.();
                if (isPressed(BUTTONS.HOME)) callbacksRef.current?.onHome?.();

                // Navigation (Fixed mapping)
                if (isPressed(BUTTONS.LEFT)) handleDpadLeft();
                if (isPressed(BUTTONS.RIGHT)) handleDpadRight();
                if (isPressed(BUTTONS.UP)) handleDpadUp();
                if (isPressed(BUTTONS.DOWN)) handleDpadDown();
                if (isPressed(BUTTONS.LS)) cycleFocusedSeat(-1);
                if (isPressed(BUTTONS.RS)) cycleFocusedSeat(1);

                // Betting actions
                if (state.gamePhase === GamePhase.BETTING) {
                    if (isPressed(mapping.undo)) executeAction('undo');
                    if (isPressed(mapping.deal)) executeAction('deal');
                    if (isPressed(mapping.rebet) && !roomConfig.isTutorial) executeAction('rebet');
                    if (isPressed(mapping.clear) && mapping.clear !== undefined) executeAction('clear');
                } else if (state.gamePhase === GamePhase.PLAYER_TURN) {
                    const rules = getRules(state.currentRoom);
                    if (isPressed(mapping.zap) && rules.canZap) executeAction('zap');
                    if (isPressed(mapping.switch) && rules.canSwitch) executeAction('switch');
                    if (isPressed(mapping.burn) && rules.canBurn) executeAction('burn');
                    if (isPressed(mapping.surrender)) executeAction('surrender');
                }

                // Analog Navigation
                if (gp.axes.length >= 2) {
                    const lx = gp.axes[0];
                    const ly = gp.axes[1];
                    if (Math.abs(lx) > ANALOG_DEADZONE) {
                        if (!analogAxisActiveRef.current.x || (now - analogLastActionRef.current.x > ANALOG_COOLDOWN_MS)) {
                            if (state.gamePhase === GamePhase.BETTING && !state.hoveredAction) cycleFocusedSeat(lx > 0 ? 1 : -1);
                            else cycleHoveredAction(lx > 0 ? 1 : -1);
                            analogAxisActiveRef.current.x = true;
                            analogLastActionRef.current.x = now;
                        }
                    } else analogAxisActiveRef.current.x = false;

                    if (Math.abs(ly) > ANALOG_DEADZONE) {
                        if (!analogAxisActiveRef.current.y || (now - analogLastActionRef.current.y > ANALOG_COOLDOWN_MS)) {
                            state.setHoveredAction(null);
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
