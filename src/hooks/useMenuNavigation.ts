import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================
// useMenuNavigation — Shared keyboard + gamepad
// navigation for menu pages and modals
// ============================================
//
// Keyboard:
//   ↑ / ↓ / ← / → = move focus
//   Enter / Space   = select focused item
//   Escape          = go back
//
// Gamepad (Xbox / PlayStation):
//   D-pad / Left Stick = move focus
//   A (Cross)          = select
//   B (Circle)         = back
//   BACK / START       = back
//

const BUTTONS = {
    A: 0,
    B: 1,
    BACK: 8,
    START: 9,
    UP: 12,
    DOWN: 13,
    LEFT: 14,
    RIGHT: 15,
};

const ANALOG_DEADZONE = 0.5;
const ANALOG_COOLDOWN_MS = 220;

interface UseMenuNavigationOptions {
    /** Array of item identifiers */
    items: string[];
    /** Number of columns in grid layout (default 1 = vertical list) */
    columns?: number;
    /** Called when user selects/activates the focused item */
    onSelect?: (id: string, index: number) => void;
    /** Called when user presses Escape/B/Back */
    onBack?: () => void;
    /** Called when user tries to move past the boundary (first/last item) in non-wrap mode.
     *  direction: 'prev' = tried to go before first, 'next' = tried to go past last */
    onBoundary?: (direction: 'prev' | 'next') => void;
    /** Disable the hook (e.g. when a modal is open on top) */
    disabled?: boolean;
    /** Enable wrap-around navigation (default true) */
    wrap?: boolean;
    /** Initial focus index */
    initialIndex?: number;
}

interface UseMenuNavigationReturn {
    /** Currently focused index (-1 if none) */
    focusedIndex: number;
    /** Currently focused item ID (or null) */
    focusedId: string | null;
    /** Programmatically set focus */
    setFocusedIndex: (index: number) => void;
}

