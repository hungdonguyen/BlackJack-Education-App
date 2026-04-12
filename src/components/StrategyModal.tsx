'use client';

// ============================================
// StrategyModal - Basic Strategy Chart
// Premium casino-style presentation
// Refactored into modular components
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Hash, Layers, Layout, Target, Zap, ArrowLeftRight } from 'lucide-react';
import { useModalNavigation } from '@/hooks/useMenuNavigation';

import { RoomConfig } from '@/utils/rooms';
import { useGameStore } from '@/hooks/useGameStore';
import { GameStore } from '@/types/game';
import { getDeviationSet } from '@/utils/countingDeviations';
import { getStrategyTables } from '@/utils/strategyAdvisor';
import { useAudio } from '@/utils/audio';

// Modular Components
import { StrategyModalHeader } from './strategy/StrategyModalHeader';
import { StrategyTabs } from './strategy/StrategyTabs';
import { StrategyRulesTab } from './strategy/StrategyRulesTab';
import { StrategyTableTab } from './strategy/StrategyTableTab';
import { StrategySpecialTab } from './strategy/StrategySpecialTab';
import { StrategyCountingTab } from './strategy/StrategyCountingTab';
import { StrategySwitchTab } from './strategy/StrategySwitchTab';

interface StrategyModalProps {
    room: RoomConfig;
    onClose: () => void;
}

type Tab = 'rules' | 'hard' | 'soft' | 'pairs' | 'special' | 'counting' | 'free_hand' | 'switch_advice';

function getDeviationTableLabel(room: RoomConfig, countTab: 'hilo' | 'kw'): string {
    const setId = room.deviationsSet;

    if (setId === 'iberian_21') {
        return countTab === 'kw'
            ? 'Deviation Table: Iberian 21 Katarina Walker Indices'
            : 'Deviation Table: Iberian 21 Hi-Lo Indices';
    }

    if (setId === 'free_action') return 'Deviation Table: Push 22 (Free Bet) Indices';
    if (setId === 'exchange_21') return 'Deviation Table: Push 22 (Switch/Exchange 21) Indices';
    if (setId === 'zapout_21') return 'Deviation Table: Push 22 (Zap Out trimmed set)';
    if (setId === 'firecard_21') return 'Deviation Table: Fire Card 21 (H17 + Burn Indices)';
    if (setId === 'european') return 'Deviation Table: European ENHC (E18 custom set)';
    if (setId === 'uk') return 'Deviation Table: Illustrious 18 + Fab 4 (UK set)';

    const baseTable = room.gameRules.dealerHitsSoft17 ? 'Illustrious 18 (H17)' : 'Illustrious 18 (S17)';
    const surrenderPart = room.gameRules.allowSurrender ? ' + Fab 4' : '';
    return `Deviation Table: ${baseTable}${surrenderPart}`;
}

