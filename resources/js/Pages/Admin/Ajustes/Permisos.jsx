import React, { useState } from 'react';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useConfirm } from '@/Contexts/ConfirmContext';


export default function Permisos({ roles, permisos }) {
    const confirmDialog = useConfirm();

    const { flash } = usePage().props;
    const [selectedRole, setSelectedRole] = useState(roles.length > 0 ? roles[0].id : null);
    
    const activeRole = roles.find(r => r.id === selectedRole);
    
    const [rolePermisos, setRolePermisos] = useState(
        activeRole ? activeRole.permisos.map(p => p.id) : []
    );

    const [processing, setProcessing] = useState(false);
    
    // Formulario de creación de rol
    const { data: roleData, setData: setRoleData, post: postRole, processing: creatingRole, reset: resetRole, errors: roleErrors } = useForm({
        nombre: '',
        descripcion: ''
    });
    const [showNewRoleForm, setShowNewRoleForm] = useState(false);

    const submitNewRole = async (e) => {
        e.preventDefault();
        postRole('/admin/ajustes/roles', {
            preserveScroll: true,
            onSuccess: () => {
                setShowNewRoleForm(false);
                resetRole();
            }
        });
    };

    const deleteRole = async (id, nombre) => {
        if (nombre === 'admin') return;
        if (await confirmDialog(`¿Estás seguro de eliminar el rol "${nombre}"? Los usuarios que lo tengan podrían perder accesos si no se reasignan.`)) {
            router.delete(`/admin/ajustes/roles/${id}`, { 
                preserveScroll: true,
                onSuccess: () => {
                    if (selectedRole === id) {
                        setSelectedRole(roles.length > 0 ? roles[0].id : null);
                    }
                }
            });
        }
    };

    const handleRoleChange = (roleId) => {
        setSelectedRole(roleId);
        const role = roles.find(r => r.id === roleId);
        setRolePermisos(role ? role.permisos.map(p => p.id) : []);
    };

    const handlePermisoChange = (permisoId) => {
        if (activeRole?.nombre === 'admin') return; // Admin siempre tiene todos
        
        if (rolePermisos.includes(permisoId)) {
            setRolePermisos(rolePermisos.filter(id => id !== permisoId));
        } else {
            setRolePermisos([...rolePermisos, permisoId]);
        }
    };

    const submit = () => {
        setProcessing(true);
        router.post('/admin/ajustes/permisos/sync', {
            rol_id: selectedRole,
            permisos: rolePermisos
        }, {
            preserveScroll: true,
            onFinish: () => setProcessing(false)
        });
    };

    // Agrupar permisos (opcional, aquí los mostraremos en lista por ahora)
    return (
        <AdminLayout logoUrl={null}>
            <Head title="Roles y Permisos" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Roles y Permisos</h1>
            </div>

            {flash?.success && (
                <div style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500', border: '1px solid rgba(37,99,235,0.2)' }}>
                    {flash.success}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '20px' }}>
                
                {/* Lista de Roles */}
                <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', alignSelf: 'start' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--admin-border)', paddingBottom: '10px', marginBottom: '15px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Roles</h2>
                        <button 
                            onClick={() => setShowNewRoleForm(!showNewRoleForm)}
                            style={{ background: 'rgba(29,78,216,0.1)', color: '#1d4ed8', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            {showNewRoleForm ? 'Cancelar' : '+ Nuevo'}
                        </button>
                    </div>

                    {showNewRoleForm && (
                        <form onSubmit={submitNewRole} style={{ background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '8px', marginBottom: '15px', border: '1px solid var(--admin-border)' }}>
                            <input
                                type="text"
                                value={roleData.nombre}
                                onChange={e => setRoleData('nombre', e.target.value)}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--admin-border)', marginBottom: '8px', background: 'var(--admin-bg-panel)', color: 'var(--admin-text-main)', fontSize: '14px' }}
                                required
                            />
                            {roleErrors.nombre && <div style={{ color: '#3b82f6', fontSize: '11px', marginBottom: '8px' }}>{roleErrors.nombre}</div>}
                            
                            <input
                                type="text"
                                placeholder="Descripción (opcional)"
                                value={roleData.descripcion}
                                onChange={e => setRoleData('descripcion', e.target.value)}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--admin-border)', marginBottom: '10px', background: 'var(--admin-bg-panel)', color: 'var(--admin-text-main)', fontSize: '14px' }}
                            />
                            <button
                                type="submit"
                                disabled={creatingRole}
                                style={{ width: '100%', background: '#1d4ed8', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 'bold', cursor: creatingRole ? 'not-allowed' : 'pointer', fontSize: '13px' }}
                            >
                                {creatingRole ? 'Creando...' : 'Crear Rol'}
                            </button>
                        </form>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {roles.map(rol => (
                            <div
                                key={rol.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <button
                                    onClick={() => handleRoleChange(rol.id)}
                                    style={{
                                        flex: 1,
                                        textAlign: 'left',
                                        padding: '12px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--admin-border)',
                                        background: selectedRole === rol.id ? 'rgba(29,78,216,0.1)' : 'transparent',
                                        color: selectedRole === rol.id ? '#1d4ed8' : 'var(--admin-text-main)',
                                        fontWeight: selectedRole === rol.id ? 'bold' : 'normal',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        borderLeft: selectedRole === rol.id ? '4px solid #1d4ed8' : '1px solid var(--admin-border)'
                                    }}
                                >
                                    <div style={{ textTransform: 'capitalize' }}>{rol.nombre}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', fontWeight: 'normal' }}>{rol.descripcion || 'Sin descripción'}</div>
                                </button>
                                {rol.nombre !== 'admin' && (
                                    <button
                                        onClick={() => deleteRole(rol.id, rol.nombre)}
                                        style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                                        title="Eliminar Rol"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Permisos del Rol */}
                <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--admin-border)', paddingBottom: '15px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>
                            Asignar Permisos a: <span style={{ color: '#1d4ed8', textTransform: 'capitalize' }}>{activeRole?.nombre}</span>
                        </h2>
                        <button
                            onClick={submit}
                            disabled={processing || activeRole?.nombre === 'admin'}
                            style={{
                                background: activeRole?.nombre === 'admin' ? 'rgba(255,255,255,0.1)' : '#1d4ed8',
                                color: activeRole?.nombre === 'admin' ? 'var(--admin-text-muted)' : 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: activeRole?.nombre === 'admin' || processing ? 'not-allowed' : 'pointer',
                                boxShadow: activeRole?.nombre === 'admin' ? 'none' : '0 4px 10px rgba(29, 78, 216, 0.3)'
                            }}
                        >
                            {processing ? 'Guardando...' : 'Guardar Permisos'}
                        </button>
                    </div>

                    {activeRole?.nombre === 'admin' && (
                        <div style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'text-bottom' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            El rol <strong>Admin</strong> tiene acceso total al sistema de forma predeterminada y sus permisos no pueden ser modificados.
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                        {permisos.map(permiso => (
                            <label 
                                key={permiso.id} 
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'flex-start', 
                                    gap: '12px', 
                                    padding: '12px', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--admin-border)',
                                    background: rolePermisos.includes(permiso.id) ? 'rgba(138,43,226,0.05)' : 'transparent',
                                    cursor: activeRole?.nombre === 'admin' ? 'not-allowed' : 'pointer',
                                    opacity: activeRole?.nombre === 'admin' ? 0.7 : 1
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={rolePermisos.includes(permiso.id) || activeRole?.nombre === 'admin'}
                                    onChange={() => handlePermisoChange(permiso.id)}
                                    disabled={activeRole?.nombre === 'admin'}
                                    style={{ width: '18px', height: '18px', marginTop: '2px' }}
                                />
                                <div>
                                    <div style={{ color: 'var(--admin-text-main)', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>
                                        {permiso.nombre.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </div>
                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>
                                        {permiso.descripcion || `Permite ${permiso.nombre.replace(/_/g, ' ')}`}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
