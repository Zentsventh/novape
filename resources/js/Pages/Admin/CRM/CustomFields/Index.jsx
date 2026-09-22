import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../../../Layouts/AdminLayout';
import { Plus, Trash2 } from 'lucide-react';

export default function Index({ fields, logoUrl }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        model_type: 'deal',
        name: '',
        label: '',
        type: 'text',
        options: '', // comma separated initially
        required: false
    });

    const [isAdding, setIsAdding] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Convert comma-separated options to array if type is select
        let formattedData = { ...data };
        if (data.type === 'select' && data.options) {
            formattedData.options = data.options.split(',').map(o => o.trim()).filter(o => o);
        } else {
            formattedData.options = null;
        }

        router.post('/admin/crm/custom-fields', formattedData, {
            onSuccess: () => {
                reset();
                setIsAdding(false);
            }
        });
    };

    const handleDelete = (id) => {
        if (confirm('¿Estás seguro de eliminar este campo? Se perderán los datos asociados a este campo en los registros.')) {
            router.delete(`/admin/crm/custom-fields/${id}`);
        }
    };

    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title="Campos Personalizados CRM" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Campos Personalizados</h1>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '14px', marginTop: '4px' }}>
                        Define campos adicionales para las Oportunidades (Deals) y Clientes (Usuarios).
                    </p>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
                >
                    <Plus size={18} />
                    Nuevo Campo
                </button>
            </div>

            {isAdding && (
                <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--admin-border)', marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>Agregar Nuevo Campo</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Entidad</label>
                            <select value={data.model_type} onChange={e => setData('model_type', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>
                                <option value="deal">Oportunidad (Deal)</option>
                                <option value="user">Cliente (Usuario)</option>
                            </select>
                            {errors.model_type && <span style={{ color: 'red', fontSize: '12px' }}>{errors.model_type}</span>}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Identificador (sin espacios, ej: industria)</label>
                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }} placeholder="Ej: tamaño_empresa" />
                            {errors.name && <span style={{ color: 'red', fontSize: '12px' }}>{errors.name}</span>}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Etiqueta (UI)</label>
                            <input type="text" value={data.label} onChange={e => setData('label', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }} placeholder="Ej: Tamaño de Empresa" />
                            {errors.label && <span style={{ color: 'red', fontSize: '12px' }}>{errors.label}</span>}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Tipo de Dato</label>
                            <select value={data.type} onChange={e => setData('type', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>
                                <option value="text">Texto</option>
                                <option value="number">Número</option>
                                <option value="boolean">Verdadero/Falso (Checkbox)</option>
                                <option value="date">Fecha</option>
                                <option value="select">Lista de Opciones (Select)</option>
                            </select>
                            {errors.type && <span style={{ color: 'red', fontSize: '12px' }}>{errors.type}</span>}
                        </div>

                        {data.type === 'select' && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>Opciones (Separadas por coma)</label>
                                <input type="text" value={data.options} onChange={e => setData('options', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }} placeholder="Opción 1, Opción 2, Opción 3" />
                            </div>
                        )}

                        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" id="required_field" checked={data.required} onChange={e => setData('required', e.target.checked)} />
                            <label htmlFor="required_field" style={{ fontSize: '13px' }}>Este campo es obligatorio</label>
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button type="button" onClick={() => setIsAdding(false)} style={{ background: 'transparent', border: '1px solid var(--admin-border)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                            <button type="submit" disabled={processing} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Guardar Campo</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', border: '1px solid var(--admin-border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--admin-bg)', borderBottom: '1px solid var(--admin-border)' }}>
                            <th style={{ padding: '12px 15px', textAlign: 'left', fontSize: '13px', color: 'var(--admin-text-muted)' }}>Entidad</th>
                            <th style={{ padding: '12px 15px', textAlign: 'left', fontSize: '13px', color: 'var(--admin-text-muted)' }}>Etiqueta</th>
                            <th style={{ padding: '12px 15px', textAlign: 'left', fontSize: '13px', color: 'var(--admin-text-muted)' }}>Identificador</th>
                            <th style={{ padding: '12px 15px', textAlign: 'left', fontSize: '13px', color: 'var(--admin-text-muted)' }}>Tipo</th>
                            <th style={{ padding: '12px 15px', textAlign: 'center', fontSize: '13px', color: 'var(--admin-text-muted)' }}>Obligatorio</th>
                            <th style={{ padding: '12px 15px', textAlign: 'right', fontSize: '13px', color: 'var(--admin-text-muted)' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fields.map(field => (
                            <tr key={field.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                                <td style={{ padding: '12px 15px', fontSize: '14px' }}>
                                    <span style={{ background: field.model_type === 'deal' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)', color: field.model_type === 'deal' ? '#3b82f6' : '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                        {field.model_type === 'deal' ? 'Deal' : 'User'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 15px', fontSize: '14px', fontWeight: '600' }}>{field.label}</td>
                                <td style={{ padding: '12px 15px', fontSize: '14px', color: 'var(--admin-text-muted)' }}>{field.name}</td>
                                <td style={{ padding: '12px 15px', fontSize: '14px' }}>
                                    {field.type} {field.type === 'select' && field.options && <span style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>({field.options.length} opciones)</span>}
                                </td>
                                <td style={{ padding: '12px 15px', fontSize: '14px', textAlign: 'center' }}>
                                    {field.required ? 'Sí' : 'No'}
                                </td>
                                <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                                    <button onClick={() => handleDelete(field.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {fields.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                    No hay campos personalizados definidos.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
