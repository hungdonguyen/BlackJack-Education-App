'use client';

import { useMemo, useState } from 'react';
import { Fragment } from 'react';
import Link from 'next/link';
import { Eye, Pause, Play, RotateCcw, ShieldAlert, TrendingUp, X } from 'lucide-react';
import { useGameStore, useStoreHydration } from '@/hooks/useGameStore';
import { getLobbyRooms, getRoomConfig } from '@/utils/rooms';
import type { MatchRecord } from '@/types/game';
import type { SimulatorConfig } from '@/types/simulator';
import StrategyModal from '@/components/StrategyModal';

interface PreRunRiskSnapshot {
  projectedPeakBet: number;
  projectedBankrollAtRiskPct: number;
  projectedRiskOfRuinPct: number;
  notes: string[];
}

function formatMoney(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  return `${sign}$${abs.toLocaleString()}`;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function ratio(value: number): string {
  if (!Number.isFinite(value)) return 'inf';
  return value.toFixed(2);
}

function humanizeSimulatorAction(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) return '';
  if (trimmed === 'NO_BET') return 'No bet placed (insufficient bankroll or table limit).';
  if (trimmed === 'BLACKJACK') return 'Blackjack';

  const switchParsed = /^S(\d+):SWITCH$/.exec(trimmed);
  if (switchParsed) {
    return `Seat ${Number(switchParsed[1])}: Switch second cards`;
  }

  const parsed = /^S(\d+)H(\d+):([A-Z0-9_]+)$/.exec(trimmed);
  const legacyParsed = /^H(\d+):([A-Z0-9_]+)$/.exec(trimmed);

  if (!parsed && !legacyParsed) return trimmed.replaceAll('_', ' ').toLowerCase();

  const seatIndex = parsed ? Number(parsed[1]) : 1;
  const handIndex = parsed ? Number(parsed[2]) : Number(legacyParsed?.[1] ?? 1);
  const actionCode = parsed ? parsed[3] : (legacyParsed?.[2] ?? '');
  const actionMap: Record<string, string> = {
    HIT: 'Hit',
    STAND: 'Stand',
    DOUBLE: 'Double Down',
    SPLIT: 'Split',
    SURRENDER: 'Surrender',
    BURN: 'Burn Card',
    FREE_DOUBLE: 'Free Double',
    FREE_SPLIT: 'Free Split',
    BLACKJACK: 'Blackjack',
    H: 'Hit',
    S: 'Stand',
    D: 'Double Down',
    SP: 'Split',
    SU: 'Surrender',
    B: 'Burn Card',
  };

  const readable = actionMap[actionCode] ?? actionCode;
  return `Seat ${seatIndex} · Hand ${handIndex}: ${readable}`;
}

function normalizeActionList(actions: string[], blackjacks = 0): string[] {
  const list = actions
    .map(humanizeSimulatorAction)
    .filter((entry) => entry.length > 0);
  if (list.length === 0 && blackjacks > 0) return ['Blackjack'];
  return list.length > 0 ? list : ['No action recorded'];
}

function buildPreRunRiskSnapshot(config: SimulatorConfig): PreRunRiskSnapshot {
  let projectedPeakBet = config.baseUnit;
  const notes: string[] = [];

  if (config.bettingSystem === 'martingale') {
    const steps = Math.max(1, config.bettingParams.martingaleMaxSteps ?? 6);
    projectedPeakBet = config.baseUnit * 2 ** Math.max(0, steps - 1);
    notes.push(`Martingale progression up to step ${steps}.`);
  } else if (config.bettingSystem === 'parlay') {
    const steps = Math.max(1, config.bettingParams.parlayMaxSteps ?? 4);
    const multiplier = Math.max(1.1, config.bettingParams.parlayMultiplier ?? 2);
    projectedPeakBet = config.baseUnit * multiplier ** Math.max(0, steps - 1);
    notes.push(`Parlay multiplier ${multiplier.toFixed(1)} over ${steps} steps.`);
  } else if (config.bettingSystem === '1326') {
    projectedPeakBet = config.baseUnit * 6;
    notes.push('1-3-2-6 progression reaches a 6u peak on step 4.');
  } else {
    notes.push('Flat betting keeps a stable stake around the base unit.');
  }

  const projectedBankrollAtRiskPct = Math.min(1, projectedPeakBet * 3 / Math.max(1, config.initialBankroll));
  const projectedRiskOfRuinPct = Math.min(1, projectedPeakBet * 6 / Math.max(1, config.initialBankroll));

  return {
    projectedPeakBet,
    projectedBankrollAtRiskPct,
    projectedRiskOfRuinPct,
    notes,
  };
}

