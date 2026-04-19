'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, BookOpen, Star, Play, CheckCircle2 } from 'lucide-react';
import { ROOMS, RoomConfig } from '@/utils/rooms';
import { useAudio } from '@/utils/audio';
import Image from 'next/image';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { getLevelRank, getTutorialProfile, getTutorialSequenceRank } from '@/utils/tutorials/profiles';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { SwiperClass } from 'swiper/react';
import { FloatingLogosBackdrop, ROOM_LOGO_PATHS } from '@/components/FloatingLogosBackdrop';
import { useMenuNavigation } from '@/hooks/useMenuNavigation';
import { toAppHref } from '@/utils/platform';

import 'swiper/css';
import 'swiper/css/navigation';

const ITEMS_PER_PAGE = 3;

export default function TutorialLobby() {
  const router = useRouter();
  const { playSound } = useAudio();
  const completedTutorials = useGameStore((s) => s.completedTutorials);
  const [activePage, setActivePage] = useState(0);

  const tutorialRooms = useMemo(() => {
    return Object.values(ROOMS)
      .filter((r) => r.isTutorial)
      .sort((a, b) => {
        const sequenceDelta = getTutorialSequenceRank(a.id) - getTutorialSequenceRank(b.id);
        if (sequenceDelta !== 0) return sequenceDelta;

        const pa = getTutorialProfile(a.id);
        const pb = getTutorialProfile(b.id);
        const levelDelta = getLevelRank(pa.level) - getLevelRank(pb.level);
        if (levelDelta !== 0) return levelDelta;

        return a.name.localeCompare(b.name);
      });
  }, []);

  const chunkedRooms = useMemo(() => {
    const chunks: RoomConfig[][] = [];
    for (let i = 0; i < tutorialRooms.length; i += ITEMS_PER_PAGE) {
      chunks.push(tutorialRooms.slice(i, i + ITEMS_PER_PAGE));
    }
    return chunks;
  }, [tutorialRooms]);

  // Current page room IDs for arrow/gamepad navigation
  const currentPageRoomIds = useMemo(
    () => (chunkedRooms[activePage] ?? []).map(r => r.id),
    [chunkedRooms, activePage]
  );

  const [swiperRef, setSwiperRef] = useState<SwiperClass | null>(null);

  const handleTutorialSelect = useCallback((id: string) => {
    playSound('chip-lay');
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
    } else if (direction === 'prev' && activePage > 0) {
      playSound('click');
      swiperRef.slidePrev();
    }
  }, [swiperRef, activePage, chunkedRooms.length, playSound]);

  const { focusedId, setFocusedIndex } = useMenuNavigation({
    items: currentPageRoomIds,
    columns: 3,
    wrap: false,
    onSelect: handleTutorialSelect,
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

  return (
    <div className="min-h-full h-full bg-[#02020a] text-white font-sans selection:bg-indigo-500/30 flex flex-col">
      <style>{`
        .tutorial-swiper-btn-disabled {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        .swiper-button-disabled {
          opacity: 0;
          pointer-events: none;
        }
      `}</style>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <FloatingLogosBackdrop logoPaths={ROOM_LOGO_PATHS} opacityClassName="opacity-[0.07]" className="mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e1b4b_0%,_transparent_70%)] opacity-40" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Header */}
      <header className="relative z-50 flex items-center justify-between px-8 py-6 backdrop-blur-md border-b border-white/5 bg-black/40">
        <div className="flex items-center gap-6">
          <motion.button
            onClick={() => { playSound('click'); router.push(toAppHref('/')); }}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft size={20} />
          </motion.button>
          
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <span className="bg-linear-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Tutorial</span>
              <span className="text-white/20 font-light">/</span>
              <span className="text-white/90">Paths</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold mt-1">Beginner to Advanced Learning Tracks</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-10">
        <div className="w-full max-w-[1100px] relative px-12">
          <Swiper
            modules={[Navigation]}
            spaceBetween={32}
            slidesPerView={1}
            allowTouchMove={true}
            speed={500}
            navigation={{
              prevEl: '.tutorial-prev',
              nextEl: '.tutorial-next',
            }}
            className="w-full"
            onSwiper={setSwiperRef}
            onSlideChange={(s) => { playSound('click'); setActivePage(s.activeIndex); }}
          >
            {chunkedRooms.map((chunk, pageIndex) => (
              <SwiperSlide key={pageIndex}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full py-4">
                  {chunk.map((room) => (
                    <TutorialCard
                      key={room.id}
                      room={room}
                      completed={Boolean(completedTutorials?.[room.id])}
                      onStart={() => { playSound('chip-lay'); router.push(toAppHref(`/game/${room.id}`)); }}
                      isFocused={focusedId === room.id}
                    />
                  ))}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Prev/Next Buttons */}
          {chunkedRooms.length > 1 && (
            <>
              <div className="tutorial-prev absolute left-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-indigo-400/20 text-indigo-400/80 cursor-pointer hover:bg-indigo-400/10 hover:text-indigo-300 hover:scale-110 hover:border-indigo-400/60 transition-all duration-300 shadow-lg">
                <ChevronLeft size={24} />
              </div>
              <div className="tutorial-next absolute right-0 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-indigo-400/20 text-indigo-400/80 cursor-pointer hover:bg-indigo-400/10 hover:text-indigo-300 hover:scale-110 hover:border-indigo-400/60 transition-all duration-300 shadow-lg">
                <ChevronRight size={24} />
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 px-8 py-6 border-t border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 opacity-40 max-w-7xl mx-auto">
          <p className="text-xs font-medium text-white/60 text-center md:text-left">
            Tutorial tracks are designed for educational practice only and progress from fundamentals to advanced play.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Free Access</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Skill Tags</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TutorialCard({ room, onStart, completed, isFocused }: { room: RoomConfig; onStart: () => void; completed: boolean; isFocused?: boolean }) {
  const profile = getTutorialProfile(room.id);

  const levelStyle = profile.level === 'Beginner'
    ? 'bg-black/60 border-emerald-400/30 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.15)] ring-1 ring-inset ring-emerald-400/20'
    : profile.level === 'Intermediate'
      ? 'bg-black/60 border-amber-400/30 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.15)] ring-1 ring-inset ring-amber-400/20'
      : 'bg-black/60 border-fuchsia-400/30 text-fuchsia-300 shadow-[0_0_15px_rgba(192,38,211,0.15)] ring-1 ring-inset ring-fuchsia-400/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col"
      style={{
        ...(isFocused ? {
          boxShadow: '0 0 0 3px rgba(99,102,241,0.7), 0 0 30px rgba(99,102,241,0.3)',
          borderRadius: '1rem',
          transform: 'scale(1.03)',
          transition: 'all 0.15s ease',
        } : {}),
      }}
    >
      {/* Glow border */}
      <div className="absolute -inset-[1px] rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
        style={{ background: `linear-gradient(to bottom, ${room.accentColor}80, transparent)` }}
      />

      <div
        className="relative bg-[#0a0a16] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col h-full transition-transform duration-500 group-hover:-translate-y-2"
      >
        {/* Visual Header */}
        <div className="h-44 relative overflow-hidden" style={{ background: room.feltGradient }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 0.5px, transparent 0.5px)', backgroundSize: '3px 3px' }} />
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative w-full h-full transform transition-transform duration-700 group-hover:scale-110">
              <Image
                src={room.logoPath}
                alt={room.name}
                fill
                className="object-contain drop-shadow-2xl"
              />
            </div>
          </div>
          {/* Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {completed && (
              <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-emerald-400/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.15)] ring-1 ring-inset ring-emerald-400/20">
                <CheckCircle2 size={12} className="text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-300">Completed</span>
              </div>
            )}
            <div className={`px-3 py-1.5 rounded-full backdrop-blur-md border flex items-center gap-1.5 transition-all ${levelStyle}`}>
              <Star size={12} className="fill-current drop-shadow-[0_0_4px_currentColor]" />
              <span className="text-[10px] font-black uppercase tracking-[0.15em]">{profile.level}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <div className="mb-3">
            <h2 className="text-xl font-black text-white/90 mb-1">{room.name}</h2>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: room.accentColor }}>
              <BookOpen size={12} />
              {room.subtitle}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {profile.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-white/15 text-white/75 bg-black/20">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <p className="text-white/40 text-sm leading-relaxed mb-6 flex-1">
            {room.description}
          </p>

          <button
            onClick={onStart}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 cursor-pointer group/btn overflow-hidden relative shadow-lg"
            style={{
              background: room.accentColor,
              boxShadow: `0 4px 24px ${room.accentColor}40`,
            }}
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
            <Play size={14} fill="white" className="relative transition-transform group-hover/btn:scale-110" />
            <span className="relative">{completed ? 'Review Tutorial' : 'Start Tutorial'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}


