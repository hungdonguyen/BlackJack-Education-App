'use client';

// ============================================
// DevTools — debug panel (development only)
// ============================================

import { useGameStore } from '@/hooks/useGameStore';

export default function DevTools() {
    const addFunds = useGameStore((s) => s.addFunds);
    const forceBlackjack = useGameStore((s) => s.forceBlackjack);
    const forceSplitScenario = useGameStore((s) => s.forceSplitScenario);

    // Only show in development
    if (process.env.NODE_ENV !== 'development') return null;

    const handleClearStorage = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('blackjack-storage');
            window.location.reload();
        }
    };

    return (
        <div className="fixed bottom-16 left-3 z-[100] opacity-20 hover:opacity-100 transition-opacity duration-300">
            <div className="bg-black/90 backdrop-blur-sm rounded-lg border border-white/10 p-2 space-y-1">
                <p className="text-[8px] text-white/40 font-mono uppercase tracking-widest mb-1">
                    ⚙ Dev
                </p>
                <DevButton label="Force Blackjack" onClick={forceBlackjack} />
                <DevButton label="Force Split (8s)" onClick={forceSplitScenario} />
                <DevButton label="Add $10,000" onClick={() => addFunds(10_000)} />
                <DevButton label="Add $1,000,000" onClick={() => addFunds(1_000_000)} />
                <DevButton
                    label="Clear Storage"
                    onClick={handleClearStorage}
                    variant="danger"
                />
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
