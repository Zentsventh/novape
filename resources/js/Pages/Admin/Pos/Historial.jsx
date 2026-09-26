import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { FileText, ArrowLeft, Search, Receipt, Calendar, CreditCard, User, Hash } from 'lucide-react';
import AdminLayout from '../../../Layouts/AdminLayout';
import '../../../../css/admin/admin.css';

export default function HistorialPos({ historial, filters, logoUrl }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/admin/pos/historial', { search: searchTerm }, { preserveState: true });
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    // Estilos inline reutilizables (SaaS style)
    const styles = {
        pageTitle: {
            fontSize: '24px',
            fontWeight: '700',
            color: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            letterSpacing: '-0.02em',
        },
        card: {
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            marginTop: '24px',
            transition: 'all 0.3s ease',
        },
        th: {
            padding: '16px 24px',
            textAlign: 'left',
            fontSize: '12px',
            fontWeight: '600',
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
        },
        td: {
            padding: '16px 24px',
            fontSize: '14px',
            color: '#1E293B',
            borderBottom: '1px solid #F1F5F9',
            verticalAlign: 'middle',
        },
        badge: {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: '#F0F9FF',
            color: '#00B4FF',
            border: '1px solid #BAE6FD',
        },
        btnBack: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#F8FAFC',
            color: '#475569',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none',
            border: '1px solid #E2E8F0',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
        },
        searchInput: {
            width: '100%',
            padding: '10px 16px 10px 42px',
            borderRadius: '8px',
            border: `1px solid ${isSearchFocused ? '#00B4FF' : '#E2E8F0'}`,
            fontSize: '14px',
            color: '#1E293B',
            outline: 'none',
            boxShadow: isSearchFocused ? '0 0 0 3px rgba(0, 180, 255, 0.15)' : 'none',
            transition: 'all 0.2s ease',
            backgroundColor: isSearchFocused ? '#ffffff' : '#F8FAFC',
        },
        btnSearch: {
            padding: '10px 20px',
            backgroundColor: '#00B4FF',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0, 180, 255, 0.25)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        actionBtn: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            color: '#94A3B8',
            backgroundColor: 'transparent',
            transition: 'all 0.2s ease',
        }
    };

    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title="Historial POS" />
            
            <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={styles.pageTitle}>
                        <div style={{ padding: '8px', backgroundColor: '#F0F9FF', borderRadius: '10px', color: '#00B4FF' }}>
                            <FileText size={24} />
                        </div>
                        Historial de Ventas POS
                    </h1>
                    <Link 
                        href="/admin/pos" 
                        style={styles.btnBack}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <ArrowLeft size={16} /> Volver al POS
                    </Link>
                </div>

                <div style={styles.card}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#ffffff' }}>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', maxWidth: '480px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: isSearchFocused ? '#00B4FF' : '#94A3B8', transition: 'color 0.2s ease' }} />
                                <input 
                                    type="text"
                                    style={styles.searchInput}
                                    placeholder="Buscar por código de ticket o cliente..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setIsSearchFocused(false)}
                                />
                            </div>
                            <button 
                                type="submit" 
                                style={styles.btnSearch}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#009BE0'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 180, 255, 0.3)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#00B4FF'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 180, 255, 0.25)'; }}
                            >
                                Buscar
                            </button>
                        </form>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Fecha</th>
                                    <th style={styles.th}>Código Ticket</th>
                                    <th style={styles.th}>Cajero</th>
                                    <th style={styles.th}>Cliente</th>
                                    <th style={styles.th}>Comprobante</th>
                                    <th style={styles.th}>Método de Pago</th>
                                    <th style={styles.th}>Total</th>
                                    <th style={styles.th} align="center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historial.data.length > 0 ? (
                                    historial.data.map(venta => (
                                        <tr 
                                            key={venta.id}
                                            style={{ transition: 'background-color 0.2s ease', cursor: 'default' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                                                    <Calendar size={14} style={{ color: '#94A3B8' }} />
                                                    {formatearFecha(venta.created_at)}
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.badge}>
                                                    <Hash size={12} style={{ marginRight: '4px' }} />
                                                    {venta.codigo_ticket}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '10px', fontWeight: 'bold' }}>
                                                        {venta.cajero_nombre ? venta.cajero_nombre.charAt(0).toUpperCase() : 'D'}
                                                    </div>
                                                    <span style={{ fontWeight: '500' }}>{venta.cajero_nombre || 'Desconocido'}</span>
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <User size={14} style={{ color: '#94A3B8' }} />
                                                    {venta.cliente_nombre || 'Público en General'}
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569', backgroundColor: '#F1F5F9', padding: '4px 8px', borderRadius: '4px' }}>
                                                    {venta.tipo_comprobante ? venta.tipo_comprobante.toUpperCase() : 'TICKET'}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                                                    <CreditCard size={14} style={{ color: '#94A3B8' }} />
                                                    {venta.metodo_pago || '-'}
                                                </div>
                                            </td>
                                            <td style={{ ...styles.td, fontWeight: '700', color: '#1E293B' }}>
                                                S/ {Number(venta.total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                            </td>
                                            <td style={{ ...styles.td, textAlign: 'center' }}>
                                                <a 
                                                    href={`/admin/pos/ticket/${venta.id}`} 
                                                    target="_blank" 
                                                    style={styles.actionBtn}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F9FF'; e.currentTarget.style.color = '#00B4FF'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                    title="Imprimir Ticket"
                                                >
                                                    <Receipt size={18} />
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748B' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                <Search size={32} style={{ color: '#CBD5E1' }} />
                                                <p style={{ margin: 0, fontSize: '15px', fontWeight: '500' }}>No se encontraron ventas en el historial.</p>
                                                <p style={{ margin: 0, fontSize: '14px' }}>Intenta ajustar los filtros de búsqueda.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {historial.links && historial.links.length > 3 && (
                        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '6px', justifyContent: 'flex-end', backgroundColor: '#F8FAFC' }}>
                            {historial.links.map((link, i) => (
                                <Link 
                                    key={i}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    style={{
                                        padding: '6px 12px',
                                        border: `1px solid ${link.active ? '#00B4FF' : '#E2E8F0'}`,
                                        borderRadius: '6px',
                                        textDecoration: 'none',
                                        backgroundColor: link.active ? '#00B4FF' : '#ffffff',
                                        color: link.active ? '#ffffff' : '#475569',
                                        fontSize: '13px',
                                        fontWeight: link.active ? '600' : '500',
                                        pointerEvents: link.url ? 'auto' : 'none',
                                        opacity: link.url ? 1 : 0.5,
                                        transition: 'all 0.2s ease',
                                        boxShadow: link.active ? '0 2px 4px rgba(0, 180, 255, 0.25)' : 'none'
                                    }}
                                    onMouseEnter={(e) => { 
                                        if (!link.active && link.url) {
                                            e.currentTarget.style.borderColor = '#CBD5E1';
                                            e.currentTarget.style.backgroundColor = '#F1F5F9';
                                        }
                                    }}
                                    onMouseLeave={(e) => { 
                                        if (!link.active && link.url) {
                                            e.currentTarget.style.borderColor = '#E2E8F0';
                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
