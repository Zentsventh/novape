import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Header from '../Components/Home/Header';
import Footer from '../Components/Home/Footer';

export default function Comparador({ productos = [], especificacionesUnicas = [], logoUrl }) {
    const { cart } = usePage().props;
    const [pending, setPending] = useState(false);
    const remove = id => router.post('/comparador/remove', { producto_id: id }, { preserveScroll: true,
        onStart: () => setPending(true), onFinish: () => setPending(false) });

    return (
        <div className="layout-container">
            <Head title="Comparador" />
            <Header logoUrl={logoUrl} cartCount={cart?.count || 0} onOpenCart={() => router.visit('/carrito')} onOpenCategories={() => router.visit('/catalogo')} />
            <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '20px', minHeight: '60vh' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>Comparador de Productos</h1>
                {productos.length > 0 ? (
                    <div className="store-table-scroll" tabIndex={0} role="region" aria-label="Comparación de productos">
                        <p>Comparando {productos.length} productos...</p>
                        <table className="store-comparison-table">
                            <caption>Precios y características</caption>
                            <thead><tr><th scope="col">Producto</th>{productos.map(p => <th scope="col" key={p.id}>
                                <Link href={`/producto/${p.id}`}><img src={p.imagen} alt="" loading="lazy" /><span>{p.nombre}</span></Link>
                                <button onClick={() => remove(p.id)} disabled={pending} aria-label={`Quitar ${p.nombre}`}>Quitar</button>
                            </th>)}</tr></thead>
                            <tbody>
                                <tr><th scope="row">Precio</th>{productos.map(p => <td key={p.id}>{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(p.precio)}</td>)}</tr>
                                <tr><th scope="row">Marca</th>{productos.map(p => <td key={p.id}>{p.marca}</td>)}</tr>
                                {especificacionesUnicas.map(name => <tr key={name}><th scope="row">{name}</th>{productos.map(p => <td key={p.id}>{p.especificaciones?.find(s => s.nombre === name)?.valor || 'No especificado'}</td>)}</tr>)}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 40px', background: '#f9fafb', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        <svg style={{ width: '64px', height: '64px', margin: '0 auto', color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        <p style={{ fontSize: '18px', color: '#475569', marginTop: '16px' }}>No tienes productos en tu lista de comparación.</p>
                        <Link href="/catalogo" style={{ display: 'inline-block', marginTop: '24px', padding: '12px 24px', background: '#0073D8', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
                            Añadir Productos
                        </Link>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}