function buildRiskConclusion(
  pre: PreRunRiskSnapshot,
  post: { bankrollAtRiskPct: number; riskOfRuinEstimate: number; roi: number },
): string {
  const preRisk = (pre.projectedBankrollAtRiskPct + pre.projectedRiskOfRuinPct) / 2;
  const postRisk = (post.bankrollAtRiskPct + post.riskOfRuinEstimate) / 2;
  const delta = postRisk - preRisk;

  if (post.roi < 0 && delta > 0.08) return 'Unlucky run with significantly higher realized risk than projected.';
  if (post.roi < 0 && delta <= 0.08) return 'Strategy was not effective in this run. Consider a lower-variance setup.';
  if (post.roi > 0 && delta > 0.1) return 'Profitable run, but returns came with higher-than-expected risk.';
  if (post.roi > 0 && delta <= 0) return 'Better than expected: positive return with controlled risk.';
  return 'Mixed result: realized performance and risk are close to projection.';
}

function EquityChart({ values }: { values: number[] }) {
  const points = useMemo(() => {
    if (values.length <= 1) return '';
    const width = 600;
    const height = 180;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);

    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');
  }, [values]);

  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;

  return (
    <div className="rounded-2xl border border-white/15 bg-slate-950/70 p-3">
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-white/65">
        <span>Equity Curve</span>
        <span>{formatMoney(min)} to {formatMoney(max)}</span>
      </div>
      <svg viewBox="0 0 600 180" className="h-44 w-full">
        <defs>
          <linearGradient id="sim-eq-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="600" height="180" fill="rgba(15,23,42,0.75)" rx="12" />
        {points ? <polyline fill="none" stroke="url(#sim-eq-stroke)" strokeWidth="3" points={points} /> : null}
      </svg>
    </div>
  );
}

