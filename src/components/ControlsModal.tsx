import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, Keyboard, RotateCcw } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { useAudio } from '@/utils/audio';
import { useModalNavigation } from '@/hooks/useMenuNavigation';

interface ControlsModalProps {
    roomId?: string;
    accentColor: string;
    borderColor: string;
    onClose: () => void;
}

const ACTION_LABELS: Record<string, string> = {
    hit: 'Hit / Confirm',
    stand: 'Stand / Cancel',
    double: 'Double Down',
    split: 'Split',
    surrender: 'Surrender',
    zap: 'Zap Out',
    switch: 'Switch Cards',
    burn: 'Burn Card',
    deal: 'Deal',
    undo: 'Undo Bet',
    clear: 'Clear Bets',
    rebet: 'Rebet',
};

const GAMEPAD_NAMES: Record<number, string> = {
    0: 'A', 1: 'B', 2: 'X', 3: 'Y',
    4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT',
    8: 'BACK', 9: 'START', 10: 'LS', 11: 'RS',
    12: 'D-UP', 13: 'D-DOWN', 14: 'D-LEFT', 15: 'D-RIGHT', 16: 'HOME'
};

const formatKeyName = (key: string) => {
    if (key === ' ') return 'Space';
    if (key === 'Control') return 'Ctrl';
    return key.length === 1 ? key.toUpperCase() : key;
};

export default function ControlsModal({ accentColor, borderColor, onClose }: ControlsModalProps) {
    const keyboardMapping = useGameStore((s) => s.keyboardMapping);
    const gamepadMapping = useGameStore((s) => s.gamepadMapping);
    const setKeyboardMapping = useGameStore((s) => s.setKeyboardMapping);
    const setGamepadMapping = useGameStore((s) => s.setGamepadMapping);
    const resetControlsToDefault = useGameStore((s) => s.resetControlsToDefault);
    const { playSound } = useAudio();

    const [activeTab, setActiveTab] = useState<'keyboard' | 'gamepad'>('keyboard');
    const [listeningAction, setListeningAction] = useState<string | null>(null);

    useModalNavigation({
        onClose: () => {
            if (listeningAction) {
                setListeningAction(null);
            } else {
                playSound('click');
                onClose();
            }
        },
    });

    useEffect(() => {
        if (activeTab !== 'keyboard' || !listeningAction) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            const key = e.key;
            if (key !== 'Escape') {
                setKeyboardMapping(listeningAction, key);
                playSound('switch');
            }
            setListeningAction(null);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTab, listeningAction, setKeyboardMapping, playSound]);

    useEffect(() => {
        if (activeTab !== 'gamepad' || !listeningAction) return;

        let reqId: number;
        let lastButtons: boolean[] = [];

        const pollGamepad = () => {
            const gp = Array.from(navigator.getGamepads()).find((pad): pad is Gamepad => !!pad);
            if (gp) {
                const currentButtons = gp.buttons.map((b) => b.pressed);
                // Check for only newly pressed buttons
                const pressedIndex = currentButtons.findIndex((pressed, i) => pressed && !lastButtons[i]);
                
                if (pressedIndex !== -1 && pressedIndex <= 16) {
                    setGamepadMapping(listeningAction, pressedIndex);
                    playSound('switch');
                    setListeningAction(null);
                    return; 
                }
                lastButtons = currentButtons;
            }
            reqId = requestAnimationFrame(pollGamepad);
        };
        reqId = requestAnimationFrame(pollGamepad);

        return () => cancelAnimationFrame(reqId);
    }, [activeTab, listeningAction, setGamepadMapping, playSound]);

    const handleReset = () => {
        resetControlsToDefault();
        playSound('switch');
    };

    return (
        <motion.div className="absolute inset-0 z-[200] flex items-center justify-center p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !listeningAction && onClose()} />
            
            <motion.div
                className="relative w-full max-w-[480px] max-h-[85vh] md:max-h-[864px] rounded-2xl overflow-hidden flex flex-col"
                style={{
                    background: 'rgba(20, 12, 8, 0.97)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${borderColor}`,
                    boxShadow: `0 0 60px ${accentColor}33`,
                }}
                initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
            >
                <div className="p-6 pb-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-extrabold uppercase tracking-[0.15em] flex items-center gap-2"
                            style={{ color: accentColor }}
                        >
                            <Gamepad2 size={24} /> Controls
                        </h2>
                        <button onClick={() => { playSound('click'); onClose(); }}
                            aria-label="Close Controls"
                            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
                        ><X size={16} /></button>
                    </div>

                    <div className="flex border border-white/10 rounded-lg overflow-hidden p-1 bg-black/40">
                        <button 
                            className={`flex flex-1 items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'keyboard' ? 'text-black' : 'text-white/40 hover:text-white/80'}`}
                            style={activeTab === 'keyboard' ? { background: accentColor } : {}}
                            onClick={() => { playSound('switch'); setActiveTab('keyboard'); setListeningAction(null); }}
                        >
                            <Keyboard size={16} /> Keyboard
                        </button>
                        <button 
                            className={`flex flex-1 items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'gamepad' ? 'text-black' : 'text-white/40 hover:text-white/80'}`}
                            style={activeTab === 'gamepad' ? { background: accentColor } : {}}
                            onClick={() => { playSound('switch'); setActiveTab('gamepad'); setListeningAction(null); }}
                        >
                            <Gamepad2 size={16} /> Gamepad
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {/* Map entries */}
                    {Object.entries(ACTION_LABELS).map(([actionKey, label]) => {
                        const isKeyboard = activeTab === 'keyboard';
                        const isListening = listeningAction === actionKey;
                        const boundVal = isKeyboard ? keyboardMapping[actionKey as keyof typeof keyboardMapping] : gamepadMapping[actionKey as keyof typeof gamepadMapping];
                        
                        let displayVal = boundVal;
                        if (isKeyboard && typeof boundVal === 'string') displayVal = formatKeyName(boundVal);
                        else if (!isKeyboard && typeof boundVal === 'number') displayVal = GAMEPAD_NAMES[boundVal] || `Btn ${boundVal}`;
                        if (boundVal === undefined) displayVal = 'Unbound';

                        return (
                            <div key={actionKey} className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                                <span className="text-sm font-bold text-white/80 uppercase tracking-widest">{label}</span>
                                
                                <button
                                    onClick={() => { playSound('click'); setListeningAction(actionKey); }}
                                    className={`relative flex items-center justify-center min-w-[80px] h-9 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border
                                        ${isListening 
                                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse' 
                                            : 'bg-white/5 border-white/10 text-white/60 group-hover:text-white/90 group-hover:bg-white/10 group-hover:border-white/20'}`}
                                >
                                    {isListening ? 'Press Any...' : displayVal}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest pl-2">
                        Auto-saved to LocalStorage
                    </p>
                    <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all"
                    >
                        <RotateCcw size={14} /> Reset Defaults
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
