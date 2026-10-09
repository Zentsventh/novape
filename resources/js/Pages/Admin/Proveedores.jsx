import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { useConfirm } from '@/Contexts/ConfirmContext';


export default function Proveedores({ proveedores }) {
    const confirmDialog = useConfirm();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        nombre: '',
        ruc: '',
        contacto: '',
        telefono: '',
        email: ''
    });

    const openModal = (proveedor = null) => {
        if (proveedor) {
            setEditingId(proveedor.id);
            setData({
                nombre: proveedor.nombre,
                ruc: proveedor.ruc || '',
                contacto: proveedor.contacto || '',
                telefono: proveedor.telefono || '',
                email: proveedor.email || ''
            });
        } else {
            setEditingId(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingId) {
            put(`/admin/proveedores/${editingId}`, { onSuccess: () => closeModal() });
        } else {
            post('/admin/proveedores', { onSuccess: () => closeModal() });
        }
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('¿Estás seguro de eliminar este proveedor?')) {
            destroy(`/admin/proveedores/${id}`);
        }
    };

    return (
        <AdminLayout>
            <Head title="Proveedores" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Proveedores</h1>
                <button 
                    onClick={() => openModal()} 
                    style={{ background: '#1d4ed8', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(29, 78, 216, 0.3)' }}
                >
                    + Nuevo Proveedor
                </button>
            </div>

            <div className="admin-card">
                <div className="admin-card-body p-0">
                    <div className="overflow-x-auto">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>RUC</th>
                                    <th>Contacto</th>
                                    <th>Teléfono / Email</th>
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proveedores.length === 0 ? (
                                    <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>No hay proveedores registrados</td></tr>
                                ) : (
                                    proveedores.map(prov => (
                                        <tr key={prov.id}>
                                            <td>{prov.id}</td>
                                            <td style={{ fontWeight: 'bold', color: 'var(--admin-text-main)' }}>{prov.nombre}</td>
                                            <td>{prov.ruc || '-'}</td>
                                            <td>{prov.contacto || '-'}</td>
                                            <td>
                                                <div>{prov.telefono || '-'}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{prov.email || ''}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button onClick={() => openModal(prov)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 'bold', marginRight: '15px', cursor: 'pointer' }}>Editar</button>
                                                <button onClick={() => handleDelete(prov.id)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer' }}>Eliminar</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'var(--admin-bg-panel, #ffffff)', width: '100%', maxWidth: '500px', margin: '20px', padding: '30px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--admin-text-main)', marginBottom: '20px' }}>{editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Nombre *</label>
                                <input type="text" value={data.nombre} onChange={e => setData('nombre', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg-panel)', color: 'var(--admin-text-main)' }} required />
                                {errors.nombre && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.nombre}</div>}
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>RUC</label>
                                <input type="text" value={data.ruc} onChange={e => setData('ruc', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg-panel)', color: 'var(--admin-text-main)' }} />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Contacto</label>
                                <input type="text" value={data.contacto} onChange={e => setData('contacto', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg-panel)', color: 'var(--admin-text-main)' }} />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Teléfono</label>
                                <input type="text" value={data.telefono} onChange={e => setData('telefono', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg-panel)', color: 'var(--admin-text-main)' }} />
                            </div>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Email</label>
                                <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg-panel)', color: 'var(--admin-text-main)' }} />
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={closeModal} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--admin-border)', borderRadius: '8px', color: 'var(--admin-text-main)', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" disabled={processing} style={{ padding: '10px 20px', background: '#1d4ed8', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.7 : 1 }}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
