'use client';

// ============================================
// DevTools — debug panel (development only)
// ============================================

import { useState } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { useRouter } from 'next/navigation';
import { calculateHandValue } from '@/utils/hand';
import { GamePhase } from '@/types/enums';

// ─── Phase badge colours ───
const PHASE_COLORS: Record<string, string> = {
    [GamePhase.BETTING]: 'bg-amber-500/20 text-amber-300',
    [GamePhase.DEALING]: 'bg-sky-500/20 text-sky-300',
    [GamePhase.INSURANCE]: 'bg-yellow-500/20 text-yellow-300',
    [GamePhase.PLAYER_TURN]: 'bg-emerald-500/20 text-emerald-300',
    [GamePhase.DEALER_TURN]: 'bg-red-500/20 text-red-300',
    [GamePhase.PAYOUT]: 'bg-purple-500/20 text-purple-300',
};

// Display a card as short string e.g. "A♠", "K♥"
function cardStr(c: { rank: string; suit: string }): string {
    const r = c.rank === 'ACE' ? 'A' : c.rank === 'JACK' ? 'J' : c.rank === 'QUEEN' ? 'Q' : c.rank === 'KING' ? 'K' : c.rank;
    const s = c.suit === 'HEARTS' ? '♥' : c.suit === 'DIAMONDS' ? '♦' : c.suit === 'CLUBS' ? '♣' : '♠';
    return `${r}${s}`;
}

