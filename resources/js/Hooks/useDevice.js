import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Breakpoints profesionales alineados con la industria (Shopify, Vercel, etc.)
 * Definidos una sola vez como constantes para evitar recreaciones.
 */
const BREAKPOINTS = {
    xs:  480,   // Celulares pequeños (iPhone SE, Galaxy S8)
    sm:  640,   // Celulares grandes (iPhone 14 Pro, Pixel 7)
    md:  768,   // Tablets portrait (iPad Mini)
    lg:  1024,  // Tablets landscape / Laptops pequeñas
    xl:  1280,  // Laptops estándar
    '2xl': 1440 // Desktops / Monitores grandes
};

/**
 * Crea un MediaQueryList y devuelve su estado actual.
 * Usa window.matchMedia (O(1) en el motor del navegador) en lugar de
 * escuchar `resize` (que dispara cientos de veces por segundo).
 */
function createMatcher(query) {
    if (typeof window === 'undefined') return { matches: false };
    return window.matchMedia(query);
}

/**
 * useDevice — Hook algorítmico central de detección de dispositivo.
 *
 * Estrategia:
 * 1. Usa matchMedia listeners (event-driven, no polling) → eficiente en batería.
 * 2. Combina data server-side (User-Agent de Laravel/Inertia) con client-side.
 * 3. Expone breakpoint semántico ('xs'|'sm'|'md'|'lg'|'xl'|'2xl').
 * 4. Detecta capacidades táctiles para adaptar interacciones (no solo tamaño).
 *
 * @param {Object} serverHints - Props opcionales inyectados por Laravel (isMobile, isTablet, etc.)
 * @returns {Object} Estado completo del dispositivo
 */
export default function useDevice(serverHints = {}) {
    // --- Matchers (se crean una sola vez) ---
    const matchers = useMemo(() => {
        if (typeof window === 'undefined') return {};
        return {
            isMobile:  createMatcher(`(max-width: ${BREAKPOINTS.md - 1}px)`),
            isTablet:  createMatcher(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`),
            isDesktop: createMatcher(`(min-width: ${BREAKPOINTS.lg}px)`),
            isTouch:   createMatcher('(pointer: coarse)'),
            isPortrait: createMatcher('(orientation: portrait)'),
            prefersReducedMotion: createMatcher('(prefers-reduced-motion: reduce)'),
            prefersDark: createMatcher('(prefers-color-scheme: dark)'),
        };
    }, []);

    // --- Calcula el breakpoint semántico actual ---
    const getBreakpoint = useCallback(() => {
        if (typeof window === 'undefined') return 'lg';
        const w = window.innerWidth;
        return Object.entries(BREAKPOINTS).reverse().find(([, width]) => w >= width)?.[0] || 'xs';
    }, []);

    // --- Estado inicial (hidrata desde server-side si está disponible) ---
    const [device, setDevice] = useState(() => ({
        isMobile:   matchers.isMobile?.matches ?? serverHints.isMobile ?? false,
        isTablet:   matchers.isTablet?.matches ?? serverHints.isTablet ?? false,
        isDesktop:  matchers.isDesktop?.matches ?? serverHints.isDesktop ?? true,
        isTouch:    matchers.isTouch?.matches ?? false,
        isPortrait: matchers.isPortrait?.matches ?? false,
        prefersReducedMotion: matchers.prefersReducedMotion?.matches ?? false,
        prefersDark: matchers.prefersDark?.matches ?? false,
        breakpoint: getBreakpoint(),
        screenWidth:  typeof window !== 'undefined' ? window.innerWidth  : 1280,
        screenHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
    }));

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Listener central: cuando CUALQUIER media query cambia, recalcular todo.
        const update = () => {
            setDevice({
                isMobile:   matchers.isMobile?.matches  ?? false,
                isTablet:   matchers.isTablet?.matches   ?? false,
                isDesktop:  matchers.isDesktop?.matches  ?? true,
                isTouch:    matchers.isTouch?.matches     ?? false,
                isPortrait: matchers.isPortrait?.matches  ?? false,
                prefersReducedMotion: matchers.prefersReducedMotion?.matches ?? false,
                prefersDark: matchers.prefersDark?.matches ?? false,
                breakpoint: getBreakpoint(),
                screenWidth:  window.innerWidth,
                screenHeight: window.innerHeight,
            });
        };

        update();
        // Registrar listeners en cada matcher
        const entries = Object.values(matchers);
        entries.forEach(mql => {
            if (mql && typeof mql.addEventListener === 'function') {
                mql.addEventListener('change', update);
            }
        });

        // Listener de resize con debounce ligero para screenWidth/Height
        let resizeTimer;
        const onResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(update, 100);
        };
        window.addEventListener('resize', onResize);

        return () => {
            entries.forEach(mql => {
                if (mql && typeof mql.removeEventListener === 'function') {
                    mql.removeEventListener('change', update);
                }
            });
            window.removeEventListener('resize', onResize);
            clearTimeout(resizeTimer);
        };
    }, [matchers, getBreakpoint]);

    return device;
}

// Exportar breakpoints para uso externo (CSS-in-JS, etc.)
export { BREAKPOINTS };
