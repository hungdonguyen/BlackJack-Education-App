'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/hooks/useGameStore';
import { useGameStoreBase } from '@/store/gameStore';
import { GamePhase } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';

const TURN_TIMER_SECONDS = 30;
export function TurnTimer() {
    const [timer, setTimer] = useState(TURN_TIMER_SECONDS);
    const gamePhase = useGameStore(s => s.gamePhase);
    const currentRoom = useGameStore(s => s.currentRoom);
    const room = getRoomConfig(currentRoom);
    const isPlayerTurn = gamePhase === GamePhase.PLAYER_TURN;
    
    // Dependencies to restart timer on actions
    const currentSeatIndex = useGameStore(s => s.currentSeatIndex);
    const actionCounter = useGameStore(s => s.actionCounter);
    const currentSeat = useGameStore(s => s.seats[s.currentSeatIndex]);
    const currentHandIndex = currentSeat?.currentHandIndex;

    useEffect(() => {
        let interval: NodeJS.Timeout;
        let expired = false;

        if (isPlayerTurn && !room.isTutorial) {
            setTimer(TURN_TIMER_SECONDS);
            interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        if (!expired) {
                            expired = true;
                            // Safe Zustand mutation bypassing React batching context
                            const state = useGameStoreBase.getState();
                            const roomCfg = getRoomConfig(state.currentRoom);
                            const isSingleCardStart = (roomCfg.gameRules.playerInitialCards ?? 2) === 1;
                            const cSeat = state.seats[state.currentSeatIndex];
                            const cHand = cSeat?.hands[cSeat.currentHandIndex];
                            
                            if (isSingleCardStart && cHand && cHand.cards.length === 1) {
                                state.hit();
                            } else {
                                state.stand();
                            }
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setTimer(TURN_TIMER_SECONDS);
        }

        return () => {
            clearInterval(interval);
        };
    }, [isPlayerTurn, currentSeatIndex, currentHandIndex, actionCounter, room.isTutorial]);

    if (!isPlayerTurn || room.isTutorial || timer === undefined) return null;

    return (
        <motion.div
            className={`flex items-center justify-center rounded-full border-2 bg-black/80 backdrop-blur-md shadow-xl
                ${timer <= 5 ? 'border-red-500/80' : timer <= 10 ? 'border-yellow-500/80 text-yellow-500' : 'border-emerald-500/80 text-emerald-400'}`}
            style={{ width: 46, height: 46 }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
        >
            <span className={`text-lg font-black tabular-nums ${timer <= 5 ? 'text-red-500 animate-pulse' : ''}`}>
                {timer}
            </span>
        </motion.div>
    );
}

const INSURANCE_TIMER_SECONDS = 10;
export function InsuranceTimer() {
    const [timer, setTimer] = useState(INSURANCE_TIMER_SECONDS);
    const gamePhase = useGameStore(s => s.gamePhase);
    const currentRoom = useGameStore(s => s.currentRoom);
    const room = getRoomConfig(currentRoom);
    const isInsurance = gamePhase === GamePhase.INSURANCE;
    const currentSeatIndex = useGameStore(s => s.currentSeatIndex);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        let expired = false;

        if (isInsurance && !room.isTutorial) {
            setTimer(INSURANCE_TIMER_SECONDS);
            interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        if (!expired) {
                            expired = true;
                            useGameStoreBase.getState().declineInsurance();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setTimer(INSURANCE_TIMER_SECONDS);
        }

        return () => {
            clearInterval(interval);
        };
    }, [isInsurance, currentSeatIndex, room.isTutorial]);

    if (!isInsurance || room.isTutorial || timer === undefined) return null;

    return (
        <motion.div
            className={`flex items-center justify-center rounded-full border-2 bg-black/80 backdrop-blur-md shadow-xl
                ${timer <= 3 ? 'border-red-500/80' : timer <= 5 ? 'border-yellow-500/80 text-yellow-500' : 'border-yellow-400/80 text-yellow-400'}`}
            style={{ width: 46, height: 46 }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
        >
            <span className={`text-lg font-black tabular-nums ${timer <= 3 ? 'text-red-500 animate-pulse' : ''}`}>
                {timer}
            </span>
        </motion.div>
    );
}
