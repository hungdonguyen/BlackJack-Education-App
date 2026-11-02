'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getLobbyRooms, RoomConfig } from '@/utils/rooms';
import Image from 'next/image';
import { ArrowLeft, Home, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useAudio } from '@/utils/audio';
import { MusicPlayer } from '@/components/MusicPlayer';
import { useGameStore } from '@/hooks/useGameStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { SwiperClass } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { useMenuNavigation } from '@/hooks/useMenuNavigation';
import { InsufficientFundsWarning } from '@/components/table/InsufficientFundsWarning';
import { toAppHref } from '@/utils/platform';
import { ShinyText, CountUp, SpotlightCard } from '@/components/reactbits';

import 'swiper/css';
import 'swiper/css/navigation';

export default function LobbyPage() {
    const router = useRouter();
    const rooms = useMemo(() => getLobbyRooms(), []);
    const { playSound } = useAudio();
    const bankroll = useGameStore((s) => s.bankroll);
    const insufficientFundsWarning = useGameStore((s) => s.insufficientFundsWarning);
    const [swiperRef, setSwiperRef] = useState<SwiperClass | null>(null);
    const [activePage, setActivePage] = useState(0);

    const formatMoney = (v: number) =>
        v >= 1_000_000
            ? `$${(v / 1_000_000).toFixed(1)}M`
            : v >= 1000
                ? `$${v.toLocaleString()}`
                : `$${v}`;

    const ITEMS_PER_PAGE = 4;

    const chunkedRooms = useMemo(() => {
        const chunks = [];
        for (let i = 0; i < rooms.length; i += ITEMS_PER_PAGE) {
            chunks.push(rooms.slice(i, i + ITEMS_PER_PAGE));
        }
        return chunks;
    }, [rooms]);

    // Current page room IDs as navigation items
    const currentPageRoomIds = useMemo(
        () => (chunkedRooms[activePage] ?? []).map(r => r.id),
        [chunkedRooms, activePage]
    );

    const handleRoomSelect = useCallback((id: string) => {
        playSound('click');
        router.push(toAppHref(`/game/${id}`));
    }, [playSound, router]);

    const handleGoHome = useCallback(() => {
        playSound('click');
        router.push(toAppHref('/'));
    }, [playSound, router]);

    const handleBoundary = useCallback((direction: 'prev' | 'next') => {
        if (!swiperRef) return;
        if (direction === 'next' && activePage < chunkedRooms.length - 1) {
            playSound('click');
            swiperRef.slideNext();
            // Focus will reset to 0 because items change triggers clamp
        } else if (direction === 'prev' && activePage > 0) {
            playSound('click');
            swiperRef.slidePrev();
        }
    }, [swiperRef, activePage, chunkedRooms.length, playSound]);

    const { focusedId, setFocusedIndex } = useMenuNavigation({
        items: currentPageRoomIds,
        columns: 2,
        wrap: false,
        onSelect: handleRoomSelect,
        onBack: handleGoHome,
        onBoundary: handleBoundary,
    });

    // When page changes, reset focus to first item (next page) or last item (prev page)
    const prevPageRef = useRef(activePage);
    useEffect(() => {
        if (activePage !== prevPageRef.current) {
            const wentForward = activePage > prevPageRef.current;
            setFocusedIndex(wentForward ? 0 : (chunkedRooms[activePage]?.length ?? 1) - 1);
            prevPageRef.current = activePage;
        }
    }, [activePage, chunkedRooms, setFocusedIndex]);

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1,
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.9 },
        show: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 20
            }
        }
    };

    return (
        <motion.div 
            className="relative w-full h-full overflow-hidden select-none flex flex-col items-center"
            style={{
                background: 'radial-gradient(ellipse 120% 100% at 50% 30%, #301a10 0%, #1a0e0a 40%, #0d0705 100%)',
            }}
            initial="hidden"
            animate="show"
            variants={containerVariants}
        >
            <style>{`
                .swiper-button-disabled {
                    opacity: 0; pointer-events: none;
                }
            `}</style>
            
            {/* Top Bar — absolute so it doesn't affect centering */}
            <motion.div 
                className="absolute top-0 left-0 right-0 z-20 flex items-center h-20 px-6"
                variants={{
                    hidden: { opacity: 0, y: -20 },
                    show: { opacity: 1, y: 0 }
                }}
            >
                {/* Left Side: Back/Home */}
                <motion.button
                    onClick={() => { playSound('click'); router.push(toAppHref('/')); }}
                    className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors cursor-pointer mr-6"
                    whileHover={{ x: -3 }}
                >
                    <span><ArrowLeft size={16} /></span>
                    <span className="text-xs font-bold uppercase tracking-wider">Home</span>
                </motion.button>

                {/* Balance Badge */}
                <motion.div
                    className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-xl cursor-default"
                >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/20">
                        <Wallet size={12} className="text-amber-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-wider text-white/40 font-bold">Balance</span>
                        <CountUp
                            to={bankroll} from={bankroll}
                            prefix="$"
                            duration={0.8}
                            className="text-sm font-black text-amber-400 leading-none"
                        />
                    </div>
                </motion.div>


                {/* Right Side: Music Player */}
                <div className="ml-auto flex items-center pr-2">
                    <MusicPlayer roomId="lobby" />
                </div>
            </motion.div>

            {/* Center content — flex 1 allows vertical centering and pushes footer down */}
            <div className="flex-1 flex flex-col items-center justify-center w-full z-10 px-4 md:px-8 my-1">
                {/* Heading */}
                <motion.div
                    className="text-center mb-2 shrink-0"
                    variants={{
                        hidden: { opacity: 0, scale: 0.9 },
                        show: { opacity: 1, scale: 1 }
                    }}
                >
                    
                    <h1 className="text-2xl font-black uppercase tracking-[0.25em] font-cinzel leading-tight text-[#f5d280] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                        Educational Blackjack
                    </h1>
                    <div className="flex items-center justify-center gap-3 mt-1.5">
                        <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/40" />
                        <span className="text-amber-400/40 text-[8px] tracking-[0.5em] uppercase font-sans">Choose Your Table</span>
                        <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/40" />
                    </div>
                </motion.div>

                {/* Main Content Area (Swiper Carousel) */}
                <motion.div 
                    className="w-full max-w-[1300px] relative px-10 md:px-16 flex-1 max-h-[640px]"
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0 }
                    }}
                >
                    <Swiper
                        modules={[Navigation]}
                        spaceBetween={40}
                        slidesPerView={1}
                        allowTouchMove={true}
                        speed={600}
                        navigation={{
                            prevEl: '.lobby-prev',
                            nextEl: '.lobby-next',
                        }}
                        className="w-full h-full"
                        onSwiper={(s) => setSwiperRef(s)}
                        onSlideChange={(s) => { playSound('click'); setActivePage(s.activeIndex); }}
                    >
                        {chunkedRooms.map((chunk, pageIndex) => (
                            <SwiperSlide key={pageIndex}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:gap-5 w-full max-w-[960px] mx-auto py-1">
                                    {chunk.map((room, index) => (
                                        <RoomCard 
                                            key={room.id} 
                                            room={room} 
                                            index={index} 
                                            onClick={() => { playSound('click'); router.push(toAppHref(`/game/${room.id}`)); }} 
                                            variants={itemVariants} 
                                            isFocused={focusedId === room.id}
                                            onMouseEnter={() => setFocusedIndex(index)}
                                        />
                                    ))}
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Custom Nav Buttons */}
                    {chunkedRooms.length > 1 && (
                        <>
                            <div className="lobby-prev absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-amber-400/20 text-amber-500/80 cursor-pointer shadow-lg hover:bg-amber-400/10 hover:text-amber-400 hover:scale-110 hover:border-amber-400/60 transition-all duration-300">
                                <ChevronLeft size={28} />
                            </div>
                            <div className="lobby-next absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-amber-400/20 text-amber-500/80 cursor-pointer shadow-lg hover:bg-amber-400/10 hover:text-amber-400 hover:scale-110 hover:border-amber-400/60 transition-all duration-300">
                                <ChevronRight size={28} />
                            </div>
                        </>
                    )}
                </motion.div>
            </div>

            {/* Educational Disclaimer */}
            <motion.div 
                className="absolute bottom-3 left-0 right-0 flex flex-col items-center text-center z-50 pointer-events-none"
                variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1 }
                }}
            >
                <div className="bg-black/80 border border-white/10 backdrop-blur-md px-6 py-1.5 rounded-full flex flex-col items-center gap-0.5 shadow-lg">
                    <p className="text-[10px] text-stone-200 font-semibold uppercase tracking-[0.15em]">
                        This is a strictly educational project. No real money gambling is involved.
                    </p>
                    <div className="text-[9px] text-stone-300 leading-tight uppercase tracking-wider font-medium">
                        Audio Credits: Music by Kevin MacLeod & Audionautix.com · SFX by Kenney.nl
                    </div>
                </div>
            </motion.div>
            
            <InsufficientFundsWarning show={insufficientFundsWarning} />
        </motion.div>
    );
}

