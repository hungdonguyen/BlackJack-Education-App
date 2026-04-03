import { useEffect, useRef } from 'react';
import { useGameStoreBase } from '@/store/gameStore';
import { GamePhase } from '@/types/enums';
import { CHIP_VALUES } from '@/utils/constants';

// Basic mapping based on standard Gamepad structure (Xbox/PlayStation layout)
const BUTTONS = {
    A: 0, // Cross / A - Hit / Place Bet
    B: 1, // Circle / B - Stand / Clear Bets
    X: 2, // Square / X - Double Down
    Y: 3, // Triangle / Y - Split / Surrender
    LB: 4, // Left Bumper - Undo Bet
    RB: 5, // Right Bumper - Deal
    LT: 6, // Left Trigger - Surrender
    RT: 7, // Right Trigger - Rebet / x2
    BACK: 8, // Share / View - Reset round
    START: 9, // Options / Menu - Toggle settings modal
    LS: 10, // Left Stick Press - Clear Bets
    RS: 11, // Right Stick Press - Deal
    UP: 12, // D-pad Up - Select larger chip
    DOWN: 13, // D-pad Down - Select smaller chip
    LEFT: 14, // D-pad Left - Previous seat
    RIGHT: 15, // D-pad Right - Next seat
    HOME: 16, // Guide / PS - Reserved
};

