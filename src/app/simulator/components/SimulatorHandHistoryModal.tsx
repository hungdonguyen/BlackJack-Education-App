import { Fragment, useMemo, useState } from 'react';
import { Eye, X, ChevronDown, ChevronUp, CheckCircle2, XCircle, MinusCircle, Database, TriangleAlert, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MatchRecord } from '@/types/game';
import { useGameStore } from '@/hooks/useGameStore';
import { getRoomConfig } from '@/utils/rooms';
import { formatMoney, normalizeActionList, percent } from '../utils/formatters';
import { EquityAreaChart } from './EquityAreaChart';

const PAGE_SIZE = 100;
const EMPTY_HISTORY: NonNullable<MatchRecord['simulatorHandHistory']> = [];

const SUIT_SYMBOL: Record<string, string> = {
  HEARTS: '♥',
  DIAMONDS: '♦',
  CLUBS: '♣',
  SPADES: '♠',
};

const ACTION_LABEL: Record<string, string> = {
  HIT: 'Hit',
  STAND: 'Stand',
  DOUBLE: 'Double',
  FREE_DOUBLE: 'Free Double',
  SPLIT: 'Split',
  FREE_SPLIT: 'Free Split',
  SURRENDER: 'Surrender',
  RESCUE: 'Rescue',
  BURN: 'Burn',
  ZAP: 'Zap',
  BLACKJACK: 'Blackjack',
};

const TAG_STYLE: Record<string, string> = {
  positive: 'border-emerald-400/25 bg-emerald-500/12 text-emerald-200',
  warning: 'border-amber-400/25 bg-amber-500/12 text-amber-100',
  risk: 'border-rose-400/25 bg-rose-500/12 text-rose-200',
  neutral: 'border-[#d4a843]/25 bg-[#d4a843]/12 text-[#f1d98f]',
};

const DISCARD_STYLE: Record<'BURN' | 'ZAP' | 'UNKNOWN', { border: string; badge: string; label: string }> = {
  BURN: {
    border: 'border-orange-400 bg-orange-50',
    badge: 'border-orange-400/40 bg-orange-500/18 text-orange-200',
    label: 'Burn',
  },
  ZAP: {
    border: 'border-fuchsia-400 bg-fuchsia-50',
    badge: 'border-fuchsia-400/40 bg-fuchsia-500/18 text-fuchsia-100',
    label: 'Zap',
  },
  UNKNOWN: {
    border: 'border-[#d4a843]/45 bg-slate-100',
    badge: 'border-[#d4a843]/30 bg-[#d4a843]/12 text-[#f1d98f]',
    label: 'Discard',
  },
};

function describeSpecialSettlement(code: string, amount: number) {
  switch (code) {
    case 'DOUBLE_COST':
      return `Double Down: Added ${formatMoney(amount)} from bankroll for the extra bet.`;
    case 'FREE_DOUBLE_GRANT':
      return `Free Double: Extra stake ${formatMoney(amount)} was covered at no bankroll cost.`;
    case 'SPLIT_COST':
      return `Split: Paid ${formatMoney(amount)} to open the new split hand.`;
    case 'FREE_SPLIT_GRANT':
      return `Free Split: New hand stake ${formatMoney(amount)} was covered at no bankroll cost.`;
    case 'BURN_COST':
      return `Burn Card: Paid burn fee ${formatMoney(amount)} to replace one card.`;
    case 'ZAP_COST':
      return `Zap: Paid zap fee ${formatMoney(amount)} to redraw the opening hand.`;
    case 'FREE_ZAP_GRANT':
      return 'Free Zap: Hand redraw was granted with no bankroll cost.';
    default:
      return `${code}: ${formatMoney(amount)}`;
  }
}

function getWindowPages(total: number, current: number) {
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end = Math.min(total, Math.max(current + 2, 5));
  const pages: number[] = [];
  for (let value = start; value <= end; value += 1) pages.push(value);
  return pages;
}

function summaryValue(value: number | undefined, formatter: (input: number) => string, fallback = '--') {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return formatter(value);
}

function rankLabel(rank: string) {
  const normalized = rank.toUpperCase();
  const map: Record<string, string> = {
    ACE: 'A',
    A: 'A',
    '1': 'A',
    KING: 'K',
    K: 'K',
    QUEEN: 'Q',
    Q: 'Q',
    JACK: 'J',
    J: 'J',
    TEN: '10',
    '10': '10',
    NINE: '9',
    '9': '9',
    EIGHT: '8',
    '8': '8',
    SEVEN: '7',
    '7': '7',
    SIX: '6',
    '6': '6',
    FIVE: '5',
    '5': '5',
    FOUR: '4',
    '4': '4',
    THREE: '3',
    '3': '3',
    TWO: '2',
    '2': '2',
  };
  return map[normalized] ?? rank;
}

function valueFromRank(rank: string) {
  const normalized = rank.toUpperCase();
  if (normalized === 'ACE' || normalized === 'A' || normalized === '1') return 11;
  if (normalized === 'KING' || normalized === 'K' || normalized === 'QUEEN' || normalized === 'Q' || normalized === 'JACK' || normalized === 'J' || normalized === 'TEN') return 10;
  const parsed = Number(normalized);
  if (Number.isFinite(parsed) && parsed >= 2 && parsed <= 10) return parsed;
  return 10;
}

function calculatePoints(cards: Array<{ value: number }>) {
  let total = cards.reduce((sum, card) => sum + card.value, 0);
  let aces = cards.filter((card) => card.value === 11).length;

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  if (aces > 0 && total < 21) {
    return `${total - 10}/${total}`;
  }

  return total;
}

function parseHandActionToken(token: string) {
  const match = /^S(\d+)H(\d+):([A-Z_]+)$/.exec(token.trim());
  if (!match) return null;
  return {
    seatNumber: Number(match[1]),
    handNumber: Number(match[2]),
    code: match[3],
  };
}

function formatActionLine(code: string, points: number | string) {
  const fallback = code.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  const label = ACTION_LABEL[code] ?? fallback;
  return `${label}: ${points}`;
}

function buildDealerFlow(cards: Array<{ value: number }>) {
  if (cards.length === 0) {
    return ['Initial: --', 'Profit/Loss: --'];
  }

  const lines: string[] = [];
  const initialCount = Math.min(2, cards.length);
  lines.push(`Initial: ${calculatePoints(cards.slice(0, initialCount))}`);

  for (let index = initialCount; index < cards.length; index += 1) {
    lines.push(formatActionLine('HIT', calculatePoints(cards.slice(0, index + 1))));
  }

  if (cards.length <= 2) {
    lines.push(formatActionLine('STAND', calculatePoints(cards)));
  }

  return lines;
}

