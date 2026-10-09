import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '../Components/Home/Header';
import Footer from '../Components/Home/Footer';

export default function Wishlist() {
    const [wishlists, setWishlists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch wishlists
        fetch('/wishlist/lists')
            .then(res => res.json())
            .then(data => {
                setWishlists(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="layout-container">
            <Head title="Mi Wishlist" />
            <Header />
            <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '20px', minHeight: '60vh' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>Mis Listas de Deseos</h1>
                {loading ? (
                    <div style={{ padding: 'clamp(0.75rem, 3vw, 2.5rem)', textAlign: 'center', color: '#666' }}>Cargando listas...</div>
                ) : wishlists.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18.75rem), 1fr))', gap: '20px' }}>
                        {wishlists.map(list => (
                            <div key={list.id} style={{ border: '1px solid #e5e7eb', padding: 'clamp(0.75rem, 3vw, 1.5rem)', borderRadius: '12px', background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>{list.nombre}</h3>
                                <p style={{ color: '#6b7280', marginTop: '8px' }}>{list.items_count} producto(s)</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 40px', background: '#f9fafb', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        <svg style={{ width: '64px', height: '64px', margin: '0 auto', color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                        <p style={{ fontSize: '18px', color: '#475569', marginTop: '16px' }}>Aún no tienes listas de deseos guardadas.</p>
                        <Link href="/catalogo" style={{ display: 'inline-block', marginTop: '24px', padding: '12px 24px', background: '#0073D8', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
                            Explorar Catálogo
                        </Link>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}
