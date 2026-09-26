import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { Plus, Search, Calendar, X, Wallet, Edit2, Trash2, Tag, CalendarDays, Receipt } from 'lucide-react';

export default function GastosIndex({ gastos, totalGastos, logoUrl, filters = {} }) {
    const confirmDialog = useConfirm();

    const [showModal, setShowModal] = useState(false);
    const [editingGasto, setEditingGasto] = useState(null);
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [search, setSearch] = useState(filters.search || '');
    const [categoria, setCategoria] = useState(filters.categoria || 'Todos');
    const { data, setData, post, put, processing, reset, errors } = useForm({
        concepto: '',
        monto: '',
        categoria: 'Operativo',
        tipo: 'variable',
        fecha_gasto: new Date().toISOString().split('T')[0]
    });

    const openCreateModal = () => {
        setEditingGasto(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (gasto) => {
        setEditingGasto(gasto);
        setData({
            concepto: gasto.concepto,
            monto: gasto.monto,
            categoria: gasto.categoria,
            tipo: gasto.tipo,
            fecha_gasto: gasto.fecha_gasto.split('T')[0] || gasto.fecha_gasto
        });
        setShowModal(true);
    };

    const submit = async (e) => {
        e.preventDefault();
        if (editingGasto) {
            put(`/admin/gastos/${editingGasto.id}`, {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        } else {
            post('/admin/gastos', {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('¿Eliminar este gasto?')) {
            router.delete(`/admin/gastos/${id}`);
        }
    };

    const applyFilters = (overrideCategoria = categoria, overrideSearch = search) => {
        router.get('/admin/gastos', {
            start_date: startDate,
            end_date: endDate,
            search: overrideSearch,
            categoria: overrideCategoria
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setSearch('');
        setCategoria('Todos');
        router.get('/admin/gastos', { start_date: '', end_date: '', search: '', categoria: '' }, { preserveState: true });
    };

    const handleCategoriaClick = (cat) => {
        setCategoria(cat);
        applyFilters(cat, search);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters(categoria, search);
    };

    const categoriasList = ['Todos', 'Operativo', 'Infraestructura TI', 'Planilla', 'Marketing', 'Software', 'Administrativo', 'Otros'];

    const getCategoryColor = (cat) => {
        const colors = {
            'Operativo': { bg: '#E0F2FE', text: '#0284C7' },
            'Infraestructura TI': { bg: '#EDE9FE', text: '#7C3AED' },
            'Planilla': { bg: '#ECFCCB', text: '#4D7C0F' },
            'Marketing': { bg: '#FFE4E6', text: '#E11D48' },
            'Software': { bg: '#CCFBF1', text: '#0F766E' },
            'Administrativo': { bg: '#FEE2E2', text: '#B91C1C' },
            'Otros': { bg: '#F1F5F9', text: '#475569' }
        };
        return colors[cat] || { bg: '#F1F5F9', text: '#475569' };
    };

    const inputStyle = {
        width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0',
        background: '#F8FAFC', color: '#1E293B', fontSize: '15px', outline: 'none', transition: 'all 0.2s',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
    };
    
    const inputFocusStyle = {
        borderColor: '#00B4FF', boxShadow: '0 0 0 4px rgba(0, 180, 255, 0.1)', backgroundColor: '#ffffff'
    };

    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title="Control de Gastos" />

            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px' }}>Control de Gastos</h1>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '15px' }}>Administra los egresos operativos y financieros.</p>
                    </div>

                    <button 
                        onClick={openCreateModal}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', background: '#00B4FF', color: 'white', border: 'none', cursor: 'pointer',
                            padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '14px',
                            boxShadow: '0 4px 14px rgba(0, 180, 255, 0.3)', transition: 'all 0.2s ease'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 180, 255, 0.4)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 180, 255, 0.3)'; }}
                    >
                        <Plus size={18} /> Nuevo Gasto
                    </button>
                </div>

                {/* Filtros */}
                <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '20px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                            <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar por concepto de gasto..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ 
                                    width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px', border: '1px solid #E2E8F0', 
                                    background: '#F8FAFC', color: '#1E293B', fontSize: '14px', outline: 'none', transition: 'all 0.2s',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                onFocus={e => { e.target.style.borderColor = '#00B4FF'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 180, 255, 0.1)'; e.target.style.backgroundColor = '#ffffff'; }}
                                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                            />
                            <button type="submit" style={{ display: 'none' }}>Buscar</button>
                        </form>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '6px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', borderRadius: '8px', padding: '4px 12px', border: '1px solid #E2E8F0' }}>
                                <Calendar size={16} color="#94A3B8" style={{ marginRight: '8px' }} />
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', background: 'transparent', color: '#1E293B', outline: 'none', fontSize: '13px', padding: '4px 0' }} />
                            </div>
                            <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 500 }}>hasta</span>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', borderRadius: '8px', padding: '4px 12px', border: '1px solid #E2E8F0' }}>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', background: 'transparent', color: '#1E293B', outline: 'none', fontSize: '13px', padding: '4px 0' }} />
                            </div>
                            <button 
                                onClick={() => applyFilters(categoria, search)} 
                                style={{ background: '#1E293B', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s' }}
                                onMouseOver={e => e.currentTarget.style.background = '#0F172A'}
                                onMouseOut={e => e.currentTarget.style.background = '#1E293B'}
                            >
                                Filtrar
                            </button>
                            {(startDate || endDate || search || categoria !== 'Todos') && (
                                <button 
                                    onClick={clearFilters} 
                                    style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                    title="Limpiar Filtros"
                                    onMouseOver={e => e.currentTarget.style.background = '#FECACA'}
                                    onMouseOut={e => e.currentTarget.style.background = '#FEE2E2'}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Categorías y KPI */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '24px' }}>
                    <div style={{ flex: 1, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {categoriasList.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => handleCategoriaClick(cat)}
                                style={{ 
                                    padding: '8px 16px', 
                                    borderRadius: '24px', 
                                    fontSize: '13px', 
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    border: categoria === cat ? 'none' : '1px solid #E2E8F0',
                                    background: categoria === cat ? '#1E293B' : '#ffffff',
                                    color: categoria === cat ? '#ffffff' : '#64748B',
                                    transition: 'all 0.2s',
                                    boxShadow: categoria === cat ? '0 4px 12px rgba(30, 41, 59, 0.2)' : '0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                onMouseOver={e => { if(categoria !== cat) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)'; } }}
                                onMouseOut={e => { if(categoria !== cat) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; } }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, #ffffff, #F8FAFC)', padding: '24px', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)', border: '1px solid #E2E8F0', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: '#E0F2FE', color: '#00B4FF', padding: '8px', borderRadius: '10px' }}><Wallet size={20} /></div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gastos Totales</div>
                        </div>
                        <div style={{ fontSize: '36px', fontWeight: 800, color: '#1E293B', letterSpacing: '-1px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontSize: '20px', color: '#94A3B8' }}>S/</span>
                            {Number(totalGastos).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                    </div>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Concepto</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoría</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monto</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gastos.data && gastos.data.length > 0 ? gastos.data.map(g => {
                                    const catColors = getCategoryColor(g.categoria);
                                    return (
                                    <tr key={g.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.2s', backgroundColor: '#ffffff' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '14px', fontWeight: 500 }}>
                                                <CalendarDays size={16} color="#94A3B8" /> {g.fecha_gasto}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px', color: '#1E293B', fontWeight: 600, fontSize: '15px' }}>{g.concepto}</td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <span style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                background: catColors.bg, color: catColors.text, 
                                                padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 
                                            }}>
                                                <Tag size={12} /> {g.categoria}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px 24px', fontWeight: 800, color: '#1E293B', fontSize: '15px' }}>
                                            S/ {Number(g.monto).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </td>
                                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button 
                                                    onClick={() => openEditModal(g)} 
                                                    style={{ 
                                                        color: '#00B4FF', background: '#E0F2FE', padding: '8px', borderRadius: '8px', 
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', border: 'none', cursor: 'pointer'
                                                    }}
                                                    onMouseOver={e => { e.currentTarget.style.backgroundColor = '#00B4FF'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                    onMouseOut={e => { e.currentTarget.style.backgroundColor = '#E0F2FE'; e.currentTarget.style.color = '#00B4FF'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(g.id)} 
                                                    style={{ 
                                                        color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px',
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={e => { e.currentTarget.style.backgroundColor = '#FEE2E2'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                    onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}) : (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '60px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                                                    <Receipt size={32} />
                                                </div>
                                                <p style={{ margin: 0, color: '#64748B', fontSize: '15px', fontWeight: 500 }}>No hay gastos registrados para estos filtros.</p>
                                                <button 
                                                    onClick={openCreateModal}
                                                    style={{ background: 'transparent', border: '1px solid #00B4FF', color: '#00B4FF', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', marginTop: '8px' }}
                                                    onMouseOver={(e) => { e.currentTarget.style.background = '#00B4FF'; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#00B4FF'; }}
                                                >
                                                    Registrar Primer Gasto
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

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)}></div>
                    <div style={{ 
                        position: 'relative', background: 'white', borderRadius: '24px', width: '500px', maxWidth: '90%', 
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>{editingGasto ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}</h2>
                            <button 
                                onClick={() => setShowModal(false)}
                                style={{ background: '#F1F5F9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseOver={(e) => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#1E293B'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '32px' }}>
                            <form id="gasto-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Concepto</label>
                                    <input 
                                        type="text" value={data.concepto} onChange={e => setData('concepto', e.target.value)} 
                                        style={inputStyle} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                        placeholder="Ej. Recibo de luz" required 
                                    />
                                    {errors.concepto && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.concepto}</div>}
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Monto (S/)</label>
                                        <input 
                                            type="number" step="0.01" value={data.monto} onChange={e => setData('monto', e.target.value)} 
                                            style={inputStyle} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                            placeholder="0.00" required 
                                        />
                                        {errors.monto && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.monto}</div>}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Fecha</label>
                                        <input 
                                            type="date" value={data.fecha_gasto} onChange={e => setData('fecha_gasto', e.target.value)} 
                                            style={inputStyle} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                            required 
                                        />
                                        {errors.fecha_gasto && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.fecha_gasto}</div>}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Categoría</label>
                                    <select 
                                        value={data.categoria} onChange={e => setData('categoria', e.target.value)} 
                                        style={inputStyle} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                    >
                                        <option value="Operativo">Operativo (Luz, Agua, Local)</option>
                                        <option value="Infraestructura TI">Infraestructura TI</option>
                                        <option value="Marketing">Marketing / Publicidad</option>
                                        <option value="Planilla">Planilla / Sueldos</option>
                                        <option value="Software">Software y Suscripciones</option>
                                        <option value="Administrativo">Administrativo</option>
                                        <option value="Otros">Otros Gastos</option>
                                    </select>
                                    {errors.categoria && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.categoria}</div>}
                                </div>
                            </form>
                        </div>
                        
                        <div style={{ padding: '24px 32px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                            <button 
                                type="button" onClick={() => setShowModal(false)}
                                style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#ffffff', color: '#64748B', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' }}
                                onMouseOver={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748B'; }}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" form="gasto-form" disabled={processing}
                                style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#00B4FF', color: '#ffffff', fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontSize: '14px', boxShadow: '0 4px 12px rgba(0, 180, 255, 0.3)' }}
                                onMouseOver={(e) => { if(!processing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 180, 255, 0.4)'; } }}
                                onMouseOut={(e) => { if(!processing) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 180, 255, 0.3)'; } }}
                            >
                                {processing ? 'Guardando...' : 'Guardar Gasto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
