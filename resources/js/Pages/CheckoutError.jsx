import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '../Components/Home/Header';
import Footer from '../Components/Home/Footer';

export default function CheckoutError({ message }) {
    return (
        <div className="layout-container">
            <Head title="Error en el Pago" />
            <Header />
            <div style={{ maxWidth: '600px', margin: '80px auto', padding: 'clamp(0.75rem, 3vw, 2.5rem)', textAlign: 'center', background: '#fee2e2', borderRadius: '16px', border: '1px solid #fca5a5', boxShadow: '0 10px 25px rgba(220, 38, 38, 0.1)' }}>
                <svg style={{ width: '80px', height: '80px', margin: '0 auto', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '24px 0 16px', color: '#991b1b' }}>Pago no procesado</h1>
                <p style={{ fontSize: '18px', color: '#7f1d1d', marginBottom: '40px', lineHeight: '1.6' }}>
                    {message || "Lo sentimos, no pudimos procesar tu pago. Por favor, verifica que los fondos sean suficientes o intenta con otro método de pago."}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
                    <Link href="/checkout" style={{ display: 'inline-block', padding: '14px 28px', background: '#dc2626', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', transition: 'background 0.2s' }}>
                        Reintentar Pago
                    </Link>
                    <Link href="/ayuda" style={{ display: 'inline-block', padding: '14px 28px', background: 'transparent', color: '#dc2626', border: '2px solid #dc2626', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', transition: 'background 0.2s' }}>
                        Necesito Ayuda
                    </Link>
                </div>
            </div>
            <Footer />
        </div>
    );
}
