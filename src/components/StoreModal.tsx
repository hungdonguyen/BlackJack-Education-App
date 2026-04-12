'use client';

import { motion } from 'framer-motion';
import { X, ShoppingCart, Check, Crown, Lock, Sparkles } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { useAudio } from '@/utils/audio';
import Image from 'next/image';
import { getCardImage } from '@/utils/cardImages';
import { Suit, Rank } from '@/types/enums';

interface StoreModalProps {
    onClose: () => void;
}

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
            description: 'The standard casino-grade playing cards. Clean, readable, and elegant.',
            price: 0,
            image: getCardImage(Suit.SPADES, Rank.ACE, 'default'),
            accent: '#4B5563', // gray
            icon: null
        },
        {
            id: 'silver',
            name: 'Sterling Silver Deck',
            description: 'Polished sterling silver cards with a cool metallic sheen. Subtle elegance for the refined player.',
            price: 100_000,
            image: getCardImage(Suit.SPADES, Rank.ACE, 'silver'),
            accent: '#94a3b8', // silver
            icon: <Sparkles size={14} className="text-slate-300" />
        },
        {
            id: 'plasma',
            name: 'Plasma Flow Deck',
            description: 'Futuristic animated cards pulsing with dynamic neon plasma energy and stardust effects.',
            price: 500_000,
            image: getCardImage(Suit.SPADES, Rank.ACE, 'plasma'),
            accent: '#06b6d4', // cyan
            icon: <Sparkles size={14} className="text-cyan-400" />
        },
        {
            id: 'gold',
            name: 'Premium Gold Deck',
            description: 'Exclusive 24k solid gold textured cards designed for ultimate high rollers.',
            price: 777_777,
            image: getCardImage(Suit.SPADES, Rank.ACE, 'gold'),
            accent: '#d4a843', // gold
            icon: <Crown size={14} className="text-amber-500" />
        },
        {
            id: 'cosmic',
            name: 'Cosmic Swirl Deck',
            description: 'Cards forged from the heart of a galaxy. Swirling nebula backgrounds with star-dust detail.',
            price: 1_234_567,
            image: getCardImage(Suit.SPADES, Rank.ACE, 'cosmic'),
            accent: '#7c3aed', // purple
            icon: <Sparkles size={14} className="text-purple-400" />
        }
    ];

    const formatMoney = (v: number) => {
        if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
        if (v === 0) return 'Free';
        return `$${v.toLocaleString()}`;
    };

    const handleAction = (deckId: string, price: number) => {
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
            setActiveDeck(deckId); // auto equip
            checkDeckPurchaseAchievement(deckId);
        } else {
            // Insufficient funds
            triggerInsufficientFunds();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                style={{
                    background: 'rgba(15, 10, 8, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10"
                     style={{ background: 'linear-gradient(90deg, rgba(30,20,15,1) 0%, rgba(15,10,8,1) 100%)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                            <ShoppingCart size={20} className="text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-wider text-white">Casino Store</h2>
                            <p className="text-xs text-white/50 uppercase tracking-[0.1em]">Customize Your Experience</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* Current Bankroll display in Modal */}
                        <div className="flex flex-col items-end mr-4">
                            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Your Balance</span>
                            <span className="text-sm font-black text-amber-500">${bankroll.toLocaleString()}</span>
                        </div>
                        
                        <button
                            onClick={() => { playSound('click'); onClose(); }}
                            className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body Elements */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {decks.map(deck => {
                        const isOwned = purchasedDecks.includes(deck.id);
                        const isActive = activeDeck === deck.id;
                        const canAfford = bankroll >= deck.price;
                        
                        return (
                            <div 
                                key={deck.id}
                                className="relative flex p-4 rounded-xl transition-all duration-300 group"
                                style={{
                                    background: isActive ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.4)',
                                    border: isActive ? `1px solid ${deck.accent}` : '1px solid rgba(255,255,255,0.05)',
                                    boxShadow: isActive ? `0 0 20px ${deck.accent}22` : 'none'
                                }}
                            >
                                {/* Preview Card */}
                                <div className="w-[80px] h-[110px] shrink-0 relative mr-5 rounded-md overflow-hidden"
                                     style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                                    <Image 
                                        src={deck.image} 
                                        alt={deck.name} 
                                        fill 
                                        className="object-contain" 
                                    />
                                </div>
                                
                                {/* Info */}
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-black text-white/90 uppercase tracking-wide">{deck.name}</h3>
                                        {deck.icon}
                                    </div>
                                    <p className="text-xs text-white/50 leading-relaxed mb-4 max-w-sm">
                                        {deck.description}
                                    </p>
                                    
                                    <div className="flex items-center gap-3">
                                        {isOwned ? (
                                            <button
                                                onClick={() => handleAction(deck.id, deck.price)}
                                                disabled={isActive}
                                                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                                                    ${isActive 
                                                        ? 'bg-white/10 text-white/80 cursor-default' 
                                                        : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 border border-indigo-500/30 font-black'
                                                    }`}
                                            >
                                                {isActive ? (
                                                    <span className="flex items-center gap-2"><Check size={14} /> Equipped</span>
                                                ) : (
                                                    'Equip Deck'
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAction(deck.id, deck.price)}
                                                className={`px-8 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2
                                                    ${canAfford 
                                                        ? 'bg-amber-500 text-amber-950 hover:bg-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                                                        : 'bg-white/5 text-white/30 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                                                    }`}
                                            >
                                                {!canAfford && <Lock size={12} />}
                                                {formatMoney(deck.price)}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </motion.div>
        </div>
    );
}