function buildPlayerHandTags(params: {
  playerTotal: number;
  cardsLength: number;
  surrendered: boolean;
  actionCodes: string[];
  seatSwitched: boolean;
}) {
  const { playerTotal, cardsLength, surrendered, actionCodes, seatSwitched } = params;

  const tags: Array<{ label: string; tone: keyof typeof TAG_STYLE }> = [];
  const doubleCount = actionCodes.filter((code) => code === 'DOUBLE' || code === 'FREE_DOUBLE').length;

  if (actionCodes.includes('FREE_SPLIT')) tags.push({ label: 'FREE SPLIT', tone: 'positive' });
  if (actionCodes.includes('SPLIT')) tags.push({ label: 'SPLIT', tone: 'neutral' });
  if (actionCodes.includes('FREE_DOUBLE')) tags.push({ label: 'FREE DOUBLE', tone: 'positive' });
  if (actionCodes.includes('DOUBLE')) tags.push({ label: 'DOUBLE', tone: 'neutral' });
  if (doubleCount >= 2) tags.push({ label: `${doubleCount}X DOUBLE`, tone: 'warning' });
  if (actionCodes.includes('BURN')) tags.push({ label: 'BURN', tone: 'warning' });
  if (actionCodes.includes('ZAP')) tags.push({ label: 'ZAP', tone: 'warning' });
  if (seatSwitched) tags.push({ label: 'SWITCH', tone: 'neutral' });

  if (!surrendered && playerTotal > 21) tags.push({ label: 'BUST', tone: 'risk' });
  if (!surrendered && cardsLength === 2 && playerTotal === 21) tags.push({ label: 'BLACKJACK', tone: 'positive' });

  return tags;
}

function groupPlayerHandsBySeat(
  playerHands: NonNullable<NonNullable<MatchRecord['simulatorHandHistory']>[number]['playerHands']>,
) {
  const grouped: Record<number, typeof playerHands> = {};
  for (const hand of playerHands) {
    if (!grouped[hand.seatNumber]) grouped[hand.seatNumber] = [];
    grouped[hand.seatNumber].push(hand);
  }

  return Object.entries(grouped)
    .map(([seat, hands]) => ({
      seatNumber: Number(seat),
      hands: hands.sort((a, b) => a.handNumber - b.handNumber),
      seatProfit: hands.reduce((sum, hand) => sum + (hand.profit ?? 0), 0),
    }))
    .sort((a, b) => a.seatNumber - b.seatNumber);
}

function buildDealerTags(cards: Array<{ value: number }>, total: number) {
  const tags: Array<{ label: string; tone: keyof typeof TAG_STYLE }> = [];
  if (total > 21) {
    tags.push({ label: 'BUST', tone: 'risk' });
  } else if (cards.length === 2 && total === 21) {
    tags.push({ label: 'BLACKJACK', tone: 'positive' });
  } else if (total > 0 && total <= 21) {
    tags.push({ label: 'STAND', tone: 'neutral' });
  }
  return tags;
}

function buildGroupedTimeline(actions: string[], blackjacks: number) {
  if (!actions || actions.length === 0) {
    if (blackjacks > 0) return [{ title: 'General', items: ['Blackjack'] }];
    return [];
  }
  const groups: Array<{ title: string; items: string[] }> = [];
  let currentGroup: { title: string; items: string[] } | null = null;

  for (const token of actions) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    if (trimmed === 'NO_BET') {
      groups.push({ title: 'General', items: ['No Bet'] });
      continue;
    }
    if (trimmed === 'BLACKJACK') {
      groups.push({ title: 'General', items: ['Blackjack'] });
      continue;
    }

    let title = 'General';
    let label = trimmed;

    const switchParsed = /^S(\d+):SWITCH$/.exec(trimmed);
    const parsed = /^S(\d+)H(\d+):([A-Z0-9_]+)$/.exec(trimmed);
    const legacyParsed = /^H(\d+):([A-Z0-9_]+)$/.exec(trimmed);

    if (switchParsed) {
      title = `Seat ${switchParsed[1]}`;
      label = 'Switch';
    } else if (parsed || legacyParsed) {
      const seatIndex = parsed ? Number(parsed[1]) : 1;
      const handIndex = parsed ? Number(parsed[2]) : Number(legacyParsed?.[1] ?? 1);
      const actionCode = parsed ? parsed[3] : (legacyParsed?.[2] ?? '');
      title = `Seat ${seatIndex} - Hand ${handIndex}`;
      const actionFallback = actionCode.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      label = ACTION_LABEL[actionCode] ?? actionFallback;
    } else {
      label = ACTION_LABEL[trimmed] ?? trimmed.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    if (!currentGroup || currentGroup.title !== title) {
      currentGroup = { title, items: [label] };
      groups.push(currentGroup);
    } else {
      currentGroup.items.push(label);
    }
  }
  return groups;
}

