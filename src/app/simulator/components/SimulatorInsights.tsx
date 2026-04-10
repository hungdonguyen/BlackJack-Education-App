import { useMemo, useState } from 'react';
import { Eye, ShieldAlert, TrendingUp, RotateCcw } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import type { MatchRecord } from '@/types/game';
import { formatMoney, percent, ratio, buildRiskConclusion, PreRunRiskSnapshot, buildPreRunRiskSnapshot } from '../utils/formatters';

const RUN_HISTORY_PAGE_SIZE = 3;

interface Props {
  riskBaseline: PreRunRiskSnapshot | null;
  onOpenHistory: (run: MatchRecord) => void;
}

const StatBox = ({ title, value, valueClass = "text-[#f0e6d6]", borderClass = "border-[#d4a843]/15", bgClass = "bg-[#25130d]/60", titleColor = "text-[#d4a843]/70", spanClass = "col-span-1" }: any) => (
  <div className={`rounded-xl border ${borderClass} ${bgClass} px-3 py-2.5 shadow-sm ${spanClass} flex flex-col justify-between`}>
    <span className={`block text-[10px] font-bold uppercase tracking-wider ${titleColor}`}>{title}</span>
    <span className={`mt-1 block text-lg font-extrabold tracking-tight ${valueClass}`}>{value}</span>
  </div>
);

