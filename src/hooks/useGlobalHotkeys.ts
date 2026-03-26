import { useEffect, useRef } from 'react';

interface HotkeysHandlers {
    onEscape?: () => void;
}

export function useGlobalHotkeys(handlers: HotkeysHandlers) {
    const handlersRef = useRef(handlers);

    useEffect(() => {
        handlersRef.current = handlers;
    }, [handlers]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && handlersRef.current.onEscape) {
                event.preventDefault();
                handlersRef.current.onEscape();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
}
