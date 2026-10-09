import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { ArrowLeft, User, FileText, CheckCircle, Save } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

export default function Show({ reclamo }) {
    const { flash } = usePage().props;
    const { data, setData, put, processing } = useForm({
        estado: reclamo.estado || 'Pendiente',
        respuesta_admin: reclamo.respuesta_admin || ''
    });

    const submit = (e) => {
        e.preventDefault();
        put(`/admin/reclamos/${reclamo.id}`);
    };

    const SectionHeader = ({ icon: Icon, title }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ background: '#F1F5F9', padding: '6px', borderRadius: '8px' }}>
                <Icon size={18} color="#004797" />
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>{title}</h3>
        </div>
    );

    const DataRow = ({ label, value, isCol = false }) => (
        <div style={{ marginBottom: '16px', display: isCol ? 'block' : 'grid', gridTemplateColumns: isCol ? '1fr' : '150px 1fr', gap: '12px', alignItems: isCol ? 'flex-start' : 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: isCol ? '6px' : '0' }}>{label}</span>
            <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '500', background: isCol ? '#F8FAFC' : 'transparent', padding: isCol ? '12px' : '0', borderRadius: isCol ? '8px' : '0', border: isCol ? '1px solid #E2E8F0' : 'none', minHeight: isCol ? '80px' : 'auto' }}>
                {value || '-'}
            </span>
        </div>
    );

    return (
        <AdminLayout>
            <Head title={`Reclamo ${reclamo.codigo}`} />

            <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '24px' }}>
                    <Link href="/admin/reclamos" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748B', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                        <ArrowLeft size={16} /> Volver al listado
                    </Link>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em' }}>
                            {reclamo.tipo_reclamo} <span style={{ color: '#004797' }}>{reclamo.codigo}</span>
                        </h1>
                        <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
                            Registrado el {dayjs(reclamo.created_at).locale('es').format('DD [de] MMMM, YYYY [a las] HH:mm')}
                        </p>
                    </div>
                    <div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '30px', fontSize: '14px', fontWeight: '600', background: reclamo.estado === 'Resuelto' ? '#DCFCE7' : reclamo.estado === 'En Proceso' ? '#FEF9C3' : '#FEE2E2', color: reclamo.estado === 'Resuelto' ? '#166534' : reclamo.estado === 'En Proceso' ? '#854D0E' : '#991B1B' }}>
                            {reclamo.estado}
                        </span>
                    </div>
                </div>

                {flash?.success && (
                    <div style={{ background: '#F0FDF4', color: '#166534', padding: '16px 20px', borderRadius: '12px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', border: '1px solid #BBF7D0' }}>
                        <CheckCircle size={20} /> {flash.success}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Datos del Cliente */}
                        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <SectionHeader icon={User} title="1. Identificación del Consumidor" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'x-24px' }}>
                                <div>
                                    <DataRow label="Nombres" value={reclamo.nombres} />
                                    <DataRow label="Apellidos" value={reclamo.apellidos} />
                                    <DataRow label="Documento" value={`${reclamo.tipo_documento}: ${reclamo.numero_documento}`} />
                                    <DataRow label="Menor de Edad" value={reclamo.menor_edad ? 'Sí' : 'No'} />
                                    {reclamo.menor_edad && <DataRow label="Apoderado" value={reclamo.nombre_apoderado} />}
                                </div>
                                <div>
                                    <DataRow label="Teléfono" value={reclamo.telefono} />
                                    <DataRow label="Correo Electrónico" value={reclamo.email} />
                                    <DataRow label="Dirección" value={reclamo.direccion} />
                                </div>
                            </div>
                        </div>

                        {/* Detalle del Reclamo */}
                        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <SectionHeader icon={FileText} title="2. Detalle del Bien y Reclamo" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                <DataRow label="Bien Contratado" value={reclamo.bien_contratado} />
                                <DataRow label="Monto Reclamado" value={`S/ ${reclamo.monto_reclamado}`} />
                                <DataRow label="Pedido Relacionado" value={reclamo.pedido_relacionado} />
                            </div>
                            
                            <DataRow label="Detalle de lo sucedido" value={reclamo.detalle} isCol={true} />
                            <DataRow label="Pedido del consumidor" value={reclamo.pedido_consumidor} isCol={true} />
                        </div>
                    </div>

                    {/* Acciones de Gestión */}
                    <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'sticky', top: '24px' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>Gestión Administrativa</h3>
                        
                        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Estado de la solicitud</label>
                                <select 
                                    value={data.estado} 
                                    onChange={e => setData('estado', e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', color: '#1E293B', background: '#F8FAFC' }}
                                >
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="En Proceso">En Proceso</option>
                                    <option value="Resuelto">Resuelto</option>
                                    <option value="Cerrado">Cerrado</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Respuesta de la empresa (Resolución)</label>
                                <textarea 
                                    value={data.respuesta_admin} 
                                    onChange={e => setData('respuesta_admin', e.target.value)}
                                    rows="6"
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', color: '#1E293B', resize: 'vertical' }}
                                    placeholder="Detalle la resolución ofrecida al cliente..."
                                />
                                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '6px', lineHeight: '1.4' }}>Recuerde que el plazo legal para responder es de 15 días hábiles. Esta respuesta debe comunicarse también formalmente al cliente.</p>
                            </div>

                            <button 
                                type="submit" 
                                disabled={processing}
                                style={{ width: '100%', padding: '12px', background: '#004797', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}
                            >
                                <Save size={16} /> {processing ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
