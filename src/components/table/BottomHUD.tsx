import React from 'react';
import { BookOpen, Settings, LayoutGrid, Home } from 'lucide-react';
import { RoomConfig } from '@/utils/rooms/types';
import ChipRack from '@/components/ChipRack';
import { useAudio } from '@/utils/audio';

interface BottomHUDProps {
    room: RoomConfig;
    tutorialBalance?: number;
    bankroll?: number;
    totalBet: number;
    setShowStrategy: (show: boolean) => void;
    setShowSettings: (show: boolean) => void;
    returnToLobby: () => void;
    returnHome: () => void;
}

export function BottomHUD({
    room,
    tutorialBalance,
    bankroll,
    totalBet,
    setShowStrategy,
    setShowSettings,
    returnToLobby,
    returnHome
}: BottomHUDProps) {
    const { playSound } = useAudio();

    return (
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
    );
}
