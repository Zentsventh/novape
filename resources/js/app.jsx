import { createInertiaApp, router, usePage } from '@inertiajs/react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
const ChatBot = React.lazy(() => import('./Components/Home/ChatBot'));
const PanelAssistant = React.lazy(() => import('./Components/Admin/PanelAssistant'));
const TeamCallProvider = React.lazy(() => import('./Contexts/TeamCallContext'));
const MobileBottomNav = React.lazy(() => import('./Components/Home/MobileBottomNav'));
import { ConfirmProvider } from '@/Contexts/ConfirmContext';
import { DeviceProvider, useDeviceContext } from '@/Contexts/DeviceContext';
import { LocationProvider } from '@/Contexts/LocationContext';
import { ShippingProvider } from '@/Contexts/ShippingContext';
import '../css/home/chatbot.css';
import '../css/home/responsive.css';
import '../css/home/storefront.css';
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
function GlobalLayout({ children }) {
    const { component: pageName, props } = usePage();
    const isAdmin = pageName.startsWith('Admin/');
    const hasWidgets = !isAdmin && !pageName.startsWith('Auth/') && !pageName.startsWith('Checkout');
    const sharedState = JSON.stringify([props.auth?.user?.id, props.cart]);
    React.useEffect(() => { if (!isAdmin) router.flushAll(); }, [sharedState, isAdmin]);
    const adminContent = <>{children}{props.auth?.user && !pageName.startsWith('Admin/Auth') && pageName !== 'Admin/Assistant/Index' && <React.Suspense fallback={null}><PanelAssistant/></React.Suspense>}</>;
    const content = isAdmin ? (props.auth?.user && !pageName.startsWith('Admin/Auth') ? <React.Suspense fallback={children}><TeamCallProvider user={props.auth.user}>{adminContent}</TeamCallProvider></React.Suspense> : adminContent) : (
        <div className={`storefront${hasWidgets ? ' storefront--with-nav' : ''}`}>
            {children}
            {hasWidgets && <React.Suspense fallback={null}><MobileBottomNav user={props.auth?.user} cart={props.cart} /></React.Suspense>}
            {hasWidgets && <React.Suspense fallback={null}><ChatBot user={props.auth?.user} /></React.Suspense>}
        </div>
    );

    return (
        <DeviceProvider serverHints={props.device || {}}>
            <LocationProvider>
                <ShippingProvider>
                    <ConfirmProvider>{content}</ConfirmProvider>
                </ShippingProvider>
            </LocationProvider>
        </DeviceProvider>
    );
}

createInertiaApp({
    title: (title) => {
        if (!title) return 'Novape';
        if (title.includes('Novape')) return title;
        return `${title} | Novape`;
    },
    resolve: async (name) => {
        const page = await resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx'));
        page.default.layout = (children) => <GlobalLayout>{children}</GlobalLayout>;
        return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <ErrorBoundary>
                <App {...props} />
            </ErrorBoundary>
        );
    },
});