export function useGamepad() {
    const requestRef = useRef<number>(0);
    const lastButtonsRef = useRef<boolean[]>([]);
    const focusedSeatRef = useRef<number>(3);

    useEffect(() => {
        const getFocusedActiveSeatId = () => {
            const store = useGameStoreBase.getState();
            const activeSeatIds = store.seats.filter((seat) => seat.isActive).map((seat) => seat.id);
            if (activeSeatIds.length === 0) return 3;

            if (activeSeatIds.includes(focusedSeatRef.current)) return focusedSeatRef.current;

            const seatFromTurn = store.currentSeatIndex + 1;
            if (activeSeatIds.includes(seatFromTurn)) {
                focusedSeatRef.current = seatFromTurn;
                return seatFromTurn;
            }

            focusedSeatRef.current = activeSeatIds[0];
            return activeSeatIds[0];
        };

        const cycleFocusedSeat = (step: -1 | 1) => {
            const store = useGameStoreBase.getState();
            if (store.gamePhase !== GamePhase.BETTING) return;

            const activeSeatIds = store.seats.filter((seat) => seat.isActive).map((seat) => seat.id);
            if (activeSeatIds.length <= 1) return;

            const current = getFocusedActiveSeatId();
            const currentIndex = Math.max(0, activeSeatIds.indexOf(current));
            const nextIndex = (currentIndex + step + activeSeatIds.length) % activeSeatIds.length;
            focusedSeatRef.current = activeSeatIds[nextIndex];
        };

        const cycleChip = (step: -1 | 1) => {
            const store = useGameStoreBase.getState();
            if (store.gamePhase !== GamePhase.BETTING) return;

            const currentIndex = CHIP_VALUES.findIndex((value) => value === store.selectedChipValue);
            const safeIndex = currentIndex === -1 ? 0 : currentIndex;
            const nextIndex = Math.min(CHIP_VALUES.length - 1, Math.max(0, safeIndex + step));
            store.selectChip(CHIP_VALUES[nextIndex]);
        };

        const handleHitOrBet = () => {
            const store = useGameStoreBase.getState();
            if (store.gamePhase === GamePhase.PLAYER_TURN) {
                store.hit();
                return;
            }

            if (store.gamePhase === GamePhase.INSURANCE) {
                store.acceptInsurance();
                return;
            }

            if (store.gamePhase === GamePhase.BETTING) {
                const seatId = getFocusedActiveSeatId();
                store.placeBet(seatId, store.selectedChipValue);
            }
        };

        const handleStandOrClear = () => {
            const store = useGameStoreBase.getState();
            if (store.gamePhase === GamePhase.PLAYER_TURN) {
                store.stand();
            } else if (store.gamePhase === GamePhase.INSURANCE) {
                store.declineInsurance();
            } else if (store.gamePhase === GamePhase.BETTING) {
                store.clearAllBets();
            }
        };

        const handleDoubleDown = () => {
            const store = useGameStoreBase.getState();
            if (store.gamePhase === GamePhase.PLAYER_TURN) store.doubleDown();
        };

        const handleSplit = () => {
            const store = useGameStoreBase.getState();
            if (store.gamePhase === GamePhase.PLAYER_TURN) {
                const currentSeat = store.seats[store.currentSeatIndex];
                const currentHand = currentSeat?.hands[currentSeat.currentHandIndex];
                const isPairLike = currentHand?.cards.length === 2
                    && currentHand.cards[0].value === currentHand.cards[1].value;

                if (isPairLike) {
                    store.split();
                } else {
                    store.surrender();
                }
            }
        };

        const handleUndoBet = () => {
            const store = useGameStoreBase.getState();
            if (store.gamePhase === GamePhase.BETTING) store.undoBet();
        };

        const handleDeal = () => {
            const store = useGameStoreBase.getState();
            if (store.gamePhase === GamePhase.BETTING) store.startDeal();
        };

        const handleTriggerLeft = () => {
            const store = useGameStoreBase.getState();
            if (store.gamePhase === GamePhase.PLAYER_TURN) {
                store.surrender();
            }
        };

        const handleTriggerRight = () => {
            const store = useGameStoreBase.getState();
            if (store.gamePhase === GamePhase.BETTING) {
                store.rebet();
            }
        };

        const handleBack = () => {
            const store = useGameStoreBase.getState();
            if (store.gamePhase === GamePhase.PAYOUT) {
                store.resetRound();
            }
        };

        const handleStart = () => {
            const store = useGameStoreBase.getState();
            store.setSettingsModalOpen(!store.isSettingsModalOpen);
        };

        const handleLeftStickPress = () => {
            const store = useGameStoreBase.getState();
            if (store.gamePhase === GamePhase.BETTING) {
                store.clearAllBets();
            }
        };

        const handleRightStickPress = () => {
            const store = useGameStoreBase.getState();
            if (store.gamePhase === GamePhase.BETTING) {
                store.startDeal();
            }
        };

        const handleDpadUp = () => {
            cycleChip(1);
        };

        const handleDpadDown = () => {
            cycleChip(-1);
        };

        const handleDpadLeft = () => {
            cycleFocusedSeat(-1);
        };

        const handleDpadRight = () => {
            cycleFocusedSeat(1);
        };

        const updateLoop = () => {
            const gamepads = navigator.getGamepads();
            const gp = gamepads[0]; // Take the first connected gamepad

            if (gp) {
                const currentButtons = gp.buttons.map((b) => b.pressed);
                
                // Compare with previous frame to detect "button down" events
                const isPressed = (index: number) => {
                    return currentButtons[index] && !lastButtonsRef.current[index];
                };

                // Trigger actions on 'button down'
                if (isPressed(BUTTONS.A)) handleHitOrBet();
                if (isPressed(BUTTONS.B)) handleStandOrClear();
                if (isPressed(BUTTONS.X)) handleDoubleDown();
                if (isPressed(BUTTONS.Y)) handleSplit();
                if (isPressed(BUTTONS.LB)) handleUndoBet();
                if (isPressed(BUTTONS.RB)) handleDeal();
                if (isPressed(BUTTONS.LT)) handleTriggerLeft();
                if (isPressed(BUTTONS.RT)) handleTriggerRight();
                if (isPressed(BUTTONS.BACK)) handleBack();
                if (isPressed(BUTTONS.START)) handleStart();
                if (isPressed(BUTTONS.LS)) handleLeftStickPress();
                if (isPressed(BUTTONS.RS)) handleRightStickPress();
                if (isPressed(BUTTONS.UP)) handleDpadUp();
                if (isPressed(BUTTONS.DOWN)) handleDpadDown();
                if (isPressed(BUTTONS.LEFT)) handleDpadLeft();
                if (isPressed(BUTTONS.RIGHT)) handleDpadRight();
                if (isPressed(BUTTONS.HOME)) {
                    // Reserved to avoid clashing with OS/Steam overlay behavior.
                }

                // Save state for next frame
                lastButtonsRef.current = currentButtons;
            } else {
                // Reset button edge detection when gamepad disconnects.
                lastButtonsRef.current = [];
            }

            requestRef.current = requestAnimationFrame(updateLoop);
        };

        requestRef.current = requestAnimationFrame(updateLoop);

        return () => {
            cancelAnimationFrame(requestRef.current);
        };
    }, []);
}
