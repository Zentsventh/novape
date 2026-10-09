import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import TwentyCrmLayout from '../../../../Layouts/TwentyCrmLayout';
import { Plus, Database, Type, Hash, List, ToggleLeft, Calendar as CalendarIcon, Trash2, X, ChevronRight } from 'lucide-react';
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

            <div style={{ display: 'flex', height: '100%', backgroundColor: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
                {/* Internal Sidebar for Settings */}
                <div style={{ 
                    width: '260px', 
                    backgroundColor: '#ffffff',
                    borderRight: '1px solid #E2E8F0', 
                    padding: '32px 20px',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
                    zIndex: 10
                }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px', paddingLeft: '12px' }}>
                        Objetos Estandar
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button 
                            onClick={() => setSelectedObject('deal')}
                            style={{ 
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', width: '100%',
                                border: 'none', background: selectedObject === 'deal' ? '#004797' : 'transparent',
                                borderRadius: '12px', cursor: 'pointer',
                                color: selectedObject === 'deal' ? '#ffffff' : '#64748B',
                                fontWeight: selectedObject === 'deal' ? 600 : 500,
                                transition: 'all 0.2s ease',
                                boxShadow: selectedObject === 'deal' ? '0 4px 12px rgba(0, 71, 151, 0.3)' : 'none'
                            }}
                            onMouseOver={(e) => { if(selectedObject !== 'deal') { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; } }}
                            onMouseOut={(e) => { if(selectedObject !== 'deal') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; } }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Database size={18} />
                                <span style={{ fontSize: '14px' }}>Oportunidades</span>
                            </div>
                            {selectedObject === 'deal' && <ChevronRight size={16} opacity={0.8} />}
                        </button>
                        <button 
                            onClick={() => setSelectedObject('user')}
                            style={{ 
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', width: '100%',
                                border: 'none', background: selectedObject === 'user' ? '#004797' : 'transparent',
                                borderRadius: '12px', cursor: 'pointer',
                                color: selectedObject === 'user' ? '#ffffff' : '#64748B',
                                fontWeight: selectedObject === 'user' ? 600 : 500,
                                transition: 'all 0.2s ease',
                                boxShadow: selectedObject === 'user' ? '0 4px 12px rgba(0, 71, 151, 0.3)' : 'none'
                            }}
                            onMouseOver={(e) => { if(selectedObject !== 'user') { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; } }}
                            onMouseOut={(e) => { if(selectedObject !== 'user') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; } }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Database size={18} />
                                <span style={{ fontSize: '14px' }}>Personas (Clientes)</span>
                            </div>
                            {selectedObject === 'user' && <ChevronRight size={16} opacity={0.8} />}
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={{ flex: 1, padding: '40px 56px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                        <div>
                            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                                {selectedObject === 'deal' ? 'Campos de Oportunidad' : 'Campos de Persona'}
                            </h2>
                            <p style={{ margin: 0, color: '#64748B', fontSize: '15px' }}>
                                Personaliza la estructura de datos para este objeto añadiendo campos personalizados.
                            </p>
                        </div>
                        <button 
                            onClick={openModal}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#004797', color: '#ffffff',
                                border: 'none', borderRadius: '12px', padding: '12px 20px',
                                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(0, 71, 151, 0.4)',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 71, 151, 0.5)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 71, 151, 0.4)'; }}
                        >
                            <Plus size={18} />
                            Crear Campo
                        </button>
                    </div>

                    <div style={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #E2E8F0', 
                        borderRadius: '16px', 
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Etiqueta (Label)</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre Interno</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFields.length > 0 ? filteredFields.map(field => (
                                    <tr 
                                        key={field.id} 
                                        style={{ borderBottom: '1px solid #F1F5F9', transition: 'all 0.2s ease', backgroundColor: '#ffffff' }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                                    >
                                        <td style={{ padding: '20px 24px', fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>
                                            {field.label}
                                        </td>
                                        <td style={{ fontSize: '13px', color: '#64748B', fontFamily: 'monospace', background: '#F1F5F9', borderRadius: '4px', padding: '4px 8px', margin: '16px 24px', display: 'inline-block', fontWeight: 500 }}>
                                            {field.name}
                                        </td>
                                        <td style={{ padding: '20px 24px', fontSize: '14px', color: '#475569', fontWeight: 500 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#E0F2FE', color: '#004797' }}>
                                                    {typeIcons[field.type]}
                                                </div>
                                                {typeLabels[field.type]}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => handleDelete(field.id)}
                                                style={{ 
                                                    background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer',
                                                    padding: '8px', borderRadius: '8px', transition: 'all 0.2s ease',
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#FEE2E2'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                title="Eliminar Campo"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '64px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                                                    <Database size={32} />
                                                </div>
                                                <p style={{ margin: 0, color: '#64748B', fontSize: '15px', fontWeight: 500 }}>No hay campos personalizados para este objeto.</p>
                                                <button 
                                                    onClick={openModal}
                                                    style={{ background: 'transparent', border: '1px solid #004797', color: '#004797', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', marginTop: '8px' }}
                                                    onMouseOver={(e) => { e.currentTarget.style.background = '#004797'; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#004797'; }}
                                                >
                                                    Agregar mi primer campo
                                                </button>
                                            </div>
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
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div 
                        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }} 
                        onClick={() => setIsModalOpen(false)} 
                    />
                    
                    <div style={{
                        position: 'relative',
                        backgroundColor: '#ffffff', borderRadius: '24px',
                        width: '500px', maxWidth: '90%', zIndex: 101, 
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
                        animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.3px' }}>
                                {step === 1 ? 'Seleccionar Tipo de Campo' : 'Detalles del Campo'}
                            </h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseOver={(e) => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#1E293B'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div style={{ padding: '32px', overflowY: 'auto' }}>
                            {errors.error && (
                                <div style={{ padding: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: 500 }}>
                                    {errors.error}
                                </div>
                            )}

                            {step === 1 ? (
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {Object.entries(typeLabels).map(([typeKey, label]) => (
                                        <button 
                                            key={typeKey}
                                            onClick={() => handleTypeSelect(typeKey)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '16px', padding: '20px',
                                                border: '1px solid #E2E8F0', borderRadius: '16px',
                                                background: '#ffffff', cursor: 'pointer', textAlign: 'left', 
                                                transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.borderColor = '#004797';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 71, 151, 0.15)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.borderColor = '#E2E8F0';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                                            }}
                                        >
                                            <div style={{ color: '#004797', background: '#E0F2FE', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {typeIcons[typeKey]}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>{label}</span>
                                                <span style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                                                    {typeKey === 'text' && 'Textos cortos, nombres o enlaces.'}
                                                    {typeKey === 'number' && 'Cantidades, montos o métricas.'}
                                                    {typeKey === 'select' && 'Una lista desplegable de opciones.'}
                                                    {typeKey === 'boolean' && 'Una casilla de verificación sí/no.'}
                                                    {typeKey === 'date' && 'Un selector de fecha del calendario.'}
                                                </span>
                                            </div>
                                            <ChevronRight size={20} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <form id="field-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#1E293B' }}>
                                            Etiqueta (Nombre visible)
                                        </label>
                                        <input 
                                            type="text" 
                                            value={data.label}
                                            onChange={e => {
                                                setData('label', e.target.value);
                                                if (!data.name) setData('name', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''));
                                            }}
                                            style={{ 
                                                width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', 
                                                fontSize: '15px', outline: 'none', transition: 'all 0.2s',
                                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                            }}
                                            onFocus={e => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 71, 151, 0.1)'; }}
                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; }}
                                            required
                                        />
                                        {errors.label && <span style={{ color: '#EF4444', fontSize: '13px', marginTop: '6px', display: 'block', fontWeight: 500 }}>{errors.label}</span>}
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#1E293B' }}>
                                            Nombre Interno (API Key)
                                        </label>
                                        <input 
                                            type="text" 
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            placeholder="sector_industrial"
                                            style={{ 
                                                width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', 
                                                fontSize: '15px', outline: 'none', backgroundColor: '#F8FAFC', transition: 'all 0.2s'
                                            }}
                                            onFocus={e => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 71, 151, 0.1)'; e.target.style.backgroundColor = '#ffffff'; }}
                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                            required
                                        />
                                        <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Solo letras minúsculas, números y guiones bajos (_).</p>
                                        {errors.name && <span style={{ color: '#EF4444', fontSize: '13px', marginTop: '6px', display: 'block', fontWeight: 500 }}>{errors.name}</span>}
                                    </div>

                                    {fieldType === 'select' && (
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#1E293B' }}>
                                                Opciones
                                            </label>
                                            <input 
                                                type="text" 
                                                onChange={e => setData('options', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                                                placeholder="Tecnología, Salud, Educación (separadas por coma)"
                                                style={{ 
                                                    width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', 
                                                    fontSize: '15px', outline: 'none', transition: 'all 0.2s',
                                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                                }}
                                                onFocus={e => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 71, 151, 0.1)'; }}
                                                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; }}
                                                required
                                            />
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>

                        {step === 2 && (
                            <div style={{ padding: '24px 32px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
                                <button 
                                    onClick={() => setStep(1)}
                                    style={{
                                        background: '#ffffff', border: '1px solid #E2E8F0', color: '#475569',
                                        padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                                >
                                    Atrás
                                </button>
                                <button 
                                    type="submit" 
                                    form="field-form" 
                                    disabled={processing}
                                    style={{
                                        background: '#004797', border: 'none', color: '#ffffff',
                                        padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                                        cursor: processing ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                                        boxShadow: '0 4px 12px rgba(0, 71, 151, 0.3)', opacity: processing ? 0.7 : 1
                                    }}
                                    onMouseOver={(e) => { if(!processing) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 71, 151, 0.4)'; } }}
                                    onMouseOut={(e) => { if(!processing) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 71, 151, 0.3)'; } }}
                                >
                                    {processing ? 'Guardando...' : 'Crear Campo'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </TwentyCrmLayout>
    );
}
