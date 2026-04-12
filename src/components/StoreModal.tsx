import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Check, Crown, Lock, Sparkles, CreditCard } from 'lucide-react';
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
            accent: '#4B5563',
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
            description: 'Futuristic animated cards pulsing with dynamic neon plasma energy.',
            price: 777_777,
            accent: '#06b6d4',
            icon: <Sparkles size={14} className="text-cyan-400" />
        },
        {
            id: 'gold',
            name: 'Premium Gold',
            description: 'Exclusive 24k solid gold textured cards for high rollers.',
            price: 500_000,
            accent: '#d4a843',
            icon: <Crown size={14} className="text-amber-500" />
        },
        {
            id: 'cosmic',
            name: 'Cosmic Swirl',
            description: 'Transcend beyond the stars with swirling nebula backgrounds.',
            price: 1_234_567,
            accent: '#7c3aed',
            icon: <Sparkles size={14} className="text-purple-400" />
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

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
            <motion.div
                className="relative w-full max-w-6xl h-[82vh] rounded-[32px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,1)] flex flex-col border border-white/10"
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
                            <h2 className="text-xl font-black uppercase tracking-tighter text-white">Grand Collection</h2>
                            <p className="text-[8px] text-amber-500/50 uppercase tracking-[0.3em] font-black italic">Exquisite Artistry & Design</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] text-white/20 uppercase tracking-[0.2em] font-black">Capital Balance</span>
                            <span className="text-xl font-black text-white tabular-nums">${bankroll.toLocaleString()}</span>
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
                                            <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none"
                                                style={{ textShadow: `0 0 40px ${currentDeck.accent}22` }}>
                                                {currentDeck.name}
                                            </h3>
                                            <p className="text-white/40 text-[13px] max-w-lg font-medium leading-normal">
                                                {currentDeck.description}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleAction(currentDeck.id, currentDeck.price)}
                                        className={`px-8 py-3.5 rounded-2xl font-black uppercase tracking-tighter text-sm transition-all duration-500
                                            ${purchasedDecks.includes(currentDeck.id)
                                                ? (activeDeck === currentDeck.id ? 'bg-white/5 text-white/20 border border-white/5 cursor-default' : 'bg-white text-black hover:scale-105 shadow-lg')
                                                : (bankroll >= currentDeck.price ? 'bg-amber-500 text-black hover:scale-105 shadow-lg' : 'bg-red-500/10 text-red-500/40 border border-red-500/20 cursor-not-allowed')
                                            }`}
                                    >
                                        {purchasedDecks.includes(currentDeck.id)
                                            ? (activeDeck === currentDeck.id ? 'Equipped' : 'Equip Theme')
                                            : `Purchase - ${formatMoney(currentDeck.price)}`}
                                    </button>
                                </div>

                                {/* Spread Deck Gallery (4x13) */}
                                <div className="flex-1 flex flex-col justify-around py-4">
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
                                                        <Image src={getCardImage(suit, rank, currentDeck.id)} alt={`${rank}${suit}`} fill className="object-cover" />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