export function SimulatorInsights({ riskBaseline, onOpenHistory }: Props) {
  const [historyPage, setHistoryPage] = useState(1);
  const runState = useGameStore((s) => s.simulatorRunState);
  const result = useGameStore((s) => s.simulatorResult);
  const simulatorHistory = useGameStore((s) => s.simulatorHistory);
  const config = useGameStore((s) => s.simulatorConfig);

  const theoreticalRisk = useMemo(() => buildPreRunRiskSnapshot(config), [config]);

  const orderedHistory = useMemo(() => [...simulatorHistory].reverse(), [simulatorHistory]);
  const totalHistoryPages = Math.max(1, Math.ceil(orderedHistory.length / RUN_HISTORY_PAGE_SIZE));
  const displayHistoryPage = Math.min(historyPage, totalHistoryPages);
  const pageHistory = orderedHistory.slice(
    (displayHistoryPage - 1) * RUN_HISTORY_PAGE_SIZE,
    displayHistoryPage * RUN_HISTORY_PAGE_SIZE,
  );

  const riskConclusion = useMemo(() => {
    if (!result || !riskBaseline) return null;
    return buildRiskConclusion(riskBaseline, {
      bankrollAtRiskPct: result.bankrollAtRiskPct,
      riskOfRuinEstimate: result.riskOfRuinEstimate,
      roi: result.roi,
    });
  }, [result, riskBaseline]);

  return (
    <aside className="custom-scrollbar flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-1">
      <div className="rounded-2xl border border-[#d4a843]/20 bg-[linear-gradient(180deg,rgba(36,20,14,0.85)_0%,rgba(24,12,9,0.85)_100%)] p-4 shadow-[inset_0_1px_0_rgba(212,168,67,0.1)] backdrop-blur-md">
         <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#d4a843]/90">
           <TrendingUp size={16} className="text-[#f1d98f]" /> Performance Review
         </h2>
         <div className="grid grid-cols-2 gap-2.5 mb-2 pb-4 border-b border-[#d4a843]/15">
            <StatBox 
              title="End Bankroll" 
              value={formatMoney(result?.endingBankroll ?? runState.bankrollCurrent)} 
            />
            <StatBox 
              title="Ret. On Inv." 
              value={percent(result?.roi ?? 0)} 
              valueClass={result?.roi && result.roi > 0 ? 'text-emerald-400' : result?.roi && result.roi < 0 ? 'text-rose-400' : 'text-[#f0e6d6]'}
            />
            <StatBox 
              title="Profit Factor" 
              value={ratio(result?.profitFactor ?? 0)} 
            />
            <StatBox 
              title="Avg Bet Size" 
              value={formatMoney(result?.averageBet ?? 0)} 
            />
         </div>

         <h2 className="mb-3 mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#d4a843]/90">
           <ShieldAlert size={16} className="text-[#f1d98f]" /> Risk Analysis
         </h2>
         <div className="space-y-3">
            {/* Theoretical Section */}
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 pb-3">
               <h3 className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-sky-400/80">1. Theoretical Projections</h3>
               <div className="grid grid-cols-2 gap-2.5">
                 <StatBox 
                   title="Est. Cap @ Risk" 
                   value={percent(theoreticalRisk.projectedBankrollAtRiskPct)} 
                   borderClass="border-sky-500/25"
                   bgClass="bg-sky-500/10"
                   titleColor="text-sky-400/80"
                   valueClass="text-sky-300"
                 />
                 <StatBox 
                   title="Est. Ruin Risk" 
                   value={percent(theoreticalRisk.projectedRiskOfRuinPct)} 
                   borderClass="border-sky-500/25"
                   bgClass="bg-sky-500/10"
                   titleColor="text-sky-400/80"
                   valueClass="text-sky-300 font-black"
                 />
               </div>
               <div className="mt-2.5 text-[9px] font-medium leading-relaxed text-sky-200/70">
                 {theoreticalRisk.notes.map((note, i) => (
                   <p key={i}>• {note}</p>
                 ))}
                 <p>• Proj. Peak Bet: {formatMoney(theoreticalRisk.projectedPeakBet)}</p>
               </div>
            </div>

            {/* Realized Section */}
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 pb-3 opacity-95">
               <h3 className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-orange-400/80 flex items-center justify-between">
                 <span>2. Realized Risk</span>
                 {!result && <span className="text-orange-400/50 text-[8px] tracking-normal lowercase">(Waiting for run)</span>}
               </h3>
               <div className="grid grid-cols-2 gap-2.5">
                 <StatBox 
                   title="Capital @ Risk" 
                   value={percent(result?.bankrollAtRiskPct ?? 0)} 
                   borderClass="border-orange-500/25"
                   bgClass="bg-orange-500/10"
                   titleColor="text-orange-400/80"
                   valueClass="text-orange-300"
                 />
                 <StatBox 
                   title="Risk Of Ruin" 
                   value={percent(result?.riskOfRuinEstimate ?? 0)} 
                   borderClass="border-rose-500/25"
                   bgClass="bg-rose-500/10"
                   titleColor="text-rose-400/80"
                   valueClass="text-rose-400 font-black"
                 />
               </div>
               
               <div className="mt-3 flex flex-col rounded-lg border border-[#d4a843]/20 bg-black/40 p-2.5 shadow-inner">
                  <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#d4a843]/80">System Verdict</h3>
                  {Array.isArray(riskConclusion) ? (
                    <div className="space-y-1.5 mt-1">
                      {riskConclusion.map((line, i) => {
                        let colorClass = 'text-[#f1d98f]/90';
                        if (line.type === 'success') colorClass = 'text-emerald-400';
                        else if (line.type === 'danger') colorClass = 'text-rose-400';
                        else if (line.type === 'warning') colorClass = 'text-orange-300';
                        
                        return (
                          <p key={i} className={`text-[10px] sm:text-[11px] font-medium leading-relaxed ${colorClass}`}>
                            {line.text}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] leading-relaxed text-[#f1d98f]/60 italic">
                      Run a full simulation sequence to compute risk topology scaling and conclusion details.
                    </p>
                  )}
               </div>
            </div>
         </div>
      </div>

      <div className="relative flex shrink-0 flex-col overflow-hidden rounded-2xl border border-[#d4a843]/20 bg-[linear-gradient(180deg,rgba(34,18,13,0.78)_0%,rgba(20,10,8,0.85)_100%)] shadow-[inset_0_1px_0_rgba(212,168,67,0.08)] backdrop-blur-md">
         <div className="sticky top-0 z-10 border-b border-[#d4a843]/15 bg-[#21120d]/95 px-4 py-3 backdrop-blur">
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d4a843]/78">Run History</h2>
         </div>
         
         <div className="px-3 py-2">
           {simulatorHistory.length === 0 ? (
             <div className="flex flex-col items-center justify-center px-6 py-4 text-center text-xs text-[#f0e6d6]/35">
               <RotateCcw size={32} className="mb-3 opacity-20" />
               <p>No historical runs traced.</p>
             </div>
           ) : (
             <div className="space-y-1.5 pb-2 pt-1">
               {pageHistory.map((entry) => {
                 const pnl = entry.bankrollAfter - entry.bankrollBefore;
                 const startBankroll = entry.simulatorSummary?.bankrollStart ?? entry.bankrollBefore;
                 const endBankroll = entry.simulatorSummary?.bankrollEnd ?? entry.bankrollAfter;
                 return (
                   <div key={entry.id} className="group flex flex-col gap-1.5 rounded-xl border border-[#d4a843]/15 bg-black/25 p-2 transition-all hover:border-[#d4a843]/38 hover:bg-black/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#f0e6d6]/45">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                        <span className={`text-xs font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-300'}`}>
                          {pnl > 0 ? '+' : ''}{formatMoney(pnl)}
                        </span>
                      </div>
                      
                      <div className="flex items-end justify-between">
                         <div className="text-xs font-semibold text-[#f0e6d6]/65">
                           <p className="max-w-50 truncate capitalize text-[#f0e6d6]/85">{entry.simulatorSummary?.roomName ?? entry.roomId}</p>
                           <p className="mt-0.5 opacity-60">{entry.simulatorSummary?.handCount ?? 0} H · {entry.simulatorSummary?.bettingSystem ?? 'flat'}</p>
                           <p className="mt-0.5 opacity-60">{formatMoney(startBankroll)} &rarr; {formatMoney(endBankroll)}</p>
                         </div>
                         <button
                           onClick={() => onOpenHistory(entry)}
                           className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d4a843]/30 bg-[#d4a843]/12 text-[#e8c860] transition-colors hover:bg-[#d4a843]/22 hover:text-[#f1d98f]"
                         >
                           <Eye size={14} />
                         </button>
                      </div>
                   </div>
                 )
               })}
             </div>
           )}
         </div>

         {orderedHistory.length > RUN_HISTORY_PAGE_SIZE ? (
           <div className="border-t border-[#d4a843]/15 bg-black/20 px-3 py-2.5">
             <div className="flex items-center justify-between text-[10px] text-[#f0e6d6]/55">
               <span>
                 Page {displayHistoryPage}/{totalHistoryPages}
               </span>
               <span>
                 {orderedHistory.length} runs
               </span>
             </div>
             <div className="mt-2 flex items-center gap-2">
               <button
                 type="button"
                 onClick={() => setHistoryPage((value) => Math.max(1, value - 1))}
                 disabled={displayHistoryPage === 1}
                 className="rounded-md border border-[#d4a843]/22 bg-black/25 px-2.5 py-1 text-[10px] font-semibold text-[#f0e6d6]/75 transition-colors hover:bg-[#d4a843]/10 disabled:cursor-not-allowed disabled:opacity-35"
               >
                 Previous
               </button>
               <button
                 type="button"
                 onClick={() => setHistoryPage((value) => Math.min(totalHistoryPages, value + 1))}
                 disabled={displayHistoryPage === totalHistoryPages}
                 className="rounded-md border border-[#d4a843]/22 bg-black/25 px-2.5 py-1 text-[10px] font-semibold text-[#f0e6d6]/75 transition-colors hover:bg-[#d4a843]/10 disabled:cursor-not-allowed disabled:opacity-35"
               >
                 Next
               </button>
             </div>
           </div>
         ) : null}
      </div>
    </aside>
  );
}
