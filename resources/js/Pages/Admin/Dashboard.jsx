import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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
            case 'pendiente': return { bg: 'rgba(100,116,139,0.1)', color: '#64748b' };
            case 'procesando': return { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' };
            case 'enviado': return { bg: 'rgba(37,99,235,0.1)', color: '#2563eb' };
            case 'pagado':
            case 'completado': return { bg: 'rgba(30,58,138,0.1)', color: '#1e3a8a' };
            case 'cancelado': return { bg: 'rgba(71,85,105,0.1)', color: '#475569' };
            default: return { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' };
        }
    };

    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title="Dashboard" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Visión General</h1>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--admin-bg-panel)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-muted)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', background: 'transparent', color: 'var(--admin-text-main)', outline: 'none', fontSize: '13px' }} />
                        <span style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>hasta</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', background: 'transparent', color: 'var(--admin-text-main)', outline: 'none', fontSize: '13px' }} />
                        
                        <div style={{ width: '1px', height: '20px', background: 'var(--admin-border)', margin: '0 5px' }}></div>
                        
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ border: 'none', background: 'transparent', color: 'var(--admin-text-main)', outline: 'none', fontSize: '13px' }}>
                            <option value="">Todos los Estados</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="pagado">Pagado</option>
                            <option value="enviado">Enviado</option>
                            <option value="completado">Completado</option>
                            <option value="cancelado">Cancelado</option>
                        </select>

                        <div style={{ width: '1px', height: '20px', background: 'var(--admin-border)', margin: '0 5px' }}></div>
                        
                        <input type="text" placeholder="Buscar pedido..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ border: 'none', background: 'transparent', color: 'var(--admin-text-main)', outline: 'none', fontSize: '13px', width: '120px' }} />

                        <button onClick={applyFilters} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', marginLeft: '5px', fontSize: '12px', fontWeight: 'bold' }}>Filtrar</button>
                        {(startDate || endDate || statusFilter || searchQuery) && <button onClick={clearFilters} style={{ background: 'rgba(100,116,139,0.1)', color: '#64748B', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', marginLeft: '5px', fontSize: '12px', fontWeight: 'bold' }}>X</button>}
                    </div>
                    <Link 
                        href="/admin/pedidos" 
                        className="admin-btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        Gestionar Pedidos
                    </Link>
                    <a 
                        href={`/admin/pedidos/exportar-excel?start_date=${startDate || ''}&end_date=${endDate || ''}`}
                        target="_blank"
                        className="admin-btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Exportar Excel
                    </a>
                    <a 
                        href={`/admin/pedidos/exportar-pdf?start_date=${startDate || ''}&end_date=${endDate || ''}`}
                        target="_blank"
                        className="admin-btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                        Exportar PDF
                    </a>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                
                {/* KPI: Ventas Mes */}
                <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-accent) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px var(--admin-primary-glow)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    </div>
                    <div>
                        <div style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: 'bold' }}>INGRESOS</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>S/ {ventasTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        <div style={{ fontSize: '11px', color: 'var(--admin-primary)', marginTop: '4px', fontWeight: '600' }}>▲ +12.5% vs mes anterior</div>
                    </div>
                </div>

                {/* KPI: Costos */}
                <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-accent) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px var(--admin-primary-glow)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>
                    </div>
                    <div>
                        <div style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: 'bold' }}>COSTOS</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>S/ {costosTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        <div style={{ fontSize: '11px', color: 'var(--admin-primary)', marginTop: '4px', fontWeight: '600' }}>▶ +1.2% vs mes anterior</div>
                    </div>
                </div>

                {/* KPI: Ganancia Neta */}
                <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-accent) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px var(--admin-primary-glow)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                    </div>
                    <div>
                        <div style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: 'bold' }}>GANANCIA NETA</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>S/ {gananciaNeta.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        <div style={{ fontSize: '11px', color: 'var(--admin-primary)', marginTop: '4px', fontWeight: '600' }}>▲ +18.4% vs mes anterior</div>
                    </div>
                </div>

                {/* KPI: Total Pedidos */}
                <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-accent) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px var(--admin-primary-glow)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    </div>
                    <div>
                        <div style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: 'bold' }}>TOTAL PEDIDOS</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>{totalPedidos}</div>
                        <div style={{ fontSize: '11px', color: 'var(--admin-primary)', marginTop: '4px', fontWeight: '600' }}>▲ +5.0% vs mes anterior</div>
                    </div>
                </div>
            </div>

            {/* CHAT/GRAFICOS */}
            <div className="admin-grid-charts">
                {/* Gráfico de Ventas de la Semana */}
                <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Ventas de la Semana</h2>
                    </div>
                    <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                        {chartVentasSemana.every(d => d.total === 0) ? (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted)' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '10px' }}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                <div style={{ fontSize: '14px', fontWeight: '500' }}>Aún no hay datos de ventas para esta semana</div>
                            </div>
                        ) : (
                            <ResponsiveContainer>
                                <AreaChart data={chartVentasSemana} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                                    <XAxis dataKey="dia" stroke="var(--admin-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--admin-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `S/${val}`} />
                                    <Tooltip 
                                        contentStyle={{ background: 'var(--admin-bg-panel)', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        cursor={{fill: 'rgba(0,0,0,0.05)'}}
                                        formatter={(value) => [`S/ ${value}`, 'Total']}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Alertas de Stock Bajo */}
                <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Alertas de Stock Bajo</h2>
                        <span style={{ background: 'rgba(71,85,105,0.1)', color: '#475569', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                            {stockBajo.length} items
                        </span>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', paddingRight: '5px' }}>
                        {safeStockBajo.length > 0 ? safeStockBajo.map(prod => (
                            <div key={prod.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--admin-border)' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#333', overflow: 'hidden', flexShrink: 0 }}>
                                    {prod.imagen ? <img src={prod.imagen} alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--admin-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {prod.nombre}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{prod.marca || 'Sin marca'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: prod.stock <= 5 ? '#ef4444' : 'var(--admin-text-main)', fontWeight: 'bold', fontSize: '14px' }}>
                                        {prod.stock} u.
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--admin-text-main)', textAlign: 'center', opacity: 0.7 }}>
                                <div>
                                    <strong>Todo el inventario se</strong><br/>encuentra en niveles óptimos.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* LISTAS/TABLAS RECIENTES */}
            <div className="admin-grid-tables">
                {/* Pedidos Recientes */}
                <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Últimos Pedidos</h2>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--admin-bg-main, #f9fafb)', borderRadius: '6px', padding: '4px 8px', border: '1px solid var(--admin-border)' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                <input 
                                    type="text" 
                                    placeholder="Buscar pedido..." 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', padding: '4px', color: 'var(--admin-text-main)', width: '120px' }}
                                />
                            </div>
                            <Link href="/admin/pedidos" style={{ color: '#2563eb', fontSize: '13px', textDecoration: 'none', fontWeight: 'bold' }}>Ver todos</Link>
                        </div>
                    </div>

                    <div className="overflow-x-auto" style={{ width: '100%', overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--admin-border)', color: 'var(--admin-text-muted)' }}>
                                <th style={{ padding: '10px 0', fontWeight: 'normal' }}>Código</th>
                                <th style={{ padding: '10px 0', fontWeight: 'normal' }}>Cliente</th>
                                <th style={{ padding: '10px 0', fontWeight: 'normal', cursor: 'pointer' }} onClick={() => toggleSort('total')}>
                                    Monto {filters.sort_by === 'total' && (filters.sort_order === 'desc' ? '↓' : '↑')}
                                </th>
                                <th style={{ padding: '10px 0', fontWeight: 'normal', cursor: 'pointer' }} onClick={() => toggleSort('created_at')}>
                                    Fecha {filters.sort_by === 'created_at' && (filters.sort_order === 'desc' ? '↓' : '↑')}
                                </th>
                                <th style={{ padding: '10px 0', fontWeight: 'normal', textAlign: 'right' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {safePedidosRecientes.length > 0 ? safePedidosRecientes.map(pedido => {
                                const { bg, color } = getStatusColor(pedido.estado);
                                return (
                                    <tr key={pedido.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                                        <td style={{ padding: '12px 0', color: 'var(--admin-text-main)', fontWeight: 'bold' }}>
                                            <Link href={`/admin/pedidos/${pedido.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                                {pedido.codigo}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '12px 0', color: 'var(--admin-text-muted)' }}>
                                            {pedido.usuario_nombre === 'Cliente' ? (
                                                <span style={{ color: '#475569', fontStyle: 'italic', background: 'rgba(71,85,105,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Cliente Eliminado</span>
                                            ) : (
                                                pedido.usuario_nombre
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 0', color: 'var(--admin-text-main)', fontWeight: 'bold' }}>S/ {pedido.total}</td>
                                        <td style={{ padding: '12px 0', color: 'var(--admin-text-muted)' }}>
                                            {new Date(pedido.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '12px 0', textAlign: 'right' }}>
                                            <span style={{ background: bg, color: color, padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                                {pedido.estado}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '20px 0', textAlign: 'center', color: 'var(--admin-text-muted)' }}>No hay pedidos recientes.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>

                {/* Top Productos Más Vendidos */}
                <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Top Productos Vendidos (POS)</h2>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {safeTopProductosVendidos.length > 0 ? (
                            safeTopProductosVendidos.map((prod, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--admin-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: index === 0 ? '#111827' : 'var(--admin-bg-main)', color: index === 0 ? 'white' : 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                                            {index + 1}
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--admin-text-main)', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {prod.nombre}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 'bold', color: 'var(--admin-text-main)', fontSize: '14px' }}>
                                        {prod.cantidad} <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)', fontWeight: 'normal' }}>u.</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: '40px 0' }}>No hay ventas registradas en POS aún.</div>
                        )}
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