export function useMenuNavigation({
    items,
    columns = 1,
    onSelect,
    onBack,
    onBoundary,
    disabled = false,
    wrap = true,
    initialIndex = 0,
}: UseMenuNavigationOptions): UseMenuNavigationReturn {
    const [focusedIndexState, setFocusedIndexState] = useState(initialIndex);
    const focusedIndexRef = useRef(initialIndex);

    const setFocusedIndex = useCallback((updaterOrValue: number | ((prev: number) => number)) => {
        const nextValue = typeof updaterOrValue === 'function' ? updaterOrValue(focusedIndexRef.current) : updaterOrValue;
        focusedIndexRef.current = nextValue;
        setFocusedIndexState(nextValue);
    }, []);
    const onSelectRef = useRef(onSelect);
    const onBackRef = useRef(onBack);
    const onBoundaryRef = useRef(onBoundary);
    const itemsRef = useRef(items);
    const columnsRef = useRef(columns);
    const wrapRef = useRef(wrap);
    const disabledRef = useRef(disabled);

    // Keep refs in sync
    useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
    useEffect(() => { onBackRef.current = onBack; }, [onBack]);
    useEffect(() => { onBoundaryRef.current = onBoundary; }, [onBoundary]);
    useEffect(() => { itemsRef.current = items; }, [items]);
    useEffect(() => { columnsRef.current = columns; }, [columns]);
    useEffect(() => { wrapRef.current = wrap; }, [wrap]);
    useEffect(() => { disabledRef.current = disabled; }, [disabled]);

    // Clamp focusedIndex when items change
    useEffect(() => {
        if (items.length === 0) return;
        setFocusedIndex((prev) => Math.min(prev, items.length - 1));
    }, [items.length, setFocusedIndex]);

    const move = useCallback((dx: number, dy: number) => {
        const list = itemsRef.current;
        const cols = columnsRef.current;
        const doWrap = wrapRef.current;
        if (list.length === 0) return;

        const prev = focusedIndexRef.current;
        const safePrev = Math.min(prev, list.length - 1);
        let next = safePrev;

        if (cols <= 1) {
            // Vertical list: ↑↓ move, ←→ also move
            const step = dy !== 0 ? dy : dx;
            next = safePrev + step;
        } else {
            // Grid layout
            if (dx !== 0) {
                next = safePrev + dx;
            }
            if (dy !== 0) {
                next = safePrev + dy * cols;
            }
        }

        if (doWrap) {
            next = ((next % list.length) + list.length) % list.length;
        } else {
            // Fire boundary callback when clamped (outside of state updater)
            if (next < 0) {
                onBoundaryRef.current?.('prev');
                next = safePrev; // don't move
            } else if (next >= list.length) {
                onBoundaryRef.current?.('next');
                next = safePrev; // don't move
            }
        }

        setFocusedIndex(next);
    }, [setFocusedIndex]);

    // Keyboard handler
    useEffect(() => {
        if (disabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (disabledRef.current) return;
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    move(0, -1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    move(0, 1);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    move(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    move(1, 0);
                    break;
                case 'Enter':
                case ' ': {
                    e.preventDefault();
                    const idx = focusedIndexRef.current;
                    const itemsList = itemsRef.current;
                    if (itemsList.length > 0 && idx >= 0 && idx < itemsList.length) {
                        onSelectRef.current?.(itemsList[idx], idx);
                    }
                    break;
                }
                case 'Escape':
                    e.preventDefault();
                    onBackRef.current?.();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [disabled, move]);

    // Gamepad polling
    useEffect(() => {
        if (disabled) return;

        let animFrame = 0;
        const lastButtons: boolean[] = [];
        const analogAxis = { x: false, y: false };
        const analogLast = { x: 0, y: 0 };

        const poll = () => {
            if (disabledRef.current) {
                animFrame = requestAnimationFrame(poll);
                return;
            }

            const gp = Array.from(navigator.getGamepads()).find((pad): pad is Gamepad => !!pad);
            if (gp) {
                const now = Date.now();
                const currentButtons = gp.buttons.map((b) => b.pressed);
                const isPressed = (i: number) => currentButtons[i] && !lastButtons[i];

                // D-pad
                if (isPressed(BUTTONS.UP)) move(0, -1);
                if (isPressed(BUTTONS.DOWN)) move(0, 1);
                if (isPressed(BUTTONS.LEFT)) move(-1, 0);
                if (isPressed(BUTTONS.RIGHT)) move(1, 0);

                // A = select
                if (isPressed(BUTTONS.A)) {
                    const idx = focusedIndexRef.current;
                    const itemsList = itemsRef.current;
                    if (itemsList.length > 0 && idx >= 0 && idx < itemsList.length) {
                        onSelectRef.current?.(itemsList[idx], idx);
                    }
                }

                // B / BACK = go back
                if (isPressed(BUTTONS.B) || isPressed(BUTTONS.BACK)) {
                    onBackRef.current?.();
                }

                // Analog stick navigation
                if (gp.axes.length >= 2) {
                    const lx = gp.axes[0];
                    const ly = gp.axes[1];

                    if (Math.abs(lx) > ANALOG_DEADZONE) {
                        if (!analogAxis.x || (now - analogLast.x > ANALOG_COOLDOWN_MS)) {
                            move(lx > 0 ? 1 : -1, 0);
                            analogAxis.x = true;
                            analogLast.x = now;
                        }
                    } else {
                        analogAxis.x = false;
                    }

                    if (Math.abs(ly) > ANALOG_DEADZONE) {
                        if (!analogAxis.y || (now - analogLast.y > ANALOG_COOLDOWN_MS)) {
                            move(0, ly > 0 ? 1 : -1);
                            analogAxis.y = true;
                            analogLast.y = now;
                        }
                    } else {
                        analogAxis.y = false;
                    }
                }

                // Copy buttons
                for (let i = 0; i < currentButtons.length; i++) {
                    lastButtons[i] = currentButtons[i];
                }
            }

            animFrame = requestAnimationFrame(poll);
        };

        animFrame = requestAnimationFrame(poll);
        return () => cancelAnimationFrame(animFrame);
    }, [disabled, move]);

    return {
        focusedIndex: items.length === 0 ? -1 : Math.min(focusedIndexState, items.length - 1),
        focusedId: items.length === 0 ? null : items[Math.min(focusedIndexState, items.length - 1)] ?? null,
        setFocusedIndex,
    };
}

/**
 * Lighter hook for modals that only need Escape/B to close
 * and optional ←→ or ↑↓ for simple navigation.
 */
interface UseModalNavigationOptions {
    /** Called on Escape / Gamepad B */
    onClose?: () => void;
    /** Called on ← / Gamepad Left / LB */
    onPrev?: () => void;
    /** Called on → / Gamepad Right / RB */
    onNext?: () => void;
    /** Called on ↑ */
    onUp?: () => void;
    /** Called on ↓ */
    onDown?: () => void;
    /** Called on Enter / Space / Gamepad A */
    onConfirm?: () => void;
    /** Disable */
    disabled?: boolean;
}

export function useModalNavigation({
    onClose,
    onPrev,
    onNext,
    onUp,
    onDown,
    onConfirm,
    disabled = false,
}: UseModalNavigationOptions) {
    const refs = useRef({ onClose, onPrev, onNext, onUp, onDown, onConfirm });
    useEffect(() => {
        refs.current = { onClose, onPrev, onNext, onUp, onDown, onConfirm };
    }, [onClose, onPrev, onNext, onUp, onDown, onConfirm]);

    // Keyboard
    useEffect(() => {
        if (disabled) return;

        const handle = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    refs.current.onClose?.();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    refs.current.onPrev?.();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    refs.current.onNext?.();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    refs.current.onUp?.();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    refs.current.onDown?.();
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    refs.current.onConfirm?.();
                    break;
            }
        };

        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [disabled]);

    // Gamepad
    useEffect(() => {
        if (disabled) return;

        let animFrame = 0;
        const lastButtons: boolean[] = [];

        const poll = () => {
            const gp = Array.from(navigator.getGamepads()).find((pad): pad is Gamepad => !!pad);
            if (gp) {
                const currentButtons = gp.buttons.map((b) => b.pressed);
                const isPressed = (i: number) => currentButtons[i] && !lastButtons[i];

                if (isPressed(BUTTONS.B) || isPressed(BUTTONS.BACK)) refs.current.onClose?.();
                if (isPressed(BUTTONS.A)) refs.current.onConfirm?.();
                if (isPressed(BUTTONS.LEFT)) refs.current.onPrev?.();
                if (isPressed(BUTTONS.RIGHT)) refs.current.onNext?.();
                if (isPressed(BUTTONS.UP)) refs.current.onUp?.();
                if (isPressed(BUTTONS.DOWN)) refs.current.onDown?.();
                // LB/RB for prev/next too
                if (isPressed(4)) refs.current.onPrev?.();  // LB
                if (isPressed(5)) refs.current.onNext?.();  // RB

                for (let i = 0; i < currentButtons.length; i++) {
                    lastButtons[i] = currentButtons[i];
                }
            }
            animFrame = requestAnimationFrame(poll);
        };

        animFrame = requestAnimationFrame(poll);
        return () => cancelAnimationFrame(animFrame);
    }, [disabled]);
}
