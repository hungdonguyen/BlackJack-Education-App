'use client';

import { useState } from 'react';
import StrategyModal from '@/components/StrategyModal';
import { getRoomConfig } from '@/utils/rooms';
import { useGameStore } from '@/hooks/useGameStore';
import type { MatchRecord } from '@/types/game';
import type { PreRunRiskSnapshot } from './utils/formatters';
import { buildPreRunRiskSnapshot } from './utils/formatters';

import { SimulatorHeader } from './components/SimulatorHeader';
import { SimulatorSetup } from './components/SimulatorSetup';
import { SimulatorMatrix } from './components/SimulatorMatrix';
import { SimulatorInsights } from './components/SimulatorInsights';
import { SimulatorHandHistoryModal } from './components/SimulatorHandHistoryModal';

export default function SimulatorPage() {
  const config = useGameStore((s) => s.simulatorConfig);
  const room = getRoomConfig(config.roomId);
  
  const [showStrategy, setShowStrategy] = useState(false);
  const [riskBaseline, setRiskBaseline] = useState<PreRunRiskSnapshot | null>(null);
  const [historyModalRun, setHistoryModalRun] = useState<MatchRecord | null>(null);

  const handleIgnite = () => {
    setRiskBaseline(buildPreRunRiskSnapshot(config));
  };

  return (
    <div
      className="relative h-full min-h-full w-full overflow-hidden font-sans"
      style={{
        backgroundColor: '#140a07',
        backgroundImage:
          'radial-gradient(ellipse 120% 90% at 50% -20%, rgba(212, 168, 67, 0.2), rgba(20, 10, 7, 0) 55%), radial-gradient(circle at 18% 18%, rgba(139, 26, 26, 0.22), rgba(139, 26, 26, 0) 45%), radial-gradient(circle at 82% 22%, rgba(90, 18, 18, 0.3), rgba(90, 18, 18, 0) 48%), linear-gradient(180deg, #24120d 0%, #140a07 45%, #0c0604 100%)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgba(212, 168, 67, 0.06) 0px, rgba(212, 168, 67, 0.06) 1px, transparent 1px, transparent 11px)' }} />
      <div className="relative flex h-full min-h-full w-full flex-col overflow-hidden">
      <SimulatorHeader onOpenStrategy={() => setShowStrategy(true)} />

        <main className="mx-auto flex w-full max-w-400 flex-1 min-h-0 px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3 xl:px-5 xl:pb-5">
          <div className="grid h-full min-h-0 w-full grid-cols-1 gap-3 xl:grid-cols-12 xl:gap-4">
            <div className="min-h-0 xl:col-span-3">
              <SimulatorSetup />
            </div>
            <div className="min-h-0 xl:col-span-5">
              <SimulatorMatrix onIgnite={handleIgnite} />
            </div>
            <div className="min-h-0 xl:col-span-4">
              <SimulatorInsights riskBaseline={riskBaseline} onOpenHistory={setHistoryModalRun} />
            </div>
          </div>
        </main>
      </div>

      {showStrategy ? <StrategyModal room={room} onClose={() => setShowStrategy(false)} /> : null}
      {historyModalRun ? <SimulatorHandHistoryModal run={historyModalRun} onClose={() => setHistoryModalRun(null)} /> : null}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,168,67,0.28); border-radius: 999px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(212,168,67,0.45); }
        .sim-select { color-scheme: dark; }
        .sim-select option { background: #1b0f0b; color: #f0e6d6; }
        .sim-select option:checked { background: #3a1f17; color: #f1d98f; }
        .sim-select:focus option:checked { background: #4a261c linear-gradient(0deg, #4a261c 0%, #4a261c 100%); }
      `}} />
    </div>
  );
}
