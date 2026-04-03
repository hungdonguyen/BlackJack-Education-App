'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useViewportScale } from '@/hooks/useViewportScale';

// Default canvas is slightly smaller so UI elements appear larger on screen
const NORMAL_DESIGN_WIDTH = 1536; // 1920 / 1.25
const NORMAL_DESIGN_HEIGHT = 864; // 1080 / 1.25

// Game canvas is 1920x1080 because the Table component is specifically tuned for it
const GAME_DESIGN_WIDTH = 1920;
const GAME_DESIGN_HEIGHT = 1080;

export default function ResponsiveWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isGameRoute = pathname?.startsWith('/game');

    const designWidth = isGameRoute ? GAME_DESIGN_WIDTH : NORMAL_DESIGN_WIDTH;
    const designHeight = isGameRoute ? GAME_DESIGN_HEIGHT : NORMAL_DESIGN_HEIGHT;

    const viewScale = useViewportScale(designWidth, designHeight);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Block right-click (Context Menu) for Native Feel (Applies to Dev & Prod)
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        window.addEventListener('contextmenu', handleContextMenu);
        return () => window.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    // Provide a solid background prior to client hydration to avoid flash
    if (!mounted) {
        return (
            <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a0a0a' }}>
            </div>
        );
    }

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: designWidth, height: designHeight, transform: `scale(${viewScale})`, transformOrigin: 'center center', flexShrink: 0, position: 'relative' }}>
                <div style={{ width: '100%', height: '100%', position: 'relative', overflowY: 'auto', overflowX: 'hidden' }} className="custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}
