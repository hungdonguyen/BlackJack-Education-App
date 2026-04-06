import { Info, BrainCircuit } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { getLobbyRooms, getRoomConfig } from '@/utils/rooms';
import { getBettingSummary, getPlayLogicSummary } from '../utils/formatters';

export function SimulatorSetup() {
  const config = useGameStore((s) => s.simulatorConfig);
  const setConfig = useGameStore((s) => s.setSimulatorConfig);

  const room = getRoomConfig(config.roomId);
  const gameRules = room.gameRules as typeof room.gameRules & { canBurn?: boolean; push22?: boolean };
  const rooms = getLobbyRooms();
  const panelClass = 'rounded-2xl border border-[#d4a843]/20 bg-[linear-gradient(180deg,rgba(36,20,14,0.85)_0%,rgba(24,12,9,0.85)_100%)] p-4 shadow-[inset_0_1px_0_rgba(212,168,67,0.1)] backdrop-blur-md';
  const inputClass = 'mt-1.5 w-full rounded-lg border border-[#d4a843]/25 bg-black/25 px-3 py-2 text-sm text-[#f0e6d6] shadow-inner outline-none transition-all focus:border-[#d4a843]/55 focus:ring-2 focus:ring-[#d4a843]/20';
  const selectClass = `${inputClass} sim-select`;

  return (
    <aside className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
      <div className={`flex flex-col gap-3 ${panelClass}`}>
        <div className="border-b border-[#d4a843]/15 pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d4a843]/75">Game Config</h2>
        </div>
        
        <label className="text-sm font-semibold text-[#f0e6d6]/85">
          Room Rules
          <select 
            value={config.roomId} 
            onChange={(e) => setConfig({ roomId: e.target.value })} 
            className={selectClass}
          >
            {rooms.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-semibold text-[#f0e6d6]/85">
            Max Hands
            <input 
              type="number" min={1} max={100000} 
              value={config.maxHands} 
              onChange={(e) => setConfig({ maxHands: Math.max(1, Math.min(100000, Number(e.target.value || 1))) })} 
              className={inputClass}
            />
            </label>
            <label className="text-sm font-semibold text-[#f0e6d6]/85">
            Seats
            <input 
              type="number" min={1} max={5} 
              value={Number.isFinite(config.seatCount) ? config.seatCount : 1} 
              onChange={(e) => setConfig({ seatCount: Math.max(1, Math.min(5, Number(e.target.value || 1))) })} 
              className={inputClass}
            />
            </label>
        </div>
      </div>

      <div className={`flex flex-col gap-3 ${panelClass}`}>
        <div className="border-b border-[#d4a843]/15 pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d4a843]/75">Bankroll & Stakes</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-semibold text-[#f0e6d6]/85">
            Bankroll
            <input 
              type="number"
              value={config.initialBankroll === 0 ? '' : config.initialBankroll} 
              onChange={(e) => setConfig({ initialBankroll: Number(e.target.value) })} 
              className={inputClass}
            />
          </label>
          <label className="text-sm font-semibold text-[#f0e6d6]/85">
            Base Unit
            <input 
              type="number"
              value={config.baseUnit === 0 ? '' : config.baseUnit} 
              onChange={(e) => setConfig({ baseUnit: Number(e.target.value) })} 
              className={inputClass}
            />
          </label>
          <label className="text-sm font-semibold text-[#f0e6d6]/85">
            Target Mul
            <input 
              type="number" min={1} step={0.1} 
              value={config.targetMultiplier} 
              onChange={(e) => setConfig({ targetMultiplier: Math.max(1, Number(e.target.value || 1)) })} 
              className={inputClass}
            />
          </label>
          <label className="text-sm font-semibold text-[#f0e6d6]/85">
            Stop Loss
            <input 
              type="number" min={0} 
              value={config.stopLoss} 
              onChange={(e) => setConfig({ stopLoss: Math.max(0, Number(e.target.value || 0)) })} 
              className={inputClass}
            />
          </label>
        </div>
      </div>

      <div className={`flex flex-col gap-3 ${panelClass}`}>
        <div className="border-b border-[#d4a843]/15 pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d4a843]/75">Strategy Profile</h2>
        </div>
        
        <label className="text-sm font-semibold text-[#f0e6d6]/85">
          Betting System
          <select 
            value={config.bettingSystem} 
            onChange={(e) => setConfig({ bettingSystem: e.target.value as typeof config.bettingSystem })} 
            className={selectClass}
          >
            <option value="flat">Flat Target</option>
            <option value="martingale">Martingale</option>
            <option value="parlay">Parlay</option>
            <option value="1326">1-3-2-6 System</option>
            <option value="fibonacci">Fibonacci Sequence</option>
            <option value="d_alembert">D&apos;Alembert</option>
            <option value="regression">Regression Method</option>
          </select>
        </label>

        <label className="text-sm font-semibold text-[#f0e6d6]/85">
          Play Action Logic
          <select 
            value={config.playDecisionSource} 
            onChange={(e) => setConfig({ playDecisionSource: e.target.value as typeof config.playDecisionSource })} 
            className={selectClass}
          >
            <option value="strategy_advice">Strategy Advice (Card Counting)</option>
            <option value="basic_strategy">Mathematical Basic Strategy</option>
          </select>
        </label>

        {config.roomId === 'exchange_21' && config.playDecisionSource === 'strategy_advice' && (
          <label className="mt-1 animate-in fade-in zoom-in-95 text-sm font-semibold text-[#f0e6d6]/85 duration-300">
            Exchange Switch Engine
            <select 
              value={config.exchangeSwitchEngine || 'cindy_advanced'} 
              onChange={(e) => setConfig({ exchangeSwitchEngine: e.target.value as typeof config.exchangeSwitchEngine })} 
              className="sim-select mt-1.5 w-full rounded-lg border border-[#d4a843]/30 bg-[#d4a843]/10 px-3 py-2 text-sm font-semibold text-[#f0e6d6] outline-none focus:border-[#d4a843]/60 focus:ring-2 focus:ring-[#d4a843]/20"
            >
              <option value="cindy_basic">Cindy Liu Basic</option>
              <option value="cindy_advanced">Cindy Liu Advanced</option>
              <option value="arnold_snyder">Arnold Snyder Matrix</option>
            </select>
          </label>
        )}

        <label className="mt-1 text-sm font-semibold text-[#f0e6d6]/85">
            Worker Delay (ms)
            <input 
              type="number" min={0} max={500}
              value={config.delayMs || 0} 
              onChange={(e) => setConfig({ delayMs: Math.max(0, Math.min(500, Number(e.target.value || 0))) })} 
              className={inputClass}
            />
        </label>
      </div>

      <div className="flex flex-col gap-3 pb-1">
          <div className="group relative overflow-hidden rounded-2xl border border-[#d4a843]/20 bg-[#d4a843]/10 p-4">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#d4a843]/10 opacity-60 blur-3xl transition-opacity group-hover:opacity-100" />
            <div className="flex items-center gap-2 mb-2">
              <Info size={16} className="text-[#e8c860]" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#e8c860]">Rules Summary</h4>
            </div>
            <div className="relative z-10 mt-2 space-y-2 text-sm font-medium text-[#f0e6d6]/80">
              <p>{room.gameRules.numberOfDecks} Decks, Dealer {room.gameRules.dealerHitsSoft17 ? 'Hits Soft 17' : 'Stands All 17'}. Blackjack Pays {room.blackjackMultiplier}:1.</p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {room.gameRules.allowSurrender && <span className="rounded-md border border-[#d4a843]/35 bg-[#d4a843]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#f1d98f]">Surrender</span>}
                {room.gameRules.omitTens && <span className="rounded-md border border-rose-500/40 bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rose-200">No 10s (Spanish)</span>}
                {gameRules.canBurn && <span className="rounded-md border border-orange-500/40 bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange-200">Burn Card</span>}
                {gameRules.push22 && <span className="rounded-md border border-indigo-500/40 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-200">Push 22</span>}
                {room.id === 'free_action' && <span className="rounded-md border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-100">Free Actions</span>}
                {room.id === 'exchange_21' && <span className="rounded-md border border-fuchsia-500/40 bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-fuchsia-100">Exchange Hand</span>}
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-[#8b1a1a]/30 bg-[#8b1a1a]/20 p-4">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#d4a843]/10 opacity-50 blur-3xl transition-opacity group-hover:opacity-95" />
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit size={16} className="text-[#e8c860]" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#e8c860]">Strategy Focus</h4>
            </div>
            <div className="relative z-10 space-y-2 text-sm font-medium text-[#f0e6d6]/80">
              <p>{getBettingSummary(config.bettingSystem)}</p>
              <p>{getPlayLogicSummary(config.playDecisionSource)}</p>
            </div>
          </div>
      </div>
    </aside>
  );
}