export default function DevTools() {
    // Disabled entirely for native testing
    return null;
    const router = useRouter();

    // ─── Store selectors ───
    const gamePhase = useGameStore((s) => s.gamePhase);
    const bankroll = useGameStore((s) => s.bankroll);
    const seats = useGameStore((s) => s.seats);
    const dealerHand = useGameStore((s) => s.dealerHand);
    const shoe = useGameStore((s) => s.shoe);
    const currentSeatIndex = useGameStore((s) => s.currentSeatIndex);
    const matchHistory = useGameStore((s) => s.matchHistory);
    const addFunds = useGameStore((s) => s.addFunds);
    const setBankroll = useGameStore((s) => s.setBankroll);
    const forceBlackjack = useGameStore((s) => s.forceBlackjack);
    const forceBust = useGameStore((s) => s.forceBust);
    const forcePush = useGameStore((s) => s.forcePush);
    const forceDealerBust = useGameStore((s) => s.forceDealerBust);
    const forceInsurance = useGameStore((s) => s.forceInsurance);
    const forceDoubleSetup = useGameStore((s) => s.forceDoubleSetup);
    const forceSplitScenario = useGameStore((s) => s.forceSplitScenario);
    const forceAceSplitScenario = useGameStore((s) => s.forceAceSplitScenario);
    const calculatePayouts = useGameStore((s) => s.calculatePayouts);
    const resetRound = useGameStore((s) => s.resetRound);

    const [collapsed, setCollapsed] = useState(false);
    const [bankrollInput, setBankrollInput] = useState('');
    const [openSection, setOpenSection] = useState<string | null>('state');

    // Only show in development
    if (process.env.NODE_ENV !== 'development') return null;

    const activeSeats = seats.filter((s) => s.isActive);
    const dealerVisible = dealerHand.cards.filter((c) => !c.isHidden);
    const dealerValue = dealerVisible.length > 0 ? calculateHandValue(dealerVisible) : null;

    const handleClearStorage = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('blackjack-storage');
            window.location.reload();
        }
    };

    const toggleSection = (id: string) => setOpenSection((prev) => (prev === id ? null : id));

    return (
        <div className="fixed bottom-16 left-3 z-[300] opacity-25 hover:opacity-100 transition-opacity duration-300 w-56 font-mono select-none">
            <div className="bg-black/97 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl overflow-hidden">

                {/* Header */}
                <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer border-b border-white/10 hover:bg-white/5"
                    onClick={() => setCollapsed((c) => !c)}
                >
                    <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">⚙ DevTools</span>
                    <span className="text-white/30 text-[9px]">{collapsed ? '▶' : '▼'}</span>
                </div>

                {!collapsed && (
                    <div className="max-h-[72vh] overflow-y-auto">

                        {/* ══ LIVE STATE ══ */}
                        <DevSection title="Live State" id="state" open={openSection} toggle={toggleSection}>
                            <Row label="Phase">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${PHASE_COLORS[gamePhase] ?? 'text-white/60'}`}>
                                    {gamePhase}
                                </span>
                            </Row>
                            <Row label="Bankroll">
                                <span className="text-[9px] text-emerald-400 font-bold">${bankroll.toLocaleString()}</span>
                            </Row>
                            <Row label="Shoe">
                                <span className="text-[9px] text-white/50">{shoe.length} cards</span>
                            </Row>

                            {/* Dealer */}
                            {dealerHand.cards.length > 0 && (
                                <div className="mt-2 p-1.5 bg-white/[0.03] rounded-lg border border-white/5">
                                    <div className="text-[8px] text-white/25 uppercase tracking-wider mb-1">Dealer</div>
                                    <div className="flex flex-wrap gap-0.5 mb-1">
                                        {dealerHand.cards.map((c, i) => (
                                            <span key={i} className={`text-[10px] font-bold px-1 rounded ${c.isHidden ? 'bg-white/5 text-white/20' : 'bg-white/10 text-white/80'}`}>
                                                {c.isHidden ? '??' : cardStr(c)}
                                            </span>
                                        ))}
                                    </div>
                                    {dealerValue && (
                                        <span className="text-[9px] text-white/40">{dealerValue.isSoft ? 'Soft ' : ''}{dealerValue.total}</span>
                                    )}
                                </div>
                            )}

                            {/* Seats */}
                            {activeSeats.map((seat) => {
                                const isCurrent = seats.indexOf(seat) === currentSeatIndex && gamePhase === GamePhase.PLAYER_TURN;
                                return (
                                    <div key={seat.id} className={`mt-1.5 p-1.5 rounded-lg border ${isCurrent ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                                        <div className={`text-[8px] uppercase tracking-wider mb-1 ${isCurrent ? 'text-emerald-400' : 'text-white/25'}`}>
                                            Seat {seat.id}{isCurrent ? ' ◀' : ''}
                                        </div>
                                        {seat.hands.map((hand, hi) => {
                                            const hv = hand.cards.length > 0 ? calculateHandValue(hand.cards) : null;
                                            const statusColor =
                                                hand.status === 'BUST' ? 'bg-red-500/20 text-red-400' :
                                                    hand.status === 'BLACKJACK' ? 'bg-yellow-500/20 text-yellow-300' :
                                                        hand.status === 'WON' ? 'bg-emerald-500/15 text-emerald-400' :
                                                            hand.status === 'LOST' ? 'bg-red-500/15 text-red-400' :
                                                                hand.status === 'PUSH' ? 'bg-sky-500/15 text-sky-400' : 'text-white/15';
                                            return (
                                                <div key={hi} className="mb-0.5">
                                                    <div className="flex flex-wrap gap-0.5 mb-0.5">
                                                        {hand.cards.map((c, ci) => (
                                                            <span key={ci} className="text-[10px] font-bold text-white/80 bg-white/10 px-1 rounded">{cardStr(c)}</span>
                                                        ))}
                                                    </div>
                                                    {hv && (
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-[9px] text-white/40">{hv.isSoft ? 'Soft ' : ''}{hv.total}</span>
                                                            <span className={`text-[8px] uppercase px-1 rounded font-bold ${statusColor}`}>{hand.status}</span>
                                                            <span className="text-[8px] text-white/20">bet ${hand.betAmount}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                            <div className="text-[8px] text-white/15 mt-2">{matchHistory.length} rounds recorded</div>
                        </DevSection>

                        {/* ══ FORCE SCENARIOS ══ */}
                        <DevSection title="Force Scenarios" id="force" open={openSection} toggle={toggleSection}
                            badge={gamePhase !== GamePhase.BETTING ? '⚡ BETTING only' : undefined}>
                            <div className="space-y-0.5">
                                <GroupLabel>Player hand</GroupLabel>
                                <DevBtn label="Blackjack  (A + K)" onClick={forceBlackjack} disabled={gamePhase !== GamePhase.BETTING} />
                                <DevBtn label="Bust  (16 → hit 10)" onClick={forceBust} disabled={gamePhase !== GamePhase.BETTING} />
                                <DevBtn label="Push  (20 vs 20)" onClick={forcePush} disabled={gamePhase !== GamePhase.BETTING} color="sky" />
                                <DevBtn label="Double  (9 + 2 = 11)" onClick={forceDoubleSetup} disabled={gamePhase !== GamePhase.BETTING} color="sky" />
                                <GroupLabel className="mt-2">Dealer outcome</GroupLabel>
                                <DevBtn label="Dealer Bust (6+10 hit)" onClick={forceDealerBust} disabled={gamePhase !== GamePhase.BETTING} color="orange" />
                                <DevBtn label="Insurance  (Ace up)" onClick={forceInsurance} disabled={gamePhase !== GamePhase.BETTING} color="orange" />
                                <GroupLabel className="mt-2">Split</GroupLabel>
                                <DevBtn label="Split  8 – 8" onClick={forceSplitScenario} disabled={gamePhase !== GamePhase.BETTING} color="purple" />
                                <DevBtn label="Split  A – A" onClick={forceAceSplitScenario} disabled={gamePhase !== GamePhase.BETTING} color="purple" />
                            </div>
                        </DevSection>

                        {/* ══ PHASE CONTROLS ══ */}
                        <DevSection title="Phase Controls" id="phase" open={openSection} toggle={toggleSection}>
                            <div className="space-y-0.5">
                                <DevBtn label="⏩ Skip to Payout" onClick={calculatePayouts}
                                    disabled={gamePhase === GamePhase.BETTING || gamePhase === GamePhase.PAYOUT} color="purple" />
                                <DevBtn label="↺ Reset Round" onClick={resetRound}
                                    disabled={gamePhase === GamePhase.BETTING} color="orange" />
                            </div>
                        </DevSection>

                        {/* ══ BANKROLL ══ */}
                        <DevSection title="Bankroll" id="bankroll" open={openSection} toggle={toggleSection}>
                            <div className="space-y-0.5 mb-2">
                                <DevBtn label="+$1,000" onClick={() => addFunds(1_000)} />
                                <DevBtn label="+$10,000" onClick={() => addFunds(10_000)} />
                                <DevBtn label="+$1,000,000" onClick={() => addFunds(1_000_000)} />
                                <DevBtn label="Set $0  (test broke)" onClick={() => setBankroll(0)} color="danger" />
                            </div>
                            <div className="flex gap-1.5">
                                <input
                                    type="number"
                                    value={bankrollInput}
                                    onChange={(e) => setBankrollInput(e.target.value)}
                                    placeholder="Set exact amount…"
                                    className="flex-1 min-w-0 text-[10px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/70 placeholder-white/20 outline-none focus:border-emerald-500/40"
                                />
                                <button
                                    onClick={() => { if (bankrollInput) { setBankroll(Number(bankrollInput)); setBankrollInput(''); } }}
                                    className="text-[10px] px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded border border-emerald-500/20 hover:bg-emerald-500/30 transition-colors whitespace-nowrap"
                                >Set</button>
                            </div>
                        </DevSection>

                        {/* ══ NAVIGATION ══ */}
                        <DevSection title="Navigation" id="nav" open={openSection} toggle={toggleSection}>
                            <div className="space-y-0.5">
                                <DevBtn label="Classic VIP" onClick={() => router.push('/game/classic')} />
                                <DevBtn label="Vegas Strip" onClick={() => router.push('/game/vegas_strip')} color="purple" />
                                <DevBtn label="Vegas Dwtwn" onClick={() => router.push('/game/vegas_downtown')} color="sky" />
                                <DevBtn label="Lobby" onClick={() => router.push('/lobby')} color="sky" />
                                <DevBtn label="Home" onClick={() => router.push('/')} color="sky" />
                            </div>
                        </DevSection>

                        {/* ══ DANGER ══ */}
                        <div className="px-3 py-2 border-t border-white/10 space-y-0.5">
                            <DevBtn label="Clear Storage & Reload" onClick={handleClearStorage} color="danger" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Helper components ─── */

function DevSection({
    id, title, badge, open, toggle, children,
}: {
    id: string; title: string; badge?: string;
    open: string | null; toggle: (id: string) => void;
    children: React.ReactNode;
}) {
    const isOpen = open === id;
    return (
        <div className="border-b border-white/[0.06]">
            <button
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-white/[0.04] transition-colors"
                onClick={() => toggle(id)}
            >
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-white/40 uppercase tracking-widest">{title}</span>
                    {badge && <span className="text-[8px] text-orange-400/60">{badge}</span>}
                </div>
                <span className="text-white/20 text-[10px]">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && <div className="px-3 pb-3">{children}</div>}
        </div>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-0.5">
            <span className="text-[9px] text-white/30">{label}</span>
            {children}
        </div>
    );
}

function GroupLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <p className={`text-[8px] text-white/20 uppercase tracking-widest pt-1 pb-0.5 ${className}`}>{children}</p>;
}

function DevBtn({
    label, onClick, color = 'green', disabled = false,
}: {
    label: string; onClick: () => void;
    color?: 'green' | 'sky' | 'purple' | 'orange' | 'danger';
    disabled?: boolean;
}) {
    const colors: Record<string, string> = {
        green: 'text-emerald-400 hover:bg-emerald-500/15',
        sky: 'text-sky-300 hover:bg-sky-500/15',
        purple: 'text-violet-400 hover:bg-violet-500/15',
        orange: 'text-orange-400 hover:bg-orange-500/15',
        danger: 'text-red-400 hover:bg-red-500/15',
    };
    return (
        <button onClick={onClick} disabled={disabled}
            className={`block w-full text-left px-2 py-1 rounded text-[10px] transition-colors duration-100 ${disabled ? 'text-white/15 cursor-not-allowed' : `cursor-pointer ${colors[color]}`
                }`}
        >
            {label}
        </button>
    );
}