function HandHistoryModal({ run, onClose }: { run: MatchRecord; onClose: () => void }) {
  const handHistory = run.simulatorHandHistory ?? [];
  const [expandedHand, setExpandedHand] = useState<number | null>(null);
  const totalProfit = handHistory.reduce((sum, hand) => sum + hand.profit, 0);
  const positiveHands = handHistory.filter((hand) => hand.outcome === 'win').length;
  const negativeHands = handHistory.filter((hand) => hand.outcome === 'loss').length;

  const suitSymbol: Record<string, string> = {
    HEARTS: '♥',
    DIAMONDS: '♦',
    CLUBS: '♣',
    SPADES: '♠',
  };

  const cardText = (card: { rank: string; suit: string }) => `${card.rank}${suitSymbol[card.suit] ?? card.suit}`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <div className="mt-5 mb-5 w-full max-w-5xl overflow-hidden rounded-2xl border border-white/20 bg-slate-950/95 shadow-2xl shadow-cyan-500/10">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">Run Details</p>
            <p className="text-xs text-white/60">
              {new Date(run.timestamp).toLocaleString()} | Hands: {run.simulatorSummary?.handCount ?? handHistory.length}
            </p>
            <p className="text-xs text-white/55">
              Rules: {run.simulatorSummary?.roomName ?? run.roomId} · {run.simulatorSummary?.bettingSystem ?? 'flat'} · {run.simulatorSummary?.playDecisionSource ?? 'strategy_advice'} · Seats {run.simulatorSummary?.seatCount ?? 1}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/15 bg-white/5 p-2 text-white/80 hover:bg-white/10"
            aria-label="Close hand history"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 border-b border-white/10 bg-slate-900/40 px-4 py-2 text-xs">
          <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1">
            <p className="text-white/55">Net PnL</p>
            <p className={`font-semibold ${totalProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{formatMoney(totalProfit)}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1">
            <p className="text-white/55">Winning Hands</p>
            <p className="font-semibold text-emerald-300">{positiveHands}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1">
            <p className="text-white/55">Losing Hands</p>
            <p className="font-semibold text-rose-300">{negativeHands}</p>
          </div>
        </div>

        <div className="max-h-[72vh] overflow-auto p-3">
          {handHistory.length === 0 ? (
            <p className="text-sm text-white/65">No per-hand details were recorded for this run.</p>
          ) : (
            <table className="w-full text-xs text-white/85">
              <thead className="sticky top-0 z-10 bg-slate-950 text-white/60">
                <tr>
                  <th className="px-2 py-2 text-left">Hand</th>
                  <th className="px-2 py-2 text-left">Outcome</th>
                  <th className="px-2 py-2 text-left">Bet</th>
                  <th className="px-2 py-2 text-left">Profit</th>
                  <th className="px-2 py-2 text-left">Bankroll</th>
                  <th className="px-2 py-2 text-left">Player Totals</th>
                  <th className="px-2 py-2 text-left">Dealer Total</th>
                  <th className="px-2 py-2 text-left">Action Timeline</th>
                  <th className="px-2 py-2 text-left">Detail</th>
                </tr>
              </thead>
              <tbody>
                {handHistory.map((hand) => (
                  <Fragment key={`${run.id}-${hand.handNumber}`}>
                  <tr key={`${run.id}-${hand.handNumber}`} className="border-t border-white/10 odd:bg-white/[0.01]">
                    <td className="px-2 py-1.5">{hand.handNumber}</td>
                    <td className="px-2 py-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 capitalize ${
                          hand.outcome === 'win'
                            ? 'bg-emerald-500/20 text-emerald-200'
                            : hand.outcome === 'loss'
                              ? 'bg-rose-500/20 text-rose-200'
                              : 'bg-slate-500/20 text-slate-200'
                        }`}
                      >
                        {hand.outcome}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">{formatMoney(hand.bet)}</td>
                    <td className={`px-2 py-1.5 ${hand.profit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {formatMoney(hand.profit)}
                    </td>
                    <td className="px-2 py-1.5">{formatMoney(hand.bankrollAfter)}</td>
                    <td className="px-2 py-1.5">{hand.playerTotals.length > 0 ? hand.playerTotals.join(', ') : '-'}</td>
                    <td className="px-2 py-1.5">{hand.dealerTotal > 0 ? hand.dealerTotal : '-'}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-wrap gap-1">
                        {normalizeActionList(hand.actions, hand.blackjacks).map((action, actionIndex) => (
                          <span key={`${run.id}-${hand.handNumber}-action-${actionIndex}`} className="rounded-md border border-cyan-300/25 bg-cyan-500/10 px-1.5 py-0.5 text-[11px] text-cyan-100">
                            {action}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => setExpandedHand(expandedHand === hand.handNumber ? null : hand.handNumber)}
                        className="rounded-md border border-amber-300/35 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-100 hover:bg-amber-500/25"
                      >
                        {expandedHand === hand.handNumber ? 'Hide' : 'Detail'}
                      </button>
                    </td>
                  </tr>
                  {expandedHand === hand.handNumber ? (
                    <tr key={`${run.id}-${hand.handNumber}-detail`} className="border-t border-white/10 bg-slate-900/45">
                      <td colSpan={9} className="px-3 py-2">
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                            <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-white/60">Dealer Cards</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(hand.dealerCards ?? []).map((card, cardIndex) => (
                                <span key={`${run.id}-${hand.handNumber}-dealer-${cardIndex}`} className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-white/85">
                                  {cardText(card)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                            <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-white/60">Player Hands</p>
                            <div className="space-y-1.5">
                              {(hand.playerHands ?? []).map((pHand, pIndex) => (
                                <div key={`${run.id}-${hand.handNumber}-phand-${pIndex}`} className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
                                  <p className="text-[11px] text-white/70">Seat {pHand.seatNumber} · Hand {pHand.handNumber} · Total {pHand.total === -1 ? 'Surrender' : pHand.total}</p>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    {pHand.cards.map((card, cIndex) => (
                                      <span key={`${run.id}-${hand.handNumber}-pcard-${pIndex}-${cIndex}`} className="rounded-md border border-white/15 bg-black/25 px-2 py-0.5 text-white/85">
                                        {cardText(card)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SimulatorPage() {
  const isHydrated = useStoreHydration();
  const config = useGameStore((s) => s.simulatorConfig);
  const runState = useGameStore((s) => s.simulatorRunState);
  const result = useGameStore((s) => s.simulatorResult);
  const equityCurve = useGameStore((s) => s.simulatorEquityCurve);
  const simulatorHistory = useGameStore((s) => s.simulatorHistory);

  const setConfig = useGameStore((s) => s.setSimulatorConfig);
  const startRun = useGameStore((s) => s.startSimulatorRun);
  const pauseRun = useGameStore((s) => s.pauseSimulatorRun);
  const resumeRun = useGameStore((s) => s.resumeSimulatorRun);
  const resetRun = useGameStore((s) => s.resetSimulatorRun);

  const [showStrategy, setShowStrategy] = useState(false);
  const [riskBaseline, setRiskBaseline] = useState<PreRunRiskSnapshot | null>(null);
  const [historyModalRun, setHistoryModalRun] = useState<MatchRecord | null>(null);

  const room = getRoomConfig(config.roomId);
  const rooms = getLobbyRooms();
  const completionPct = Math.min(1, runState.currentHandIndex / Math.max(1, config.maxHands));
  const preRunRisk = useMemo(() => buildPreRunRiskSnapshot(config), [config]);

  const riskConclusion = useMemo(() => {
    if (!result || !riskBaseline) return null;
    return buildRiskConclusion(riskBaseline, {
      bankrollAtRiskPct: result.bankrollAtRiskPct,
      riskOfRuinEstimate: result.riskOfRuinEstimate,
      roi: result.roi,
    });
  }, [result, riskBaseline]);

  const coreKpis = [
    { label: 'Bankroll', value: formatMoney(runState.bankrollCurrent) },
    { label: 'Profit', value: formatMoney(runState.summary.profit) },
    { label: 'Win Rate', value: percent(runState.summary.winRate) },
    { label: 'EV / Hand', value: formatMoney(runState.summary.evPerHand) },
    { label: 'Max Drawdown', value: formatMoney(runState.summary.maxDrawdown) },
    { label: 'Losing Streak', value: `${runState.summary.longestLosingStreak}` },
  ];

  return (
    <div
      className="min-h-full w-full overflow-x-hidden"
      style={{
        background:
          'radial-gradient(140% 100% at 14% 6%, rgba(234,179,8,0.22) 0%, rgba(15,23,42,0.95) 40%, rgba(2,6,23,1) 100%)',
      }}
    >
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-4 lg:px-6 lg:py-5">
        <div className="flex items-center justify-between rounded-2xl border border-amber-300/15 bg-slate-950/75 px-4 py-3 shadow-lg shadow-amber-900/10">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-white">
              <span>Blackjack Simulator</span>
              <span className="rounded-full border border-amber-300/45 bg-amber-500/25 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-amber-100">
                Beta
              </span>
            </h1>
            <p className="text-sm text-white/65">Focused simulation dashboard for rapid strategy evaluation.</p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="rounded-xl border border-white/15 px-3 py-2 text-white/85 hover:bg-white/10">
              Home
            </Link>
            <button
              onClick={() => setShowStrategy(true)}
              className="rounded-xl border border-amber-300/40 bg-amber-500/15 px-3 py-2 text-amber-100 hover:bg-amber-500/25"
            >
              Open Strategy
            </button>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 backdrop-blur-md">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-white/65">Setup</h2>

            <label className="mb-2 block text-sm text-white/80">
              Room
              <select
                value={config.roomId}
                onChange={(e) => setConfig({ roomId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2"
              >
                {rooms.map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.name}</option>
                ))}
              </select>
            </label>

            <div className="mb-2 grid grid-cols-2 gap-2 text-sm">
              <label className="text-white/80">
                Bankroll
                <input
                  type="number"
                  min={100}
                  value={config.initialBankroll}
                  onChange={(e) => setConfig({ initialBankroll: Math.max(100, Number(e.target.value || 0)) })}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2"
                />
              </label>
              <label className="text-white/80">
                Base Unit
                <input
                  type="number"
                  min={1}
                  value={config.baseUnit}
                  onChange={(e) => setConfig({ baseUnit: Math.max(1, Number(e.target.value || 1)) })}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2"
                />
              </label>
            </div>

            <div className="mb-2 grid grid-cols-2 gap-2 text-sm">
              <label className="text-white/80">
                Target
                <input
                  type="number"
                  min={1}
                  step={0.1}
                  value={config.targetMultiplier}
                  onChange={(e) => setConfig({ targetMultiplier: Math.max(1, Number(e.target.value || 1)) })}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2"
                />
              </label>
              <label className="text-white/80">
                Stop Loss
                <input
                  type="number"
                  min={0}
                  value={config.stopLoss}
                  onChange={(e) => setConfig({ stopLoss: Math.max(0, Number(e.target.value || 0)) })}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2"
                />
              </label>
            </div>

            <div className="mb-2 grid grid-cols-2 gap-2 text-sm">
              <label className="text-white/80">
                Max Hands
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={config.maxHands}
                  onChange={(e) => setConfig({ maxHands: Math.max(1, Math.min(5000, Number(e.target.value || 1))) })}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2"
                />
              </label>
              <label className="text-white/80">
                Seats
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={Number.isFinite(config.seatCount) ? config.seatCount : 1}
                  onChange={(e) => setConfig({ seatCount: Math.max(1, Math.min(5, Number(e.target.value || 1))) })}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2"
                />
              </label>
            </div>

            <div className="mb-2 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-[11px] text-white/70">
              Simulation speed is fixed to a safe level for stability.
            </div>

            <label className="mb-2 block text-sm text-white/80">
              Betting System
              <select
                value={config.bettingSystem}
                onChange={(e) => setConfig({ bettingSystem: e.target.value as typeof config.bettingSystem })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2"
              >
                <option value="flat">Flat</option>
                <option value="martingale">Martingale</option>
                <option value="parlay">Parlay</option>
                <option value="1326">1-3-2-6</option>
              </select>
            </label>

            <label className="mb-2 block text-sm text-white/80">
              Play Logic
              <select
                value={config.playDecisionSource}
                onChange={(e) => setConfig({ playDecisionSource: e.target.value as typeof config.playDecisionSource })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2"
              >
                <option value="strategy_advice">Use Strategy Advice</option>
                <option value="basic_strategy">Use Basic Strategy</option>
                <option value="custom_profile">Custom Profile</option>
              </select>
            </label>

            {config.playDecisionSource === 'custom_profile' ? (
              <label className="mb-2 block text-sm text-white/80">
                Risk Profile
                <select
                  value={config.customRiskLevel}
                  onChange={(e) => setConfig({ customRiskLevel: e.target.value as typeof config.customRiskLevel })}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2"
                >
                  <option value="conservative">Conservative</option>
                  <option value="balanced">Balanced</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </label>
            ) : null}

            <div className="rounded-xl border border-rose-300/25 bg-rose-500/10 p-2.5 text-xs text-white/85">
              <p className="mb-1 font-semibold uppercase tracking-[0.14em] text-rose-200">Pre-run Risk</p>
              <p>Peak bet: <span className="font-bold text-white">{formatMoney(preRunRisk.projectedPeakBet)}</span></p>
              <p>Bankroll at risk: <span className="font-bold text-white">{percent(preRunRisk.projectedBankrollAtRiskPct)}</span></p>
              <p>Ruin estimate: <span className="font-bold text-white">{percent(preRunRisk.projectedRiskOfRuinPct)}</span></p>
            </div>

            <p className="mt-2 text-[11px] text-white/60">
              Rule snapshot: {room.gameRules.numberOfDecks} decks, {room.gameRules.dealerHitsSoft17 ? 'H17' : 'S17'}, blackjack {room.blackjackMultiplier}:1.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">Run</h2>
                <p className="text-xs text-white/55">
                  Status <span className="font-semibold text-amber-200">{runState.status.toUpperCase()}</span> · {percent(completionPct)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setRiskBaseline(buildPreRunRiskSnapshot(config));
                    startRun();
                  }}
                  disabled={!isHydrated || runState.status === 'running'}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300/35 bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100 disabled:opacity-40"
                >
                  <Play size={14} /> Start
                </button>
                {runState.status === 'running' ? (
                  <button
                    onClick={pauseRun}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
                  >
                    <Pause size={14} /> Pause
                  </button>
                ) : (
                  <button
                    onClick={resumeRun}
                    disabled={runState.status !== 'paused'}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white disabled:opacity-40"
                  >
                    <Play size={14} /> Resume
                  </button>
                )}
                <button
                  onClick={resetRun}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-300/35 bg-red-500/15 px-3 py-2 text-sm text-red-100"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              </div>
            </div>

            <div className="mb-3 rounded-xl border border-white/12 bg-slate-900/70 p-2.5">
              <div className="mb-1.5 flex items-center justify-between text-xs text-white/60">
                <span>Progress</span>
                <span>{runState.currentHandIndex}/{config.maxHands} hands</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-lime-400 to-emerald-400 transition-all"
                  style={{ width: `${Math.min(100, completionPct * 100)}%` }}
                />
              </div>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
              {coreKpis.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/12 bg-slate-900/60 p-2.5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">{item.label}</p>
                  <p className="mt-1 text-lg font-black text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <EquityChart values={equityCurve} />
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 backdrop-blur-md">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-white/65">Insights</h2>

            <div className="space-y-2.5 text-sm">
              <div className="rounded-xl border border-white/12 bg-slate-900/65 p-2.5">
                <div className="mb-1.5 flex items-center gap-2 text-white/85">
                  <TrendingUp size={14} className="text-emerald-300" />
                  <span className="font-medium">Performance</span>
                </div>
                <p>Ending bankroll: <span className="font-semibold text-white">{formatMoney(result?.endingBankroll ?? runState.bankrollCurrent)}</span></p>
                <p>ROI: <span className="font-semibold text-white">{percent(result?.roi ?? 0)}</span></p>
                <p>Average bet: <span className="font-semibold text-white">{formatMoney(result?.averageBet ?? 0)}</span></p>
                <p>Profit factor: <span className="font-semibold text-white">{ratio(result?.profitFactor ?? 0)}</span></p>
              </div>

              <div className="rounded-xl border border-white/12 bg-slate-900/65 p-2.5">
                <div className="mb-1.5 flex items-center gap-2 text-white/85">
                  <ShieldAlert size={14} className="text-rose-300" />
                  <span className="font-medium">Risk Compare</span>
                </div>
                <p>Pre-run bankroll at risk: <span className="font-semibold text-white">{percent((riskBaseline ?? preRunRisk).projectedBankrollAtRiskPct)}</span></p>
                <p>Post-run bankroll at risk: <span className="font-semibold text-white">{percent(result?.bankrollAtRiskPct ?? 0)}</span></p>
                <p>Pre-run ruin estimate: <span className="font-semibold text-white">{percent((riskBaseline ?? preRunRisk).projectedRiskOfRuinPct)}</span></p>
                <p>Post-run ruin estimate: <span className="font-semibold text-white">{percent(result?.riskOfRuinEstimate ?? 0)}</span></p>
                <p className="mt-2 rounded-lg border border-white/10 bg-black/25 p-2 text-white/85">
                  {riskConclusion ?? 'Run a simulation to compare projected vs realized risk.'}
                </p>
              </div>

              <div className="rounded-xl border border-white/12 bg-slate-900/65 p-2.5">
                <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-white/65">Run History</p>
                {simulatorHistory.length === 0 ? (
                  <p className="text-xs text-white/65">No completed simulation run yet.</p>
                ) : (
                  <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                    {simulatorHistory.slice(-20).reverse().map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-xs">
                        <div className="min-w-0">
                          <p className="truncate text-white/85">{new Date(entry.timestamp).toLocaleString()}</p>
                          <p className="text-white/60">
                            PnL {formatMoney(entry.bankrollAfter - entry.bankrollBefore)} · Hands {entry.simulatorSummary?.handCount ?? 0}
                          </p>
                          <p className="truncate text-white/55">
                            {entry.simulatorSummary?.roomName ?? entry.roomId} · {entry.simulatorSummary?.bettingSystem ?? 'flat'} · {entry.simulatorSummary?.playDecisionSource ?? 'strategy_advice'} · Seats {entry.simulatorSummary?.seatCount ?? 1}
                          </p>
                        </div>
                        <button
                          onClick={() => setHistoryModalRun(entry)}
                          className="ml-2 rounded-md border border-cyan-300/35 bg-cyan-500/15 p-1.5 text-cyan-100 hover:bg-cyan-500/25"
                          aria-label="View hand details"
                          title="View hand details"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {showStrategy ? <StrategyModal room={room} onClose={() => setShowStrategy(false)} /> : null}
      {historyModalRun ? <HandHistoryModal run={historyModalRun} onClose={() => setHistoryModalRun(null)} /> : null}
    </div>
  );
}
