import React from 'react';
import { BookOpen, Settings, LayoutGrid, Home, Gamepad2 } from 'lucide-react';
import { RoomConfig } from '@/utils/rooms/types';
import ChipRack from '@/components/ChipRack';
import { useAudio } from '@/utils/audio';
import { CountUp } from '@/components/reactbits';

interface BottomHUDProps {
    room: RoomConfig;
    tutorialBalance?: number;
    bankroll?: number;
    totalBet: number;
    setShowStrategy: (show: boolean) => void;
    setShowSettings: (show: boolean) => void;
    setShowControls: (show: boolean) => void;
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
    setShowControls,
    returnToLobby,
    returnHome
}: BottomHUDProps) {
    const { playSound } = useAudio();
    const balanceValue = (room.isTutorial ? tutorialBalance : bankroll) ?? 0;

    return (
        <div className="absolute bottom-0 left-0 right-0 z-50">
            <div className="flex items-center justify-between px-6 md:px-10 xl:px-14 py-2.5"
                style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(10,6,4,0.85) 25%, rgba(10,6,4,0.98) 100%)' }}
            >
                {/* Elevated, safe-padded bankroll pill (safe from browser extension buttons) */}
                <div className="flex items-center gap-4 bg-black/75 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 shadow-2xl ml-36 md:ml-40 shrink-0">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-semibold">Balance</span>
                        <CountUp
                            to={balanceValue} from={balanceValue}
                            prefix="$"
                            duration={0.8}
                            className="text-base md:text-lg font-black tabular-nums leading-tight"
                            style={{ color: room.accentColor }}
                        />
                    </div>
                    <div className="w-px h-7 bg-white/10" />
                    <div className="flex flex-col">
                        <span className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-semibold">Total Bet</span>
                        <CountUp
                            to={totalBet ?? 0} from={totalBet ?? 0}
                            prefix="$"
                            duration={0.5}
                            className="text-base md:text-lg font-black text-white/90 tabular-nums leading-tight"
                        />
                    </div>
                </div>

                {/* Centered ChipRack */}
                <div className="flex-1 flex justify-center px-2">
                    <ChipRack />
                </div>

                {/* Stable, non-drifting action buttons */}
                <div className="flex items-center gap-2.5 mr-2 md:mr-4 shrink-0">
                    <button id="strategy-button" onClick={() => { playSound('click'); setShowStrategy(true); }}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-md hover:scale-105 active:scale-95"
                    ><BookOpen size={15} className="mr-1.5 flex-shrink-0 inline -mt-0.5 text-amber-400" /> Rule & Strategy</button>

                    <button onClick={() => { playSound('click'); setShowControls(true); }}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-md hover:scale-105 active:scale-95"
                    ><Gamepad2 size={15} className="mr-1.5 flex-shrink-0 inline -mt-0.5 text-blue-400" /> Controls</button>

                    <button onClick={() => { playSound('click'); setShowSettings(true); }}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-md hover:scale-105 active:scale-95"
                    ><Settings size={15} className="mr-1.5 flex-shrink-0 inline -mt-0.5 text-purple-400" /> Settings</button>

                    <button onClick={() => { playSound('click'); returnToLobby(); }}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-md hover:scale-105 active:scale-95"
                    ><LayoutGrid size={15} className="mr-1.5 flex-shrink-0 inline -mt-0.5 text-emerald-400" /> Lobby</button>

                    <button onClick={() => { playSound('click'); returnHome(); }}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-md hover:scale-105 active:scale-95"
                    ><Home size={15} className="mr-1.5 flex-shrink-0 inline -mt-0.5 text-red-400" /> Home</button>
                </div>
            </div>
        </div>
    );
}
