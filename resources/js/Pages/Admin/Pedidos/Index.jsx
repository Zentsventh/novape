import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { Download, Search, Filter, Trash2, Eye, FileText, ShoppingBag } from 'lucide-react';

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
            case 'pendiente': return { bg: '#FEF3C7', color: '#D97706' }; 
            case 'procesando': return { bg: '#E0F2FE', color: '#0284C7' }; 
            case 'enviado': return { bg: '#F3E8FF', color: '#7E22CE' }; 
            case 'completado': return { bg: '#DCFCE7', color: '#16A34A' }; 
            case 'cancelado': return { bg: '#FEE2E2', color: '#DC2626' }; 
            default: return { bg: '#F1F5F9', color: '#64748B' }; 
        }
    };

    return (
        <AdminLayout logoUrl={null}>
            <Head title="Pedidos" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
                    <div style={{ padding: '8px', backgroundColor: '#F0F9FF', borderRadius: '10px', color: '#00B4FF' }}>
                        <ShoppingBag size={24} />
                    </div>
                    Gestión de Pedidos
                </h1>
                <a 
                    href="/admin/pedidos/exportar" 
                    target="_blank"
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0F172A'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1E293B'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    style={{ background: '#1E293B', color: '#ffffff', padding: '10px 18px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }}
                >
                    <Download size={16} />
                    Exportar a CSV
                </a>
            </div>

            {flash?.success && (
                <div style={{ background: '#ECFDF5', color: '#059669', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: '600', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    {flash.success}
                </div>
            )}

            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
                <form onSubmit={handleFilter} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '220px' }}>
                        <label style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Buscar Pedido o Cliente</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input 
                                type="text" 
                                placeholder="Ej. PED-NIUBIZ-123456"
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                                onFocus={(e) => { e.target.style.borderColor = '#00B4FF'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 180, 255, 0.1)'; e.target.style.backgroundColor = '#ffffff'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#1E293B', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease', boxSizing: 'border-box' }} 
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Fecha Inicio</label>
                        <input 
                            type="date" 
                            value={dateStart} 
                            onChange={e => setDateStart(e.target.value)} 
                            onFocus={(e) => { e.target.style.borderColor = '#00B4FF'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 180, 255, 0.1)'; e.target.style.backgroundColor = '#ffffff'; }}
                            onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#F8FAFC'; }}
                            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#1E293B', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease', fontFamily: 'inherit' }} 
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Fecha Fin</label>
                        <input 
                            type="date" 
                            value={dateEnd} 
                            onChange={e => setDateEnd(e.target.value)} 
                            onFocus={(e) => { e.target.style.borderColor = '#00B4FF'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 180, 255, 0.1)'; e.target.style.backgroundColor = '#ffffff'; }}
                            onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#F8FAFC'; }}
                            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#1E293B', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease', fontFamily: 'inherit' }} 
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Orden (Fecha)</label>
                        <select 
                            value={sort} 
                            onChange={e => setSort(e.target.value)} 
                            onFocus={(e) => { e.target.style.borderColor = '#00B4FF'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 180, 255, 0.1)'; e.target.style.backgroundColor = '#ffffff'; }}
                            onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#F8FAFC'; }}
                            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#1E293B', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease', width: '160px', cursor: 'pointer' }}
                        >
                            <option value="desc">Más recientes</option>
                            <option value="asc">Más antiguos</option>
                        </select>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
                        {(search || dateStart || dateEnd || sort !== 'desc') && (
                            <Link 
                                href="/admin/pedidos" 
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEE2E2'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#ffffff', color: '#64748B', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', transition: 'all 0.2s ease' }}
                            >
                                <Trash2 size={16} /> Limpiar
                            </Link>
                        )}
                        <button 
                            type="submit" 
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#009BE0'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 180, 255, 0.3)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#00B4FF'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 180, 255, 0.2)'; }}
                            style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#00B4FF', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0, 180, 255, 0.2)' }}
                        >
                            <Filter size={16} />
                            Filtrar
                        </button>
                    </div>
                </form>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '0', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', overflowX: 'auto', marginBottom: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Código</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? data.map(pedido => {
                            const { bg, color } = getStatusColor(pedido.estado);
                            return (
                                <tr 
                                    key={pedido.id} 
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    style={{ borderBottom: '1px solid #E2E8F0', transition: 'background 0.2s' }}
                                >
                                    <td style={{ padding: '16px 24px', color: '#1E293B', fontWeight: '600', fontSize: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FileText size={16} style={{ color: '#94A3B8' }} />
                                            {pedido.codigo}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ color: '#1E293B', fontWeight: '500', fontSize: '14px' }}>
                                            {pedido.usuario ? `${pedido.usuario.nombres} ${pedido.usuario.apellidos}` : 'Cliente Eliminado'}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{pedido.usuario?.email}</div>
                                    </td>
                                    <td style={{ padding: '16px 24px', color: '#64748B', fontSize: '14px' }}>
                                        {new Date(pedido.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style={{ padding: '16px 24px', color: '#1E293B', fontWeight: '700', fontSize: '14px' }}>
                                        S/ {Number(pedido.total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{ background: bg, color: color, padding: '6px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize', display: 'inline-block' }}>
                                            {pedido.estado}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <Link 
                                            href={`/admin/pedidos/${pedido.id}`} 
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#00B4FF'; e.currentTarget.style.borderColor = '#00B4FF'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 180, 255, 0.1)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                                            style={{ color: '#475569', textDecoration: 'none', padding: '8px 14px', borderRadius: '8px', background: '#ffffff', border: '1px solid #E2E8F0', fontWeight: '600', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }}
                                        >
                                            <Eye size={16} />
                                            Ver Detalle
                                        </Link>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="6" style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
                                    <ShoppingBag size={48} style={{ margin: '0 auto', opacity: 0.2, marginBottom: '16px' }} />
                                    <div style={{ fontSize: '15px', fontWeight: '500' }}>No se encontraron pedidos.</div>
                                    <div style={{ fontSize: '13px', marginTop: '4px' }}>Intenta ajustar los filtros de búsqueda.</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Paginación */}
            {pedidos?.links && pedidos.links.length > 3 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', gap: '6px', paddingBottom: '24px' }}>
                    {pedidos.links.map((link, i) => (
                        <Link 
                            key={i} 
                            href={link.url || '#'} 
                            onMouseEnter={(e) => { if(link.url && !link.active) { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; } }}
                            onMouseLeave={(e) => { if(link.url && !link.active) { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#64748B'; } }}
                            style={{ 
                                padding: '8px 16px', 
                                background: link.active ? '#00B4FF' : '#ffffff', 
                                color: link.active ? '#ffffff' : '#64748B', 
                                border: `1px solid ${link.active ? '#00B4FF' : '#E2E8F0'}`,
                                borderRadius: '8px', 
                                textDecoration: 'none',
                                fontWeight: '600',
                                fontSize: '14px',
                                opacity: link.url ? 1 : 0.5,
                                pointerEvents: link.url ? 'auto' : 'none',
                                transition: 'all 0.2s ease',
                                boxShadow: link.active ? '0 4px 6px rgba(0, 180, 255, 0.2)' : '0 1px 2px rgba(0,0,0,0.02)'
                            }}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
