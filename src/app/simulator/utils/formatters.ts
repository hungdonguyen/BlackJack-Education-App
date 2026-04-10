import type { SimulatorConfig } from '@/types/simulator';

export interface PreRunRiskSnapshot {
  projectedPeakBet: number;
  projectedBankrollAtRiskPct: number;
  projectedRiskOfRuinPct: number;
  notes: string[];
}

export function formatMoney(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  return `${sign}$${abs.toLocaleString()}`;
}

export function percent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function ratio(value: number): string {
  if (!Number.isFinite(value)) return 'inf';
  return value.toFixed(2);
}

export function getBettingSummary(sys: string): string {
  if (sys === 'flat') return 'Flat Betting: Stakes remain constant. Offers the lowest variance and risk of ruin.';
  if (sys === 'martingale') return 'Martingale: Doubles the bet after every loss to recoup losses. Extremely high risk of ruin.';
  if (sys === 'parlay') return 'Parlay: Increases the bet after wins. Aggressive approach to ride hot streaks.';
  if (sys === '1326') return '1-3-2-6: Structured progression. Caps the max loss per sequence while chasing a 4-win streak.';
  if (sys === 'fibonacci') return 'Fibonacci: Increases bets on losses following the sequence. Slower progression than Martingale.';
  if (sys === 'd_alembert') return 'D\'Alembert: Adds 1 unit after a loss, subtracts 1 after a win. A balanced, smooth progression.';
  if (sys === 'regression') return 'Regression: Takes early profit after successive wins by safely dropping the bet size back to base.';
  return '';
}

export function getPlayLogicSummary(logic: string): string {
  if (logic === 'basic_strategy') return 'Basic Strategy: Mathematically optimal baseline responses without tracking the running count.';
  if (logic === 'strategy_advice') return 'Strategy Advice: Dynamically adjusts baseline using True Count deviations (Illustrious 18, Surrender Fab 4).';
  return '';
}

export function humanizeSimulatorAction(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) return '';
  if (trimmed === 'NO_BET') return 'No Bet (Insufficient Bankroll)';
  if (trimmed === 'BLACKJACK') return 'Blackjack';

  const switchParsed = /^S(\d+):SWITCH$/.exec(trimmed);
  if (switchParsed) return `Seat ${switchParsed[1]}: Switch`;

  const parsed = /^S(\d+)H(\d+):([A-Z0-9_]+)$/.exec(trimmed);
  const legacyParsed = /^H(\d+):([A-Z0-9_]+)$/.exec(trimmed);

  if (!parsed && !legacyParsed) return trimmed.replaceAll('_', ' ').toLowerCase();

  const seatIndex = parsed ? Number(parsed[1]) : 1;
  const handIndex = parsed ? Number(parsed[2]) : Number(legacyParsed?.[1] ?? 1);
  const actionCode = parsed ? parsed[3] : (legacyParsed?.[2] ?? '');
  const actionMap: Record<string, string> = {
    HIT: 'Hit', STAND: 'Stand', DOUBLE: 'Double', SPLIT: 'Split', SURRENDER: 'Surrender', BURN: 'Burn', ZAP: 'Zap', H: 'Hit', S: 'Stand', D: 'Double', SP: 'Split', SU: 'Surrender', B: 'Burn', Z: 'Zap',
  };

  const readable = actionMap[actionCode] ?? actionCode;
  return `Seat ${seatIndex} · H${handIndex}: ${readable}`;
}

export function normalizeActionList(actions: string[], blackjacks = 0): string[] {
  const list = actions.map(humanizeSimulatorAction).filter((entry) => entry.length > 0);
  if (list.length === 0 && blackjacks > 0) return ['Blackjack Record'];
  return list.length > 0 ? list : ['-'];
}

