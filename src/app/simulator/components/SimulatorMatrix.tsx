import { Play, Pause, RotateCcw, Square } from 'lucide-react';
import { useGameStore, useStoreHydration } from '@/hooks/useGameStore';
import { formatMoney, percent } from '../utils/formatters';
import { EquityAreaChart } from './EquityAreaChart';

const MetricCard = ({ title, value, type = 'neutral' }: { title: string, value: string, type?: 'profit'|'loss'|'neutral'|'progress' }) => (
  <div className="flex min-h-21 flex-col justify-center rounded-xl border border-[#d4a843]/20 bg-[linear-gradient(180deg,rgba(34,18,13,0.78)_0%,rgba(21,11,8,0.82)_100%)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(212,168,67,0.08)] transition-all duration-200 hover:border-[#d4a843]/35">
    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4a843]/65">{title}</p>
    <p className={`text-xl font-black leading-tight ${type === 'profit' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.28)]' : type === 'loss' ? 'text-rose-400' : type === 'progress' ? 'text-[#e8c860]' : 'text-[#f0e6d6]'}`}>
      {value}
    </p>
  </div>
);

interface Props {
  onIgnite: () => void;
}

export function SimulatorMatrix({ onIgnite }: Props) {
  const isHydrated = useStoreHydration();
  const config = useGameStore((s) => s.simulatorConfig);
  const runState = useGameStore((s) => s.simulatorRunState);
  const equityCurve = useGameStore((s) => s.simulatorEquityCurve);

  const startRun = useGameStore((s) => s.startSimulatorRun);
  const pauseRun = useGameStore((s) => s.pauseSimulatorRun);
  const resumeRun = useGameStore((s) => s.resumeSimulatorRun);
  const stopRun = useGameStore((s) => s.stopSimulatorRun);
  const resetRun = useGameStore((s) => s.resetSimulatorRun);

  const completionPct = Math.min(1, runState.currentHandIndex / Math.max(1, config.maxHands));

  const handleStart = () => {
    if (config.initialBankroll < 100) {
      alert('Bankroll must be at least 100.');
      return;
    }
    if (config.baseUnit < 1) {
      alert('Base Unit must be at least 1.');
      return;
    }
    if (config.baseUnit > config.initialBankroll) {
      alert('Base Unit cannot be greater than Bankroll.');
      return;
    }
    onIgnite(); 
    startRun();
  };

  return (
    <div className="flex h-full min-w-0 min-h-0 flex-1 flex-col gap-3">
      <div className="relative flex shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-[#d4a843]/25 bg-[linear-gradient(180deg,rgba(40,20,14,0.82)_0%,rgba(24,12,8,0.88)_100%)] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-lg">
        <div className="absolute left-0 top-0 h-px w-full bg-linear-to-r from-transparent via-[#d4a843]/55 to-transparent" />
        
        <div className="z-10 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d4a843]/75">{runState.status === 'running' ? 'Active Matrix' : 'Engine Ready'}</h2>
            <div className="mt-1 flex items-end gap-2.5">
              <span className="text-3xl font-black leading-none text-[#f0e6d6]">{runState.currentHandIndex.toLocaleString()}</span>
              <span className="pb-0.5 text-xs font-semibold tracking-widest text-[#f0e6d6]/45">/ {config.maxHands.toLocaleString()} H</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleStart} 
              disabled={!isHydrated || runState.status === 'running'} 
              className="flex h-9 items-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-bold text-[#0f1210] shadow-[0_0_18px_rgba(16,185,129,0.25)] transition-all hover:bg-emerald-400 disabled:opacity-35 disabled:shadow-none"
            >
              <Play fill="currentColor" size={16} /> Start
            </button>
            {runState.status === 'running' ? (
              <button onClick={pauseRun} className="flex h-9 items-center gap-2 rounded-lg border border-[#d4a843]/40 bg-[#d4a843]/12 px-4 text-sm font-bold text-[#e8c860] transition-all hover:bg-[#d4a843]/22">
                <Pause fill="currentColor" size={16} /> Pause
              </button>
            ) : (
              <button onClick={resumeRun} disabled={runState.status !== 'paused'} className="flex h-9 items-center gap-2 rounded-lg border border-[#d4a843]/40 bg-[#d4a843]/12 px-4 text-sm font-bold text-[#e8c860] transition-all hover:bg-[#d4a843]/22 disabled:opacity-35">
                <Play fill="currentColor" size={16} /> Resume
              </button>
            )}
            <button
              onClick={stopRun}
              disabled={runState.status !== 'running' && runState.status !== 'paused'}
              className="flex h-9 items-center gap-2 rounded-lg border border-rose-500/35 bg-rose-500/12 px-4 text-sm font-bold text-rose-300 transition-all hover:bg-rose-500/22 disabled:opacity-35"
            >
              <Square fill="currentColor" size={12} /> End Early
            </button>
            <button onClick={resetRun} className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 transition-all hover:bg-rose-500/20">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        <div className="relative z-10 mt-3 w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/45 shadow-inner">
            <div className="h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${Math.min(100, completionPct * 100)}%`, background: 'linear-gradient(90deg, #d4a843, #f0d78c, #34d399)' }} />
          </div>
          <p className="absolute -top-5 right-0 text-xs font-bold text-[#f1d98f]">{percent(completionPct)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <MetricCard title="Current Bankroll" value={formatMoney(runState.bankrollCurrent)} />
        <MetricCard title="Profit / Loss" value={formatMoney(runState.summary.profit)} type={runState.summary.profit > 0 ? 'profit' : runState.summary.profit < 0 ? 'loss' : 'neutral'} />
        <MetricCard title="Win Rate" value={percent(runState.summary.winRate)} />
        <MetricCard title="EV Per Hand" value={formatMoney(runState.summary.evPerHand)} />
        <MetricCard title="Max Drawdown" value={formatMoney(runState.summary.maxDrawdown)} type={runState.summary.maxDrawdown < 0 ? 'loss' : 'neutral'} />
        <MetricCard title="Max Losing Streak" value={`${runState.summary.longestLosingStreak} Hands`} />
      </div>

      <div className="min-h-0 flex-1">
        <EquityAreaChart values={equityCurve} />
      </div>
    </div>
  );
}
