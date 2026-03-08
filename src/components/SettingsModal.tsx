'use client';

// ============================================
// Settings Modal — user preferences panel
// ============================================

import { motion } from 'framer-motion';
import { X, Gauge, Zap, Volume2, VolumeX, Eye, EyeOff, Settings, Music } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { DealerSpeed } from '@/store/settingsSlice';
import { useAudio } from '@/utils/audio';

interface SettingsModalProps {
    roomId: string;
    accentColor: string;
    borderColor: string;
    onClose: () => void;
}

export default function SettingsModal({ roomId, accentColor, borderColor, onClose }: SettingsModalProps) {
    const dealerSpeed = useGameStore((s) => s.dealerSpeed);
    const soundEnabled = useGameStore((s) => s.soundEnabled);
    const showHandAdvisor = useGameStore((s) => s.showHandAdvisor);
    const showCardCounting = useGameStore((s) => s.showCardCounting);
    const countSystem = useGameStore((s) => s.countSystem);

    const setDealerSpeed = useGameStore((s) => s.setDealerSpeed);
    const setSoundEnabled = useGameStore((s) => s.setSoundEnabled);
    const setShowHandAdvisor = useGameStore((s) => s.setShowHandAdvisor);
    const setShowCardCounting = useGameStore((s) => s.setShowCardCounting);
    const setCountSystem = useGameStore((s) => s.setCountSystem);
    const musicEnabled = useGameStore((s) => s.musicEnabled);
    const musicVolume = useGameStore((s) => s.musicVolume);
    const soundVolume = useGameStore((s) => s.soundVolume);
    const setMusicEnabled = useGameStore((s) => s.setMusicEnabled);
    const setMusicVolume = useGameStore((s) => s.setMusicVolume);
    const setSoundVolume = useGameStore((s) => s.setSoundVolume);
    const { playSound } = useAudio();

    return (
        <motion.div className="absolute inset-0 z-[200] flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                className="relative w-[420px] max-h-[80vh] rounded-2xl overflow-hidden flex flex-col"
                style={{
                    background: 'rgba(20, 12, 8, 0.97)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${borderColor}`,
                    boxShadow: `0 0 60px ${accentColor}33`,
                }}
                initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
            >
                {/* Header */}
                <div className="p-6 pb-4 flex items-center justify-between border-b border-white/5">
                    <h2 className="text-lg font-extrabold uppercase tracking-[0.15em] flex items-center gap-2"
                        style={{ color: accentColor }}
                    >
                        <Settings size={20} /> Settings
                    </h2>
                    <button onClick={() => { playSound('click'); onClose(); }}
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer transition-all"
                    ><X size={16} /></button>
                </div>

                {/* Settings List */}
                <div className="p-6 space-y-5 overflow-y-auto">

                    {/* Dealer Speed */}
                    <SettingRow
                        icon={dealerSpeed === 'fast' ? <Zap size={18} className="text-yellow-400" /> : <Gauge size={18} className="text-white/60" />}
                        label="Dealer Speed"
                        description="Fast mode for card counting practice"
                    >
                        <div className="flex rounded-lg overflow-hidden border border-white/10">
                            <SpeedButton
                                label="Normal"
                                active={dealerSpeed === 'normal'}
                                accentColor={accentColor}
                                onClick={() => { playSound('switch'); setDealerSpeed('normal'); }}
                            />
                            <SpeedButton
                                label="Fast"
                                active={dealerSpeed === 'fast'}
                                accentColor={accentColor}
                                onClick={() => { playSound('switch'); setDealerSpeed('fast'); }}
                            />
                        </div>
                    </SettingRow>

                    <Divider />

                    {/* Sound */}
                    <SettingRow
                        icon={soundEnabled ? <Volume2 size={18} className="text-emerald-400" /> : <VolumeX size={18} className="text-white/30" />}
                        label="Sound Effects"
                        description="Toggle game audio on/off"
                    >
                        <ToggleSwitch
                            enabled={soundEnabled}
                            accentColor={accentColor}
                            onChange={(val) => { playSound('switch'); setSoundEnabled(val); }}
                        />
                    </SettingRow>

                    {soundEnabled && (
                        <div className="pl-12 flex items-center gap-3">
                            <span className="text-[10px] text-white/40 w-10">Vol</span>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={Math.round(soundVolume * 100)}
                                onChange={(e) => setSoundVolume(Number(e.target.value) / 100)}
                                className="flex-1 h-1 accent-emerald-400 cursor-pointer"
                            />
                            <span className="text-[10px] text-white/40 w-8 text-right">{Math.round(soundVolume * 100)}%</span>
                        </div>
                    )}

                    <Divider />

                    {/* Background Music */}
                    <SettingRow
                        icon={musicEnabled ? <Music size={18} className="text-amber-400" /> : <Music size={18} className="text-white/30" />}
                        label="Background Music"
                        description="Toggle room background music"
                    >
                        <ToggleSwitch
                            enabled={musicEnabled}
                            accentColor={accentColor}
                            onChange={(val) => { playSound('switch'); setMusicEnabled(val); }}
                        />
                    </SettingRow>

                    {musicEnabled && (
                        <>
                            <div className="pl-12 flex items-center gap-3">
                                <span className="text-[10px] text-white/40 w-10">Vol</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={Math.round(musicVolume * 100)}
                                    onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
                                    className="flex-1 h-1 accent-amber-400 cursor-pointer"
                                />
                                <span className="text-[10px] text-white/40 w-8 text-right">{Math.round(musicVolume * 100)}%</span>
                            </div>
                        </>
                    )}

                    <Divider />

                    {/* Hand Advisor */}
                    <SettingRow
                        icon={showHandAdvisor ? <Eye size={18} className="text-sky-400" /> : <EyeOff size={18} className="text-white/30" />}
                        label="Hand Advisor"
                        description="Show strategy recommendations"
                    >
                        <ToggleSwitch
                            enabled={showHandAdvisor}
                            accentColor={accentColor}
                            onChange={(val) => { playSound('switch'); setShowHandAdvisor(val); }}
                        />
                    </SettingRow>

                    <Divider />

                    {/* Card Counting */}
                    <SettingRow
                        icon={showCardCounting ? <Eye size={18} className="text-purple-400" /> : <EyeOff size={18} className="text-white/30" />}
                        label="Card Counting"
                        description="Show running & true count panel"
                    >
                        <ToggleSwitch
                            enabled={showCardCounting}
                            accentColor={accentColor}
                            onChange={(val) => { playSound('switch'); setShowCardCounting(val); }}
                        />
                    </SettingRow>

                    {showCardCounting && roomId === 'iberian_21' && (
                        <>
                            <Divider />
                            <SettingRow
                                icon={<Settings size={18} className="text-amber-400" />}
                                label="Counting System"
                                description="Hi-Lo or Katarina Walker (Iberian 21 only)"
                            >
                                <div className="flex rounded-lg overflow-hidden border border-white/10">
                                    <SpeedButton
                                        label="Hi-Lo"
                                        active={countSystem === 'Hi-Lo'}
                                        accentColor={accentColor}
                                        onClick={() => { playSound('switch'); setCountSystem('Hi-Lo'); }}
                                    />
                                    <SpeedButton
                                        label="K. Walker"
                                        active={countSystem === 'Katarina Walker'}
                                        accentColor={accentColor}
                                        onClick={() => { playSound('switch'); setCountSystem('Katarina Walker'); }}
                                    />
                                </div>
                            </SettingRow>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5 flex flex-col items-center gap-2">
                    <span className="text-[9px] text-white/20 uppercase tracking-[0.3em]">Settings auto-save</span>
                    <div className="text-center text-[8px] text-white/10 leading-tight">
                        Audio Credits: Music by Kevin MacLeod (incompetech.com) & Audionautix.com<br />
                        Licensed under Creative Commons: By Attribution 4.0 License<br />
                        SFX provided by Kenney.nl
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ─── Sub-components ─── */

function SettingRow({ icon, label, description, children }: {
    icon: React.ReactNode;
    label: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-white/90 leading-tight">{label}</p>
                    <p className="text-[10px] text-white/35 leading-tight mt-0.5">{description}</p>
                </div>
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );
}

function SpeedButton({ label, active, accentColor, onClick }: {
    label: string;
    active: boolean;
    accentColor: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${active
                ? 'text-black'
                : 'text-white/40 hover:text-white/70 bg-white/5 hover:bg-white/10'
                }`}
            style={active ? { background: accentColor } : undefined}
        >
            {label}
        </button>
    );
}

function ToggleSwitch({ enabled, accentColor, onChange }: {
    enabled: boolean;
    accentColor: string;
    onChange: (val: boolean) => void;
}) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className="relative w-11 h-6 rounded-full transition-colors cursor-pointer"
            style={{ background: enabled ? accentColor : 'rgba(255,255,255,0.1)' }}
        >
            <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                animate={{ left: enabled ? '22px' : '2px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
        </button>
    );
}

function Divider() {
    return <div className="border-t border-white/5" />;
}
