import Link from 'next/link';
import { BookOpen, BrainCircuit } from 'lucide-react';
import { toAppHref } from '@/utils/platform';

interface Props {
  onOpenStrategy: () => void;
}

export function SimulatorHeader({ onOpenStrategy }: Props) {
  return (
    <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-[#d4a843]/15 bg-[linear-gradient(180deg,rgba(35,19,13,0.9)_0%,rgba(20,10,7,0.75)_100%)] px-4 py-3 backdrop-blur-xl sm:px-5 xl:px-6">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-[#d4a843]/45 to-transparent" />
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d4a843]/40 bg-linear-to-br from-[#d4a843]/35 to-[#8b1a1a]/40 text-[#f0e6d6] shadow-[0_0_20px_rgba(212,168,67,0.2)]">
          <BrainCircuit size={20} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black tracking-tight text-[#f0e6d6] sm:text-xl">Blackjack Simulator</h1>
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d4a843]/80">Casino Analytics Desk</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link 
          href={toAppHref('/')} 
          className="inline-flex h-8 items-center rounded-lg border border-[#d4a843]/20 bg-black/20 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#f0e6d6]/85 transition-all hover:border-[#d4a843]/50 hover:bg-[#d4a843]/10 hover:text-[#f7edd9] sm:h-9 sm:px-4 sm:text-sm sm:tracking-[0.08em]"
        >
          Home
        </Link>
        <button 
          onClick={onOpenStrategy} 
          className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#d4a843]/35 bg-[#d4a843]/12 px-3 text-xs font-semibold text-[#e8c860] transition-all hover:bg-[#d4a843]/20 hover:text-[#f1d98f] sm:h-9 sm:px-4 sm:text-sm"
        >
          <BookOpen size={16} /> Open Strategy
        </button>
      </div>
    </header>
  );
}
