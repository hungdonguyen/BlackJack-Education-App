import { useMemo, useState } from 'react';
import { Eye, ShieldAlert, TrendingUp, RotateCcw } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import type { MatchRecord } from '@/types/game';
import { formatMoney, percent, ratio, buildRiskConclusion, PreRunRiskSnapshot } from '../utils/formatters';

const RUN_HISTORY_PAGE_SIZE = 3;

interface Props {
  riskBaseline: PreRunRiskSnapshot | null;
  onOpenHistory: (run: MatchRecord) => void;
}

export function SimulatorInsights({ riskBaseline, onOpenHistory }: Props) {
  const [historyPage, setHistoryPage] = useState(1);
  const runState = useGameStore((s) => s.simulatorRunState);
  const result = useGameStore((s) => s.simulatorResult);
  const simulatorHistory = useGameStore((s) => s.simulatorHistory);

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
    <aside className="flex h-full min-h-0 flex-col gap-3">
      <div className="rounded-2xl border border-[#d4a843]/20 bg-[linear-gradient(180deg,rgba(36,20,14,0.82)_0%,rgba(23,11,8,0.88)_100%)] p-4 shadow-[inset_0_1px_0_rgba(212,168,67,0.1)] backdrop-blur-md">
         <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#d4a843]/78">
           <TrendingUp size={16} /> Performance Review
         </h2>
         <div className="space-y-3 border-b border-[#d4a843]/15 pb-3 text-sm font-medium text-[#f0e6d6]/85">
            <div className="flex justify-between items-end">
              <span className="text-[#f0e6d6]/55">Ending Bankroll:</span>
              <span className="text-lg font-bold text-[#f0e6d6]">{formatMoney(result?.endingBankroll ?? runState.bankrollCurrent)}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[#f0e6d6]/55">ROI:</span>
              <span className={`text-lg font-bold ${result?.roi && result.roi > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {percent(result?.roi ?? 0)}
              </span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[#f0e6d6]/55">Profit Factor:</span>
              <span className="content-end text-lg font-bold text-[#f0e6d6]">{ratio(result?.profitFactor ?? 0)}</span>
            </div>
         </div>

         <h2 className="mb-3 mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#d4a843]/78">
           <ShieldAlert size={16} /> Risk Analysis
         </h2>
         <div className="space-y-2.5 text-sm font-medium text-[#f0e6d6]/85">
            <div className="flex justify-between items-center">
              <span className="text-[#f0e6d6]/55">Bankroll At Risk:</span>
              <span className="font-bold text-[#f0e6d6]">{percent(result?.bankrollAtRiskPct ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#f0e6d6]/55">Risk of Ruin:</span>
              <span className="font-bold text-rose-300">{percent(result?.riskOfRuinEstimate ?? 0)}</span>
            </div>
            
            <div className="mt-3 rounded-xl border border-[#d4a843]/25 bg-[#d4a843]/10 p-3 text-xs leading-relaxed text-[#f1d98f]">
              {riskConclusion ?? 'Run a full lifecycle sequence to unlock risk deviation matrices.'}
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
