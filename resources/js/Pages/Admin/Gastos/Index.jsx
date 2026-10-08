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
        borderColor: '#004797', boxShadow: '0 0 0 4px rgba(0, 71, 151, 0.1)', backgroundColor: '#ffffff'
    };

    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title="Control de Gastos" />

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", padding: '32px 40px', maxWidth: '1440px', margin: '0 auto', paddingBottom: '64px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ 
                            padding: '12px', 
                            background: '#ffffff', 
                            border: '1px solid #E2E8F0', 
                            borderRadius: '12px', 
                            color: '#1E293B', 
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                            <Receipt size={24} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '700', color: '#0F172A', letterSpacing: '-0.02em' }}>
                                Control de Gastos
                            </h1>
                            <p style={{ color: '#64748B', fontSize: '14px', margin: '4px 0 0 0', fontWeight: '400' }}>
                                Administra los egresos operativos y financieros.
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={openCreateModal}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', 
                            background: '#004797', color: 'white', border: 'none', cursor: 'pointer',
                            padding: '10px 20px', borderRadius: '10px', textDecoration: 'none', 
                            fontWeight: '600', fontSize: '14px',
                            boxShadow: '0 4px 6px -1px rgba(0, 71, 151, 0.2), 0 2px 4px -1px rgba(0, 71, 151, 0.1)', 
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#003875'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#004797'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <Plus size={18} /> <span>Nuevo Gasto</span>
                    </button>
                </div>

                {/* Filtros */}
                <div style={{ 
                    background: '#ffffff', 
                    padding: '20px 24px', 
                    borderRadius: '16px', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)', 
                    border: '1px solid #E2E8F0', 
                    marginBottom: '24px' 
                }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por concepto de gasto..." 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ 
                                        width: '100%', padding: '12px 16px 12px 44px', borderRadius: '10px', 
                                        border: '1px solid #E2E8F0', background: '#F8FAFC', 
                                        color: '#1E293B', fontSize: '14px', outline: 'none', transition: 'all 0.2s'
                                    }}
                                    onFocus={e => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)'; e.target.style.backgroundColor = '#ffffff'; }}
                                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                />
                            </div>
                            <button 
                                type="submit" 
                                style={{ 
                                    padding: '0 24px', borderRadius: '10px', border: 'none', 
                                    background: '#1E293B', color: 'white', fontWeight: '600', 
                                    cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0F172A'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                            >
                                Buscar
                            </button>
                        </form>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '6px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', borderRadius: '8px', padding: '6px 12px', border: '1px solid #E2E8F0' }}>
                                <Calendar size={16} color="#94A3B8" style={{ marginRight: '8px' }} />
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', background: 'transparent', color: '#1E293B', outline: 'none', fontSize: '13px', padding: 0 }} />
                            </div>
                            <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 500 }}>hasta</span>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', borderRadius: '8px', padding: '6px 12px', border: '1px solid #E2E8F0' }}>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', background: 'transparent', color: '#1E293B', outline: 'none', fontSize: '13px', padding: 0 }} />
                            </div>
                            <button 
                                onClick={() => applyFilters(categoria, search)} 
                                style={{ background: '#ffffff', color: '#475569', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s' }}
                                onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; }}
                                onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#475569'; }}
                            >
                                Filtrar
                            </button>
                            {(startDate || endDate || search || categoria !== 'Todos') && (
                                <button 
                                    onClick={clearFilters} 
                                    style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                    title="Limpiar Filtros"
                                    onMouseOver={e => e.currentTarget.style.background = '#FEE2E2'}
                                    onMouseOut={e => e.currentTarget.style.background = '#FEF2F2'}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Categorías y KPI */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '24px' }}>
                    <div style={{ flex: 1, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {categoriasList.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => handleCategoriaClick(cat)}
                                style={{ 
                                    padding: '8px 16px', 
                                    borderRadius: '20px', 
                                    fontSize: '13px', 
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    border: categoria === cat ? 'none' : '1px solid #E2E8F0',
                                    background: categoria === cat ? '#1E293B' : '#ffffff',
                                    color: categoria === cat ? '#ffffff' : '#64748B',
                                    transition: 'all 0.2s',
                                    boxShadow: categoria === cat ? '0 2px 8px rgba(30, 41, 59, 0.15)' : '0 1px 2px rgba(0,0,0,0.02)'
                                }}
                                onMouseOver={e => { if(categoria !== cat) { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; } }}
                                onMouseOut={e => { if(categoria !== cat) { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748B'; } }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: '#E0F2FE', color: '#004797', padding: '8px', borderRadius: '10px' }}><Wallet size={18} /></div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gastos Totales</div>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontSize: '18px', color: '#94A3B8' }}>S/</span>
                            {Number(totalGastos).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                    </div>
                </div>

                {/* Table Card */}
                <div style={{ 
                    background: '#ffffff', 
                    borderRadius: '16px', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)', 
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden'
                }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                                    <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Concepto</th>
                                    <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoría</th>
                                    <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monto</th>
                                    <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
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
                                        <td style={{ padding: '20px 24px', color: '#1E293B', fontWeight: 600, fontSize: '14px' }}>{g.concepto}</td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <span style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                background: catColors.bg, color: catColors.text, 
                                                padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 
                                            }}>
                                                <Tag size={12} /> {g.categoria}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px 24px', fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>
                                            S/ {Number(g.monto).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </td>
                                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                <button 
                                                    onClick={() => openEditModal(g)} 
                                                    style={{ 
                                                        color: '#64748B', background: 'transparent', padding: '8px', borderRadius: '8px', 
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', border: 'none', cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#004797'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(g.id)} 
                                                    style={{ 
                                                        color: '#64748B', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px',
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}) : (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '80px 20px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                                                    <Receipt size={24} />
                                                </div>
                                                <p style={{ margin: 0, color: '#475569', fontSize: '14px', fontWeight: 500 }}>No hay gastos registrados para estos filtros.</p>
                                                <button 
                                                    onClick={openCreateModal}
                                                    style={{ 
                                                        background: '#ffffff', border: '1px solid #E2E8F0', color: '#1E293B', 
                                                        padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
                                                        cursor: 'pointer', transition: 'all 0.2s', marginTop: '8px', textDecoration: 'none',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                    }}
                                                    onMouseOver={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; }}
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

                {/* Paginación (Si existiera en el objeto gastos) */}
                {gastos.links && gastos.links.length > 3 && (
                    <div style={{ padding: '24px 0', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {gastos.links.map((link, k) => (
                            <div 
                                key={k} 
                                style={{ 
                                    padding: '8px 14px', 
                                    background: link.active ? '#1E293B' : '#ffffff', 
                                    color: link.active ? 'white' : '#475569', 
                                    borderRadius: '8px', 
                                    border: link.active ? '1px solid #1E293B' : '1px solid #E2E8F0',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    opacity: link.url ? 1 : 0.5,
                                    boxShadow: link.active ? '0 1px 3px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.02)'
                                }}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)}></div>
                    <div style={{ 
                        position: 'relative', background: 'white', borderRadius: '16px', width: '500px', maxWidth: '90%', 
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>{editingGasto ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}</h2>
                            <button 
                                onClick={() => setShowModal(false)}
                                style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', cursor: 'pointer', transition: 'all 0.2s', padding: '4px', borderRadius: '50%' }}
                                onMouseOver={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '24px' }}>
                            <form id="gasto-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Concepto</label>
                                    <input 
                                        type="text" value={data.concepto} onChange={e => setData('concepto', e.target.value)} 
                                        style={inputStyle} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#F8FAFC'; }} required 
                                    />
                                    {errors.concepto && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.concepto}</div>}
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Monto (S/)</label>
                                        <input 
                                            type="number" step="0.01" value={data.monto} onChange={e => setData('monto', e.target.value)} 
                                            style={inputStyle} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                            required 
                                        />
                                        {errors.monto && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.monto}</div>}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Fecha</label>
                                        <input 
                                            type="date" value={data.fecha_gasto} onChange={e => setData('fecha_gasto', e.target.value)} 
                                            style={inputStyle} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                            required 
                                        />
                                        {errors.fecha_gasto && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.fecha_gasto}</div>}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Categoría</label>
                                    <select 
                                        value={data.categoria} onChange={e => setData('categoria', e.target.value)} 
                                        style={inputStyle} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#F8FAFC'; }}
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
                        
                        <div style={{ padding: '20px 24px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button 
                                type="button" onClick={() => setShowModal(false)}
                                style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                                onMouseOver={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#475569'; }}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" form="gasto-form" disabled={processing}
                                style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#004797', color: '#ffffff', fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontSize: '13px', boxShadow: '0 4px 6px -1px rgba(0, 71, 151, 0.2), 0 2px 4px -1px rgba(0, 71, 151, 0.1)' }}
                                onMouseOver={(e) => { if(!processing) { e.currentTarget.style.backgroundColor = '#003875'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                                onMouseOut={(e) => { if(!processing) { e.currentTarget.style.backgroundColor = '#004797'; e.currentTarget.style.transform = 'translateY(0)'; } }}
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