export function buildPreRunRiskSnapshot(config: SimulatorConfig): PreRunRiskSnapshot {
  let projectedPeakBet = config.baseUnit;
  const notes: string[] = [];

  if (config.bettingSystem === 'martingale') {
    const steps = Math.max(1, config.bettingParams.martingaleMaxSteps ?? 6);
    projectedPeakBet = config.baseUnit * 2 ** Math.max(0, steps - 1);
    notes.push(`Martingale capped at step ${steps}.`);
  } else if (config.bettingSystem === 'parlay') {
    const steps = Math.max(1, config.bettingParams.parlayMaxSteps ?? 4);
    const multiplier = Math.max(1.1, config.bettingParams.parlayMultiplier ?? 2);
    projectedPeakBet = config.baseUnit * multiplier ** Math.max(0, steps - 1);
    notes.push(`Parlay scales x${multiplier.toFixed(1)} for ${steps} steps.`);
  } else if (config.bettingSystem === '1326') {
    projectedPeakBet = config.baseUnit * 6;
    notes.push('1-3-2-6 reaches 6u peak on final step.');
  } else if (config.bettingSystem === 'fibonacci') {
    projectedPeakBet = config.baseUnit * 13; 
    notes.push('Fibonacci steps increase steadily.');
  } else if (config.bettingSystem === 'regression') {
    projectedPeakBet = config.baseUnit * 2; 
    notes.push('Regression takes safe profits.');
  } else {
    notes.push('Flat betting maintains core stake.');
  }

  const projectedBankrollAtRiskPct = Math.min(1, projectedPeakBet * 3 / Math.max(1, config.initialBankroll));
  const projectedRiskOfRuinPct = Math.min(1, projectedPeakBet * 6 / Math.max(1, config.initialBankroll));

  return { projectedPeakBet, projectedBankrollAtRiskPct, projectedRiskOfRuinPct, notes };
}

export interface RiskConclusionLine {
  text: string;
  type: 'neutral' | 'success' | 'warning' | 'danger';
}

export function buildRiskConclusion(
  pre: PreRunRiskSnapshot,
  post: { bankrollAtRiskPct: number; riskOfRuinEstimate: number; roi: number },
): RiskConclusionLine[] {
  const deltaRuin = post.riskOfRuinEstimate - pre.projectedRiskOfRuinPct;
  const deltaAtRisk = post.bankrollAtRiskPct - pre.projectedBankrollAtRiskPct;
  const roiFmt = percent(post.roi);
  
  const lines: RiskConclusionLine[] = [];
  
  // 1. Evaluate ROI magnitude
  if (post.roi <= -0.5) {
    lines.push({ text: `Disastrous sequence (ROI: ${roiFmt}). You lost over half your bankroll.`, type: 'danger' });
  } else if (post.roi < -0.05) {
    lines.push({ text: `Negative return (ROI: ${roiFmt}). The strategy failed to overcome the variance or house edge this session.`, type: 'warning' });
  } else if (post.roi <= 0.05 && post.roi >= -0.05) {
    lines.push({ text: `Flatline sequence (ROI: ${roiFmt}). Effectively a breakeven run with minimal capital drift.`, type: 'neutral' });
  } else if (post.roi >= 0.5) {
    lines.push({ text: `Exceptional upside (ROI: ${roiFmt}). You captured a massive scaling run well beyond the statistical norm.`, type: 'success' });
  } else {
    lines.push({ text: `Profitable run (ROI: ${roiFmt}). Solid, moderate capital growth achieved.`, type: 'success' });
  }

  // 2. Evaluate Risk Independently (No averaging)
  if (post.riskOfRuinEstimate > 0.4) {
     lines.push({ text: `[WARNING] Extreme Risk: Realized Risk of Ruin reached ${percent(post.riskOfRuinEstimate)}. This setup is structurally unsafe for current stakes.`, type: 'danger' });
  } else if (deltaRuin > 0.15) {
     lines.push({ text: `High Ruin Danger: Realized ruin threat spiked to ${percent(post.riskOfRuinEstimate)}, exceeding projections by ${percent(deltaRuin)}.`, type: 'danger' });
  } else if (deltaAtRisk > 0.15) {
     lines.push({ text: `High Volatility: Heavy drawdowns pushed Bankroll At Risk to ${percent(post.bankrollAtRiskPct)}, exceeding initial estimates by ${percent(deltaAtRisk)}.`, type: 'warning' });
  } else if (post.riskOfRuinEstimate < 0.05 && post.roi > 0) {
     lines.push({ text: `Stellar Control: The negligible ruin risk (${percent(post.riskOfRuinEstimate)}) combined with positive ROI indicates a highly efficient setup.`, type: 'success' });
  } else if (deltaRuin <= 0.05 && deltaAtRisk <= 0.05) {
     lines.push({ text: `Risk was tightly controlled, with actual drawdowns remaining below or closely aligned with theoretical ceilings.`, type: 'neutral' });
  } else {
     lines.push({ text: `Realized risk metrics fluctuated but ultimately remained within acceptable statistical variance limits.`, type: 'neutral' });
  }
  
  return lines;
}
