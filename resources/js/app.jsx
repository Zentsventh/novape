import { createInertiaApp } from '@inertiajs/react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ChatBot from './Components/Home/ChatBot';
import MobileBottomNav from './Components/Home/MobileBottomNav';
import { ConfirmProvider } from '@/Contexts/ConfirmContext';
import { DeviceProvider, useDeviceContext } from '@/Contexts/DeviceContext';
import '../css/home/chatbot.css';
import '../css/home/responsive.css';
import './echo';

/* Error Boundary to catch silent React crashes */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error("React Error Caught:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', background: '#fee2e2', color: '#991b1b', fontFamily: 'monospace', minHeight: '100vh' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Algo salió mal en React.</h1>
                    <pre style={{ background: '#fff', padding: '20px', borderRadius: '8px', overflowX: 'auto', marginTop: '20px' }}>
                        {this.state.error && this.state.error.toString()}
                        <br/><br/>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

/* Wrapper global que muestra el ChatBot en páginas públicas (no admin). */
function GlobalLayout({ children, pageName = '', serverHints = {}, user = null, cart = null }) {
    const isAdmin = typeof pageName === 'string' && (pageName.startsWith('Admin/') || pageName.startsWith('Auth/'));
    const isCheckoutFlow = typeof pageName === 'string' && pageName.startsWith('Checkout');

    return (
        <DeviceProvider serverHints={serverHints}>
            <ConfirmProvider>
                {children}
                {!isAdmin && !isCheckoutFlow && <MobileBottomNav user={user} cart={cart} />}
                {!isAdmin && !isCheckoutFlow && <ChatBot user={user} />}
            </ConfirmProvider>
        </DeviceProvider>
    );
}

createInertiaApp({
    title: (title) => title ? `${title} - Novape` : 'Novape',
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        createRoot(el).render(
            <ErrorBoundary>
                <GlobalLayout 
                    pageName={props?.initialPage?.component || ''} 
                    serverHints={props?.initialPage?.props?.device || {}}
                    user={props?.initialPage?.props?.auth?.user}
                    cart={props?.initialPage?.props?.cart}
                >
                    <App {...props} />
                </GlobalLayout>
            </ErrorBoundary>
        );
    },
});

