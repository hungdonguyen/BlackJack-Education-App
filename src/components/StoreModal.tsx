'use client';
import { ShinyText, CountUp } from '@/components/reactbits';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Check, Crown, Lock, Sparkles, CreditCard, Zap, Gem, Flame, Bot, Waves, Sun, Ghost, Loader2 } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { useAudio } from '@/utils/audio';
import Image from 'next/image';
import { getCardImage, getCardBackImage } from '@/utils/cardImages';
import { Suit, Rank } from '@/types/enums';

interface StoreModalProps {
    onClose: () => void;
}

const ALL_RANKS = [
    Rank.ACE, Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE,
    Rank.SIX, Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN,
    Rank.JACK, Rank.QUEEN, Rank.KING
];
const SUITS = [Suit.SPADES, Suit.HEARTS, Suit.CLUBS, Suit.DIAMONDS];

export default function StoreModal({ onClose }: StoreModalProps) {
    const { playSound } = useAudio();
    const purchasedDecks = useGameStore((s) => s.purchasedDecks) || ['default'];
    const activeDeck = useGameStore((s) => s.activeDeck) || 'default';
    const purchaseDeck = useGameStore((s) => s.purchaseDeck);
    const setActiveDeck = useGameStore((s) => s.setActiveDeck);
    const bankroll = useGameStore((s) => s.bankroll);
    const triggerInsufficientFunds = useGameStore((s) => s.triggerInsufficientFunds);
    const checkDeckPurchaseAchievement = useGameStore((s) => s.checkDeckPurchaseAchievement);

    const decks = [
        {
            id: 'default',
            name: 'Classic Deck',
            description: 'Standard casino-grade cards. Clean, readable, and elegant.',
            price: 0,
            accent: '#94a3b8',
            icon: null
        },
        {
            id: 'silver',
            name: 'Sterling Silver',
            description: 'Polished sterling silver cards with a cool metallic sheen.',
            price: 100_000,
            accent: '#94a3b8',
            icon: <Sparkles size={14} className="text-slate-300" />
        },
        {
            id: 'plasma',
            name: 'Plasma Flow',
            description: 'Futuristic cards featuring animated glowing cyan plasma currents.',
            price: 777_777,
            accent: '#06b6d4',
            icon: <Sparkles size={14} className="text-cyan-400" />
        },
        {
            id: 'gold',
            name: 'Premium Gold',
            description: 'Solid 24k gold textured cards designed for high rollers.',
            price: 500_000,
            accent: '#d4a843',
            icon: <Crown size={14} className="text-amber-500" />
        },
        {
            id: 'rainbow',
            name: 'Iridescent Rainbow',
            description: 'Holographic foil finish with an animated shifting pastel spectrum.',
            price: 666_666,
            accent: '#ec4899',
            icon: <Sparkles size={14} className="text-pink-400" />
        },
        {
            id: 'hacker',
            name: 'Cyber Hacker',
            description: 'Matrix terminal theme with phosphor-green scanlines and data glitches.',
            price: 404_040,
            accent: '#22c55e',
            icon: <Zap size={14} className="text-green-500" />
        },
        {
            id: 'glass',
            name: 'Frosted Glass',
            description: 'Frosted translucent glass with animated prismatic refractions and snowflake motifs.',
            price: 888_888,
            accent: '#e0f2fe',
            icon: <Gem size={14} className="text-sky-200" />
        },
        {
            id: 'cosmic',
            name: 'Cosmic Swirl',
            description: 'Deep space aesthetic featuring animated swirling nebula dust.',
            price: 1_234_567,
            accent: '#7c3aed',
            icon: <Sparkles size={14} className="text-purple-400" />
        },
        {
            id: 'dragon',
            name: 'Imperial Dragon',
            description: 'Traditional dragon motifs styled in gold leaf and imperial crimson.',
            price: 1_888_888,
            accent: '#f59e0b',
            icon: <Flame size={14} className="text-amber-400" />
        },
        {
            id: 'mecha',
            name: 'Cyber Mecha',
            description: 'Armored titanium plating with cyan energy conduits.',
            price: 2_099_000,
            accent: '#06b6d4',
            icon: <Bot size={14} className="text-cyan-400" />
        },
        {
            id: 'abyss',
            name: 'Eldritch Abyss',
            description: 'Deep-sea theme with bioluminescent aquatic accents.',
            price: 2_500_000,
            accent: '#2dd4bf',
            icon: <Waves size={14} className="text-teal-400" />
        },
        {
            id: 'solar',
            name: 'Celestial Solar',
            description: 'Dual Sun & Eclipse theme featuring the Celestial Goddess, custom solar pips, and corona flash effects.',
            price: 3_333_333,
            accent: '#fbbf24',
            icon: <Sun size={14} className="text-yellow-400" />
        },
        {
            id: 'phantom',
            name: 'Ghostly Wraith',
            description: 'Spectral gothic theme with ethereal violet flames and mist.',
            price: 5_000_000,
            accent: '#c084fc',
            icon: <Ghost size={14} className="text-purple-400" />
        }
    ].sort((a, b) => a.price - b.price);

    const [selectedIndex, setSelectedIndex] = useState(decks.findIndex(d => d.id === activeDeck));

    const formatMoney = (v: number) => {
        if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
        if (v === 0) return 'Free';
        return `$${v.toLocaleString()}`;
    };

    const handleAction = useCallback((deckId: string, price: number) => {
        if (purchasedDecks.includes(deckId)) {
            if (activeDeck !== deckId) {
                playSound('click');
                setActiveDeck(deckId);
            }
            return;
        }

        if (bankroll >= price) {
            playSound('chip-lay');
            purchaseDeck(deckId, price);
            setActiveDeck(deckId);
            checkDeckPurchaseAchievement(deckId);
        } else {
            triggerInsufficientFunds();
        }
    }, [purchasedDecks, activeDeck, bankroll, playSound, purchaseDeck, setActiveDeck, checkDeckPurchaseAchievement, triggerInsufficientFunds]);

    // Selection helper
    const selectDeck = useCallback((idx: number) => {
        if (idx !== selectedIndex) {
            playSound('click');
            setSelectedIndex(idx);
        }
    }, [selectedIndex, playSound]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectDeck(selectedIndex > 0 ? selectedIndex - 1 : decks.length - 1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectDeck(selectedIndex < decks.length - 1 ? selectedIndex + 1 : 0);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const deck = decks[selectedIndex];
                handleAction(deck.id, deck.price);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, decks, handleAction, onClose, selectDeck]);

    const currentDeck = decks[selectedIndex];

    // Ensure 100% of the 52 cards are fully cached and loaded before showing to user
    const [loadedDecks, setLoadedDecks] = useState<Set<string>>(() => new Set(['default']));
    const [isDeckLoading, setIsDeckLoading] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);

    useEffect(() => {
        const deckId = currentDeck.id;
        if (loadedDecks.has(deckId)) {
            setIsDeckLoading(false);
            return;
        }

        let isCancelled = false;
        setIsDeckLoading(true);
        setLoadProgress(0);

        const cardUrls: string[] = [];
        for (const suit of SUITS) {
            for (const rank of ALL_RANKS) {
                cardUrls.push(getCardImage(suit, rank, deckId));
            }
        }
        cardUrls.push(getCardBackImage(deckId));

        let loadedCount = 0;
        const total = cardUrls.length;

        const promises = cardUrls.map(url => {
            return new Promise<void>((resolve) => {
                const img = new window.Image();
                img.src = url;
                const done = () => {
                    loadedCount++;
                    if (!isCancelled) {
                        setLoadProgress(Math.round((loadedCount / total) * 100));
                    }
                    resolve();
                };
                img.onload = done;
                img.onerror = done;
            });
        });

        Promise.all(promises).then(() => {
            if (!isCancelled) {
                setLoadedDecks(prev => new Set(prev).add(deckId));
                setIsDeckLoading(false);
            }
        });

        return () => {
            isCancelled = true;
        };
    }, [currentDeck.id, loadedDecks]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-2xl">
            <motion.div
                className="relative w-full max-w-6xl h-full max-h-[calc(100%-2rem)] md:max-h-[calc(100%-4rem)] rounded-[32px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,1)] flex flex-col border border-white/10"
                style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #000 100%)' }}
                initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotateX: 10 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-black/40">
                    <div className="flex items-center gap-5">
                        <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                            <ShoppingCart size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-white">Card Decks</h2>
                            <p className="text-[8px] text-amber-500/50 uppercase tracking-[0.3em] font-black italic">Custom Visual Themes</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] text-white/20 uppercase tracking-[0.2em] font-black">Bankroll</span>
                            <CountUp to={bankroll} from={bankroll} prefix="$" duration={0.8} className="text-xl font-black text-white tabular-nums" />
                        </div>

                        <button
                            onClick={() => { playSound('click'); onClose(); }}
                            className="group relative w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 hover:bg-red-500/10 transition-all duration-500"
                        >
                            <X size={20} className="text-white/20 group-hover:text-red-400 transition-colors" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area: 3:7 Split */}
                <div className="flex-1 flex overflow-hidden">

                    {/* LEFT: Selection List (28%) */}
                    <div className="w-[28%] border-r border-white/5 p-4 space-y-2.5 overflow-y-auto custom-scrollbar bg-black/20">
                        {decks.map((deck, idx) => {
                            const isSelected = selectedIndex === idx;
                            const isOwned = purchasedDecks.includes(deck.id);
                            const isActive = activeDeck === deck.id;

                            return (
                                <button
                                    key={deck.id}
                                    onClick={() => selectDeck(idx)}
                                    className={`w-full relative flex flex-col p-4 rounded-2xl transition-all duration-500 text-left border
                                        ${isSelected
                                            ? 'bg-white/10 border-white/10 shadow-lg scale-[1.02]'
                                            : 'bg-transparent border-transparent hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-base font-black uppercase tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>
                                                {deck.name}
                                            </span>
                                            {deck.icon}
                                        </div>
                                        {isActive && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-2.5">
                                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all
                                            ${isOwned
                                                ? 'bg-white/5 text-white/30'
                                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/10'}`}>
                                            {isOwned ? (isActive ? 'Equipped' : 'Owned') : formatMoney(deck.price)}
                                        </div>

                                        {!isOwned && bankroll < deck.price && (
                                            <Lock size={10} className="text-red-500/30" />
                                        )}
                                    </div>

                                    {isSelected && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-amber-500 rounded-full"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* RIGHT: Display Showcase (72%) */}
                    <div className="w-[72%] relative flex flex-col bg-zinc-950/40 p-10 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentDeck.id}
                                initial={{ opacity: 0, filter: 'blur(8px)' }}
                                animate={{ opacity: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, filter: 'blur(8px)' }}
                                transition={{ duration: 0.4 }}
                                className="flex flex-col h-full"
                            >
                                {/* Compact Info Area */}
                                <div className="mb-8 flex items-start justify-between">
                                    <div className="flex gap-6 items-center">
                                        <motion.div
                                            className="relative w-[3.5rem] aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] ring-1 ring-white/20 shrink-0"
                                            whileHover={{ scale: 1.15, rotateY: 15 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                            <Image src={getCardBackImage(currentDeck.id)} alt="Card Back" fill className="object-cover" sizes="80px" />
                                        </motion.div>
                                        <div className="space-y-2">
                                            <ShinyText
                                                text={currentDeck.name}
                                                shineColor={currentDeck.accent || '#ffffff'}
                                                color="#ffffff"
                                                speed={2.5}
                                                glow={0.4}
                                                className="text-4xl font-black uppercase tracking-tighter leading-none drop-shadow-md"
                                            />
                                            <p className="text-white/40 text-[13px] max-w-lg font-medium leading-normal">
                                                {currentDeck.description}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                            onClick={() => handleAction(currentDeck.id, currentDeck.price)}
                                            className={`px-8 py-3.5 rounded-2xl font-black uppercase tracking-tighter text-sm transition-all duration-300
                                                ${purchasedDecks.includes(currentDeck.id)
                                                    ? (activeDeck === currentDeck.id 
                                                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] cursor-default' 
                                                        : 'bg-white text-black hover:scale-105 shadow-lg cursor-pointer')
                                                    : (bankroll >= currentDeck.price 
                                                        ? 'bg-amber-500 hover:bg-amber-400 text-black hover:scale-105 shadow-lg cursor-pointer' 
                                                        : 'bg-red-500/10 text-red-400/60 border border-red-500/20 cursor-not-allowed')
                                                }`}
                                        >
                                            {purchasedDecks.includes(currentDeck.id)
                                                ? (activeDeck === currentDeck.id ? (
                                                    <span className="flex items-center gap-2">
                                                        <Check size={16} className="text-emerald-400" />
                                                        <span>Equipped</span>
                                                    </span>
                                                ) : 'Equip Theme')
                                                : `Purchase - ${formatMoney(currentDeck.price)}`}
                                        </button>
                                </div>

                                {/* Spread Deck Gallery (4x13) or High-End Preloader */}
                                <div className="flex-1 relative flex flex-col justify-around py-4 min-h-[360px]">
                                    <AnimatePresence mode="wait">
                                        {isDeckLoading ? (
                                            <motion.div
                                                key="loading"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md rounded-2xl border border-white/5 z-20"
                                            >
                                                <div className="relative mb-5">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                                        className="w-16 h-16 rounded-full border-2 border-white/10"
                                                        style={{ borderTopColor: currentDeck.accent || '#fff' }}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Loader2 size={24} className="animate-spin text-white/40" />
                                                    </div>
                                                </div>
                                                
                                                <p className="text-sm font-bold uppercase tracking-wider text-white/90">
                                                    Caching card deck assets...
                                                </p>
                                                <p className="text-xs text-white/40 font-mono mt-1">
                                                    {currentDeck.name} • {loadProgress}%
                                                </p>

                                                <div className="w-56 h-1.5 bg-white/10 rounded-full overflow-hidden mt-4">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${loadProgress}%`,
                                                            backgroundColor: currentDeck.accent || '#fff'
                                                        }}
                                                        transition={{ duration: 0.1 }}
                                                    />
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="gallery"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex-1 flex flex-col justify-around"
                                            >
                                                {SUITS.map(suit => (
                                                    <div key={suit} className="flex items-center">
                                                        <div className="w-9 h-9 flex items-center justify-center shrink-0 border border-white/5 rounded-lg bg-white/5 mr-4">
                                                            <span className="text-xl opacity-20">{suit === Suit.SPADES ? '♠' : suit === Suit.HEARTS ? '♥' : suit === Suit.CLUBS ? '♣' : '♦'}</span>
                                                        </div>
                                                        <div className="flex flex-1 items-center justify-between">
                                                            {ALL_RANKS.map((rank, rankIdx) => (
                                                                <motion.div
                                                                    key={`${suit}-${rank}`}
                                                                    className="relative w-14 aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10"
                                                                    style={{
                                                                        marginLeft: rankIdx === 0 ? 0 : '-1.2rem',
                                                                        zIndex: rankIdx
                                                                    }}
                                                                    whileHover={{
                                                                        scale: 1.4,
                                                                        zIndex: 100,
                                                                        y: -15,
                                                                        transition: { type: 'spring', stiffness: 400, damping: 25 }
                                                                    }}
                                                                >
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img
                                                                        src={getCardImage(suit, rank, currentDeck.id)}
                                                                        alt={`${rank}${suit}`}
                                                                        className="w-full h-full object-cover select-none pointer-events-none"
                                                                        loading="eager"
                                                                        decoding="sync"
                                                                    />
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
