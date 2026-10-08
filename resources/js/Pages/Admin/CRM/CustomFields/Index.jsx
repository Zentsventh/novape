import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../../../Layouts/AdminLayout';
import { Plus, Trash2, List, X, Save } from 'lucide-react';

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

    const inputStyle = {
        width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0',
        background: '#F8FAFC', color: '#1E293B', fontSize: '15px', outline: 'none', transition: 'all 0.2s',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
    };
    
    const inputFocusStyle = {
        borderColor: '#004797', boxShadow: '0 0 0 4px rgba(0, 71, 151, 0.1)', backgroundColor: '#ffffff'
    };

    const labelStyle = {
        display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '13px', color: '#475569', letterSpacing: '0.5px', textTransform: 'uppercase'
    };

    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title="Campos Personalizados CRM" />
            
            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                    <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
                        <div style={{ padding: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', color: '#64748B', display: 'flex' }}>
                            <List size={20} />
                        </div>
                        <div>
                            Campos Personalizados
                            <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0', fontWeight: '500' }}>
                                Define campos adicionales para las Oportunidades (Deals) y Clientes (Usuarios).
                            </p>
                        </div>
                    </h1>
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isAdding ? '#F8FAFC' : '#003670'; if(!isAdding) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 71, 151, 0.2)'; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isAdding ? 'transparent' : '#004797'; if(!isAdding) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 71, 151, 0.15)'; } }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: isAdding ? 'transparent' : '#004797', color: isAdding ? '#475569' : 'white', border: isAdding ? '1px solid #E2E8F0' : 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s ease', boxShadow: isAdding ? 'none' : '0 2px 4px rgba(0, 71, 151, 0.15)', cursor: 'pointer' }}
                    >
                        {isAdding ? <X size={16} /> : <Plus size={16} />}
                        {isAdding ? 'Cancelar' : 'Nuevo Campo'}
                    </button>
                </div>

            {isAdding && (
                <div style={{ background: '#ffffff', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', marginBottom: '32px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', animation: 'fadeIn 0.3s ease-in-out' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', color: '#1E293B' }}>Agregar Nuevo Campo</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <label style={labelStyle}>Entidad</label>
                            <select value={data.model_type} onChange={e => setData('model_type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}>
                                <option value="deal">Oportunidad (Deal)</option>
                                <option value="user">Cliente (Usuario)</option>
                            </select>
                            {errors.model_type && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: '600', display: 'block' }}>{errors.model_type}</span>}
                        </div>

                        <div>
                            <label style={labelStyle}>Identificador <span style={{ color: '#94A3B8', fontWeight: 500, textTransform: 'none' }}>(sin espacios)</span></label>
                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} style={inputStyle} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }} />
                            {errors.name && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: '600', display: 'block' }}>{errors.name}</span>}
                        </div>

                        <div>
                            <label style={labelStyle}>Etiqueta (UI)</label>
                            <input type="text" value={data.label} onChange={e => setData('label', e.target.value)} style={inputStyle} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }} />
                            {errors.label && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: '600', display: 'block' }}>{errors.label}</span>}
                        </div>

                        <div>
                            <label style={labelStyle}>Tipo de Dato</label>
                            <select value={data.type} onChange={e => setData('type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}>
                                <option value="text">Texto</option>
                                <option value="number">Número</option>
                                <option value="boolean">Verdadero/Falso (Checkbox)</option>
                                <option value="date">Fecha</option>
                                <option value="select">Lista de Opciones (Select)</option>
                            </select>
                            {errors.type && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: '600', display: 'block' }}>{errors.type}</span>}
                        </div>

                        {data.type === 'select' && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Opciones <span style={{ color: '#94A3B8', fontWeight: 500, textTransform: 'none' }}>(Separadas por coma)</span></label>
                                <input type="text" value={data.options} onChange={e => setData('options', e.target.value)} style={inputStyle} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }} />
                            </div>
                        )}

                        <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#ffffff'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}>
                                <input type="checkbox" id="required_field" checked={data.required} onChange={e => setData('required', e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#004797', cursor: 'pointer' }} />
                                <span style={{ color: '#1E293B', fontWeight: 600, fontSize: '15px' }}>Este campo es obligatorio</span>
                            </label>
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '24px', borderTop: '1px solid #E2E8F0' }}>
                            <button type="button" onClick={() => setIsAdding(false)} 
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                style={{ background: 'transparent', border: '1px solid #E2E8F0', color: '#475569', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' }}>
                                Cancelar
                            </button>
                            <button type="submit" disabled={processing} 
                                onMouseEnter={e => { if(!processing) { e.currentTarget.style.backgroundColor = '#003670'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 71, 151, 0.2)'; } }}
                                onMouseLeave={e => { if(!processing) { e.currentTarget.style.backgroundColor = '#004797'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 71, 151, 0.15)'; } }}
                                style={{ background: '#004797', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: processing ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0, 71, 151, 0.15)', display: 'flex', alignItems: 'center', gap: '8px', opacity: processing ? 0.7 : 1 }}>
                                <Save size={16} /> {processing ? 'Guardando...' : 'Guardar Campo'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ background: '#ffffff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Entidad</th>
                                <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Etiqueta</th>
                                <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Identificador</th>
                                <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</th>
                                <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Obligatorio</th>
                                <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fields.map(field => (
                                <tr key={field.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                    <td style={{ padding: '24px 32px' }}>
                                        <span style={{ display: 'inline-flex', background: field.model_type === 'deal' ? '#F0F9FF' : '#F0FDF4', color: field.model_type === 'deal' ? '#0284C7' : '#16A34A', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', border: `1px solid ${field.model_type === 'deal' ? '#E0F2FE' : '#DCFCE7'}` }}>
                                            {field.model_type === 'deal' ? 'Oportunidad' : 'Cliente'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '24px 32px', color: '#1E293B', fontWeight: '800', fontSize: '15px' }}>{field.label}</td>
                                    <td style={{ padding: '24px 32px', color: '#64748B', fontSize: '14px', fontFamily: 'monospace' }}>{field.name}</td>
                                    <td style={{ padding: '24px 32px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>
                                        <span style={{ display: 'inline-flex', background: '#F8FAFC', padding: '4px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                                            {field.type}
                                        </span>
                                        {field.type === 'select' && field.options && <span style={{ color: '#94A3B8', fontSize: '13px', marginLeft: '8px', fontWeight: 600 }}>({field.options.length} opc.)</span>}
                                    </td>
                                    <td style={{ padding: '24px 32px', textAlign: 'center' }}>
                                        {field.required ? (
                                            <span style={{ display: 'inline-flex', background: '#FEF2F2', color: '#DC2626', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', border: '1px solid #FECACA' }}>Sí</span>
                                        ) : (
                                            <span style={{ display: 'inline-flex', background: '#F8FAFC', color: '#94A3B8', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: '1px solid #E2E8F0' }}>No</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                                        <button onClick={() => handleDelete(field.id)} 
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
                                            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', transition: 'all 0.2s' }} title="Eliminar Campo">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {fields.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ padding: '80px 40px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
                                                <List size={40} />
                                            </div>
                                            <h3 style={{ margin: 0, color: '#1E293B', fontSize: '18px', fontWeight: 700 }}>No hay campos personalizados</h3>
                                            <p style={{ margin: 0, color: '#64748B', fontSize: '15px', maxWidth: '400px', lineHeight: '1.5' }}>
                                                Haz clic en "Nuevo Campo" para agregar propiedades adicionales a tus oportunidades y clientes.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
        </AdminLayout>
    );
}
