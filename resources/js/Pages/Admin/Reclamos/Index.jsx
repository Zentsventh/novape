import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { BookOpen, Search, Eye, Filter } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

export default function Index({ reclamos, filters }) {
    return (
        <AdminLayout>
            <Head title="Libro de Reclamaciones" />

            <div style={{ padding: '24px 32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 8px', fontSize: '24px', fontWeight: '700', color: '#0F172A', letterSpacing: '-0.02em' }}>
                            <BookOpen size={28} color="#004797" /> 
                            Libro de Reclamaciones
                        </h1>
                        <p style={{ color: '#64748B', fontSize: '15px', margin: 0 }}>
                            Gestión de quejas y reclamos oficiales presentados por clientes.
                        </p>
                    </div>
                </div>

                <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    
                    {/* Filtros */}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <form style={{ display: 'flex', gap: '12px', flex: 1 }}>
                            <div style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
                                <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                                <input 
                                    type="text" 
                                    name="search"
                                    defaultValue={filters.search}
                                    placeholder="Buscar por código, nombre o DNI..." 
                                    style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px' }}
                                />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Filter size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                                <select name="estado" defaultValue={filters.estado || ''} style={{ padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', appearance: 'none', minWidth: '150px' }}>
                                    <option value="">Todos los estados</option>
                                    <option value="Pendiente">Pendientes</option>
                                    <option value="En Proceso">En Proceso</option>
                                    <option value="Resuelto">Resueltos</option>
                                </select>
                            </div>
                            <button type="submit" style={{ padding: '8px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', fontWeight: '500', color: '#475569', cursor: 'pointer' }}>Filtrar</button>
                        </form>
                    </div>

                    {/* Tabla */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '12px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Código</th>
                                    <th style={{ padding: '12px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Fecha</th>
                                    <th style={{ padding: '12px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Cliente</th>
                                    <th style={{ padding: '12px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Tipo</th>
                                    <th style={{ padding: '12px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase' }}>Estado</th>
                                    <th style={{ padding: '12px 20px', fontSize: '13px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reclamos.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>No se encontraron reclamos.</td>
                                    </tr>
                                ) : reclamos.data.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>{item.codigo}</td>
                                        <td style={{ padding: '16px 20px', fontSize: '14px', color: '#475569' }}>{dayjs(item.created_at).locale('es').format('DD MMM YYYY')}</td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>{item.nombres} {item.apellidos}</div>
                                            <div style={{ fontSize: '13px', color: '#64748B' }}>{item.tipo_documento}: {item.numero_documento}</div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: item.tipo_reclamo === 'Reclamo' ? '#FEE2E2' : '#FEF3C7', color: item.tipo_reclamo === 'Reclamo' ? '#991B1B' : '#92400E' }}>
                                                {item.tipo_reclamo}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: item.estado === 'Resuelto' ? '#16A34A' : item.estado === 'En Proceso' ? '#CA8A04' : '#DC2626' }}>
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.estado === 'Resuelto' ? '#16A34A' : item.estado === 'En Proceso' ? '#CA8A04' : '#DC2626' }}></span>
                                                {item.estado}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                            <Link href={`/admin/reclamos/${item.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#F1F5F9', color: '#0F172A', borderRadius: '6px', fontSize: '13px', fontWeight: '500', textDecoration: 'none', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#E2E8F0'} onMouseOut={e => e.currentTarget.style.background = '#F1F5F9'}>
                                                <Eye size={14} /> Ver Detalle
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
