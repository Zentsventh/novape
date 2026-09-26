import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Ticket, Plus, Edit2, Trash2, Copy, Check, X, Calendar, Hash, Percent, DollarSign, Activity, AlertCircle, ShoppingCart } from 'lucide-react';

export default function Index({ cupones }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCupon, setCurrentCupon] = useState(null);
    const [copiedCode, setCopiedCode] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const [form, setForm] = useState({
        codigo: '',
        tipo: 'porcentaje',
        valor: '',
        monto_minimo: '',
        fecha_inicio: '',
        fecha_fin: '',
        limite_usos: '',
        activo: true,
        unico_por_cliente: true
    });

    const openCreateModal = () => {
        setForm({
            codigo: '',
            tipo: 'porcentaje',
            valor: '',
            monto_minimo: '',
            fecha_inicio: '',
            fecha_fin: '',
            limite_usos: '',
            activo: true,
            unico_por_cliente: true
        });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (cupon) => {
        setForm({
            codigo: cupon.codigo,
            tipo: cupon.tipo,
            valor: cupon.valor,
            monto_minimo: cupon.monto_minimo || '',
            fecha_inicio: cupon.fecha_inicio ? cupon.fecha_inicio.substring(0, 16) : '',
            fecha_fin: cupon.fecha_fin ? cupon.fecha_fin.substring(0, 16) : '',
            limite_usos: cupon.limite_usos || '',
            activo: cupon.activo == 1,
            unico_por_cliente: cupon.unico_por_cliente == 1
        });
        setCurrentCupon(cupon);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isEditing) {
            router.put(`/admin/cupones/${currentCupon.id}`, form, {
                onSuccess: () => setIsModalOpen(false)
            });
        } else {
            router.post('/admin/cupones', form, {
                onSuccess: () => setIsModalOpen(false)
            });
        }
    };

    const confirmDelete = (id) => {
        setDeleteConfirm(id);
    };

    const executeDelete = () => {
        if (deleteConfirm) {
            router.delete(`/admin/cupones/${deleteConfirm}`, {
                onSuccess: () => setDeleteConfirm(null)
            });
        }
    };

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const inputStyle = {
        width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0',
        background: '#F8FAFC', color: '#1E293B', fontSize: '15px', outline: 'none', transition: 'all 0.2s',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
    };
    
    const inputFocusStyle = {
        borderColor: '#00B4FF', boxShadow: '0 0 0 4px rgba(0, 180, 255, 0.1)', backgroundColor: '#ffffff'
    };

    const labelStyle = {
        display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '13px', color: '#475569', letterSpacing: '0.5px', textTransform: 'uppercase'
    };

    return (
        <AdminLayout logoUrl={null}>
            <Head title="Gestión de Cupones" />

            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#E0F2FE', padding: '10px', borderRadius: '12px', color: '#00B4FF', display: 'flex' }}>
                                <Ticket size={24} />
                            </div>
                            Cupones de Descuento
                        </h1>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '15px' }}>
                            Crea y administra códigos promocionales para los clientes.
                        </p>
                    </div>
                    
                    <button 
                        onClick={openCreateModal} 
                        style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', 
                            border: 'none', background: '#00B4FF', color: '#ffffff', fontWeight: 700, fontSize: '14px', 
                            cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(0, 180, 255, 0.3)'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 180, 255, 0.4)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 180, 255, 0.3)'; }}
                    >
                        <Plus size={18} /> Nuevo Cupón
                    </button>
                </div>

                {/* Table */}
                <div style={{ background: '#ffffff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Código</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descuento</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Uso</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vigencia</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cupones.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '80px 40px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
                                                    <Ticket size={40} />
                                                </div>
                                                <h3 style={{ margin: 0, color: '#1E293B', fontSize: '18px', fontWeight: 700 }}>Aún no hay cupones</h3>
                                                <p style={{ margin: 0, color: '#64748B', fontSize: '15px', maxWidth: '400px', lineHeight: '1.5' }}>
                                                    Crea tu primer cupón para empezar a ofrecer descuentos a tus clientes.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    cupones.map(cupon => {
                                        const now = new Date();
                                        const isExpired = cupon.fecha_fin && new Date(cupon.fecha_fin) < now;
                                        const rowStyle = isExpired ? { opacity: 0.7, filter: 'grayscale(50%)', borderBottom: '1px solid #F1F5F9', transition: 'all 0.2s' } : { borderBottom: '1px solid #F1F5F9', transition: 'all 0.2s' };

                                        return (
                                        <tr key={cupon.id} style={rowStyle} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                            
                                            {/* Código */}
                                            <td style={{ padding: '24px 32px' }}>
                                                <div 
                                                    onClick={() => handleCopy(cupon.codigo)}
                                                    style={{ 
                                                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                                                        background: copiedCode === cupon.codigo ? '#ECFDF5' : '#F1F5F9', padding: '8px 12px',
                                                        borderRadius: '8px', border: `1px dashed ${copiedCode === cupon.codigo ? '#10B981' : '#CBD5E1'}`,
                                                        color: copiedCode === cupon.codigo ? '#059669' : '#1E293B', fontWeight: 800, fontSize: '14px',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    title="Copiar cupón"
                                                    onMouseOver={(e) => { if(copiedCode !== cupon.codigo) { e.currentTarget.style.borderColor = '#00B4FF'; e.currentTarget.style.color = '#00B4FF'; e.currentTarget.style.background = '#E0F2FE'; } }}
                                                    onMouseOut={(e) => { if(copiedCode !== cupon.codigo) { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.background = '#F1F5F9'; } }}
                                                >
                                                    {copiedCode === cupon.codigo ? <Check size={16} /> : <Copy size={16} />}
                                                    {cupon.codigo}
                                                </div>
                                            </td>

                                            {/* Descuento */}
                                            <td style={{ padding: '24px 32px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ background: cupon.tipo === 'porcentaje' ? '#FFFBEB' : '#F0FDF4', color: cupon.tipo === 'porcentaje' ? '#D97706' : '#16A34A', padding: '6px', borderRadius: '8px' }}>
                                                        {cupon.tipo === 'porcentaje' ? <Percent size={16} /> : <DollarSign size={16} />}
                                                    </div>
                                                    <div>
                                                        <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '15px', display: 'block' }}>
                                                            {cupon.tipo === 'porcentaje' ? `${parseFloat(cupon.valor)}%` : `S/ ${parseFloat(cupon.valor).toFixed(2)}`}
                                                        </span>
                                                        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                                                            {cupon.tipo === 'porcentaje' ? 'Descuento Porcentual' : 'Monto Fijo'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Uso */}
                                            <td style={{ padding: '24px 32px' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', padding: '8px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                                    <Hash size={16} color="#94A3B8" />
                                                    <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '14px' }}>
                                                        {cupon.usos_actuales}
                                                    </span>
                                                    <span style={{ color: '#64748B', fontSize: '13px' }}>
                                                        {cupon.limite_usos ? `/ ${cupon.limite_usos}` : 'de ∞'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Vigencia */}
                                            <td style={{ padding: '24px 32px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '13px', lineHeight: '1.5' }}>
                                                    <Calendar size={16} color="#94A3B8" />
                                                    <div>
                                                        <div>{cupon.fecha_inicio ? new Date(cupon.fecha_inicio).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Inicio Inmediato'}</div>
                                                        <div style={{ color: '#94A3B8' }}>{cupon.fecha_fin ? `Hasta ${new Date(cupon.fecha_fin).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'Sin Expiración'}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Estado */}
                                            <td style={{ padding: '24px 32px' }}>
                                                {isExpired ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', color: '#64748B', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        <AlertCircle size={14} /> Expirado
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: cupon.activo ? '#ECFDF5' : '#FEF2F2', color: cupon.activo ? '#059669' : '#DC2626', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        {cupon.activo ? <Activity size={14} /> : <X size={14} />} {cupon.activo ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Acciones */}
                                            <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => openEditModal(cupon)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#F1F5F9', color: '#475569', borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: isExpired ? 0.7 : 1 }} onMouseOver={e => { e.currentTarget.style.background = '#E0F2FE'; e.currentTarget.style.color = '#00B4FF'; }} onMouseOut={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }} title="Editar">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => confirmDelete(cupon.id)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#FEF2F2', color: '#EF4444', borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: isExpired ? 0.7 : 1 }} onMouseOver={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#ffffff'; }} onMouseOut={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }} title="Eliminar">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Crear/Editar Cupón */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }}>
                    <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '650px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <h5 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Ticket size={24} color="#00B4FF" />
                                {isEditing ? 'Editar Cupón' : 'Nuevo Cupón Promocional'}
                            </h5>
                            <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#E2E8F0', border: 'none', cursor: 'pointer', color: '#64748B', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#ffffff'; }} onMouseOut={e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; }}>
                                <X size={18}/>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} style={{ overflowY: 'auto' }}>
                            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                
                                {/* Código */}
                                <div>
                                    <label style={labelStyle}>Código del Cupón *</label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="text" 
                                            value={form.codigo} 
                                            onChange={e => setForm({...form, codigo: e.target.value.toUpperCase()})} 
                                            required 
                                            placeholder="Ej: VERANO2026" 
                                            style={{...inputStyle, paddingLeft: '16px', fontWeight: 700, fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase'}} 
                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)} 
                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }} 
                                        />
                                    </div>
                                    <small style={{ color: '#94A3B8', fontSize: '12px', marginTop: '6px', display: 'block' }}>El código que los clientes ingresarán en el checkout.</small>
                                </div>

                                {/* Tipo y Valor */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={labelStyle}>Tipo de Descuento *</label>
                                        <div style={{ position: 'relative' }}>
                                            <select 
                                                value={form.tipo} 
                                                onChange={e => setForm({...form, tipo: e.target.value})} 
                                                required 
                                                style={{...inputStyle, appearance: 'none', paddingLeft: '44px', cursor: 'pointer'}} 
                                                onFocus={e => Object.assign(e.target.style, inputFocusStyle)} 
                                                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                            >
                                                <option value="porcentaje">Porcentaje (%)</option>
                                                <option value="fijo">Monto Fijo (S/)</option>
                                            </select>
                                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}>
                                                {form.tipo === 'porcentaje' ? <Percent size={18} /> : <DollarSign size={18} />}
                                            </div>
                                            <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Valor del Descuento *</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            value={form.valor} 
                                            onChange={e => setForm({...form, valor: e.target.value})} 
                                            required 
                                            min="0" 
                                            placeholder={form.tipo === 'porcentaje' ? "Ej: 15.00" : "Ej: 50.00"} 
                                            style={{...inputStyle, paddingLeft: '16px'}} 
                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)} 
                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }} 
                                        />
                                    </div>
                                </div>

                                {/* Monto Mínimo */}
                                <div>
                                    <label style={labelStyle}>Monto Mínimo de Compra <span style={{ color: '#94A3B8', fontWeight: 500 }}>(Opcional)</span></label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}><ShoppingCart size={18} /></div>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            value={form.monto_minimo} 
                                            onChange={e => setForm({...form, monto_minimo: e.target.value})} 
                                            min="0" 
                                            placeholder="Ej: 100.00" 
                                            style={{...inputStyle, paddingLeft: '44px'}} 
                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)} 
                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }} 
                                        />
                                    </div>
                                </div>

                                {/* Fechas */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={labelStyle}>Fecha Inicio <span style={{ color: '#94A3B8', fontWeight: 500 }}>(Opcional)</span></label>
                                        <input 
                                            type="datetime-local" 
                                            value={form.fecha_inicio} 
                                            onChange={e => setForm({...form, fecha_inicio: e.target.value})} 
                                            style={{...inputStyle, paddingLeft: '16px'}} 
                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)} 
                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }} 
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Fecha Fin <span style={{ color: '#94A3B8', fontWeight: 500 }}>(Opcional)</span></label>
                                        <input 
                                            type="datetime-local" 
                                            value={form.fecha_fin} 
                                            onChange={e => setForm({...form, fecha_fin: e.target.value})} 
                                            style={{...inputStyle, paddingLeft: '16px'}} 
                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)} 
                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }} 
                                        />
                                    </div>
                                </div>

                                {/* Usos y Switches */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
                                    <div>
                                        <label style={labelStyle}>Límite total de usos <span style={{ color: '#94A3B8', fontWeight: 500 }}>(Opcional)</span></label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}><Hash size={18} /></div>
                                            <input 
                                                type="number" 
                                                value={form.limite_usos} 
                                                onChange={e => setForm({...form, limite_usos: e.target.value})} 
                                                min="1" 
                                                placeholder="Ej: 100" 
                                                style={{...inputStyle, paddingLeft: '44px'}} 
                                                onFocus={e => Object.assign(e.target.style, inputFocusStyle)} 
                                                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }} 
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#ffffff'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}>
                                            <input type="checkbox" checked={form.unico_por_cliente} onChange={e => setForm({...form, unico_por_cliente: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#00B4FF', cursor: 'pointer' }} />
                                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>1 solo uso por cliente</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#ffffff'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}>
                                            <input type="checkbox" checked={form.activo} onChange={e => setForm({...form, activo: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#00B4FF', cursor: 'pointer' }} />
                                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>Cupón Activo</span>
                                        </label>
                                    </div>
                                </div>

                            </div>
                            <div style={{ padding: '20px 32px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#ffffff', border: '1px solid #E2E8F0', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, color: '#475569', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; }} onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#475569'; }}>Cancelar</button>
                                <button type="submit" style={{ background: '#00B4FF', border: 'none', padding: '12px 28px', borderRadius: '12px', fontWeight: 800, color: '#ffffff', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 180, 255, 0.3)', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 180, 255, 0.4)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 180, 255, 0.3)'; }}>Guardar Cupón</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out' }}>
                    <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '32px', textAlign: 'center', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div style={{ width: '64px', height: '64px', background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Trash2 size={32} color="#DC2626" />
                        </div>
                        <h5 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>¿Eliminar este cupón?</h5>
                        <p style={{ color: '#64748B', fontSize: '14px', margin: '0 0 32px', lineHeight: '1.5' }}>Esta acción no se puede deshacer. El cupón ya no será válido para futuras compras.</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button type="button" onClick={() => setDeleteConfirm(null)} style={{ background: '#F1F5F9', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: 700, color: '#475569', cursor: 'pointer', flex: 1, transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#1E293B'; }} onMouseOut={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }}>Cancelar</button>
                            <button type="button" onClick={executeDelete} style={{ background: '#DC2626', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: 700, color: '#ffffff', cursor: 'pointer', flex: 1, transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(220, 38, 38, 0.2)' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(220, 38, 38, 0.3)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(220, 38, 38, 0.2)'; }}>Sí, eliminar</button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </AdminLayout>
    );
}
