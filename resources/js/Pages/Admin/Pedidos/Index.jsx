import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

export default function Index() {
    const { pedidos, flash, filtros } = usePage().props;

    const data = pedidos?.data || [];

    const [dateStart, setDateStart] = useState(filtros?.date_start || '');
    const [dateEnd, setDateEnd] = useState(filtros?.date_end || '');
    const [sort, setSort] = useState(filtros?.sort || 'desc');
    const [search, setSearch] = useState(filtros?.search || '');

    const handleFilter = (e) => {
        e.preventDefault();
        router.get('/admin/pedidos', { search: search, date_start: dateStart, date_end: dateEnd, sort: sort }, { preserveState: true });
    };

    const getStatusColor = (estado) => {
        switch (estado) {
            case 'pendiente': return { bg: 'rgba(96,165,250,0.1)', color: '#60a5fa' }; // Amarillo
            case 'procesando': return { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' }; // Azul
            case 'enviado': return { bg: 'rgba(29,78,216,0.1)', color: '#1d4ed8' }; // Morado
            case 'completado': return { bg: 'rgba(37,99,235,0.1)', color: '#2563eb' }; // Verde
            case 'cancelado': return { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' }; // Rojo
            default: return { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' }; // Gris
        }
    };

    return (
        <AdminLayout logoUrl={null}>
            <Head title="Pedidos" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Gestión de Pedidos</h1>
                <a 
                    href="/admin/exportar/pedidos" 
                    target="_blank"
                    style={{ background: '#2563eb', color: 'white', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    Exportar a CSV
                </a>
            </div>

            {flash?.success && (
                <div style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500', border: '1px solid rgba(37,99,235,0.2)' }}>
                    {flash.success}
                </div>
            )}

            <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                <form onSubmit={handleFilter} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '200px' }}>
                        <label style={{ fontSize: '13px', color: 'var(--admin-text-muted)', fontWeight: 'bold' }}>Buscar Pedido o Cliente</label>
                        <input 
                            type="text" 
                            placeholder="Ej. PED-NIUBIZ-123456"
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }} 
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', color: 'var(--admin-text-muted)', fontWeight: 'bold' }}>Fecha Inicio</label>
                        <input 
                            type="date" 
                            value={dateStart} 
                            onChange={e => setDateStart(e.target.value)} 
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }} 
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', color: 'var(--admin-text-muted)', fontWeight: 'bold' }}>Fecha Fin</label>
                        <input 
                            type="date" 
                            value={dateEnd} 
                            onChange={e => setDateEnd(e.target.value)} 
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }} 
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', color: 'var(--admin-text-muted)', fontWeight: 'bold' }}>Orden (Fecha)</label>
                        <select 
                            value={sort} 
                            onChange={e => setSort(e.target.value)} 
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)', width: '150px' }}
                        >
                            <option value="desc" style={{ color: 'black' }}>Más recientes (Mayor a menor)</option>
                            <option value="asc" style={{ color: 'black' }}>Más antiguos (Menor a mayor)</option>
                        </select>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
                        {(search || dateStart || dateEnd || sort !== 'desc') && (
                            <Link href="/admin/pedidos" style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--admin-border)', color: 'var(--admin-text-muted)', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                                Limpiar
                            </Link>
                        )}
                        <button type="submit" style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#4b5563', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                            Filtrar
                        </button>
                    </div>
                </form>
            </div>

            <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--admin-border)', color: 'var(--admin-text-muted)' }}>
                            <th style={{ padding: '12px' }}>Código</th>
                            <th style={{ padding: '12px' }}>Cliente</th>
                            <th style={{ padding: '12px' }}>Fecha</th>
                            <th style={{ padding: '12px' }}>Total</th>
                            <th style={{ padding: '12px' }}>Estado</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? data.map(pedido => {
                            const { bg, color } = getStatusColor(pedido.estado);
                            return (
                                <tr key={pedido.id} style={{ borderBottom: '1px solid var(--admin-border)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '12px', color: 'var(--admin-text-main)', fontWeight: 'bold' }}>{pedido.codigo}</td>
                                    <td style={{ padding: '12px', color: 'var(--admin-text-main)' }}>
                                        {pedido.usuario ? `${pedido.usuario.nombres} ${pedido.usuario.apellidos}` : 'Cliente Eliminado'}
                                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{pedido.usuario?.email}</div>
                                    </td>
                                    <td style={{ padding: '12px', color: 'var(--admin-text-muted)' }}>{new Date(pedido.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '12px', color: 'var(--admin-text-main)', fontWeight: 'bold' }}>S/ {pedido.total}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ background: bg, color: color, padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                            {pedido.estado}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <Link href={`/admin/pedidos/${pedido.id}`} style={{ color: '#1d4ed8', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', background: 'rgba(29,78,216,0.1)', fontWeight: 'bold', fontSize: '13px' }}>
                                            Ver Detalle
                                        </Link>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                    No hay pedidos registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Paginación */}
            {pedidos?.links && pedidos.links.length > 3 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '5px' }}>
                    {pedidos.links.map((link, i) => (
                        <Link 
                            key={i} 
                            href={link.url || '#'} 
                            style={{ 
                                padding: '8px 12px', 
                                background: link.active ? '#1d4ed8' : 'var(--admin-bg-panel)', 
                                color: link.active ? 'white' : 'var(--admin-text-main)', 
                                borderRadius: '6px', 
                                textDecoration: 'none',
                                opacity: link.url ? 1 : 0.5,
                                pointerEvents: link.url ? 'auto' : 'none'
                            }}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
