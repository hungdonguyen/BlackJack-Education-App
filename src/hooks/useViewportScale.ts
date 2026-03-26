import { useState, useEffect } from 'react';

export function useViewportScale(designWidth: number, designHeight: number) {
    const [viewScale, setViewScale] = useState(1);

    useEffect(() => {
        const update = () => {
            const sx = window.innerWidth / designWidth;
            const sy = window.innerHeight / designHeight;
            setViewScale(Math.min(sx, sy));
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [designWidth, designHeight]);

    return viewScale;
}
