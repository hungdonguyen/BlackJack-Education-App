import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, BrainCircuit, ChevronDown, Settings, Wallet, Route } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { getLobbyRooms, getRoomConfig } from '@/utils/rooms';
import { getBettingSummary, getPlayLogicSummary } from '../utils/formatters';

const WEB_MAX_HANDS_LIMIT = 10000;
const TAURI_MAX_HANDS_LIMIT = 50000;

function isTauriRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const hasTauriGlobals = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
  const hasTauriUserAgent = typeof navigator !== 'undefined' && navigator.userAgent.includes('Tauri');
  return hasTauriGlobals || hasTauriUserAgent;
}

type SetupSectionKey = 'gameConfig' | 'bankroll' | 'strategy' | 'rulesSummary' | 'strategyFocus';

const AnimatedParamInput = ({ label, value, onChange, min, max, step = 1, helperText }: any) => (
  <label className="animate-in fade-in zoom-in-95 duration-300 text-sm font-semibold text-[#f0e6d6]/85">
    {label}
    <input 
      type="number" min={min} max={max} step={step}
      value={value} 
      onChange={onChange} 
      className="mt-1.5 w-full rounded-lg border border-[#4a90e2]/30 bg-[#4a90e2]/10 px-3 py-2 text-sm text-[#f0e6d6] shadow-inner outline-none transition-all hover:bg-[#4a90e2]/20 focus:border-[#4a90e2]/60 focus:ring-2 focus:ring-[#4a90e2]/30"
    />
    {helperText && <span className="mt-1 block text-[10.5px] text-[#4a90e2]/60 font-normal">{helperText}</span>}
  </label>
);

