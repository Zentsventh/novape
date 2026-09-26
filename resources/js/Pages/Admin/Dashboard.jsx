import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calendar, DollarSign, CreditCard, TrendingUp, ShoppingCart, AlertCircle, Filter, Download, X, Search, ArrowRight, Activity, ChevronDown, Package, CheckCircle } from 'lucide-react';

export default function Dashboard({
    totalProductos = 0, totalCategorias = 0, totalMarcas = 0, totalBanners = 0,
    totalPromociones = 0, totalPedidos = 0, pedidosPendientes = 0,
    pedidosEnviados = 0, pedidosCompletados = 0, pedidosCancelados = 0,
    ventasTotal = 0, costosTotal = 0, gananciaNeta = 0, ventasMes = 0, totalUsuarios = 0, totalStock = 0,
    productosRecientes = [], stockBajo = [], pedidosRecientes = [],
    ventasSemana = [0,0,0,0,0,0,0], topProductosVendidos = [], logoUrl,
    filters = {}
}) {
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [searchQuery, setSearchQuery] = useState(filters.q || '');

    const applyFilters = () => {
        router.get('/admin', {
            start_date: startDate,
            end_date: endDate,
            status: statusFilter,
            q: searchQuery,
            sort_by: filters.sort_by,
            sort_order: filters.sort_order
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setStatusFilter('');
        setSearchQuery('');
        router.get('/admin', {}, { preserveState: true });
    };

    const toggleSort = (column) => {
        const currentOrder = filters.sort_order === 'desc' ? 'asc' : 'desc';
        router.get('/admin', {
            start_date: startDate,
            end_date: endDate,
            status: statusFilter,
            q: searchQuery,
            sort_by: column,
            sort_order: filters.sort_by === column ? currentOrder : 'desc'
        }, { preserveState: true });
    };
    
    const chartVentasSemana = Array.isArray(ventasSemana) 
        ? ventasSemana.map((v, i) => (typeof v === 'object' ? v : { dia: diasSemana[i], total: v }))
        : Object.values(ventasSemana).map((v, i) => (typeof v === 'object' ? v : { dia: diasSemana[i], total: v }));

    const safeStockBajo = Array.isArray(stockBajo) ? stockBajo : Object.values(stockBajo);
    const rawPedidosRecientes = Array.isArray(pedidosRecientes) ? pedidosRecientes : Object.values(pedidosRecientes);
    
    // Live Search Filter
    const safePedidosRecientes = rawPedidosRecientes.filter(pedido => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            String(pedido.codigo).toLowerCase().includes(q) ||
            String(pedido.usuario_nombre).toLowerCase().includes(q)
        );
    });
    const safeTopProductosVendidos = Array.isArray(topProductosVendidos) ? topProductosVendidos : Object.values(topProductosVendidos);

    const getStatusColor = (estado) => {
        const lowerEstado = estado?.toLowerCase();
        switch (lowerEstado) {
            case 'pendiente': return { bg: '#FEF3C7', color: '#D97706' };
            case 'procesando': return { bg: '#E0F2FE', color: '#0284C7' };
            case 'enviado': return { bg: '#F3E8FF', color: '#7E22CE' };
            case 'pagado':
            case 'completado': return { bg: '#DCFCE7', color: '#16A34A' };
            case 'cancelado': return { bg: '#FEE2E2', color: '#DC2626' };
            default: return { bg: '#F1F5F9', color: '#64748B' };
        }
    };

    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title="Dashboard" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
                    <div style={{ padding: '8px', backgroundColor: '#F0F9FF', borderRadius: '10px', color: '#00B4FF' }}>
                        <Activity size={24} />
                    </div>
                    Visión General
                </h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', gap: '6px' }}>
                            <Calendar size={14} style={{ color: '#94A3B8' }} />
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', background: 'transparent', color: '#1E293B', outline: 'none', fontSize: '13px', fontFamily: 'inherit' }} />
                        </div>
                        <span style={{ color: '#CBD5E1' }}>|</span>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', background: 'transparent', color: '#1E293B', outline: 'none', fontSize: '13px', fontFamily: 'inherit' }} />
                        </div>
                        <span style={{ color: '#CBD5E1' }}>|</span>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ border: 'none', background: 'transparent', color: '#1E293B', outline: 'none', fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer' }}>
                                <option value="">Todos los Estados</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="pagado">Pagado</option>
                                <option value="enviado">Enviado</option>
                                <option value="completado">Completado</option>
                                <option value="cancelado">Cancelado</option>
                            </select>
                        </div>
                        
                        <button 
                            onClick={applyFilters} 
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            style={{ background: 'transparent', color: '#00B4FF', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                            title="Aplicar filtros"
                        >
                            <Filter size={16} />
                        </button>
                        {(startDate || endDate || statusFilter) && (
                            <button 
                                onClick={clearFilters} 
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEE2E2'; e.currentTarget.style.color = '#EF4444'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
                                style={{ background: 'transparent', color: '#94A3B8', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                                title="Limpiar filtros"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <Link 
                        href="/admin/pedidos" 
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#009BE0'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 180, 255, 0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#00B4FF'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 180, 255, 0.2)'; }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#00B4FF', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0, 180, 255, 0.2)' }}
                    >
                        <ShoppingCart size={16} />
                        Gestionar Pedidos
                    </Link>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <a 
                            href={`/admin/pedidos/exportar-excel?start_date=${startDate || ''}&end_date=${endDate || ''}`}
                            target="_blank"
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', color: '#475569', textDecoration: 'none', padding: '10px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', border: '1px solid #E2E8F0', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                            title="Exportar Excel"
                        >
                            <Download size={16} />
                            Excel
                        </a>
                        <a 
                            href={`/admin/pedidos/exportar-pdf?start_date=${startDate || ''}&end_date=${endDate || ''}`}
                            target="_blank"
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', color: '#475569', textDecoration: 'none', padding: '10px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', border: '1px solid #E2E8F0', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                            title="Exportar PDF"
                        >
                            <Download size={16} />
                            PDF
                        </a>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                
                {/* KPI: Ingresos */}
                <div 
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.05)'; }}
                    style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.3s ease' }}
                >
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00B4FF', flexShrink: 0 }}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>INGRESOS</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.02em', marginTop: '2px' }}>S/ {ventasTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <TrendingUp size={12} /> +12.5% vs mes anterior
                        </div>
                    </div>
                </div>

                {/* KPI: Costos */}
                <div 
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.05)'; }}
                    style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.3s ease' }}
                >
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', flexShrink: 0 }}>
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>COSTOS</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.02em', marginTop: '2px' }}>S/ {costosTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ArrowRight size={12} /> +1.2% vs mes anterior
                        </div>
                    </div>
                </div>

                {/* KPI: Ganancia Neta */}
                <div 
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.05)'; }}
                    style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.3s ease' }}
                >
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                        <Activity size={24} />
                    </div>
                    <div>
                        <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>GANANCIA NETA</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.02em', marginTop: '2px' }}>S/ {gananciaNeta.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <TrendingUp size={12} /> +18.4% vs mes anterior
                        </div>
                    </div>
                </div>

                {/* KPI: Total Pedidos */}
                <div 
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.05)'; }}
                    style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.3s ease' }}
                >
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6', flexShrink: 0 }}>
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>TOTAL PEDIDOS</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.02em', marginTop: '2px' }}>{totalPedidos}</div>
                        <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <TrendingUp size={12} /> +5.0% vs mes anterior
                        </div>
                    </div>
                </div>
            </div>

            {/* CHAT/GRAFICOS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '24px', marginBottom: '24px', alignItems: 'start' }}>
                {/* Gráfico de Ventas de la Semana */}
                <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Ventas de la Semana</h2>
                    </div>
                    <div style={{ height: '320px', width: '100%', position: 'relative' }}>
                        {chartVentasSemana.every(d => d.total === 0) ? (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                                <Activity size={48} strokeWidth={1} style={{ opacity: 0.3, marginBottom: '16px' }} />
                                <div style={{ fontSize: '14px', fontWeight: '500' }}>Aún no hay datos de ventas para esta semana</div>
                            </div>
                        ) : (
                            <ResponsiveContainer>
                                <AreaChart data={chartVentasSemana} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00B4FF" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#00B4FF" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" vertical={false} />
                                    <XAxis dataKey="dia" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `S/${val}`} dx={-10} />
                                    <Tooltip 
                                        contentStyle={{ background: '#1E293B', border: 'none', borderRadius: '8px', color: '#ffffff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ color: '#00B4FF', fontWeight: 'bold' }}
                                        cursor={{fill: '#F8FAFC'}}
                                        formatter={(value) => [`S/ ${value}`, 'Total']}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#00B4FF" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6, fill: '#00B4FF', stroke: '#ffffff', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Alertas de Stock Bajo */}
                <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={18} style={{ color: '#EF4444' }} /> Alertas de Stock
                        </h2>
                        <span style={{ background: '#F1F5F9', color: '#64748B', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '700' }}>
                            {stockBajo.length} items
                        </span>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '316px', paddingRight: '5px' }}>
                        {safeStockBajo.length > 0 ? safeStockBajo.map(prod => (
                            <div key={prod.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #E2E8F0' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', overflow: 'hidden', flexShrink: 0 }}>
                                    {prod.imagen ? <img src={prod.imagen} alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={20} style={{ color: '#94A3B8', margin: '9px' }} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {prod.nombre}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748B' }}>{prod.marca || 'Sin marca'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: prod.stock <= 5 ? '#EF4444' : '#1E293B', fontWeight: '700', fontSize: '13px', background: prod.stock <= 5 ? '#FEE2E2' : '#F1F5F9', padding: '2px 8px', borderRadius: '4px' }}>
                                        {prod.stock} u.
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', textAlign: 'center' }}>
                                <div>
                                    <CheckCircle size={32} style={{ color: '#10B981', margin: '0 auto 12px auto', opacity: 0.5 }} />
                                    <div style={{ fontSize: '14px', fontWeight: '500' }}>Todo el inventario óptimo</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* LISTAS/TABLAS RECIENTES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '24px', alignItems: 'start' }}>
                {/* Pedidos Recientes */}
                <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 20px 24px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Últimos Pedidos</h2>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', borderRadius: '8px', padding: '6px 12px', border: '1px solid #E2E8F0' }}>
                                <Search size={14} style={{ color: '#94A3B8' }} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar pedido..." 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', padding: '0 0 0 8px', color: '#1E293B', width: '130px', fontFamily: 'inherit' }}
                                />
                            </div>
                            <Link href="/admin/pedidos" style={{ color: '#00B4FF', fontSize: '13px', textDecoration: 'none', fontWeight: '600', transition: 'color 0.2s ease' }} onMouseEnter={e => e.target.style.color = '#009BE0'} onMouseLeave={e => e.target.style.color = '#00B4FF'}>
                                Ver todos
                            </Link>
                        </div>
                    </div>

                    <div style={{ width: '100%', overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Código</th>
                                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente</th>
                                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }} onClick={() => toggleSort('total')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Monto {filters.sort_by === 'total' ? (filters.sort_order === 'desc' ? '↓' : '↑') : <ChevronDown size={14} style={{ opacity: 0.3 }} />}
                                    </div>
                                </th>
                                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }} onClick={() => toggleSort('created_at')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Fecha {filters.sort_by === 'created_at' ? (filters.sort_order === 'desc' ? '↓' : '↑') : <ChevronDown size={14} style={{ opacity: 0.3 }} />}
                                    </div>
                                </th>
                                <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {safePedidosRecientes.length > 0 ? safePedidosRecientes.map(pedido => {
                                const { bg, color } = getStatusColor(pedido.estado);
                                return (
                                    <tr 
                                        key={pedido.id} 
                                        style={{ borderBottom: '1px solid #E2E8F0', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        <td style={{ padding: '16px 24px', color: '#1E293B', fontWeight: '600', fontSize: '14px' }}>
                                            <Link href={`/admin/pedidos/${pedido.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                                {pedido.codigo}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '16px 24px', color: '#64748B', fontSize: '14px' }}>
                                            {pedido.usuario_nombre === 'Cliente' ? (
                                                <span style={{ color: '#EF4444', fontStyle: 'italic', background: '#FEE2E2', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>Cliente Eliminado</span>
                                            ) : (
                                                <span style={{ fontWeight: '500', color: '#1E293B' }}>{pedido.usuario_nombre}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 24px', color: '#1E293B', fontWeight: '700', fontSize: '14px' }}>S/ {Number(pedido.total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                        <td style={{ padding: '16px 24px', color: '#64748B', fontSize: '13px' }}>
                                            {new Date(pedido.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <span style={{ background: bg, color: color, padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' }}>
                                                {pedido.estado}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>No se encontraron pedidos recientes.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>

                {/* Top Productos Más Vendidos */}
                <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Top Productos (POS)</h2>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {safeTopProductosVendidos.length > 0 ? (
                            safeTopProductosVendidos.map((prod, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: index === 0 ? '#00B4FF' : '#F1F5F9', color: index === 0 ? 'white' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px', boxShadow: index === 0 ? '0 2px 8px rgba(0, 180, 255, 0.3)' : 'none' }}>
                                            {index + 1}
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', maxWidth: '170px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {prod.nombre}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '14px' }}>
                                        {prod.cantidad} <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>u.</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', color: '#94A3B8', padding: '40px 0', fontSize: '14px' }}>No hay ventas en POS aún.</div>
                        )}
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
