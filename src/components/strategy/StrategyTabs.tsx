import React from 'react';
import { motion } from 'framer-motion';
import { RoomConfig } from '@/utils/rooms';

interface TabConfig {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface StrategyTabsProps {
    room: RoomConfig;
    tabs: TabConfig[];
    activeTab: string;
    onTabChange: (id: any) => void;
}

export const StrategyTabs: React.FC<StrategyTabsProps> = ({ room, tabs, activeTab, onTabChange }) => {
    return (
        <div className="flex shrink-0 items-center justify-center gap-1.5 border-b px-6 py-3" style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.1)' }}>
            {tabs.map((t) => {
                const isActive = activeTab === t.id;
                return (
                    <button
                        key={t.id}
                        id={`tab-${t.id}`}
                        onClick={() => onTabChange(t.id)}
                        className="group relative flex items-center gap-2 rounded-lg px-4 py-2 transition-all"
                        style={{ background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                    >
                        <div style={{ color: isActive ? room.accentColor : 'rgba(255,255,255,0.35)' }}>
                            {t.icon}
                        </div>
                        <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${isActive ? 'text-white/90' : 'text-white/30 group-hover:text-white/50'}`}>
                            {t.label}
                        </span>
                        {isActive && (
                            <motion.div
                                layoutId="activeTabStrategy"
                                className="absolute -bottom-[13px] left-0 right-0 h-0.5 rounded-full"
                                style={{ background: room.accentColor }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
