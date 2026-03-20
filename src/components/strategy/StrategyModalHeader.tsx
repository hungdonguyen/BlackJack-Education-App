import React from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { RoomConfig } from '@/utils/rooms';

interface StrategyModalHeaderProps {
    room: RoomConfig;
    onClose: () => void;
}

export const StrategyModalHeader: React.FC<StrategyModalHeaderProps> = ({ room, onClose }) => {
    return (
        <div className="relative flex items-center justify-between border-b px-6 py-5 shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 blur-xl opacity-20" style={{ background: room.accentColor }} />
                    <div className="relative rounded-xl border p-2.5" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                        <Sparkles size={22} style={{ color: room.accentColor }} />
                    </div>
                </div>
                <div>
                    <h2 className="text-lg font-black tracking-tight text-white/95" style={{ fontFamily: "'Georgia', serif" }}>
                        Strategy Guide: <span style={{ color: room.accentColor }}>{room.name}</span>
                    </h2>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/35">Interactive Hand Advisor • RTP {room.rtp}</p>
                </div>
            </div>
            <button
                id="strategy-close-btn"
                onClick={onClose}
                className="group relative rounded-full p-2 text-white/40 transition-all hover:bg-white/5 hover:text-white/90"
            >
                <X size={20} />
            </button>
        </div>
    );
};
