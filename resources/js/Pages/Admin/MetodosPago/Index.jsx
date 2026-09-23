import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import '../../../../css/admin/admin.css';
import { useConfirm } from '@/Contexts/ConfirmContext';


export default function MetodosPagoIndex({ metodos, logoUrl }) {
    const confirmDialog = useConfirm();

    const [showModal, setShowModal] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        nombre: '', detalles: '', tipo: 'digital', comision_porcentaje: '0'
    });

    const submit = async (e) => {
        e.preventDefault();
        post('/admin/metodos-pago', { onSuccess: () => { setShowModal(false); reset(); } });
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('¿Eliminar este método de pago?')) router.delete(`/admin/metodos-pago/${id}`);
    };

    const tipoLabel = (t) => {
        switch(t) {
            case 'digital': return { label: 'Digital', color: '#3b82f6' };
            case 'fisico': return { label: 'Físico', color: '#2563eb' };
            case 'transferencia': return { label: 'Transferencia', color: '#1d4ed8' };
            default: return { label: t, color: '#6b7280' };
        }
    };

    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title="Métodos de Pago" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', margin: 0, fontWeight: '700', color: 'var(--admin-text-main)' }}>Métodos de Pago</h1>
                    <p style={{ color: 'var(--admin-text-secondary)', margin: '5px 0 0 0' }}>Configura pasarelas y formas de cobro aceptadas.</p>
                </div>
                <button onClick={() => setShowModal(true)} style={{ background: 'var(--admin-primary)', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+ Nuevo Método</button>
            </div>

            <div style={{ background: 'var(--admin-card-bg)', borderRadius: '12px', overflowX: 'auto', boxShadow: 'var(--admin-shadow-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--admin-bg)', borderBottom: '1px solid var(--admin-border)' }}>
                        <tr>
                            <th style={{ padding: '15px 20px', color: 'var(--admin-text-secondary)', fontWeight: '600', fontSize: '13px' }}>MÉTODO</th>
                            <th style={{ padding: '15px 20px', color: 'var(--admin-text-secondary)', fontWeight: '600', fontSize: '13px' }}>TIPO</th>
                            <th style={{ padding: '15px 20px', color: 'var(--admin-text-secondary)', fontWeight: '600', fontSize: '13px' }}>COMISIÓN</th>
                            <th style={{ padding: '15px 20px', color: 'var(--admin-text-secondary)', fontWeight: '600', fontSize: '13px' }}>DETALLES</th>
                            <th style={{ padding: '15px 20px', color: 'var(--admin-text-secondary)', fontWeight: '600', fontSize: '13px' }}>ESTADO</th>
                            <th style={{ padding: '15px 20px', color: 'var(--admin-text-secondary)', fontWeight: '600', fontSize: '13px' }}>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {metodos.map(m => {
                            const tipo = tipoLabel(m.tipo);
                            return (
                                <tr key={m.id} style={{ borderBottom: '1px solid var(--admin-border-light)' }}>
                                    <td style={{ padding: '15px 20px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>{m.nombre}</td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <span style={{ background: `${tipo.color}15`, color: tipo.color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{tipo.label}</span>
                                    </td>
                                    <td style={{ padding: '15px 20px', color: 'var(--admin-text-main)' }}>{Number(m.comision_porcentaje).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%</td>
                                    <td style={{ padding: '15px 20px', color: 'var(--admin-text-secondary)', fontSize: '13px' }}>{m.detalles || '—'}</td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <span style={{ background: m.activo ? 'rgba(37,99,235,0.1)' : 'rgba(59,130,246,0.1)', color: m.activo ? '#2563eb' : '#3b82f6', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                                            {m.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <button onClick={() => handleDelete(m.id)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Eliminar</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '420px' }}>
                        <h2 style={{ margin: '0 0 20px 0' }}>Nuevo Método de Pago</h2>
                        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre</label>
                                <input type="text" value={data.nombre} onChange={e => setData('nombre', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} required placeholder="Ej: Niubiz" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tipo</label>
                                <select value={data.tipo} onChange={e => setData('tipo', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                                    <option value="digital">Digital (Yape, Plin, Pasarela)</option>
                                    <option value="fisico">Físico (Efectivo, POS)</option>
                                    <option value="transferencia">Transferencia Bancaria</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Comisión (%)</label>
                                <input type="number" step="0.01" value={data.comision_porcentaje} onChange={e => setData('comision_porcentaje', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Detalles / Notas</label>
                                <textarea value={data.detalles} onChange={e => setData('detalles', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '60px' }} placeholder="Información adicional..." />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: 'transparent', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" disabled={processing} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: 'var(--admin-primary)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
