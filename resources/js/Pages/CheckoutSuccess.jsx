import React, { useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import Header from '../Components/Home/Header';

export default function CheckoutSuccess({ pedido }) {
    useEffect(() => {
        // Si estamos dentro de un iframe (Modal de Pago), redireccionamos la ventana principal
        if (window.top !== window.self) {
            window.top.location.href = '/perfil?tab=compras';
        } else {
            // Redirigir de inmediato a la sección de órdenes en el perfil sin refrescar la página
            router.visit('/perfil?tab=compras');
        }
    }, []);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            <Head title="Procesando Pedido..." />
            <Header cartCount={0} onOpenCart={() => {}} onOpenCategories={() => {}} minimal={true} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ width: '50px', height: '50px', border: '5px solid #bfdbfe', borderTop: '5px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a' }}>Generando tu orden...</h2>
                <p style={{ color: '#64748b' }}>Redirigiendo a tu panel de pedidos.</p>
            </div>
        </div>
    );
}
