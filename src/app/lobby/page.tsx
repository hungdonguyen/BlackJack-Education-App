'use client';

// ============================================
// Lobby Page — Room Selection
// ============================================

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ROOMS, RoomConfig } from '@/utils/rooms';
import Image from 'next/image';
import { ArrowLeft, Home } from 'lucide-react';

export default function LobbyPage() {
    const router = useRouter();
    const rooms = Object.values(ROOMS);

    return (
        <div className="relative w-screen h-screen overflow-hidden select-none flex flex-col"
            style={{
                background: 'radial-gradient(ellipse 120% 100% at 50% 30%, #301a10 0%, #1a0e0a 40%, #0d0705 100%)',
            }}
        >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 relative z-10">
                <motion.button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                    whileHover={{ x: -3 }}
                >
                    <span><ArrowLeft size={16} /></span>
                    <span className="text-xs font-bold uppercase tracking-wider">Home</span>
                </motion.button>
                <h1 className="text-lg font-extrabold text-amber-400/80 uppercase tracking-[0.3em] flex items-center justify-center">
                    <Home size={20} className="mr-2 mb-0.5" /> Lobby
                </h1>
                <div className="w-16" /> {/* Spacer */}
            </div>

            {/* Room Cards */}
            <div className="flex-1 flex items-center justify-center gap-8 px-8 relative z-10">
                {rooms.map((room, index) => (
                    <RoomCard key={room.id} room={room} index={index} onClick={() => router.push(`/game/${room.id}`)} />
                ))}
            </div>

            {/* Bottom hint */}
            <div className="text-center pb-6 relative z-10">
                <p className="text-white/15 text-[10px] uppercase tracking-[0.3em]">
                    Choose a table to play
                </p>
            </div>
            {/* Educational Disclaimer */}
            <div className="absolute bottom-4 left-0 right-0 text-center z-50 pointer-events-none">
                <p className="text-xs text-white/30 font-medium uppercase tracking-[0.1em]">
                    This is a strictly educational project. No real money gambling is involved.
                </p>
            </div>
        </div>
    );
}

function RoomCard({ room, index, onClick }: { room: RoomConfig; index: number; onClick: () => void }) {
    return (
        <motion.div
            className="relative w-[380px] rounded-2xl overflow-hidden cursor-pointer group"
            style={{
                border: `1px solid ${room.borderColor}`,
                boxShadow: `0 0 40px ${room.borderColor}`,
            }}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.15, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.03, y: -8, boxShadow: `0 0 60px ${room.accentColor}44` }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
        >
            {/* Table preview */}
            <div className="h-[200px] relative overflow-hidden"
                style={{ background: room.feltGradient }}
            >
                {/* Felt texture */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23ffffff\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
                }} />

                {/* Room logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full p-2">
                        <Image
                            src={room.id === 'freebet' ? '/images/logo/freebet_blackjack_logo.png' : '/images/logo/blackjack_vip_logo.avif'}
                            alt={room.name}
                            fill
                            className="object-contain drop-shadow-2xl"
                            sizes="(max-width: 768px) 100vw, 400px"
                        />
                    </div>
                </div>

                {/* Table text preview */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-serif">
                        {room.rules.blackjackPays}
                    </p>
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
            <div className="p-5"
                style={{ background: 'rgba(10, 6, 4, 0.95)' }}
            >
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="text-lg font-extrabold text-white/90">{room.name}</h3>
                        <p className="text-[11px] font-medium uppercase tracking-[0.15em]"
                            style={{ color: room.accentColor }}
                        >
                            {room.subtitle}
                        </p>
                    </div>
                    <span className="text-2xl">{room.icon}</span>
                </div>
                <p className="text-white/35 text-xs leading-relaxed mt-2">{room.description}</p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                    <span className="text-[9px] text-white/25 uppercase tracking-wider">
                        Min: ${room.betRange[0]}
                    </span>
                    <span className="text-[9px] text-white/25 uppercase tracking-wider">
                        Max: ${room.betRange[1].toLocaleString()}
                    </span>
                    <span className="text-[9px] text-white/25 uppercase tracking-wider ml-auto">
                        5 Seats
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