export default function StrategyModal({ room, onClose }: StrategyModalProps) {
    const [tab, setTab] = useState<Tab>(room.id === 'tutorial_strategy' ? 'hard' : 'rules');
    const countSystem = useGameStore((s: GameStore) => s.countSystem);
    const [countTab, setCountTab] = useState<'hilo' | 'kw'>(countSystem === 'Katarina Walker' ? 'kw' : 'hilo');
    const { playSound } = useAudio();

    const isIberianHiLo = room.id === 'iberian_21' && countTab === 'hilo';
    const isIberianWalker = room.id === 'iberian_21' && countTab === 'kw';

    // Strategy Data Derivation
    const strategyTables = getStrategyTables(room.strategyType);
    const strategyType = room.id;

    const isInfinityDoubleDownRoom = room.strategyType === 'infinity_double_down';

    // Row definitions
    const HARD_ROWS = isInfinityDoubleDownRoom 
        ? ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17+']
        : ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
    const SOFT_ROWS = isInfinityDoubleDownRoom
        ? ['12', '13', '14', '15', '16', '17', '18', '19+']
        : ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8', 'A,9'];
    const PAIR_ROWS = ['2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A'];

    const activeRows = tab === 'hard'
        ? HARD_ROWS
        : tab === 'soft'
            ? SOFT_ROWS
            : tab === 'pairs'
                ? PAIR_ROWS
                : tab === 'free_hand'
                    ? [...HARD_ROWS, ...SOFT_ROWS]
                    : [];

    const data = tab === 'free_hand'
        ? [...(strategyTables.free_hand?.hard || []), ...(strategyTables.free_hand?.soft || [])]
        : tab === 'hard'
            ? strategyTables.hard
            : tab === 'soft'
                ? strategyTables.soft
                : tab === 'pairs'
                    ? strategyTables.pairs
                    : [];

    const visibleDeviations = getDeviationSet(
        room.deviationsSet,
        countTab === 'kw' ? 'Katarina Walker' : 'Hi-Lo',
        room.gameRules.allowSurrender,
        room.gameRules.dealerHitsSoft17,
    );
    const deviationTableLabel = getDeviationTableLabel(room, countTab);

    const handleTabChange = (newTab: Tab) => {
        playSound('click');
        setTab(newTab);
    };

    const roomTabs: Tab[] = [
        'rules', 'hard', 'soft',
        ...(!isInfinityDoubleDownRoom ? ['pairs' as Tab] : []),
        ...(room.id === 'iberian_21' ? ['special' as Tab] : []),
        ...(room.id === 'free_action' ? ['free_hand' as Tab] : []),
        ...(room.id === 'exchange_21' ? ['switch_advice' as Tab] : []),
        'counting',
    ];

    useModalNavigation({
        onClose,
        onPrev: () => {
            const idx = roomTabs.indexOf(tab);
            const prev = idx <= 0 ? roomTabs.length - 1 : idx - 1;
            handleTabChange(roomTabs[prev]);
        },
        onNext: () => {
            const idx = roomTabs.indexOf(tab);
            const next = idx >= roomTabs.length - 1 ? 0 : idx + 1;
            handleTabChange(roomTabs[next]);
        },
    });

    const tabs = [
        { id: 'rules', label: 'Rules', icon: <BookOpen size={14} /> },
        { id: 'hard', label: 'Hard', icon: <Hash size={14} /> },
        { id: 'soft', label: 'Soft', icon: <Layers size={14} /> },
        ...(!isInfinityDoubleDownRoom ? [{ id: 'pairs', label: 'Pairs', icon: <Layout size={14} /> }] : []),
        ...(room.id === 'iberian_21' ? [{ id: 'special', label: 'Special', icon: <Target size={14} /> }] : []),
        ...(room.id === 'free_action' ? [{ id: 'free_hand', label: 'Free', icon: <Zap size={14} /> }] : []),
        ...(room.id === 'exchange_21' ? [{ id: 'switch_advice', label: 'Switch', icon: <ArrowLeftRight size={14} /> }] : []),
        { id: 'counting', label: 'Counting', icon: <Target size={14} /> },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                className="relative flex h-full max-h-[calc(100%-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[2.5rem] border shadow-2xl md:max-h-[calc(100%-3rem)]"
                style={{
                    background: 'linear-gradient(165deg, #09090b 0%, #111114 100%)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    boxShadow: `0 0 80px ${room.accentColor}15, inset 0 0 40px rgba(0,0,0,0.5)`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <StrategyModalHeader room={room} onClose={onClose} />

                <StrategyTabs
                    room={room}
                    tabs={tabs}
                    activeTab={tab}
                    onTabChange={handleTabChange}
                />

                <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar scroll-smooth md:px-8 md:py-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={tab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {tab === 'rules' && <StrategyRulesTab room={room} />}

                            {(tab === 'hard' || tab === 'soft' || tab === 'pairs' || tab === 'free_hand') && (
                                <StrategyTableTab
                                    room={room}
                                    tab={tab as any}
                                    activeRows={activeRows}
                                    data={data as any}
                                    strategyTables={strategyTables}
                                />
                            )}

                            {tab === 'special' && <StrategySpecialTab room={room} />}

                            {tab === 'counting' && (
                                <StrategyCountingTab
                                    room={room}
                                    strategyType={strategyType}
                                    isIberianWalker={isIberianWalker}
                                    isIberianHiLo={isIberianHiLo}
                                    countTab={countTab}
                                    visibleDeviations={visibleDeviations}
                                    deviationTableLabel={deviationTableLabel}
                                />
                            )}

                            {tab === 'switch_advice' && <StrategySwitchTab room={room} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
}
