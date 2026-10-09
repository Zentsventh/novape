import React, { createContext, useContext } from 'react';
import { usePage } from '@inertiajs/react';
import useDevice from '@/Hooks/useDevice';

/**
 * DeviceContext — Contexto global que distribuye la información del dispositivo
 * a cualquier componente de React sin prop drilling.
 *
 * Combina:
 * 1. Detección server-side (User-Agent analizado por Laravel → Inertia props)
 * 2. Detección client-side (matchMedia, pointer queries, orientation)
 *
 * El server-side evita el "flash" de contenido incorrecto en la primera carga.
 * El client-side provee datos en tiempo real (rotación, resize, etc.)
 */
const DeviceContext = createContext({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouch: false,
    isPortrait: false,
    prefersReducedMotion: false,
    prefersDark: false,
    breakpoint: 'lg',
    screenWidth: 1280,
    screenHeight: 800,
});

export function DeviceProvider({ children, serverHints = {} }) {
    // El hook combina server hints con detección real del navegador
    const device = useDevice(serverHints);

    return (
        <DeviceContext.Provider value={device}>
            {children}
        </DeviceContext.Provider>
    );
}

/**
 * useDeviceContext — Hook de conveniencia para consumir el contexto.
 *
 * Uso en cualquier componente:
 *   const { isMobile, isTouch, breakpoint } = useDeviceContext();
 *   if (isMobile) return <MobileLayout />;
 */
export function useDeviceContext() {
    return useContext(DeviceContext);
}

export default DeviceContext;