function RoomCard({ 
    room, 
    index, 
    onClick, 
    variants, 
    isFocused, 
    onMouseEnter 
}: { 
    room: RoomConfig; 
    index: number; 
    onClick: () => void; 
    variants: any; 
    isFocused?: boolean;
    onMouseEnter?: () => void;
}) {
    const formattedMaxBet = useMemo(() => {
        if (room.betRange[1] >= 1000000) return 'Unlimited';
        return `$${room.betRange[1].toLocaleString('en-US')}`;
    }, [room.betRange]);

    const isActive = Boolean(isFocused);

    return (
        <motion.div
            className="relative w-full h-full flex flex-col rounded-2xl overflow-hidden cursor-pointer"
            style={{
                border: isActive ? `2px solid ${room.accentColor}` : `1px solid ${room.borderColor}`,
                boxShadow: isActive
                    ? `0 12px 30px -8px rgba(0,0,0,0.8), 0 0 0 2px ${room.accentColor}`
                    : '0 8px 24px -6px rgba(0,0,0,0.6)',
                transform: isActive ? 'scale(1.025) translateY(-4px)' : 'scale(1) translateY(0)',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
            }}
            variants={variants}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
        >
            <SpotlightCard
                spotlightColor={`${room.accentColor}40`}
                className="w-full h-full p-0 flex flex-col bg-transparent border-0 rounded-2xl"
            >
            {/* Table preview */}
            <div className="h-[112px] relative overflow-hidden"
                style={{ background: room.feltGradient }}
            >
                {/* Felt texture */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23ffffff\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
                }} />

                {/* Room logo - clearly visible, never blocked on hover */}
                <div className="absolute inset-0 flex items-center justify-center p-2">
                    <div className={`relative w-[70%] h-[85%] mx-auto transition-transform duration-300 ${isActive ? 'scale-105' : ''}`}>
                        <Image
                            src={room.logoPath}
                            alt={room.name}
                            fill
                            className="object-contain drop-shadow-2xl"
                            sizes="(max-width: 768px) 100vw, 400px"
                            unoptimized
                        />
                    </div>
                </div>

                {/* Subtle top badges */}
                <div className="absolute top-2.5 left-3 flex items-center gap-2">
                    {room.isBeta && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider bg-red-500/30 text-red-300 border border-red-500/40 uppercase">
                            Beta
                        </span>
                    )}
                </div>

                {/* RTP pill top right */}
                <div className="absolute top-2.5 right-3 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-[9px] font-bold" style={{ color: room.accentColor }}>
                    {room.hasSideBet && room.baseGameRtp && room.sideBetRtp
                        ? `RTP ${room.baseGameRtp}`
                        : `RTP ${room.rtp}`}
                </div>
            </div>

            {/* Info section */}
            <div className="flex-1 flex flex-col p-3.5"
                style={{ background: 'rgba(10, 6, 4, 0.95)' }}
            >
                <div className="flex items-start justify-between mb-1">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className={`text-[15px] font-black transition-colors ${isActive ? 'text-amber-400' : 'text-white/90'}`}>{room.name}</h2>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] mt-0.5"
                            style={{ color: room.accentColor }}
                        >
                            {room.subtitle}
                        </p>
                    </div>
                    <span className={`text-xl transition-all ${isActive ? 'opacity-100 scale-110' : 'opacity-80'}`}>{room.icon}</span>
                </div>

                <p className="text-white/45 text-[10px] leading-relaxed line-clamp-2 my-1.5">{room.description}</p>

                {/* Rule Citation & Limits Bar */}
                <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-white/5">
                    <span className="text-[9px] text-white/40 truncate max-w-[260px] flex items-center gap-1 font-mono">
                        <span className="text-amber-400/80 font-bold">Ref:</span> {room.strategySource || 'Wizard of Odds Standard'}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] text-white/30 uppercase tracking-wider font-semibold">
                            ${room.betRange[0]} – {formattedMaxBet}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                            isActive 
                                ? 'bg-amber-400 text-black border border-amber-400 shadow-md scale-105' 
                                : 'bg-white/5 border border-white/15 text-white/70'
                        }`}>
                            Play
                        </span>
                    </div>
                </div>
            </div>
            </SpotlightCard>
        </motion.div>
    );
}

