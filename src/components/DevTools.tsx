'use client';

// ============================================
// DevTools — debug panel (development only)
// ============================================

import { useGameStore } from '@/hooks/useGameStore';
import { useRouter } from 'next/navigation';

export default function DevTools() {
    const addFunds = useGameStore((s) => s.addFunds);
    const forceBlackjack = useGameStore((s) => s.forceBlackjack);
    const forceBust = useGameStore((s) => s.forceBust);
    const forceSplitScenario = useGameStore((s) => s.forceSplitScenario);
    const forceAceSplitScenario = useGameStore((s) => s.forceAceSplitScenario);

    // Only show in development
    if (process.env.NODE_ENV !== 'development') return null;

    const handleClearStorage = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('blackjack-storage');
            window.location.reload();
        }
    };

    const router = useRouter();

    return (
        <div className="fixed bottom-16 left-3 z-[100] opacity-20 hover:opacity-100 transition-opacity duration-300 w-48">
            <div className="bg-black/95 backdrop-blur-md rounded-xl border border-white/10 p-3 shadow-2xl">
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                    <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest font-bold">
                        ⚙ Engine DevTools
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <p className="text-[9px] text-white/40 uppercase tracking-widest px-1">Game States</p>
                        <DevButton label="Force Blackjack" onClick={forceBlackjack} />
                        <DevButton label="Force Bust (Lose)" onClick={forceBust} />
                        <DevButton label="Force Split (8s)" onClick={forceSplitScenario} />
                        <DevButton label="Force Split (Aces)" onClick={forceAceSplitScenario} />
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-[9px] text-white/40 uppercase tracking-widest px-1">Bankroll</p>
                        <DevButton label="Add $10,000" onClick={() => addFunds(10_000)} />
                        <DevButton label="Add $1,000,000" onClick={() => addFunds(1_000_000)} />
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                        <p className="text-[9px] text-white/40 uppercase tracking-widest px-1">Rooms</p>
                        <DevButton label="Vegas Strip" onClick={() => router.push('/game/vegas_strip')} />
                        <DevButton label="VIP Classic" onClick={() => router.push('/game/classic')} />
                    </div>

                    <div className="pt-2 border-t border-white/10">
                        <DevButton
                            label="Clear Storage & Reset"
                            onClick={handleClearStorage}
                            variant="danger"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function DevButton({
    label,
    onClick,
    variant = 'default',
}: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
}) {
    return (
        <button
            onClick={onClick}
            className={`
        block w-full text-left px-2 py-1 rounded text-[11px] font-mono
        transition-colors duration-150
        ${variant === 'danger'
                    ? 'text-red-400 hover:bg-red-500/20'
                    : 'text-green-400 hover:bg-green-500/20'
                }
      `}
        >
            {label}
        </button>
    );
}
