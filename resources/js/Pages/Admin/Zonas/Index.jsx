import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import '../../../../css/admin/admin.css';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { Map, Plus, Trash2, CheckCircle, AlertCircle, MapPin, Navigation, DollarSign } from 'lucide-react';

export default function ZonasIndex({ zonas, logoUrl }) {
    const confirmDialog = useConfirm();

    const [showModal, setShowModal] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        nombre: '', descripcion: '', costo_envio: ''
    });

    const submit = async (e) => {
        e.preventDefault();
        post('/admin/zonas', { onSuccess: () => { setShowModal(false); reset(); } });
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('¿Estás seguro de eliminar esta zona de envío?')) {
            router.delete(`/admin/zonas/${id}`);
        }
    };

    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title="Zonas de Envío" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
                    <div style={{ padding: '8px', backgroundColor: '#F0F9FF', borderRadius: '10px', color: '#00B4FF' }}>
                        <Map size={24} />
                    </div>
                    <div>
                        Zonas de Envío y Logística
                        <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0', fontWeight: '500' }}>
                            Administra costos de entrega por área geográfica.
                        </p>
                    </div>
                </h1>
                
                <button 
                    onClick={() => setShowModal(true)} 
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#009BE0'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 180, 255, 0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#00B4FF'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 180, 255, 0.2)'; }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#00B4FF', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0, 180, 255, 0.2)', cursor: 'pointer' }}
                >
                    <Plus size={16} />
                    Nueva Zona
                </button>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zona</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descripción</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Costo Envío</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {zonas.map(z => (
                            <tr 
                                key={z.id} 
                                style={{ borderBottom: '1px solid #E2E8F0', transition: 'background 0.2s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                <td style={{ padding: '16px 24px', fontWeight: '700', color: '#1E293B', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MapPin size={16} style={{ color: '#00B4FF' }} /> {z.nombre}
                                </td>
                                <td style={{ padding: '16px 24px', color: '#64748B', fontSize: '13px' }}>{z.descripcion || <span style={{ fontStyle: 'italic', color: '#94A3B8' }}>Sin descripción</span>}</td>
                                <td style={{ padding: '16px 24px', fontWeight: '700', color: '#00B4FF', fontSize: '14px' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F0F9FF', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(0, 180, 255, 0.2)' }}>
                                        S/ {Number(z.costo_envio).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                    {z.activo 
                                        ? <span style={{ background: '#ECFDF5', color: '#10B981', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Activa</span>
                                        : <span style={{ background: '#F1F5F9', color: '#64748B', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> Inactiva</span>
                                    }
                                </td>
                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button 
                                            onClick={() => handleDelete(z.id)} 
                                            title="Eliminar Zona" 
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#EF4444'; }}
                                            style={{ color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {zonas.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                                    <MapPin size={32} style={{ opacity: 0.3, margin: '0 auto 12px auto' }} />
                                    No hay zonas de envío registradas.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Nueva Zona */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
                        <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '800', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Navigation size={20} style={{ color: '#00B4FF' }} />
                            Nueva Zona de Envío
                        </h2>
                        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#64748B' }}>Nombre de la Zona</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                    <input 
                                        type="text" 
                                        value={data.nombre} 
                                        onChange={e => setData('nombre', e.target.value)} 
                                        placeholder="Ej: Lima Metropolitana"
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#1E293B', outline: 'none', transition: 'all 0.2s', fontSize: '14px', fontFamily: 'inherit' }}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = '#00B4FF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 180, 255, 0.1)'; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                                        required 
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#64748B' }}>Descripción / Cobertura</label>
                                <textarea 
                                    value={data.descripcion} 
                                    onChange={e => setData('descripcion', e.target.value)} 
                                    placeholder="Distritos o provincias que cubre..."
                                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#1E293B', outline: 'none', transition: 'all 0.2s', fontSize: '14px', fontFamily: 'inherit', minHeight: '80px', resize: 'vertical' }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#00B4FF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 180, 255, 0.1)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#64748B' }}>Costo de Envío (S/)</label>
                                <div style={{ position: 'relative' }}>
                                    <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#059669' }} />
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={data.costo_envio} 
                                        onChange={e => setData('costo_envio', e.target.value)} 
                                        placeholder="0.00"
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#1E293B', outline: 'none', transition: 'all 0.2s', fontSize: '14px', fontFamily: 'inherit', fontWeight: '600' }}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = '#00B4FF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 180, 255, 0.1)'; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                                        required 
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)} 
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#F1F5F9', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={processing} 
                                    onMouseEnter={(e) => { if(!processing) e.currentTarget.style.backgroundColor = '#009BE0'; }}
                                    onMouseLeave={(e) => { if(!processing) e.currentTarget.style.backgroundColor = '#00B4FF'; }}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#00B4FF', color: 'white', fontWeight: '600', cursor: processing ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: processing ? 0.7 : 1, transition: 'all 0.2s' }}
                                >
                                    {processing ? 'Guardando...' : 'Crear Zona'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