const CustomSelect = ({ label, value, onChange, options, animateIn }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find((opt: any) => opt.value === value) || options[0];

  return (
    <div className={`block text-sm font-semibold text-[#f0e6d6]/85 ${animateIn ? 'mt-1 mb-1 animate-in fade-in zoom-in-95 duration-300' : ''}`} ref={containerRef}>
      <span className="block mb-1.5">{label}</span>
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex w-full items-center justify-between rounded-lg border border-[#d4a843]/25 bg-black/40 py-2 pl-3 pr-3 text-sm font-semibold text-[#f0e6d6] shadow-inner outline-none transition-all hover:bg-black/60 focus:border-[#d4a843]/55 focus:ring-2 focus:ring-[#d4a843]/20 ${animateIn ? 'border-[#d4a843]/30 bg-[#d4a843]/10 hover:bg-[#d4a843]/20' : ''}`}
        >
          <span className="truncate">{selectedOption?.label}</span>
          <ChevronDown size={16} className={`ml-2 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#f1d98f]' : (animateIn ? 'text-[#d4a843]' : 'text-[#d4a843]/70')}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.ul
              initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{ originY: 0 }}
              className="absolute left-0 right-0 z-50 mt-1.5 max-h-[30rem] overflow-y-auto rounded-xl border border-[#d4a843]/30 bg-[#160b09] p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] custom-scrollbar"
            >
              {options.map((opt: any) => (
                <li
                  key={opt.value}
                  onClick={() => {
                    onChange({ target: { value: opt.value } });
                    setIsOpen(false);
                  }}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors ${
                    value === opt.value
                      ? 'bg-[#d4a843]/25 text-[#f1d98f] font-bold'
                      : 'text-[#f0e6d6]/80 hover:bg-[#d4a843]/15 hover:text-[#f0e6d6]'
                  }`}
                >
                  {opt.label}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export function SimulatorSetup() {
  const config = useGameStore((s) => s.simulatorConfig);
  const setConfig = useGameStore((s) => s.setSimulatorConfig);
  const maxHandsLimit = isTauriRuntime() ? TAURI_MAX_HANDS_LIMIT : WEB_MAX_HANDS_LIMIT;
  const [openSections, setOpenSections] = useState<Record<SetupSectionKey, boolean>>({
    gameConfig: true,
    bankroll: true,
    strategy: true,
    rulesSummary: true,
    strategyFocus: true,
  });

  const room = getRoomConfig(config.roomId);
  const gameRules = room.gameRules as typeof room.gameRules & { canBurn?: boolean; push22?: boolean };
  const rooms = getLobbyRooms();
  const panelClass = 'rounded-2xl border border-[#d4a843]/20 bg-[linear-gradient(180deg,rgba(36,20,14,0.85)_0%,rgba(24,12,9,0.85)_100%)] p-4 shadow-[inset_0_1px_0_rgba(212,168,67,0.1)] backdrop-blur-md';
  const inputClass = 'mt-1.5 w-full rounded-lg border border-[#d4a843]/25 bg-black/25 px-3 py-2 text-sm text-[#f0e6d6] shadow-inner outline-none transition-all focus:border-[#d4a843]/55 focus:ring-2 focus:ring-[#d4a843]/20';

  const toggleSection = (section: SetupSectionKey) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const renderSectionHeader = (
    section: SetupSectionKey,
    title: string,
    Icon: typeof Settings,
    accentClass = 'text-[#f1d98f]',
  ) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="flex w-full items-center justify-between border-b border-[#d4a843]/15 pb-2 text-left"
    >
      <h2 className={`flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em] ${accentClass}`}>
        <Icon size={16} className={accentClass} /> {title}
      </h2>
      <ChevronDown
        size={18}
        className={`transition-transform duration-200 ${accentClass} ${openSections[section] ? 'rotate-180' : ''}`}
      />
    </button>
  );

  return (
    <aside className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
      <div className={`relative z-50 flex flex-col gap-3 ${panelClass}`}>
        {renderSectionHeader('gameConfig', 'Game Config', Settings)}

        <AnimatePresence initial={false}>
          {openSections.gameConfig && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="space-y-3 overflow-hidden"
            >
              <CustomSelect
                label="Room Rules"
                value={config.roomId}
                onChange={(e: any) => setConfig({ roomId: e.target.value })}
                options={rooms.map((entry) => ({ value: entry.id, label: entry.name }))}
              />

              <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm font-semibold text-[#f0e6d6]/85">
                  Max Hands
                  <input
                    type="number" min={1} max={maxHandsLimit}
                    value={config.maxHands}
                    onChange={(e) => setConfig({ maxHands: Math.max(1, Math.min(maxHandsLimit, Number(e.target.value || 1))) })}
                    className={inputClass}
                  />
                  <span className="mt-1 block text-[10.5px] text-[#f0e6d6]/40 font-normal tracking-wide">Range: 1 - {maxHandsLimit.toLocaleString()}</span>
                  </label>
                  <label className="text-sm font-semibold text-[#f0e6d6]/85">
                  Seats
                  <input
                    type="number" min={1} max={5}
                    value={Number.isFinite(config.seatCount) ? config.seatCount : 1}
                    onChange={(e) => setConfig({ seatCount: Math.max(1, Math.min(5, Number(e.target.value || 1))) })}
                    className={inputClass}
                  />
                  <span className="mt-1 block text-[10.5px] text-[#f0e6d6]/40 font-normal tracking-wide">Range: 1 – 5 seats</span>
                  </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`relative z-40 flex flex-col gap-3 ${panelClass}`}>
        {renderSectionHeader('bankroll', 'Bankroll & Stakes', Wallet)}
        <AnimatePresence initial={false}>
          {openSections.bankroll && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold text-[#f0e6d6]/85">
                  Bankroll
                  <input
                    type="number" min={1}
                    value={config.initialBankroll === 0 ? '' : config.initialBankroll}
                    onChange={(e) => setConfig({ initialBankroll: Math.max(1, Number(e.target.value)) })}
                    className={inputClass}
                  />
                  <span className="mt-1 block text-[10.5px] text-[#f0e6d6]/40 font-normal tracking-wide">Min: 1</span>
                </label>
                <label className="text-sm font-semibold text-[#f0e6d6]/85">
                  Base Unit
                  <input
                    type="number" min={1}
                    value={config.baseUnit === 0 ? '' : config.baseUnit}
                    onChange={(e) => setConfig({ baseUnit: Math.max(1, Number(e.target.value)) })}
                    className={inputClass}
                  />
                  <span className="mt-1 block text-[10.5px] text-[#f0e6d6]/40 font-normal tracking-wide">Min: 1</span>
                </label>
                <label className="text-sm font-semibold text-[#f0e6d6]/85">
                  Target Mul
                  <input
                    type="number" min={1} step={0.1}
                    value={config.targetMultiplier}
                    onChange={(e) => setConfig({ targetMultiplier: Math.max(1, Number(e.target.value || 1)) })}
                    className={inputClass}
                  />
                  <span className="mt-1 block text-[10.5px] text-[#f0e6d6]/40 font-normal tracking-wide">Min: 1.0x (e.g. x1.5 = take profit at +50%)</span>
                </label>
                <label className="text-sm font-semibold text-[#f0e6d6]/85">
                  Stop Loss
                  <input
                    type="number" min={0}
                    value={config.stopLoss}
                    onChange={(e) => setConfig({ stopLoss: Math.max(0, Number(e.target.value || 0)) })}
                    className={inputClass}
                  />
                  <span className="mt-1 block text-[10.5px] text-[#f0e6d6]/40 font-normal tracking-wide">Min: 0 (0 = no stop loss)</span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={`relative z-30 flex flex-col gap-3 ${panelClass}`}>
        {renderSectionHeader('strategy', 'Strategy Profile', Route)}

        <AnimatePresence initial={false}>
          {openSections.strategy && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="space-y-3 overflow-hidden"
            >
              <CustomSelect
                label="Betting System"
                value={config.bettingSystem}
                onChange={(e: any) => setConfig({ bettingSystem: e.target.value as typeof config.bettingSystem })}
                options={[
                  { value: "flat", label: "Flat Target" },
                  { value: "martingale", label: "Martingale" },
                  { value: "parlay", label: "Parlay" },
                  { value: "1326", label: "1-3-2-6 System" },
                  { value: "fibonacci", label: "Fibonacci Sequence" },
                  { value: "d_alembert", label: "D'Alembert" },
                  { value: "regression", label: "Regression Method" },
                ]}
              />

        {config.bettingSystem === 'martingale' && (
          <div className="grid grid-cols-2 gap-3">
              <AnimatedParamInput 
                 label="Max Steps (x2)" 
                 value={config.bettingParams.martingaleMaxSteps ?? 6} 
                 min={1} max={20}
                 onChange={(e: any) => setConfig({ bettingParams: { martingaleMaxSteps: Math.max(1, Number(e.target.value)) } })}
                 helperText="Range: 1 – 20 steps"
              />
          </div>
        )}
        
        {config.bettingSystem === 'parlay' && (
          <div className="grid grid-cols-2 gap-3">
              <AnimatedParamInput 
                 label="Target Steps" 
                 value={config.bettingParams.parlayMaxSteps ?? 4} 
                 min={1} max={20}
                 onChange={(e: any) => setConfig({ bettingParams: { parlayMaxSteps: Math.max(1, Number(e.target.value)) } })}
                 helperText="Range: 1 – 20 steps"
              />
              <AnimatedParamInput 
                 label="Multiplier Base" 
                 value={config.bettingParams.parlayMultiplier ?? 2} 
                 min={1.1} step={0.1}
                 onChange={(e: any) => setConfig({ bettingParams: { parlayMultiplier: Math.max(1.1, Number(e.target.value)) } })}
                 helperText="Min: x1.1 multiplier"
              />
          </div>
        )}

        {config.bettingSystem === 'fibonacci' && (
          <div className="grid grid-cols-2 gap-3">
             <AnimatedParamInput 
                 label="Max Fibo Steps" 
                 value={config.bettingParams.fibonacciMaxSteps ?? 10} 
                 min={1} max={17}
                 onChange={(e: any) => setConfig({ bettingParams: { fibonacciMaxSteps: Math.max(1, Number(e.target.value)) } })}
                 helperText="Range: 1 – 17 steps"
              />
          </div>
        )}

        {config.bettingSystem === 'd_alembert' && (
          <div className="grid grid-cols-2 gap-3">
             <AnimatedParamInput 
                 label="Unit Steps +/-" 
                 value={config.bettingParams.dAlembertUnit ?? 1} 
                 min={0.1} step={0.1}
                 onChange={(e: any) => setConfig({ bettingParams: { dAlembertUnit: Math.max(0.1, Number(e.target.value)) } })}
                 helperText="Min: 0.1 unit per step"
              />
          </div>
        )}

        {config.bettingSystem === 'regression' && (
          <div className="grid grid-cols-2 gap-3">
             <AnimatedParamInput 
                 label="Target Step Peak" 
                 value={config.bettingParams.regressionTargetSteps ?? 3} 
                 min={2} max={10}
                 onChange={(e: any) => setConfig({ bettingParams: { regressionTargetSteps: Math.max(2, Number(e.target.value)) } })}
                 helperText="Range: 2 – 10 steps"
              />
          </div>
        )}

        <CustomSelect 
          label="Play Action Logic" 
          value={config.playDecisionSource} 
          onChange={(e: any) => setConfig({ playDecisionSource: e.target.value as typeof config.playDecisionSource })} 
          options={[
            { value: "strategy_advice", label: "Strategy Advice (Card Counting)" },
            { value: "basic_strategy", label: "Mathematical Basic Strategy" },
          ]} 
        />

        {config.roomId === 'exchange_21' && config.playDecisionSource === 'strategy_advice' && (
          <CustomSelect 
            label="Exchange Switch Engine" 
            value={config.exchangeSwitchEngine || 'cindy_advanced'} 
            onChange={(e: any) => setConfig({ exchangeSwitchEngine: e.target.value as typeof config.exchangeSwitchEngine })} 
            options={[
              { value: "cindy_basic", label: "Cindy Liu Basic" },
              { value: "cindy_advanced", label: "Cindy Liu Advanced" },
              { value: "arnold_snyder", label: "Arnold Snyder Matrix" },
            ]} 
            animateIn
          />
        )}

        <label className="mt-1 text-sm font-semibold text-[#f0e6d6]/85">
            Worker Delay (ms)
            <input 
              type="number" min={0} max={1000}
              value={config.delayMs === undefined ? 0 : config.delayMs} 
              onChange={(e) => setConfig({ delayMs: Math.max(0, Math.min(1000, Number(e.target.value || 0))) })} 
              className={inputClass}
            />
            <span className="mt-1 block text-[10.5px] text-[#f0e6d6]/40 font-normal tracking-wide">Range: 0 – 1000 ms</span>
        </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3 pb-1">
          <div className="group relative overflow-hidden rounded-2xl border border-[#d4a843]/20 bg-[#d4a843]/10 p-4">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#d4a843]/10 opacity-60 blur-3xl transition-opacity group-hover:opacity-100" />
            <button
              type="button"
              onClick={() => toggleSection('rulesSummary')}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-[#f1d98f]" />
                <h4 className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#f1d98f]">Rules Summary</h4>
              </div>
              <ChevronDown
                size={18}
                className={`text-[#f1d98f] mb-2 transition-transform duration-200 ${openSections.rulesSummary ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openSections.rulesSummary && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="relative z-10 p-2.5 mt-2 bg-black/30 border border-[#d4a843]/15 rounded-lg shadow-inner text-xs font-medium text-[#f0e6d6]/80">
                    <ul className="pl-4 space-y-1 list-disc text-[#e8c860]/90">
                       <li><strong>{room.gameRules.numberOfDecks} Decks</strong> in Play.</li>
                       <li>Dealer <strong>{room.gameRules.dealerHitsSoft17 ? 'Hits on Soft 17' : 'Stands on All 17'}</strong>.</li>
                       <li>Blackjack payout is <strong>{room.blackjackMultiplier === 1.5 ? '3:2' : room.blackjackMultiplier === 1.2 ? '6:5' : `${room.blackjackMultiplier}:1`}</strong>.</li>
                       {room.gameRules.allowSurrender && <li><strong>Late Surrender</strong> is allowed.</li>}
                       {room.gameRules.allowInfiniteDouble && <li>Infinite doubling (InfinityDoubleDown) mechanics are active.</li>}
                       {room.gameRules.omitTens && <li className="text-rose-300"><strong>Spanish Rules:</strong> All 10-value spot cards are removed.</li>}
                       {gameRules.canBurn && <li className="text-orange-300"><strong>Burn Rule:</strong> Player can burn the 2nd card for a fee.</li>}
                       {gameRules.push22 && <li className="text-indigo-300"><strong>Push 22:</strong> Dealer busting with exactly 22 results in a Push.</li>}
                       {room.id === 'free_action' && <li className="text-amber-200"><strong>Free Actions:</strong> Splits and Doubles on hard 9-11 are free.</li>}
                       {room.id === 'exchange_21' && <li className="text-fuchsia-200"><strong>Exchange 21:</strong> Switch top cards between two hands.</li>}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-[#8b1a1a]/30 bg-[#8b1a1a]/20 p-4">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#d4a843]/10 opacity-50 blur-3xl transition-opacity group-hover:opacity-95" />
            <button
              type="button"
              onClick={() => toggleSection('strategyFocus')}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit size={16} className="text-[#f1d98f]" />
                <h4 className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#f1d98f]">Strategy Focus</h4>
              </div>
              <ChevronDown
                size={18}
                className={`text-[#f1d98f] mb-2 transition-transform duration-200 ${openSections.strategyFocus ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openSections.strategyFocus && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="relative z-10 space-y-2 text-sm font-medium text-[#f0e6d6]/80">
                    <p>{getBettingSummary(config.bettingSystem)}</p>
                    <p>{getPlayLogicSummary(config.playDecisionSource)}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
      </div>
    </aside>
  );
}
