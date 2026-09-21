import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import TwentyCrmLayout from '../../../../Layouts/TwentyCrmLayout';
import { Plus, Database, Type, Hash, List, ToggleLeft, Calendar as CalendarIcon, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ObjectsSettings({ fields = [], flash, errors }) {
    const [selectedObject, setSelectedObject] = useState('deal');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fieldType, setFieldType] = useState('text'); // Step 1: select type
    const [step, setStep] = useState(1); // 1: type, 2: details

    const { data, setData, post, processing, reset, clearErrors } = useForm({
        model_type: 'deal',
        name: '',
        label: '',
        type: 'text',
        options: [],
        required: false,
    });

    const filteredFields = fields.filter(f => f.model_type === selectedObject);

    const openModal = () => {
        reset();
        clearErrors();
        setData('model_type', selectedObject);
        setStep(1);
        setIsModalOpen(true);
    };

    const handleTypeSelect = (type) => {
        setFieldType(type);
        setData('type', type);
        setStep(2);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/crm/settings/objects/fields', {
            onSuccess: () => {
                setIsModalOpen(false);
                Swal.fire({
                    toast: true,
                    position: 'bottom-end',
                    icon: 'success',
                    title: 'Campo creado',
                    showConfirmButton: false,
                    timer: 2000
                });
            }
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: '¿Eliminar campo?',
            text: "No podrás recuperar la estructura del campo.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#d1d5db',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/admin/crm/settings/objects/fields/${id}`, {
                    onSuccess: () => {
                        Swal.fire({
                            toast: true,
                            position: 'bottom-end',
                            icon: 'success',
                            title: 'Campo eliminado',
                            showConfirmButton: false,
                            timer: 2000
                        });
                    }
                });
            }
        });
    };

    const typeIcons = {
        text: <Type size={16} />,
        number: <Hash size={16} />,
        select: <List size={16} />,
        boolean: <ToggleLeft size={16} />,
        date: <CalendarIcon size={16} />
    };

    const typeLabels = {
        text: 'Texto Corto',
        number: 'Número',
        select: 'Selección Simple',
        boolean: 'Booleano (Sí/No)',
        date: 'Fecha'
    };

    return (
        <TwentyCrmLayout title="Configuración de Objetos">
            <Head title="Modelo de Datos - Configuración CRM" />

            <div style={{ display: 'flex', height: '100%' }}>
                {/* Internal Sidebar for Settings */}
                <div style={{ width: '240px', borderRight: '1px solid var(--twenty-border)', padding: '24px 16px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--twenty-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', paddingLeft: '8px' }}>
                        Objetos Estandar
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button 
                            onClick={() => setSelectedObject('deal')}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', width: '100%',
                                border: 'none', background: selectedObject === 'deal' ? 'var(--twenty-bg-hover)' : 'transparent',
                                borderRadius: 'var(--twenty-radius-md)', cursor: 'pointer',
                                color: selectedObject === 'deal' ? 'var(--twenty-text-main)' : 'var(--twenty-text-secondary)',
                                fontWeight: selectedObject === 'deal' ? 500 : 400,
                                textAlign: 'left'
                            }}
                        >
                            <Database size={16} />
                            Oportunidades
                        </button>
                        <button 
                            onClick={() => setSelectedObject('user')}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', width: '100%',
                                border: 'none', background: selectedObject === 'user' ? 'var(--twenty-bg-hover)' : 'transparent',
                                borderRadius: 'var(--twenty-radius-md)', cursor: 'pointer',
                                color: selectedObject === 'user' ? 'var(--twenty-text-main)' : 'var(--twenty-text-secondary)',
                                fontWeight: selectedObject === 'user' ? 500 : 400,
                                textAlign: 'left'
                            }}
                        >
                            <Database size={16} />
                            Personas (Clientes)
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={{ flex: 1, padding: '32px 48px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--twenty-text-main)', margin: '0 0 8px 0' }}>
                                {selectedObject === 'deal' ? 'Campos de Oportunidad' : 'Campos de Persona'}
                            </h2>
                            <p style={{ margin: 0, color: 'var(--twenty-text-muted)', fontSize: '14px' }}>
                                Personaliza la estructura de datos para este objeto añadiendo campos personalizados.
                            </p>
                        </div>
                        <button className="twenty-btn twenty-btn-primary" onClick={openModal}>
                            <Plus size={16} />
                            Crear Campo
                        </button>
                    </div>

                    <div style={{ backgroundColor: 'var(--twenty-bg-surface)', border: '1px solid var(--twenty-border)', borderRadius: 'var(--twenty-radius-lg)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--twenty-border)' }}>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--twenty-text-muted)' }}>Etiqueta (Label)</th>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--twenty-text-muted)' }}>Nombre Interno</th>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--twenty-text-muted)' }}>Tipo</th>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--twenty-text-muted)', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFields.length > 0 ? filteredFields.map(field => (
                                    <tr key={field.id} style={{ borderBottom: '1px solid var(--twenty-border)' }}>
                                        <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 500, color: 'var(--twenty-text-main)' }}>
                                            {field.label}
                                        </td>
                                        <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--twenty-text-muted)', fontFamily: 'monospace' }}>
                                            {field.name}
                                        </td>
                                        <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--twenty-text-secondary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {typeIcons[field.type]}
                                                {typeLabels[field.type]}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <button className="twenty-btn-icon" style={{ color: '#ef4444' }} onClick={() => handleDelete(field.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: 'var(--twenty-text-muted)', fontSize: '14px' }}>
                                            No hay campos personalizados para este objeto.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Creación de Campo */}
            {isModalOpen && (
                <>
                    <div className="twenty-drawer-overlay" onClick={() => setIsModalOpen(false)} style={{ zIndex: 100 }} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        backgroundColor: 'var(--twenty-bg-surface)', borderRadius: 'var(--twenty-radius-lg)',
                        width: '480px', maxWidth: '90%', zIndex: 101, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        display: 'flex', flexDirection: 'column', maxHeight: '90vh'
                    }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--twenty-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--twenty-text-main)' }}>
                                {step === 1 ? 'Seleccionar Tipo de Campo' : 'Detalles del Campo'}
                            </h3>
                            <button className="twenty-btn-icon" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        
                        <div style={{ padding: '24px', overflowY: 'auto' }}>
                            {errors.error && (
                                <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 'var(--twenty-radius-md)', marginBottom: '16px', fontSize: '13px' }}>
                                    {errors.error}
                                </div>
                            )}

                            {step === 1 ? (
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {Object.entries(typeLabels).map(([typeKey, label]) => (
                                        <button 
                                            key={typeKey}
                                            onClick={() => handleTypeSelect(typeKey)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
                                                border: '1px solid var(--twenty-border)', borderRadius: 'var(--twenty-radius-md)',
                                                background: 'white', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--twenty-primary)'}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--twenty-border)'}
                                        >
                                            <div style={{ color: 'var(--twenty-primary)', background: 'var(--twenty-primary-bg)', padding: '8px', borderRadius: 'var(--twenty-radius-md)' }}>
                                                {typeIcons[typeKey]}
                                            </div>
                                            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--twenty-text-main)' }}>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <form id="field-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--twenty-text-main)' }}>
                                            Etiqueta (Nombre visible)
                                        </label>
                                        <input 
                                            type="text" 
                                            value={data.label}
                                            onChange={e => {
                                                setData('label', e.target.value);
                                                if (!data.name) setData('name', e.target.value); // Auto-fill name
                                            }}
                                            placeholder="Ej: Sector Industrial"
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--twenty-radius-md)', border: '1px solid var(--twenty-border)', fontSize: '14px', outline: 'none' }}
                                            required
                                        />
                                        {errors.label && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.label}</span>}
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--twenty-text-main)' }}>
                                            Nombre Interno (API Key)
                                        </label>
                                        <input 
                                            type="text" 
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            placeholder="sector_industrial"
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--twenty-radius-md)', border: '1px solid var(--twenty-border)', fontSize: '14px', outline: 'none', backgroundColor: 'var(--twenty-bg-hover)' }}
                                            required
                                        />
                                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--twenty-text-muted)' }}>Solo minúsculas y guiones bajos (_).</p>
                                        {errors.name && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
                                    </div>

                                    {fieldType === 'select' && (
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--twenty-text-main)' }}>
                                                Opciones (separadas por coma)
                                            </label>
                                            <input 
                                                type="text" 
                                                onChange={e => setData('options', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                                                placeholder="Tecnología, Salud, Educación"
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--twenty-radius-md)', border: '1px solid var(--twenty-border)', fontSize: '14px', outline: 'none' }}
                                                required
                                            />
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>

                        {step === 2 && (
                            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--twenty-border)', display: 'flex', justifyContent: 'space-between', backgroundColor: 'var(--twenty-bg-app)' }}>
                                <button className="twenty-btn twenty-btn-secondary" onClick={() => setStep(1)}>
                                    Atrás
                                </button>
                                <button type="submit" form="field-form" className="twenty-btn twenty-btn-primary" disabled={processing}>
                                    {processing ? 'Guardando...' : 'Crear Campo'}
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </TwentyCrmLayout>
    );
}
