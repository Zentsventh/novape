import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Mail, MessageSquare, BarChart, Users, Target, Plus, Search } from 'lucide-react';

export default function MarketingIndex({ campaigns, stats }) {
    return (
        <AdminLayout>
            <Head title="Marketing Cloud" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target size={28} color="#f59e0b" />
                        Marketing Cloud
                    </h1>
                    <p style={{ color: 'var(--admin-text-muted)', margin: '4px 0 0 0', fontSize: '14px' }}>
                        Gestiona tus campañas, automatizaciones y segmentación RFM.
                    </p>
                </div>
                <Link 
                    href={route('admin.marketing.campaigns.create')}
                    style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textDecoration: 'none' }}
                >
                    <Plus size={18} />
                    Nueva Campaña
                </Link>
            </div>

            {/* Audiencia / RFM Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '50%' }}>
                        <Users size={28} color="#3b82f6" />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>{stats.total_audience}</div>
                        <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)' }}>Audiencia Total</div>
                    </div>
                </div>

                <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '50%' }}>
                        <Target size={28} color="#f59e0b" />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>{stats.vip_customers}</div>
                        <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)' }}>Clientes VIP (RFM)</div>
                    </div>
                </div>

                <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '50%' }}>
                        <BarChart size={28} color="#ef4444" />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>{stats.at_risk}</div>
                        <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)' }}>En Riesgo (&gt;90 días)</div>
                    </div>
                </div>
            </div>

            {/* Campaign List */}
            <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--admin-text-main)' }}>Campañas Recientes</h2>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', top: '10px', left: '10px', color: '#9ca3af' }} />
                        <input type="text" placeholder="Buscar campañas..." style={{ padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text-main)' }} />
                    </div>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--admin-bg)', color: 'var(--admin-text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Campaña</th>
                                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Estado</th>
                                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Audiencia</th>
                                <th style={{ padding: '16px 20px', fontWeight: 600 }}>Apertura</th>
                                <th style={{ padding: '16px 20px', fontWeight: 600 }}>ROI (S/)</th>
                                <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600 }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map(camp => (
                                <tr key={camp.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ background: camp.type === 'Email' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)', padding: '8px', borderRadius: '8px' }}>
                                                {camp.type === 'Email' ? <Mail size={18} color="#3b82f6" /> : <MessageSquare size={18} color="#10b981" />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: 'var(--admin-text-main)', fontSize: '14px' }}>{camp.name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>{new Date(camp.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{ 
                                            background: camp.status === 'Completado' ? '#dcfce7' : (camp.status === 'Activo' ? '#dbeafe' : '#f3f4f6'), 
                                            color: camp.status === 'Completado' ? '#166534' : (camp.status === 'Activo' ? '#1e40af' : '#374151'), 
                                            padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' 
                                        }}>
                                            {camp.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 20px', color: 'var(--admin-text-main)', fontSize: '14px' }}>{camp.audience_size}</td>
                                    <td style={{ padding: '16px 20px', color: 'var(--admin-text-main)', fontSize: '14px' }}>{camp.open_rate}%</td>
                                    <td style={{ padding: '16px 20px', fontWeight: 'bold', color: '#10b981', fontSize: '14px' }}>{camp.roi == null ? 'Sin medición' : `S/ ${camp.roi}`}</td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        <button style={{ color: '#3b82f6', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Ver Informe</button>
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