function buildHandFlow(
  playerHand: { cards: Array<{ rank: string; suit: string; value: number }>; handNumber: number; surrendered: boolean; profit: number },
  seatHands: Array<{ cards: Array<{ rank: string; suit: string; value: number }>; handNumber: number }>,
  actions: string[],
  discardedEntries: Array<{ card: { value: number }; reason: 'BURN' | 'ZAP' | 'UNKNOWN' }>,
  configuredInitialCards: number,
) {
  const cards = playerHand.cards;
  const isSplitSeat = seatHands.length > 1;
  const lines: string[] = [];

  const formatCard = (c: { rank: string; suit: string }) => `${rankLabel(c.rank)}${SUIT_SYMBOL[c.suit] ?? c.suit.charAt(0)}`;

  if (isSplitSeat && playerHand.handNumber === 1 && seatHands[1]?.cards?.[0]) {
    const rootC1 = cards[0];
    const rootC2 = seatHands[1].cards[0];
    if (rootC1 && rootC2) {
      lines.push(`Initial Dealt: ${formatCard(rootC1)}, ${formatCard(rootC2)} (Total: ${calculatePoints([rootC1, rootC2])})`);
    }
  }

  const initialCount = Math.min(Math.max(1, configuredInitialCards), cards.length);
  let currentCount = initialCount;
  const hasZapAction = actions.includes('ZAP');

  const zapDiscardCards = (() => {
    const explicitZap = discardedEntries
      .filter((entry) => entry.reason === 'ZAP')
      .map((entry) => entry.card);

    if (explicitZap.length > 0) return explicitZap;

    if (hasZapAction) {
      return discardedEntries
        .filter((entry) => entry.reason === 'UNKNOWN')
        .map((entry) => entry.card);
    }

    return [] as Array<{ value: number }>;
  })();

  const zapPairs: Array<Array<{ value: number }>> = [];
  for (let index = 0; index + 1 < zapDiscardCards.length; index += 2) {
    zapPairs.push([zapDiscardCards[index], zapDiscardCards[index + 1]]);
  }

  const initialCards = hasZapAction && zapPairs.length > 0
    ? zapPairs[0]
    : cards.slice(0, initialCount);

  if (cards.length === 0) {
    return ['Initial: --', `Profit/Loss: ${formatMoney(playerHand.profit ?? 0)}`];
  }

  if (isSplitSeat) {
    const splitCardsText = initialCards.map(c => formatCard(c as any)).join(', ');
    lines.push(`Split Hand ${playerHand.handNumber}: ${splitCardsText} (Total: ${calculatePoints(initialCards)})`);
  } else {
    lines.push(`Initial: ${calculatePoints(initialCards)}`);
  }

  let zapIndex = 0;

  for (const actionCode of actions) {
    if ((actionCode === 'SPLIT' || actionCode === 'FREE_SPLIT') && currentCount === initialCount) {
      // Skip redundant split logging
      continue;
    }

    if (actionCode === 'ZAP') {
      const fromCards = zapPairs[zapIndex] ?? cards.slice(0, initialCount);
      const toCards = zapPairs[zapIndex + 1] ?? cards.slice(0, initialCount);
      lines.push(`${ACTION_LABEL.ZAP}: ${calculatePoints(fromCards)} -> ${calculatePoints(toCards)}`);
      zapIndex += 1;
      currentCount = initialCount;
      continue;
    }

    if (actionCode === 'HIT' || actionCode === 'DOUBLE' || actionCode === 'FREE_DOUBLE') {
      currentCount = Math.min(cards.length, currentCount + 1);
      lines.push(formatActionLine(actionCode, calculatePoints(cards.slice(0, currentCount))));
      continue;
    }

    if (actionCode === 'SURRENDER' || actionCode === 'RESCUE') {
      lines.push(formatActionLine(actionCode, 'Surrender'));
      continue;
    }

    if (actionCode === 'BURN') {
      lines.push(formatActionLine(actionCode, calculatePoints(cards.slice(0, currentCount))));
      continue;
    }

    lines.push(formatActionLine(actionCode, calculatePoints(cards.slice(0, currentCount))));
  }

  if (playerHand.surrendered && !actions.includes('SURRENDER') && !actions.includes('RESCUE')) {
    lines.push('Surrender: Surrender');
  }

  lines.push(`Profit/Loss: ${(playerHand.profit ?? 0) > 0 ? '+' : ''}${formatMoney(playerHand.profit ?? 0)}`);

  return lines;
}

function normalizeDiscardedCards(
  discardedCards: unknown,
  actionCodes: string[],
): Array<{ card: { rank: string; suit: string; value: number; isHidden?: boolean }; reason: 'BURN' | 'ZAP' | 'UNKNOWN' }> {
  if (!Array.isArray(discardedCards)) return [];

  const inferredReason: 'BURN' | 'ZAP' | 'UNKNOWN' =
    actionCodes.includes('ZAP') && !actionCodes.includes('BURN')
      ? 'ZAP'
      : actionCodes.includes('BURN') && !actionCodes.includes('ZAP')
      ? 'BURN'
      : 'UNKNOWN';

  const normalized: Array<{ card: { rank: string; suit: string; value: number; isHidden?: boolean }; reason: 'BURN' | 'ZAP' | 'UNKNOWN' }> = [];

  for (const entry of discardedCards) {
    if (entry && typeof entry === 'object' && 'card' in entry) {
      const obj = entry as { card?: { rank?: string; suit?: string; value?: number; isHidden?: boolean }; reason?: string };
      if (!obj.card?.rank || !obj.card?.suit) continue;
      const reason = obj.reason === 'BURN' || obj.reason === 'ZAP' ? obj.reason : inferredReason;
      normalized.push({
        card: {
          rank: obj.card.rank,
          suit: obj.card.suit,
          value: typeof obj.card.value === 'number' ? obj.card.value : valueFromRank(obj.card.rank),
          isHidden: obj.card.isHidden,
        },
        reason,
      });
      continue;
    }

    if (entry && typeof entry === 'object' && 'rank' in entry && 'suit' in entry) {
      const obj = entry as { rank?: string; suit?: string; value?: number; isHidden?: boolean };
      if (!obj.rank || !obj.suit) continue;
      normalized.push({
        card: {
          rank: obj.rank,
          suit: obj.suit,
          value: typeof obj.value === 'number' ? obj.value : valueFromRank(obj.rank),
          isHidden: obj.isHidden,
        },
        reason: inferredReason,
      });
    }
  }

  return normalized;
}

