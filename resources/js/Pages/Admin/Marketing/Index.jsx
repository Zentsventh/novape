import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Mail, MessageSquare, BarChart, Users, Target, Plus, Search, ChevronRight } from 'lucide-react';

export default function MarketingIndex({ campaigns, stats }) {
    return (
        <AdminLayout>
            <Head title="Marketing Cloud" />
            
            <style>{`
                .premium-card {
                    background: #ffffff;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    padding: 24px;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
                }
                .premium-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px -8px rgba(0, 71, 151, 0.12);
                    border-color: #CBD5E1;
                }
                .primary-btn {
                    background: #004797;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0, 71, 151, 0.2);
                }
                .primary-btn:hover {
                    background: #003675;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0, 71, 151, 0.3);
                }
                .search-input {
                    padding: 10px 14px 10px 40px;
                    border-radius: 8px;
                    border: 1px solid #E2E8F0;
                    background: #F8FAFC;
                    color: #1E293B;
                    transition: all 0.2s ease;
                    width: 250px;
                    font-size: 14px;
                }
                .search-input:focus {
                    outline: none;
                    border-color: #004797;
                    background: #ffffff;
                    box-shadow: 0 0 0 3px rgba(0, 71, 151, 0.1);
                }
                .table-row {
                    transition: all 0.2s ease;
                    border-bottom: 1px solid #F1F5F9;
                }
                .table-row:hover {
                    background: #F8FAFC;
                }
                .action-link {
                    color: #004797;
                    font-weight: 600;
                    font-size: 13px;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    transition: all 0.2s ease;
                }
                .action-link:hover {
                    color: #003675;
                }
                .action-link:hover svg {
                    transform: translateX(3px);
                }
                .icon-container {
                    padding: 12px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
                        <div style={{ background: 'rgba(0, 71, 151, 0.08)', padding: '8px', borderRadius: '10px' }}>
                            <Target size={24} color="#004797" />
                        </div>
                        Marketing Cloud
                    </h1>
                    <p style={{ color: '#64748B', margin: '8px 0 0 0', fontSize: '15px', fontWeight: '400' }}>
                        Diseña, automatiza y analiza tus campañas de marketing para segmentos RFM.
                    </p>
                </div>
                <Link href={route('admin.marketing.campaigns.create')} className="primary-btn">
                    <Plus size={18} strokeWidth={2.5} />
                    Nueva Campaña
                </Link>
            </div>

            {/* Resumen Estratégico (Tarjetas) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div className="premium-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="icon-container" style={{ background: 'rgba(0, 71, 151, 0.08)' }}>
                            <Users size={24} color="#004797" />
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audiencia Total</div>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>{stats.total_audience}</div>
                        </div>
                    </div>
                </div>

                <div className="premium-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="icon-container" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                            <Target size={24} color="#10B981" />
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clientes VIP (RFM)</div>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>{stats.vip_customers}</div>
                        </div>
                    </div>
                </div>

                <div className="premium-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="icon-container" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                            <BarChart size={24} color="#EF4444" />
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>En Riesgo (&gt;90 días)</div>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>{stats.at_risk}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Listado de Campañas */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#1E293B' }}>Campañas Recientes</h2>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input type="text" placeholder="Buscar campañas..." className="search-input" />
                    </div>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC' }}>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: '#64748B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaña</th>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: '#64748B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: '#64748B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audiencia</th>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: '#64748B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Apertura</th>
                                <th style={{ padding: '16px 24px', fontWeight: 600, color: '#64748B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Retorno (ROI)</th>
                                <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                                        No hay campañas registradas aún.
                                    </td>
                                </tr>
                            ) : campaigns.map(camp => (
                                <tr key={camp.id} className="table-row">
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ 
                                                background: camp.type === 'Email' ? 'rgba(0, 71, 151, 0.08)' : 'rgba(16, 185, 129, 0.08)', 
                                                padding: '10px', 
                                                borderRadius: '8px',
                                                border: `1px solid ${camp.type === 'Email' ? 'rgba(0, 71, 151, 0.1)' : 'rgba(16, 185, 129, 0.1)'}` 
                                            }}>
                                                {camp.type === 'Email' ? <Mail size={16} color="#004797" /> : <MessageSquare size={16} color="#10B981" />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '14px' }}>{camp.name}</div>
                                                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{new Date(camp.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{ 
                                            background: camp.status === 'Completado' ? '#ECFDF5' : (camp.status === 'Activo' ? '#EFF6FF' : '#F1F5F9'), 
                                            color: camp.status === 'Completado' ? '#059669' : (camp.status === 'Activo' ? '#1D4ED8' : '#475569'), 
                                            padding: '4px 10px', 
                                            borderRadius: '20px', 
                                            fontSize: '12px', 
                                            fontWeight: '700',
                                            border: `1px solid ${camp.status === 'Completado' ? '#A7F3D0' : (camp.status === 'Activo' ? '#BFDBFE' : '#E2E8F0')}`
                                        }}>
                                            {camp.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', color: '#1E293B', fontSize: '14px', fontWeight: '500' }}>
                                        {camp.audience_size?.toLocaleString() || 0}
                                    </td>
                                    <td style={{ padding: '16px 24px', color: '#1E293B', fontSize: '14px', fontWeight: '500' }}>
                                        {camp.open_rate}%
                                    </td>
                                    <td style={{ padding: '16px 24px', fontWeight: '700', color: camp.roi == null ? '#94A3B8' : '#059669', fontSize: '14px' }}>
                                        {camp.roi == null ? 'Sin medición' : `S/ ${camp.roi}`}
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <Link href={route('admin.marketing.campaigns.report', camp.id)} className="action-link">
                                            Ver Informe
                                            <ChevronRight size={14} style={{ transition: 'transform 0.2s ease' }} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
