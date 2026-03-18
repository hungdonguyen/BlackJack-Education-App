'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ROOMS, RoomConfig } from '@/utils/rooms';
import Image from 'next/image';
import { ArrowLeft, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useAudio } from '@/utils/audio';
import { MusicPlayer } from '@/components/MusicPlayer';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Keyboard } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';

export default function LobbyPage() {
    const router = useRouter();
    const rooms = Object.values(ROOMS).filter(r => !r.isTutorial);
    const { playSound } = useAudio();

    const ITEMS_PER_PAGE = 6;

    const chunkedRooms = useMemo(() => {
        const chunks = [];
        for (let i = 0; i < rooms.length; i += ITEMS_PER_PAGE) {
            chunks.push(rooms.slice(i, i + ITEMS_PER_PAGE));
        }
        return chunks;
    }, [rooms]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                router.push('/');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    return (
        <div className="relative w-screen h-screen overflow-hidden select-none flex flex-col items-center"
            style={{
                background: 'radial-gradient(ellipse 120% 100% at 50% 30%, #301a10 0%, #1a0e0a 40%, #0d0705 100%)',
            }}
        >
            <style>{`
                .swiper-button-disabled {
                    opacity: 0; pointer-events: none;
                }
            `}</style>
            
            {/* Top Bar — absolute so it doesn't affect centering */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center h-20 px-6">
                {/* Left Side: Back/Home */}
                <motion.button
                    onClick={() => { playSound('click'); router.push('/'); }}
                    className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                    whileHover={{ x: -3 }}
                >
                    <span><ArrowLeft size={16} /></span>
                    <span className="text-xs font-bold uppercase tracking-wider">Home</span>
                </motion.button>


                {/* Right Side: Music Player */}
                <div className="ml-auto flex items-center pr-2">
                    <MusicPlayer roomId="lobby" />
                </div>
            </div>

            {/* Center content — flex 1 allows vertical centering and pushes footer down */}
            <div className="flex-1 flex flex-col items-center justify-center w-full z-10 px-4 md:px-8 mt-12 mb-16">
                {/* Heading */}
                <motion.div
                    className="text-center mb-6 shrink-0"
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                >
                    <p className="text-[9px] uppercase tracking-[0.45em] text-amber-400/50 mb-1 font-sans">Welcome to</p>
                    <h2
                        className="text-2xl font-black uppercase tracking-[0.25em] text-transparent bg-clip-text leading-tight"
                        style={{
                            fontFamily: 'var(--font-cinzel), serif',
                            backgroundImage: 'linear-gradient(135deg, #f5d280 0%, #d4a843 40%, #b8860b 70%, #f5d280 100%)',
                            filter: 'drop-shadow(0 0 18px rgba(212,168,67,0.7)) drop-shadow(0 0 40px rgba(212,168,67,0.35))',
                        }}
                    >
                        Educational Blackjack
                    </h2>
                    <div className="flex items-center justify-center gap-3 mt-1.5">
                        <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/40" />
                        <span className="text-amber-400/40 text-[8px] tracking-[0.5em] uppercase font-sans">Choose Your Table</span>
                        <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/40" />
                    </div>
                </motion.div>

                {/* Main Content Area (Swiper Carousel) */}
                <div className="w-full max-w-[1300px] relative px-10 md:px-16 flex-1 max-h-[640px]">
                    <Swiper
                        modules={[Navigation, Keyboard]}
                        spaceBetween={40}
                        slidesPerView={1}
                        keyboard={{ enabled: true }}
                        speed={600}
                        navigation={{
                            prevEl: '.lobby-prev',
                            nextEl: '.lobby-next',
                        }}
                        className="w-full h-full"
                        onSlideChange={() => playSound('click')}
                    >
                        {chunkedRooms.map((chunk, pageIndex) => (
                            <SwiperSlide key={pageIndex}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 xl:gap-5 w-full max-w-[1100px] mx-auto py-2">
                                    {chunk.map((room, index) => (
                                        <RoomCard key={room.id} room={room} index={index} onClick={() => { playSound('click'); router.push(`/game/${room.id}`); }} />
                                    ))}
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Custom Nav Buttons */}
                    {chunkedRooms.length > 1 && (
                        <>
                            <div className="lobby-prev absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-amber-400/20 text-amber-500/80 cursor-pointer shadow-[0_0_20px_rgba(212,168,67,0.1)] hover:bg-amber-400/10 hover:text-amber-400 hover:scale-110 hover:border-amber-400/60 transition-all duration-300">
                                <ChevronLeft size={28} />
                            </div>
                            <div className="lobby-next absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-amber-400/20 text-amber-500/80 cursor-pointer shadow-[0_0_20px_rgba(212,168,67,0.1)] hover:bg-amber-400/10 hover:text-amber-400 hover:scale-110 hover:border-amber-400/60 transition-all duration-300">
                                <ChevronRight size={28} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Educational Disclaimer */}
            <div className="absolute bottom-4 left-0 right-0 text-center z-50 pointer-events-none">
                <p className="text-xs text-white/30 font-medium uppercase tracking-[0.1em]">
                    This is a strictly educational project. No real money gambling is involved.
                </p>
                <div className="text-[8px] text-white/10 mt-1 leading-tight uppercase tracking-wider">
                    Audio Credits: Music by Kevin MacLeod & Audionautix.com · SFX by Kenney.nl
                </div>
            </div>
        </div>
    );
}

function RoomCard({ room, index, onClick }: { room: RoomConfig; index: number; onClick: () => void }) {
    const formattedMaxBet = useMemo(() => room.betRange[1].toLocaleString('en-US'), [room.betRange]);

    return (
        <motion.div
            className="relative w-full h-full flex flex-col rounded-2xl overflow-hidden cursor-pointer group"
            style={{
                border: `1px solid ${room.borderColor}`,
                boxShadow: `0 0 40px ${room.borderColor}`,
            }}
            initial={false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.28, ease: 'easeOut' }}
            whileHover={{ scale: 1.03, y: -8, boxShadow: `0 0 60px ${room.accentColor}44` }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
        >
            {/* Table preview */}
            <div className="h-[110px] relative overflow-hidden"
                style={{ background: room.feltGradient }}
            >
                {/* Felt texture */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23ffffff\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
                }} />

                {/* Room logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-[60%] h-[75%] mx-auto">
                        <Image
                            src={room.logoPath}
                            alt={room.name}
                            fill
                            className="object-contain drop-shadow-xl"
                            sizes="(max-width: 768px) 100vw, 400px"
                            unoptimized
                        />
                    </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <motion.span
                        className="text-white font-bold text-sm uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity duration-300
                            px-6 py-2 rounded-full border border-white/30 bg-black/40 backdrop-blur-sm"
                    >
                        Play Now
                    </motion.span>
                </div>
            </div>

            {/* Info section */}
            <div className="flex-1 flex flex-col p-4"
                style={{ background: 'rgba(10, 6, 4, 0.95)' }}
            >
                <div className="flex items-start justify-between mb-1.5">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-[15px] font-extrabold text-white/90">{room.name}</h3>
                            {room.isBeta && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
                                    Beta
                                </span>
                            )}
                        </div>
                        <p className="text-[9px] font-medium uppercase tracking-[0.15em] mt-0.5"
                            style={{ color: room.accentColor }}
                        >
                            {room.subtitle}
                        </p>
                    </div>
                    <span className="text-xl">{room.icon}</span>
                </div>
                <p className="text-white/35 text-[9px] leading-relaxed mt-1">{room.description}</p>
                <div className="flex items-center gap-3 mt-auto pt-2.5 border-t border-white/5">
                    <span className="text-[8px] text-white/25 uppercase tracking-wider">
                        Min: ${room.betRange[0]}
                    </span>
                    <span className="text-[8px] text-white/25 uppercase tracking-wider">
                        Max: ${formattedMaxBet}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider ml-auto font-bold" style={{ color: room.accentColor }}>
                        {room.hasSideBet && room.baseGameRtp && room.sideBetRtp
                            ? <>RTP {room.baseGameRtp} · <span className="text-red-400">Side Bet {room.sideBetRtp}</span></>
                            : <>RTP {room.rtp}</>
                        }
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
