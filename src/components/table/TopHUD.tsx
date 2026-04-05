import React from 'react';
import { GamePhase } from '@/types/enums';
import { RoomConfig } from '@/utils/rooms/types';
import { GamePhaseIndicator } from './GamePhaseIndicator';

interface TopHUDProps {
    gamePhase: GamePhase;
    room: RoomConfig;
}

export function TopHUD({ gamePhase, room }: TopHUDProps) {
    return (
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
            <div className="flex items-center justify-start px-4 h-[70px] pl-6"
                style={{ background: 'linear-gradient(180deg, rgba(10,6,4,0.95) 0%, rgba(10,6,4,0.7) 70%, transparent 100%)' }}
            >
                <div className="flex flex-col items-start gap-0 pointer-events-auto">
                    <div className="flex items-center gap-4">
                        <GamePhaseIndicator phase={gamePhase} />
                    </div>
                    <div className="flex items-center gap-3 pl-0.5 mt-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: room.accentColor }}>
                            {room.name}
                        </span>
                        <span className="text-white/20 text-[9px]">|</span>
                        <span className="text-[9px] text-white/35 uppercase tracking-wider">
                            ${room.betRange[0].toLocaleString()} – {room.betRange[1] >= 1000000 ? 'Unlimited' : `$${room.betRange[1].toLocaleString()}`}
                        </span>
                        <span className="text-white/20 text-[9px]">|</span>
                        <span className="text-[9px] text-white/35 uppercase tracking-wider">5 Seats</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
