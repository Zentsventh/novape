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

    // Estilos SaaS que ajustan el contenido al 100% de la pantalla sin scroll
    const styles = {
        pageTitle: {
            fontSize: '24px',
            fontWeight: '800',
            color: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            letterSpacing: '-0.02em',
        },
        card: {
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 10px -5px rgba(0, 0, 0, 0.02)',
            border: '1px solid #F1F5F9',
            marginTop: '24px',
            width: '100%',
            boxSizing: 'border-box',
        },
        tableWrapper: {
            width: '100%',
            overflow: 'hidden',
            boxSizing: 'border-box',
        },
        table: {
            width: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'collapse',
            boxSizing: 'border-box',
        },
        thBase: {
            padding: '12px 8px',
            fontSize: '11px',
            fontWeight: '700',
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '2px solid #F1F5F9',
            backgroundColor: '#FAFAFA',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
        tdBase: {
            padding: '12px 8px',
            fontSize: '13px',
            color: '#334155',
            borderBottom: '1px solid #F1F5F9',
            verticalAlign: 'middle',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
        badge: {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            backgroundColor: '#F0F9FF',
            color: '#004797',
            border: '1px solid #BAE6FD',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            boxSizing: 'border-box',
        },
        comprobanteBadge: {
            fontSize: '11px',
            fontWeight: '700',
            color: '#475569',
            backgroundColor: '#F1F5F9',
            padding: '4px 8px',
            borderRadius: '6px',
            letterSpacing: '0.05em',
            display: 'inline-block',
        },
        btnBack: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#ffffff',
            color: '#475569',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            textDecoration: 'none',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
        },
        searchInput: {
            width: '100%',
            padding: '10px 14px 10px 40px',
            borderRadius: '8px',
            border: `1px solid ${isSearchFocused ? '#004797' : '#E2E8F0'}`,
            fontSize: '13px',
            color: '#1E293B',
            outline: 'none',
            boxShadow: isSearchFocused ? '0 0 0 3px rgba(0, 71, 151, 0.1)' : '0 1px 2px rgba(0,0,0,0.02)',
            transition: 'all 0.2s ease',
            backgroundColor: isSearchFocused ? '#ffffff' : '#FAFAFA',
            boxSizing: 'border-box',
        },
        btnSearch: {
            padding: '0 20px',
            backgroundColor: '#004797',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 71, 151, 0.2)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        actionBtn: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            color: '#64748B',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            boxSizing: 'border-box',
        }
    };

    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title="Historial POS" />
            
            <div style={{ padding: '24px', width: '100%', margin: '0', boxSizing: 'border-box', maxWidth: '100vw', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={styles.pageTitle}>
                        <div style={{ 
                            padding: '10px', 
                            backgroundColor: '#F0F9FF', 
                            borderRadius: '10px', 
                            color: '#004797',
                            boxShadow: '0 4px 12px rgba(0, 71, 151, 0.1)'
                        }}>
                            <FileText size={22} strokeWidth={2.5} />
                        </div>
                        Historial de Ventas FIX
                    </h1>
                    <Link 
                        href="/admin/pos" 
                        style={styles.btnBack}
                        onMouseEnter={(e) => { 
                            e.currentTarget.style.backgroundColor = '#F8FAFC'; 
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                        }}
                        onMouseLeave={(e) => { 
                            e.currentTarget.style.backgroundColor = '#ffffff'; 
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                        }}
                    >
                        <ArrowLeft size={16} strokeWidth={2.5} /> Volver FIX
                    </Link>
                </div>

                {/* Main Card */}
                <div style={styles.card}>
                    {/* Search Bar */}
                    <div style={{ padding: '20px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', maxWidth: '500px' }}>
                            <div style={{ position: 'relative', flex: 1, boxSizing: 'border-box' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: isSearchFocused ? '#004797' : '#94A3B8', transition: 'color 0.2s ease' }} />
                                <input 
                                    type="text"
                                    style={styles.searchInput}
                                    placeholder="Buscar cÃ³digo de ticket o cliente..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setIsSearchFocused(false)}
                                />
                            </div>
                            <button 
                                type="submit" 
                                style={styles.btnSearch}
                                onMouseEnter={(e) => { 
                                    e.currentTarget.style.backgroundColor = '#003A80'; 
                                    e.currentTarget.style.transform = 'translateY(-2px)'; 
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 71, 151, 0.3)'; 
                                }}
                                onMouseLeave={(e) => { 
                                    e.currentTarget.style.backgroundColor = '#004797'; 
                                    e.currentTarget.style.transform = 'translateY(0)'; 
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 71, 151, 0.2)'; 
                                }}
                            >
                                Buscar
                            </button>
                        </form>
                    </div>

                    {/* Table */}
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{...styles.thBase, width: '13%', textAlign: 'left'}}>Fecha</th>
                                    <th style={{...styles.thBase, width: '13%', textAlign: 'left'}}>Ticket</th>
                                    <th style={{...styles.thBase, width: '15%', textAlign: 'left'}}>Cajero</th>
                                    <th style={{...styles.thBase, width: '22%', textAlign: 'left'}}>Cliente</th>
                                    <th style={{...styles.thBase, width: '10%', textAlign: 'center'}}>Tipo</th>
                                    <th style={{...styles.thBase, width: '10%', textAlign: 'left'}}>Pago</th>
                                    <th style={{...styles.thBase, width: '10%', textAlign: 'right'}}>Total</th>
                                    <th style={{...styles.thBase, width: '7%', textAlign: 'center'}}>Ver</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historial.data.length > 0 ? (
                                    historial.data.map((venta, index) => (
                                        <tr 
                                            key={venta.id}
                                            style={{ 
                                                transition: 'all 0.2s ease', 
                                                cursor: 'default',
                                                backgroundColor: index % 2 === 0 ? '#ffffff' : '#FAFAFA'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#F0F9FF';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#FAFAFA';
                                            }}
                                        >
                                            <td style={{...styles.tdBase, textAlign: 'left'}} title={formatearFecha(venta.created_at)}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    <Calendar size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatearFecha(venta.created_at)}</span>
                                                </div>
                                            </td>
                                            <td style={{...styles.tdBase, textAlign: 'left'}} title={venta.codigo_ticket}>
                                                <span style={styles.badge}>
                                                    <Hash size={12} style={{ marginRight: '4px', flexShrink: 0 }} />
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{venta.codigo_ticket}</span>
                                                </span>
                                            </td>
                                            <td style={{...styles.tdBase, textAlign: 'left'}} title={venta.cajero_nombre || 'Desconocido'}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>
                                                        {venta.cajero_nombre ? venta.cajero_nombre.charAt(0).toUpperCase() : 'D'}
                                                    </div>
                                                    <span style={{ fontWeight: '600', color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {venta.cajero_nombre || 'Desconocido'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{...styles.tdBase, textAlign: 'left'}} title={venta.cliente_nombre || 'PÃºblico en General'}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                                    <User size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {venta.cliente_nombre || 'PÃºblico en General'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{...styles.tdBase, textAlign: 'center'}}>
                                                <span style={styles.comprobanteBadge} title={venta.tipo_comprobante ? venta.tipo_comprobante.toUpperCase() : 'TICKET'}>
                                                    {venta.tipo_comprobante ? venta.tipo_comprobante.toUpperCase() : 'TKT'}
                                                </span>
                                            </td>
                                            <td style={{...styles.tdBase, textAlign: 'left'}} title={venta.metodo_pago || '-'}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: '500', overflow: 'hidden' }}>
                                                    <CreditCard size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{venta.metodo_pago || '-'}</span>
                                                </div>
                                            </td>
                                            <td style={{ ...styles.tdBase, textAlign: 'right', fontWeight: '800', color: '#0F172A', fontSize: '14px' }} title={`S/ ${Number(venta.total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}>
                                                S/ {Number(venta.total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                            </td>
                                            <td style={{...styles.tdBase, textAlign: 'center'}}>
                                                <a 
                                                    href={`/admin/pos/ticket/${venta.id}`} 
                                                    target="_blank" 
                                                    style={styles.actionBtn}
                                                    onMouseEnter={(e) => { 
                                                        e.currentTarget.style.backgroundColor = '#004797'; 
                                                        e.currentTarget.style.color = '#ffffff'; 
                                                        e.currentTarget.style.borderColor = '#004797';
                                                    }}
                                                    onMouseLeave={(e) => { 
                                                        e.currentTarget.style.backgroundColor = '#F8FAFC'; 
                                                        e.currentTarget.style.color = '#64748B'; 
                                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                                    }}
                                                    title="Imprimir Ticket"
                                                >
                                                    <Receipt size={14} />
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748B' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '50%' }}>
                                                    <Search size={32} style={{ color: '#CBD5E1' }} />
                                                </div>
                                                <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1E293B' }}>No se encontraron ventas</p>
                                                <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Intenta ajustar los filtros de bÃºsqueda.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {historial.links && historial.links.length > 3 && (
                        <div style={{ padding: '16px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '8px', justifyContent: 'flex-end', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
                            {historial.links.map((link, i) => (
                                <Link 
                                    key={i}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    style={{
                                        padding: '6px 12px',
                                        border: `1px solid ${link.active ? '#004797' : '#E2E8F0'}`,
                                        borderRadius: '6px',
                                        textDecoration: 'none',
                                        backgroundColor: link.active ? '#004797' : '#ffffff',
                                        color: link.active ? '#ffffff' : '#475569',
                                        fontSize: '13px',
                                        fontWeight: link.active ? '600' : '500',
                                        pointerEvents: link.url ? 'auto' : 'none',
                                        opacity: link.url ? 1 : 0.4,
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => { 
                                        if (!link.active && link.url) {
                                            e.currentTarget.style.borderColor = '#CBD5E1';
                                            e.currentTarget.style.backgroundColor = '#F8FAFC';
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
