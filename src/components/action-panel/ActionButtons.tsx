import React from 'react';
import { motion } from 'framer-motion';

export interface CircleButtonProps {
    id?: string;
    label: string; icon: React.ReactNode; color: string; hoverColor: string;
    onClick: () => void; disabled: boolean; size: number;
    ariaLabel?: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    isFocused?: boolean;
}

export function CircleButton({ id, label, icon, color, hoverColor, onClick, disabled, size, ariaLabel, onMouseEnter, onMouseLeave, isFocused }: CircleButtonProps) {
    return (
        <motion.button
            id={id}
            aria-label={ariaLabel || label}
            onClick={onClick} disabled={disabled}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="flex flex-col items-center gap-1.5 cursor-pointer"
            style={{ opacity: disabled ? 0.2 : 1 }}
            whileHover={disabled ? {} : { scale: 1.12, y: -4 }}
            whileTap={disabled ? {} : { scale: 0.9 }}
        >
            <motion.div
                className="rounded-full flex items-center justify-center shadow-xl transition-shadow duration-300"
                style={{
                    width: size, height: size,
                    background: disabled ? 'rgba(100,100,100,0.3)' : `radial-gradient(circle at 35% 35%, ${hoverColor}, ${color})`,
                    boxShadow: isFocused ? '0 0 20px white, 0 4px 20px rgba(0,0,0,0.4)' : (disabled ? 'none' : `0 4px 20px ${color}66, 0 0 40px ${color}22, inset 0 1px 0 rgba(255,255,255,0.3)`),
                    border: isFocused ? '3px solid white' : `2px solid ${disabled ? 'rgba(100,100,100,0.2)' : color}`,
                    scale: isFocused ? 1.1 : 1
                }}
            >
                <span className="text-white font-black drop-shadow-md" style={{ fontSize: size * 0.35 }}>{icon}</span>
            </motion.div>
            <span className="text-[8px] font-bold text-white/50 uppercase tracking-wider whitespace-nowrap">{label}</span>
        </motion.button>
    );
}

// ── SmallButton ──
export function SmallButton({ id, label, icon, onClick, disabled, variant, isFocused }: {
    id?: string; label: string; icon: React.ReactNode; onClick: () => void; disabled: boolean; variant: 'ghost' | 'danger' | 'confirm'; isFocused?: boolean;
}) {
    let styles = '';
    if (variant === 'danger') {
        styles = 'border-red-500/30 text-red-400/70 hover:bg-red-500/10 hover:text-red-400';
    } else if (variant === 'confirm') {
        styles = 'border-emerald-500/30 text-emerald-400/80 hover:bg-emerald-500/10 hover:text-emerald-400';
    } else {
        styles = 'border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60';
    }

    return (
        <motion.button
            id={id}
            onClick={onClick} disabled={disabled}
            className={`px-4 py-2 rounded-full border text-[11px] font-bold uppercase tracking-wider
                transition-all duration-200 cursor-pointer
                ${isFocused ? 'shadow-[0_0_15px_white] scale-105 border-white text-white bg-white/10' : ''}
                ${disabled ? 'opacity-20 cursor-not-allowed' : styles}`}
            whileHover={disabled ? {} : { scale: 1.05 }}
            whileTap={disabled ? {} : { scale: 0.95 }}
        >
            <div className="flex items-center gap-1">
                <span className="flex items-center justify-center">{icon}</span>
                {label}
            </div>
        </motion.button>
    );
}

// ── FreeCircleButton — Golden shimmer for FREE actions ──
export interface FreeCircleButtonProps {
    id?: string;
    label: string; icon: React.ReactNode;
    onClick: () => void; disabled: boolean; size: number;
    ariaLabel?: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    isFocused?: boolean;
}

export function FreeCircleButton({ id, label, icon, onClick, disabled, size, ariaLabel, onMouseEnter, onMouseLeave, isFocused }: FreeCircleButtonProps) {
    return (
        <motion.button
            id={id}
            onClick={onClick} disabled={disabled}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            aria-label={ariaLabel || label}
            className="flex flex-col items-center gap-1.5 cursor-pointer"
            style={{ opacity: disabled ? 0.2 : 1 }}
            whileHover={disabled ? {} : { scale: 1.15, y: -5 }}
            whileTap={disabled ? {} : { scale: 0.88 }}
        >
            <motion.div
                className="rounded-full flex items-center justify-center shadow-xl relative overflow-hidden"
                style={{
                    width: size, height: size,
                    background: disabled
                        ? 'rgba(100,100,100,0.3)'
                        : 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 30%, #d97706 60%, #fbbf24 100%)',
                    boxShadow: isFocused ? '0 0 25px white' : (disabled
                        ? 'none'
                        : '0 4px 25px rgba(251, 191, 36, 0.6), 0 0 50px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255,255,255,0.5)'),
                    border: isFocused ? '3px solid white' : `2px solid ${disabled ? 'rgba(100,100,100,0.2)' : '#fcd34d'}`,
                    scale: isFocused ? 1.15 : 1
                }}
                animate={disabled ? {} : {
                    boxShadow: isFocused ? ['0 0 25px white'] : [
                        '0 4px 25px rgba(251, 191, 36, 0.6), 0 0 50px rgba(234, 179, 8, 0.3)',
                        '0 4px 35px rgba(251, 191, 36, 0.9), 0 0 70px rgba(234, 179, 8, 0.5)',
                        '0 4px 25px rgba(251, 191, 36, 0.6), 0 0 50px rgba(234, 179, 8, 0.3)',
                    ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                {/* Shimmer sweep */}
                {!disabled && (
                    <motion.div
                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                )}
                <span className="text-black font-black drop-shadow-sm relative z-10" style={{ fontSize: size * 0.35 }}>{icon}</span>
            </motion.div>
            <span className="text-[8px] font-black text-yellow-400 uppercase tracking-wider whitespace-nowrap drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]">
                ✦ {label}
            </span>
        </motion.button>
    );
}