export function SimulatorHandHistoryModal({ run, onClose }: { run: MatchRecord; onClose: () => void }) {
  const deleteSimulatorHistoryRun = useGameStore((s) => s.deleteSimulatorHistoryRun);
  const hasCurrentRun = useGameStore((s) => s.simulatorHistory.some((entry) => entry.id === run.id));
  const handHistory = run.simulatorHandHistory ?? EMPTY_HISTORY;
  const hasDeepHistory = handHistory.length > 0;
  const configuredInitialCards = useMemo(
    () => Math.max(1, getRoomConfig(run.roomId).gameRules.playerInitialCards ?? 2),
    [run.roomId],
  );

  const [expandedHand, setExpandedHand] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'hands' | 'detail'>('hands');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const startBankroll = run.simulatorSummary?.bankrollStart ?? run.bankrollBefore;
  const endBankroll = run.simulatorSummary?.bankrollEnd ?? run.bankrollAfter;

  const dataSize = useMemo(() => {
    try {
      const bytes = new Blob([JSON.stringify(run)]).size;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } catch {
      return '--';
    }
  }, [run]);

  const totalProfit = useMemo(() => {
    if (hasDeepHistory) {
      return handHistory.reduce((sum, hand) => sum + hand.profit, 0);
    }
    if (typeof run.simulatorSummary?.pnl === 'number') {
      return run.simulatorSummary.pnl;
    }
    return endBankroll - startBankroll;
  }, [endBankroll, hasDeepHistory, handHistory, run.simulatorSummary?.pnl, startBankroll]);

  const totalHands = run.simulatorSummary?.handCount ?? handHistory.length;
  const roi = run.simulatorSummary?.roi;
  const winRate = run.simulatorSummary?.winRate;
  const maxDrawdown = run.simulatorSummary?.maxDrawdown;
  const seatCount = useMemo(() => {
    if (typeof run.simulatorSummary?.seatCount === 'number' && run.simulatorSummary.seatCount > 0) {
      return run.simulatorSummary.seatCount;
    }

    const uniqueSeats = new Set<number>();
    for (const hand of handHistory) {
      for (const playerHand of hand.playerHands ?? []) {
        uniqueSeats.add(playerHand.seatNumber);
      }
    }

    return uniqueSeats.size > 0 ? uniqueSeats.size : 1;
  }, [handHistory, run.simulatorSummary?.seatCount]);

  const positiveHands = hasDeepHistory ? handHistory.filter((hand) => hand.outcome === 'win').length : undefined;
  const negativeHands = hasDeepHistory ? handHistory.filter((hand) => hand.outcome === 'loss').length : undefined;
  const pushHands = hasDeepHistory ? handHistory.filter((hand) => hand.outcome === 'push').length : undefined;

  const totalPages = Math.max(1, Math.ceil(handHistory.length / PAGE_SIZE));
  const currentHandHistory = handHistory.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const chartValues = useMemo(() => {
    if (run.simulatorChart?.equityCurve && run.simulatorChart.equityCurve.length > 1) {
      return run.simulatorChart.equityCurve;
    }

    if (handHistory.length > 0) {
      return [startBankroll, ...handHistory.map((entry) => entry.bankrollAfter)];
    }

    if (startBankroll !== endBankroll) {
      return [startBankroll, endBankroll];
    }

    return [startBankroll];
  }, [endBankroll, handHistory, run.simulatorChart?.equityCurve, startBankroll]);

  const hasChartData = chartValues.length > 1;

  const handleRequestDeleteRun = () => {
    if (!hasCurrentRun) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteRun = () => {
    if (!hasCurrentRun) return;
    deleteSimulatorHistoryRun(run.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const getCardColor = (suit: string) => (suit === 'HEARTS' || suit === 'DIAMONDS' ? 'text-rose-500' : 'text-slate-800');

  const renderCard = (card: { rank: string; suit: string; isHidden?: boolean }) => {
    if (card.isHidden) {
      return (
        <div className="flex h-10 w-8 items-center justify-center rounded border border-[#d4a843]/35 bg-[#2e1a11] text-[11px] font-bold text-[#e8c860]">
          ?
        </div>
      );
    }

    const suit = SUIT_SYMBOL[card.suit] ?? card.suit.charAt(0);
    return (
      <div className="flex h-10 w-8 flex-col items-center justify-center rounded border border-slate-300 bg-slate-100 leading-none shadow-sm">
        <span className={`text-[10px] font-bold ${getCardColor(card.suit)}`}>{rankLabel(card.rank)}</span>
        <span className={`text-[11px] ${getCardColor(card.suit)}`}>{suit}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative flex h-[92vh] w-full max-w-330 flex-col overflow-hidden rounded-3xl border border-[#d4a843]/20 bg-[linear-gradient(180deg,rgba(28,14,10,0.96)_0%,rgba(16,8,6,0.98)_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.55)] pointer-events-auto"
      >
        <div className="flex items-start justify-between border-b border-[#d4a843]/15 bg-[linear-gradient(90deg,rgba(44,23,16,0.9)_0%,rgba(25,13,10,0.88)_100%)] px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#d4a843]/35 bg-[#d4a843]/12 text-[#e8c860] sm:h-12 sm:w-12">
              <Eye size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold tracking-tight text-[#f0e6d6] sm:text-xl">
                Simulation Log: {run.simulatorSummary?.roomName ?? run.roomId}
              </h2>
              <p className="truncate text-xs font-medium text-[#f0e6d6]/55 sm:text-sm">
                {new Date(run.timestamp).toLocaleString()} · Block Size: {totalHands} Hands · Memory: {dataSize}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRequestDeleteRun}
              disabled={!hasCurrentRun}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/12 px-3 py-1.5 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Delete this simulator run"
              title="Delete this simulator run"
            >
              <Trash2 size={14} />
              Delete Run
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-[#d4a843]/20 bg-black/20 p-2 text-[#f0e6d6]/70 transition-colors hover:bg-[#d4a843]/10 hover:text-[#f0e6d6]"
              aria-label="Close history modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-b border-[#d4a843]/10 bg-black/20 px-4 py-3 sm:grid-cols-3 xl:grid-cols-7 sm:gap-3 sm:px-6">
          <div className="rounded-xl border border-[#d4a843]/20 bg-[#d4a843]/10 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#f0e6d6]/50">Run PnL</p>
            <p className={`text-sm font-bold sm:text-base ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-300'}`}>
              {totalProfit > 0 ? '+' : ''}
              {formatMoney(totalProfit)}
            </p>
          </div>
          <div className="rounded-xl border border-[#d4a843]/20 bg-black/25 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#f0e6d6]/50">ROI</p>
            <p className="text-sm font-bold text-[#f0e6d6] sm:text-base">{summaryValue(roi, percent)}</p>
          </div>
          <div className="rounded-xl border border-[#d4a843]/20 bg-black/25 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#f0e6d6]/50">Win Rate</p>
            <p className="text-sm font-bold text-[#f0e6d6] sm:text-base">{summaryValue(winRate, percent)}</p>
          </div>
          <div className="rounded-xl border border-[#d4a843]/20 bg-black/25 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#f0e6d6]/50">Max Drawdown</p>
            <p className="text-sm font-bold text-[#f0e6d6] sm:text-base">{summaryValue(maxDrawdown, formatMoney)}</p>
          </div>
          <div className="rounded-xl border border-[#d4a843]/20 bg-black/25 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#f0e6d6]/50">Seats</p>
            <p className="text-sm font-bold text-[#f0e6d6] sm:text-base">{seatCount}</p>
          </div>
          <div className="rounded-xl border border-[#d4a843]/20 bg-black/25 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#f0e6d6]/50">Bankroll Start</p>
            <p className="text-sm font-bold text-[#f0e6d6] sm:text-base">{formatMoney(startBankroll)}</p>
          </div>
          <div className="rounded-xl border border-[#d4a843]/20 bg-black/25 px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#f0e6d6]/50">Bankroll End</p>
            <p className="text-sm font-bold text-[#f0e6d6] sm:text-base">{formatMoney(endBankroll)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-b border-[#d4a843]/10 bg-black/25 px-4 py-2.5 text-xs sm:px-6 sm:text-sm">
          <span className="text-[#f0e6d6]/50">System:</span>
          <span className="font-semibold capitalize text-[#f0e6d6]/90">{run.simulatorSummary?.bettingSystem ?? 'flat'}</span>
          <span className="h-4 w-px bg-[#d4a843]/25" />
          <span className="text-[#f0e6d6]/50">Logic:</span>
          <span className="font-semibold capitalize text-[#f0e6d6]/90">{(run.simulatorSummary?.playDecisionSource ?? 'strategy_advice').replace('_', ' ')}</span>
          {hasDeepHistory ? (
            <>
              <span className="h-4 w-px bg-[#d4a843]/25" />
              <span className="flex items-center gap-1.5 text-emerald-300"><CheckCircle2 size={14} /> {positiveHands ?? 0}</span>
              <span className="flex items-center gap-1.5 text-rose-300"><XCircle size={14} /> {negativeHands ?? 0}</span>
              <span className="flex items-center gap-1.5 text-amber-300"><MinusCircle size={14} /> {pushHands ?? 0}</span>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-b border-[#d4a843]/10 bg-black/15 px-4 py-2 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveTab('hands')}
            className={`rounded-md border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest transition-colors ${
              activeTab === 'hands'
                ? 'border-[#d4a843]/45 bg-[#d4a843]/20 text-[#f1d98f]'
                : 'border-[#d4a843]/20 bg-black/25 text-[#f0e6d6]/65 hover:bg-[#d4a843]/10 hover:text-[#f0e6d6]'
            }`}
          >
            Hands
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('detail')}
            className={`rounded-md border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest transition-colors ${
              activeTab === 'detail'
                ? 'border-[#d4a843]/45 bg-[#d4a843]/20 text-[#f1d98f]'
                : 'border-[#d4a843]/20 bg-black/25 text-[#f0e6d6]/65 hover:bg-[#d4a843]/10 hover:text-[#f0e6d6]'
            }`}
          >
            Detail
          </button>
        </div>

        {activeTab === 'detail' ? (
          <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {hasChartData ? (
              <div className="rounded-2xl border border-[#d4a843]/20 bg-black/25 p-3">
                <EquityAreaChart values={chartValues} title="Run Equity Curve" />
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
                <p className="flex items-center gap-2 font-semibold text-amber-200">
                  <TriangleAlert size={16} />
                  No chart data stored for this run.
                </p>
                <p className="mt-1.5 text-amber-100/90">
                  Run this simulator again to capture and persist the full equity chart in history.
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#d4a843]/15 bg-[#25130d]/60 px-3 py-2.5 shadow-sm">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#d4a843]/70">Win Rate</span>
                <span className="mt-1 block text-lg font-extrabold tracking-tight text-[#f0e6d6]">
                  {summaryValue(run.simulatorSummary?.winRate, percent)}
                </span>
              </div>
              <div className="rounded-xl border border-[#d4a843]/15 bg-[#25130d]/60 px-3 py-2.5 shadow-sm">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#d4a843]/70">EV Per Hand</span>
                <span className="mt-1 block text-lg font-extrabold tracking-tight text-[#f0e6d6]">
                  {summaryValue(run.simulatorSummary?.evPerHand, formatMoney)}
                </span>
              </div>
              <div className="rounded-xl border border-[#d4a843]/15 bg-[#25130d]/60 px-3 py-2.5 shadow-sm">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#d4a843]/70">Max Drawdown</span>
                <span className="mt-1 block text-lg font-extrabold tracking-tight text-rose-300">
                  {summaryValue(run.simulatorSummary?.maxDrawdown, formatMoney)}
                </span>
              </div>
              <div className="rounded-xl border border-[#d4a843]/15 bg-[#25130d]/60 px-3 py-2.5 shadow-sm">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#d4a843]/70">Max Losing Streak</span>
                <span className="mt-1 block text-lg font-extrabold tracking-tight text-[#f0e6d6]">
                  {run.simulatorSummary?.longestLosingStreak ?? '--'}
                  {run.simulatorSummary?.longestLosingStreakStart && run.simulatorSummary.longestLosingStreakStart >= 0 ? (
                    <span className="ml-1.5 text-[11px] font-semibold tracking-normal text-rose-400">
                      (H{run.simulatorSummary.longestLosingStreakStart} - H{run.simulatorSummary.longestLosingStreakEnd})
                    </span>
                  ) : null}
                </span>
              </div>
            </div>

            {run.simulatorSummary?.systemVerdict ? (
              <div className="rounded-2xl border border-[#d4a843]/20 bg-[linear-gradient(180deg,rgba(36,20,14,0.85)_0%,rgba(24,12,9,0.85)_100%)] p-4 shadow-[inset_0_1px_0_rgba(212,168,67,0.1)]">
                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#d4a843]/90">
                  Performance Review & Risk Analysis
                </h4>
                <div className="space-y-2">
                  {run.simulatorSummary.systemVerdict.map((line, i) => {
                    let colorClass = 'text-[#f1d98f]/90';
                    if (line.type === 'success') colorClass = 'text-emerald-400';
                    else if (line.type === 'danger') colorClass = 'text-rose-400';
                    else if (line.type === 'warning') colorClass = 'text-orange-300';
                    return (
                      <p key={i} className={`text-sm font-medium leading-relaxed ${colorClass}`}>
                        {line.text}
                      </p>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : !hasDeepHistory ? (
          <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-[#d4a843]/20 bg-black/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#f0e6d6]/45">Hands Simulated</p>
                <p className="mt-1 text-2xl font-black text-[#f0e6d6]">{totalHands.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-[#d4a843]/20 bg-black/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#f0e6d6]/45">Bankroll Delta</p>
                <p className={`mt-1 text-2xl font-black ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-300'}`}>
                  {totalProfit > 0 ? '+' : ''}
                  {formatMoney(totalProfit)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#d4a843]/20 bg-black/25 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#f0e6d6]/45">Stored Detail Level</p>
                <p className="mt-1 text-xl font-black text-[#e8c860]">Summary Only</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
              <p className="flex items-center gap-2 font-semibold text-amber-200">
                <TriangleAlert size={16} />
                This run does not include hand-by-hand detail.
              </p>
              <p className="mt-1.5 text-amber-100/90">
                Older simulator records were saved in summary-only mode, so the detailed timeline cannot be reconstructed from this entry.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-[#d4a843]/20 bg-black/25 p-4 text-sm text-[#f0e6d6]/80">
              <p className="flex items-center gap-2 font-semibold text-[#f0e6d6]">
                <Database size={16} className="text-[#e8c860]" />
                Local Storage Snapshot
              </p>
              <p className="mt-1">File: simulator_history.json (Tauri local AppConfig)</p>
              <p className="mt-1">Room: {run.simulatorSummary?.roomName ?? run.roomId}</p>
              <p className="mt-1">Timestamp: {new Date(run.timestamp).toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="custom-scrollbar flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
              <table className="w-full border-separate border-spacing-y-1.5 text-xs text-[#f0e6d6]/90">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-[#f0e6d6]/45">
                    <th className="px-3 pb-2">Hand</th>
                    <th className="px-3 pb-2">Outcome</th>
                    <th className="px-3 pb-2">Bet</th>
                    <th className="px-3 pb-2">P/L</th>
                    <th className="px-3 pb-2">Equity</th>
                    <th className="px-3 pb-2">Trail</th>
                    <th className="px-3 pb-2 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {currentHandHistory.map((hand) => {
                    const isExpanded = expandedHand === hand.handNumber;
                    const isWin = hand.outcome === 'win';
                    const isLoss = hand.outcome === 'loss';
                    const actionTrail = normalizeActionList(hand.actions ?? [], hand.blackjacks ?? 0);
                    const groupedTimeline = buildGroupedTimeline(hand.actions ?? [], hand.blackjacks ?? 0);
                    const seatGroups = groupPlayerHandsBySeat(hand.playerHands ?? []);
                    const dealerFlow = buildDealerFlow(hand.dealerCards ?? []);
                    const dealerTags = buildDealerTags(hand.dealerCards ?? [], hand.dealerTotal ?? 0);

                    return (
                      <Fragment key={`hist-${hand.handNumber}`}>
                        <tr className={`transition-colors ${isExpanded ? 'bg-[#3a1f17]/75' : 'bg-black/25 hover:bg-[#2a1711]/75'} outline-1 outline-[#d4a843]/12`}>
                          <td className={`rounded-l-xl border-l-[3px] px-3 py-2.5 font-semibold ${isWin ? 'border-emerald-500' : isLoss ? 'border-rose-500' : 'border-amber-500'}`}>
                            #{hand.handNumber}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              isWin
                                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                                : isLoss
                                  ? 'border-rose-400/30 bg-rose-500/10 text-rose-300'
                                  : 'border-amber-400/30 bg-amber-500/10 text-amber-200'
                            }`}>
                              {hand.outcome}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-medium">{formatMoney(hand.bet)}</td>
                          <td className={`px-3 py-2.5 font-bold ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-300' : 'text-amber-200'}`}>
                            {hand.profit > 0 ? '+' : ''}
                            {formatMoney(hand.profit)}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[#f0e6d6]/85">{formatMoney(hand.bankrollAfter)}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap items-center gap-1">
                              {actionTrail.slice(0, 4).map((action, idx) => (
                                <span key={`${hand.handNumber}-action-${idx}`} className="rounded border border-[#d4a843]/20 bg-[#d4a843]/10 px-1.5 py-0.5 text-[10px] text-[#f1d98f]">
                                  {action}
                                </span>
                              ))}
                              {actionTrail.length > 4 ? (
                                <span className="text-[10px] text-[#f0e6d6]/45">+{actionTrail.length - 4}</span>
                              ) : null}
                            </div>
                          </td>
                          <td className="rounded-r-xl px-3 py-2.5 text-right">
                            <button
                              onClick={() => setExpandedHand(isExpanded ? null : hand.handNumber)}
                              className={`inline-flex items-center justify-center rounded-md border p-1.5 transition-colors ${
                                isExpanded
                                  ? 'border-[#d4a843]/40 bg-[#d4a843]/20 text-[#f1d98f]'
                                  : 'border-[#d4a843]/20 bg-black/20 text-[#f0e6d6]/65 hover:bg-[#d4a843]/10 hover:text-[#f0e6d6]'
                              }`}
                              aria-label={isExpanded ? 'Collapse hand details' : 'Expand hand details'}
                            >
                              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded ? (
                          <tr>
                            <td colSpan={7} className="p-0">
                              <div className="mx-3 mb-2 rounded-b-xl border border-t-0 border-[#d4a843]/20 bg-[linear-gradient(180deg,#24130d_0%,#1a0d0a_100%)] px-4 py-3">
                                <div className="mb-3 border-b border-[#d4a843]/15 pb-2.5">
                                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#e8c860]">Hand #{hand.handNumber} Detail</h3>
                                </div>
                                <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
                                  <div className="rounded-lg border border-[#d4a843]/15 bg-black/25 px-2.5 py-2">
                                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#f0e6d6]/45">Bet</p>
                                    <p className="mt-0.5 text-sm font-bold text-[#f0e6d6]">{formatMoney(hand.bet)}</p>
                                  </div>
                                  <div className="rounded-lg border border-[#d4a843]/15 bg-black/25 px-2.5 py-2">
                                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#f0e6d6]/45">Hand P/L</p>
                                    <p className={`mt-0.5 text-sm font-bold ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-300' : 'text-amber-200'}`}>
                                      {hand.profit > 0 ? '+' : ''}
                                      {formatMoney(hand.profit)}
                                    </p>
                                  </div>
                                  <div className="rounded-lg border border-[#d4a843]/15 bg-black/25 px-2.5 py-2">
                                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#f0e6d6]/45">Dealer Total</p>
                                    <p className="mt-0.5 text-sm font-bold text-[#f0e6d6]">{hand.dealerTotal > 0 ? hand.dealerTotal : '--'}</p>
                                  </div>
                                  <div className={`rounded-lg border px-2.5 py-2 ${
                                    isWin
                                      ? 'border-emerald-400/30 bg-emerald-500/12 text-emerald-200'
                                      : isLoss
                                        ? 'border-rose-400/30 bg-rose-500/12 text-rose-200'
                                        : 'border-amber-400/30 bg-amber-500/12 text-amber-100'
                                  }`}>
                                    <p className="text-[10px] uppercase tracking-[0.14em] opacity-75">Outcome</p>
                                    <p className="mt-0.5 text-sm font-bold uppercase">{hand.outcome}</p>
                                  </div>
                                </div>

                                <div className="mb-3 rounded-xl border border-[#d4a843]/15 bg-black/25 p-3">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f0e6d6]/50">Action Timeline</p>
                                  <div className="mt-2 space-y-2">
                                    {groupedTimeline.length > 0 ? groupedTimeline.map((group, groupIndex) => (
                                      <div key={`${hand.handNumber}-timeline-group-${groupIndex}`} className="flex flex-col gap-1">
                                        {group.title !== 'General' && (
                                          <span className="text-[9px] uppercase tracking-widest text-[#f0e6d6]/60">[{group.title}]</span>
                                        )}
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          {group.items.map((action, actionIndex) => (
                                            <Fragment key={`${hand.handNumber}-timeline-${groupIndex}-${actionIndex}`}>
                                              <span className="rounded-md border border-[#d4a843]/22 bg-[#d4a843]/10 px-2 py-0.5 text-[10px] text-[#f1d98f]">
                                                {action}
                                              </span>
                                              {actionIndex < group.items.length - 1 ? (
                                                <span className="text-[10px] text-[#f0e6d6]/30">&gt;</span>
                                              ) : null}
                                            </Fragment>
                                          ))}
                                        </div>
                                      </div>
                                    )) : <span className="text-xs italic text-[#f0e6d6]/45">No action detail</span>}
                                  </div>
                                </div>

                                <div className="grid gap-3 lg:grid-cols-12">
                                  <div className="rounded-xl border border-[#d4a843]/15 bg-black/22 p-3 lg:col-span-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f0e6d6]/50">Dealer Hand Flow</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                      {hand.dealerCards && hand.dealerCards.length > 0
                                        ? hand.dealerCards.map((card, cardIndex) => (
                                            <Fragment key={`${hand.handNumber}-dealer-${cardIndex}`}>{renderCard(card)}</Fragment>
                                          ))
                                        : <span className="text-xs italic text-[#f0e6d6]/45">No cards recorded</span>}
                                    </div>
                                    <div className="mt-2 space-y-1 rounded-lg border border-[#d4a843]/12 bg-black/25 p-2.5 text-[10px] text-[#f0e6d6]/75">
                                      {dealerFlow.map((line, idx) => (
                                        <p key={`${hand.handNumber}-dealer-flow-${idx}`}>{line}</p>
                                      ))}
                                    </div>
                                    {dealerTags.length > 0 ? (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {dealerTags.map((tag, tagIdx) => (
                                          <span key={`${hand.handNumber}-dealer-tag-${tagIdx}`} className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] ${TAG_STYLE[tag.tone]}`}>
                                            {tag.label}
                                          </span>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="rounded-xl border border-[#d4a843]/15 bg-black/22 p-3 lg:col-span-8">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f0e6d6]/50">Player Hands by Seat</p>
                                    <div className="mt-2 grid gap-2 lg:grid-cols-2">
                                      {seatGroups.length > 0 ? seatGroups.map((seat) => (
                                        <div key={`${hand.handNumber}-seat-${seat.seatNumber}`} className="rounded-lg border border-[#d4a843]/14 bg-black/30 p-2.5">
                                          <div className="mb-2 flex items-center justify-between text-[10px]">
                                            <span className="font-semibold uppercase tracking-[0.12em] text-[#f0e6d6]/75">Seat {seat.seatNumber}</span>
                                            <span className={`font-bold ${seat.seatProfit > 0 ? 'text-emerald-300' : seat.seatProfit < 0 ? 'text-rose-300' : 'text-amber-200/80'}`}>
                                              Net PNL: {seat.seatProfit > 0 ? '+' : ''}{formatMoney(seat.seatProfit)}
                                              {seat.seatProfit === 0 && seat.hands.length > 0 ? ' (Break Even)' : ''}
                                            </span>
                                          </div>

                                          <div className="space-y-2">
                                            {seat.hands.map((playerHand, handIndex) => {
                                              const seatActions = (hand.actions ?? [])
                                                .map(parseHandActionToken)
                                                .filter((entry): entry is { seatNumber: number; handNumber: number; code: string } => Boolean(entry))
                                                .filter((entry) => entry.seatNumber === playerHand.seatNumber && entry.handNumber === playerHand.handNumber)
                                                .map((entry) => entry.code);

                                              const seatSwitched = (hand.actions ?? []).some((token) => token === `S${playerHand.seatNumber}:SWITCH`);

                                              const discardedEntries = normalizeDiscardedCards(playerHand.discardedCards, seatActions);

                                              const flowLines = buildHandFlow(
                                                playerHand as any,
                                                seat.hands as any,
                                                seatActions,
                                                discardedEntries,
                                                configuredInitialCards,
                                              );

                                              const playerTags = buildPlayerHandTags({
                                                playerTotal: playerHand.total,
                                                cardsLength: playerHand.cards.length,
                                                surrendered: playerHand.surrendered,
                                                actionCodes: seatActions,
                                                seatSwitched,
                                              });

                                              return (
                                                <div key={`${hand.handNumber}-seat-${seat.seatNumber}-hand-${handIndex}`} className="rounded-md border border-[#d4a843]/12 bg-black/35 p-2">
                                                  <div className="mb-1.5 flex items-center justify-between text-[10px] text-[#f0e6d6]/70">
                                                    <span>Hand {playerHand.handNumber}</span>
                                                    <span className="font-semibold text-[#f0e6d6]/90">{playerHand.total === -1 ? 'Surrender' : `Total ${playerHand.total}`}</span>
                                                  </div>
                                                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                                                    {playerHand.cards.map((card, cardIndex) => (
                                                      <Fragment key={`${hand.handNumber}-seat-${seat.seatNumber}-hand-${handIndex}-card-${cardIndex}`}>{renderCard(card)}</Fragment>
                                                    ))}
                                                  </div>

                                                  {discardedEntries.length > 0 ? (
                                                    <div className="mb-1.5 rounded-md border border-rose-400/18 bg-rose-500/10 px-2 py-1">
                                                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-rose-200/85">Discarded Cards</p>
                                                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                        {discardedEntries.map((entry, cardIndex) => {
                                                          const style = DISCARD_STYLE[entry.reason];
                                                          if (entry.card.isHidden) {
                                                            return (
                                                              <div
                                                                key={`${hand.handNumber}-seat-${seat.seatNumber}-hand-${handIndex}-discard-${cardIndex}`}
                                                                className={`relative flex h-10 w-8 items-center justify-center rounded border ${style.border} text-[11px] font-bold text-[#e8c860]`}
                                                              >
                                                                ?
                                                              </div>
                                                            );
                                                          }

                                                          const suit = SUIT_SYMBOL[entry.card.suit] ?? entry.card.suit.charAt(0);
                                                          return (
                                                            <div
                                                              key={`${hand.handNumber}-seat-${seat.seatNumber}-hand-${handIndex}-discard-${cardIndex}`}
                                                              className={`relative flex h-10 w-8 flex-col items-center justify-center rounded border ${style.border} leading-none shadow-sm`}
                                                              title={`${style.label} discard`}
                                                            >
                                                              <span className={`text-[10px] font-bold ${getCardColor(entry.card.suit)}`}>{rankLabel(entry.card.rank)}</span>
                                                              <span className={`text-[11px] ${getCardColor(entry.card.suit)}`}>{suit}</span>
                                                              <span className={`absolute -right-1 -top-1 rounded border px-1 text-[8px] font-bold uppercase ${style.badge}`}>
                                                                {style.label.charAt(0)}
                                                              </span>
                                                            </div>
                                                          );
                                                        })}
                                                      </div>
                                                    </div>
                                                  ) : null}

                                                  <div className="space-y-0.5 text-[10px] text-[#f0e6d6]/75">
                                                    {flowLines.map((line, lineIndex) => (
                                                      <p key={`${hand.handNumber}-seat-${seat.seatNumber}-hand-${handIndex}-flow-${lineIndex}`}>{line}</p>
                                                    ))}
                                                  </div>

                                                  <div className="mt-1 text-[10px] text-[#f0e6d6]/70">
                                                    Bet: {formatMoney(playerHand.bet ?? 0)}
                                                    {typeof playerHand.paidBet === 'number' || typeof playerHand.freeBet === 'number' ? (
                                                      <span>
                                                        {' '}
                                                        (Paid: {formatMoney(playerHand.paidBet ?? (playerHand.bet ?? 0))}
                                                        {playerHand.freeBet ? `, Free: ${formatMoney(playerHand.freeBet)}` : ''})
                                                      </span>
                                                    ) : null}
                                                  </div>

                                                  {playerHand.specialEvents && playerHand.specialEvents.length > 0 ? (
                                                    <div className="mt-1.5 rounded-md border border-[#d4a843]/16 bg-black/25 px-2 py-1.5">
                                                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#f0e6d6]/65">
                                                        Special Action Settlement
                                                      </p>
                                                      <div className="mt-1 space-y-0.5 text-[10px]">
                                                        {playerHand.specialEvents.map((event, eventIndex) => {
                                                          const isFreeEvent =
                                                            event.code === 'FREE_DOUBLE_GRANT' ||
                                                            event.code === 'FREE_SPLIT_GRANT' ||
                                                            event.code === 'FREE_ZAP_GRANT';
                                                          const eventDescription = describeSpecialSettlement(event.code, event.amount);
                                                          return (
                                                            <p key={`${hand.handNumber}-seat-${seat.seatNumber}-hand-${handIndex}-event-${eventIndex}`} className={isFreeEvent ? 'text-emerald-300' : 'text-rose-300'}>
                                                              {eventDescription}
                                                            </p>
                                                          );
                                                        })}
                                                      </div>
                                                    </div>
                                                  ) : null}

                                                  {playerHand.advisorNotes && playerHand.advisorNotes.length > 0 ? (
                                                    <div className="mt-1.5 rounded-md border border-indigo-400/22 bg-indigo-500/10 px-2 py-1.5">
                                                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-indigo-200/85">
                                                        Counting Advisor Notes
                                                      </p>
                                                      <div className="mt-1 space-y-0.5 text-[10px] text-indigo-100/90">
                                                        {playerHand.advisorNotes.map((note, noteIndex) => (
                                                          <p key={`${hand.handNumber}-seat-${seat.seatNumber}-hand-${handIndex}-advisor-${noteIndex}`}>
                                                            {note}
                                                          </p>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  ) : null}

                                                  {playerTags.length > 0 ? (
                                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                                      {playerTags.map((tag, tagIdx) => (
                                                        <span key={`${hand.handNumber}-seat-${seat.seatNumber}-hand-${handIndex}-tag-${tagIdx}`} className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] ${TAG_STYLE[tag.tone]}`}>
                                                          {tag.label}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  ) : null}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )) : <span className="text-xs italic text-[#f0e6d6]/45">No hand detail recorded</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-[#d4a843]/12 bg-black/20 px-4 py-3 text-xs sm:px-6">
                <p className="text-[#f0e6d6]/50">
                  Showing <strong className="text-[#f0e6d6]/85">{(currentPage - 1) * PAGE_SIZE + 1}</strong> - <strong className="text-[#f0e6d6]/85">{Math.min(currentPage * PAGE_SIZE, handHistory.length)}</strong> / <strong className="text-[#e8c860]">{handHistory.length}</strong>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((value) => value - 1);
                      setExpandedHand(null);
                    }}
                    className="rounded-md border border-[#d4a843]/20 bg-black/20 px-3 py-1.5 font-semibold text-[#f0e6d6]/75 transition-colors hover:bg-[#d4a843]/10 disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {getWindowPages(totalPages, currentPage).map((page) => (
                      <button
                        key={`page-${page}`}
                        onClick={() => {
                          setCurrentPage(page);
                          setExpandedHand(null);
                        }}
                        className={`h-7 w-7 rounded-md border text-[11px] font-bold transition-colors ${
                          currentPage === page
                            ? 'border-[#d4a843]/45 bg-[#d4a843]/22 text-[#f1d98f]'
                            : 'border-[#d4a843]/18 bg-black/20 text-[#f0e6d6]/65 hover:bg-[#d4a843]/10'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage((value) => value + 1);
                      setExpandedHand(null);
                    }}
                    className="rounded-md border border-[#d4a843]/20 bg-black/20 px-3 py-1.5 font-semibold text-[#f0e6d6]/75 transition-colors hover:bg-[#d4a843]/10 disabled:opacity-30"
                  >
                    Next
                  </button>
                  <div className="ml-1 flex items-center gap-1.5 pl-3 border-l border-[#d4a843]/20">
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      placeholder="..."
                      title={`Jump to a page (1-${totalPages})`}
                      className="h-7 w-12 rounded border border-[#d4a843]/20 bg-black/30 text-center text-[11px] font-bold text-[#f0e6d6] placeholder-[#f0e6d6]/30 outline-none transition-colors focus:border-[#d4a843]/60 focus:bg-black/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = parseInt(e.currentTarget.value, 10);
                          if (!isNaN(val) && val >= 1 && val <= totalPages) {
                            setCurrentPage(val);
                            setExpandedHand(null);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}

        {showDeleteConfirm ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-2xl border border-rose-400/30 bg-[linear-gradient(180deg,rgba(42,17,17,0.96)_0%,rgba(25,10,10,0.98)_100%)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-rose-200">Delete This Run?</p>
              <p className="mt-2 text-sm text-[#f0e6d6]/85">
                This will remove the current simulator run from in-game history. This action cannot be undone.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-md border border-[#d4a843]/25 bg-black/25 px-3 py-1.5 text-xs font-semibold text-[#f0e6d6]/80 transition-colors hover:bg-[#d4a843]/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteRun}
                  className="rounded-md border border-rose-400/35 bg-rose-500/18 px-3 py-1.5 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/25"
                >
                  Delete Run
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
