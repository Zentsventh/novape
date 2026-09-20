import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ChatBot from './Components/Home/ChatBot';
import { ConfirmProvider } from '@/Contexts/ConfirmContext';
import { DeviceProvider, useDeviceContext } from '@/Contexts/DeviceContext';
import '../css/home/chatbot.css';
import '../css/home/responsive.css';
import './echo';

/* Wrapper global que muestra el ChatBot en páginas públicas (no admin). */
function GlobalLayout({ children, pageName = '', serverHints = {} }) {
    const isAdmin = typeof pageName === 'string' && (pageName.startsWith('Admin/') || pageName.startsWith('Auth/'));
    const isCheckoutFlow = typeof pageName === 'string' && pageName.startsWith('Checkout');

    return (
        <DeviceProvider serverHints={serverHints}>
            <ConfirmProvider>
                {children}
                {!isAdmin && !isCheckoutFlow && <ChatBot />}
            </ConfirmProvider>
        </DeviceProvider>
    );
}

createInertiaApp({
    title: (title) => title ? `${title} - Novape` : 'Novape',
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        createRoot(el).render(
            <GlobalLayout pageName={props?.initialPage?.component || ''} serverHints={props?.initialPage?.props?.device || {}}>
                <App {...props} />
            </GlobalLayout>
        );
    },
});

