import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from 'recharts';

/* ═══════════════════════════════════════════════
   DESIGN TOKENS — Premium SaaS palette
   ═══════════════════════════════════════════════ */
const T = {
    primary:    '#4f46e5',
    primaryDim: 'rgba(0, 71, 151, 0.12)',
    primaryGlow:'rgba(0, 71, 151, 0.25)',
    accent:     '#6366F1',
    accentDim:  'rgba(99, 102, 241, 0.12)',
    success:    '#10B981',
    successDim: 'rgba(16, 185, 129, 0.12)',
    warning:    '#F59E0B',
    warningDim: 'rgba(245, 158, 11, 0.12)',
    danger:     '#EF4444',
    dangerDim:  'rgba(239, 68, 68, 0.12)',
    // Surfaces
    cardBg:     '#ffffff',
    cardBorder: '#e4e7ef',
    cardHover:  '#fafbfe',
    // Text
    textMain:   '#202839',
    textSub:    '#596579',
    textMuted:  '#64748B',
    // Chart
    gridStroke: '#edf0f6',
    tooltipBg:  '#ffffff',
};

const CHART_COLORS = ['#004797', '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

/* ═══════════════════════════════════════════════
   Reusable micro-components
   ═══════════════════════════════════════════════ */

const tooltipStyle = {
    background: T.tooltipBg,
    border: `1px solid ${T.cardBorder}`,
    borderRadius: '10px',
    color: T.textMain,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    padding: '10px 14px',
    backdropFilter: 'blur(12px)',
};

function Card({ children, style, hover = true, className = '' }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className={className}
            onMouseEnter={() => hover && setHovered(true)}
            onMouseLeave={() => hover && setHovered(false)}
            style={{
                background: hovered ? T.cardHover : T.cardBg,
                border: `1px solid ${hovered ? 'rgba(255,255,255,0.1)' : T.cardBorder}`,
                borderRadius: '12px',
                padding: '24px',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hovered
                    ? '0 12px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.08)'
                    : '0 1px 3px rgba(0, 0, 0, 0.08)',
                ...style,
            }}
        >
            {children}
        </div>
    );
}

function KpiCard({ label, value, subValue, icon, color, colorDim }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? T.cardHover : T.cardBg,
                border: `1px solid ${hovered ? 'rgba(255,255,255,0.1)' : T.cardBorder}`,
                borderRadius: '12px',
                padding: '24px',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hovered
                    ? `0 12px 40px rgba(0,0,0,0.15), 0 0 20px ${colorDim}`
                    : '0 1px 3px rgba(0,0,0,0.08)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Subtle gradient accent */}
            <div style={{
                position: 'absolute', top: 0, right: 0, width: '120px', height: '120px',
                background: `radial-gradient(circle at top right, ${colorDim}, transparent 70%)`,
                pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                <div>
                    <div style={{
                        fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.05em', color: T.textMuted, marginBottom: '8px',
                    }}>
                        {label}
                    </div>
                    <div style={{
                        fontSize: '28px', fontWeight: 700, color: T.textMain,
                        lineHeight: 1.1, letterSpacing: '-0.02em',
                    }}>
                        {value}
                    </div>
                    {subValue && (
                        <div style={{ fontSize: '13px', color: T.textSub, marginTop: '6px' }}>
                            {subValue}
                        </div>
                    )}
                </div>
                <div style={{
                    width: '42px', height: '42px', borderRadius: '10px',
                    background: colorDim, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '20px', flexShrink: 0,
                }}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function SectionTitle({ children, subtitle }) {
    return (
        <div style={{ marginBottom: '4px' }}>
            <h2 style={{
                fontSize: '15px', fontWeight: 600, color: T.textMain,
                margin: 0, letterSpacing: '-0.01em',
            }}>
                {children}
            </h2>
            {subtitle && (
                <p style={{ fontSize: '13px', color: T.textMuted, margin: '4px 0 0' }}>
                    {subtitle}
                </p>
            )}
        </div>
    );
}

function StatRow({ label, value, color, percentage }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0', borderBottom: `1px solid ${T.cardBorder}`,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: color, flexShrink: 0,
                }} />
                <span style={{ fontSize: '13.5px', color: T.textSub }}>{label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: T.textMain }}>{value}</span>
                {percentage !== undefined && (
                    <span style={{
                        fontSize: '11px', fontWeight: 600, color, background: `${color}18`,
                        padding: '2px 7px', borderRadius: '6px',
                    }}>
                        {percentage}%
                    </span>
                )}
            </div>
        </div>
    );
}

function Badge({ children, color }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '12px', fontWeight: 600, color,
            background: `${color}15`, padding: '3px 10px', borderRadius: '20px',
        }}>
            {children}
        </span>
    );
}

/* ═══════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════ */
export default function Index({
    metricErrors = [],
    chartVentas = [],
    chartEstados = [],
    topProductos = [],
    kpis = {},
    retention = {},
    productProfit = [],
    returnRates = [],
    categoryAnalysis = [],
    cartAbandonment = {},
    channelComparison = {},
    geographicHeatmap = [],
    peakHoursHeatmap = {}
}) {
    const safeKpis = {
        ingresosHistorico: kpis?.ingresosHistorico ?? 0,
        pedidosMes: kpis?.pedidosMes ?? 0,
        ticketPromedio: kpis?.ticketPromedio ?? 0,
    };
    const safeRetention = { repeatRate: retention?.repeatRate ?? 0, clv: retention?.clv ?? 0 };
    const safeCart = { totalCarts: cartAbandonment?.totalCarts ?? 0, abandoned: cartAbandonment?.abandoned ?? 0, rate: cartAbandonment?.rate ?? 0 };
    const safeChannel = {
        web: { total: channelComparison?.web?.total ?? 0, pct: channelComparison?.web?.pct ?? 0 },
        pos: { total: channelComparison?.pos?.total ?? 0, pct: channelComparison?.pos?.pct ?? 0 },
    };

    const fmt = (n) => Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const channelData = [
        { name: 'Web', value: safeChannel.web.total, pct: safeChannel.web.pct },
        { name: 'POS', value: safeChannel.pos.total, pct: safeChannel.pos.pct },
    ];

    const medalColors = ['#004797', '#94A3B8', '#D97706'];

    // Peak hours — compute max for heat intensity
    const allHourCounts = Object.values(peakHoursHeatmap || {}).flat();
    const maxHour = Math.max(1, ...allHourCounts);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
        <AdminLayout logoUrl={null}>
            <Head title="Analíticas" />
            {metricErrors.length > 0 && <p role="alert" style={{padding: 16, color: "#B45309"}}>Hay métricas no disponibles. No interpretes los valores vacíos como cero; revisa el registro de errores.</p>}

            {/* ───── Page Header ───── */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{
                    fontSize: '22px', fontWeight: 700, color: T.textMain,
                    margin: 0, letterSpacing: '-0.02em',
                }}>
                    Analíticas y Reportes
                </h1>
                <p style={{ fontSize: '14px', color: T.textMuted, margin: '6px 0 0' }}>
                    Visión general del rendimiento de tu negocio
                </p>
            </div>

            {/* ───── KPI Cards ───── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
            }}>
                <KpiCard
                    label="Ingresos Históricos"
                    value={`S/ ${fmt(safeKpis.ingresosHistorico)}`}
                    subValue="Total acumulado"
                    icon="💰"
                    color={T.primary}
                    colorDim={T.primaryDim}
                />
                <KpiCard
                    label="Pedidos del Mes"
                    value={safeKpis.pedidosMes}
                    subValue="Mes actual"
                    icon="📦"
                    color={T.accent}
                    colorDim={T.accentDim}
                />
                <KpiCard
                    label="Ticket Promedio"
                    value={`S/ ${fmt(safeKpis.ticketPromedio)}`}
                    subValue="Por pedido completado"
                    icon="🎫"
                    color={T.success}
                    colorDim={T.successDim}
                />
                <KpiCard
                    label="Tasa Repetición"
                    value={`${safeRetention.repeatRate}%`}
                    subValue={`CLV: S/ ${fmt(safeRetention.clv)}`}
                    icon="🔄"
                    color={T.warning}
                    colorDim={T.warningDim}
                />
            </div>

            {/* ───── Charts Row 1: Revenue + Status ───── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1.8fr 1fr',
                gap: '16px',
                marginBottom: '16px',
            }}>
                {/* Revenue Area Chart */}
                <Card>
                    <SectionTitle subtitle="Ingresos completados por mes">
                        Ventas · Últimos 6 Meses
                    </SectionTitle>
                    <div style={{ height: '280px', marginTop: '16px' }}>
                        <ResponsiveContainer>
                            <AreaChart data={chartVentas} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={T.primary} stopOpacity={0.25} />
                                        <stop offset="100%" stopColor={T.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke={T.gridStroke} vertical={false} />
                                <XAxis
                                    dataKey="mes" stroke={T.textMuted} fontSize={11}
                                    tickLine={false} axisLine={false}
                                />
                                <YAxis
                                    stroke={T.textMuted} fontSize={11}
                                    tickLine={false} axisLine={false}
                                    tickFormatter={(v) => v >= 1000 ? `S/${(v / 1000).toFixed(0)}k` : `S/${v}`}
                                />
                                <RechartsTooltip
                                    contentStyle={tooltipStyle}
                                    formatter={(v) => [`S/ ${fmt(v)}`, 'Ventas']}
                                    cursor={{ stroke: T.primary, strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area
                                    type="monotone" dataKey="total"
                                    stroke={T.primary} strokeWidth={2.5}
                                    fill="url(#gradVentas)"
                                    dot={{ r: 4, fill: T.primary, stroke: '#0F172A', strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: T.primary, stroke: '#fff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Order Status Donut */}
                <Card>
                    <SectionTitle subtitle="Distribución actual">
                        Estado de Pedidos
                    </SectionTitle>
                    <div style={{ height: '200px', marginTop: '8px' }}>
                        {chartEstados.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={chartEstados} cx="50%" cy="50%"
                                        innerRadius={55} outerRadius={80}
                                        paddingAngle={4} dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {chartEstados.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.textMuted, fontSize: '13px' }}>
                                Sin datos
                            </div>
                        )}
                    </div>
                    {/* Legend inline */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px', justifyContent: 'center' }}>
                        {chartEstados.map((e, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: e.color }} />
                                <span style={{ fontSize: '11px', color: T.textSub }}>{e.name} ({e.value})</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* ───── Charts Row 2: Profitability + Categories ───── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px',
            }}>
                {/* Product Profitability */}
                <Card>
                    <SectionTitle subtitle="Top 5 por ingresos generados">
                        Ingresos por Producto
                    </SectionTitle>
                    <div style={{ height: '220px', marginTop: '12px' }}>
                        <ResponsiveContainer>
                            <BarChart data={productProfit} margin={{ top: 5, right: 8, left: -10, bottom: 0 }} layout="vertical">
                                <CartesianGrid stroke={T.gridStroke} horizontal={false} />
                                <XAxis type="number" stroke={T.textMuted} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `S/${(v/1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="nombre" stroke={T.textMuted} fontSize={11} tickLine={false} axisLine={false} width={90} />
                                <RechartsTooltip contentStyle={tooltipStyle} formatter={(v) => [`S/ ${fmt(v)}`, 'Ingreso']} />
                                <Bar dataKey="profit" radius={[0, 6, 6, 0]} barSize={18}>
                                    {productProfit.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Category Analysis */}
                <Card>
                    <SectionTitle subtitle="Categorías con más ventas completadas">
                        Categorías por Ingresos
                    </SectionTitle>
                    <div style={{ height: '220px', marginTop: '12px' }}>
                        <ResponsiveContainer>
                            <BarChart data={categoryAnalysis} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradCat" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={T.accent} stopOpacity={0.9} />
                                        <stop offset="100%" stopColor={T.accent} stopOpacity={0.4} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke={T.gridStroke} vertical={false} />
                                <XAxis dataKey="nombre" stroke={T.textMuted} fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke={T.textMuted} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `S/${(v/1000).toFixed(0)}k`} />
                                <RechartsTooltip contentStyle={tooltipStyle} formatter={(v) => [`S/ ${fmt(v)}`, 'Ingresos']} />
                                <Bar dataKey="ingresos" fill="url(#gradCat)" radius={[6, 6, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* ───── Top Products Table ───── */}
            <Card style={{ marginBottom: '16px' }}>
                <SectionTitle subtitle="Productos con más unidades vendidas">
                    Top Productos
                </SectionTitle>
                <div style={{ marginTop: '16px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.textMuted, borderBottom: `1px solid ${T.cardBorder}` }}>#</th>
                                <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.textMuted, borderBottom: `1px solid ${T.cardBorder}` }}>Producto</th>
                                <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.textMuted, borderBottom: `1px solid ${T.cardBorder}`, textAlign: 'center' }}>Unidades</th>
                                <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.textMuted, borderBottom: `1px solid ${T.cardBorder}`, textAlign: 'right' }}>Ingresos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProductos.length > 0 ? topProductos.map((prod, i) => (
                                <tr
                                    key={i}
                                    style={{
                                        transition: 'background 0.2s ease',
                                        cursor: 'default',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = T.cardHover}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '14px', borderBottom: `1px solid ${T.cardBorder}` }}>
                                        <div style={{
                                            width: '26px', height: '26px', borderRadius: '8px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '12px', fontWeight: 700,
                                            background: i < 3 ? `${medalColors[i]}18` : 'rgba(255,255,255,0.04)',
                                            color: i < 3 ? medalColors[i] : T.textMuted,
                                            border: i < 3 ? `1px solid ${medalColors[i]}30` : `1px solid ${T.cardBorder}`,
                                        }}>
                                            {i + 1}
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px', borderBottom: `1px solid ${T.cardBorder}`, color: T.textMain, fontWeight: 500, fontSize: '13.5px' }}>
                                        {prod.nombre}
                                    </td>
                                    <td style={{ padding: '14px', borderBottom: `1px solid ${T.cardBorder}`, textAlign: 'center' }}>
                                        <Badge color={T.primary}>{prod.ventas} uds</Badge>
                                    </td>
                                    <td style={{ padding: '14px', borderBottom: `1px solid ${T.cardBorder}`, textAlign: 'right', color: T.success, fontWeight: 600, fontSize: '13.5px' }}>
                                        S/ {fmt(prod.ingresos)}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: T.textMuted, fontSize: '13px' }}>
                                        No hay datos de productos.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* ───── Row 3: Channels + Cart Abandonment + Returns ───── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '16px',
                marginBottom: '16px',
            }}>
                {/* Channel Comparison */}
                <Card>
                    <SectionTitle subtitle="Distribución de ingresos">
                        Canales de Venta
                    </SectionTitle>
                    <div style={{ height: '160px', marginTop: '8px' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={channelData} cx="50%" cy="50%"
                                    innerRadius={45} outerRadius={65}
                                    paddingAngle={4} dataKey="value" strokeWidth={0}
                                >
                                    <Cell fill={T.primary} />
                                    <Cell fill={T.warning} />
                                </Pie>
                                <RechartsTooltip contentStyle={tooltipStyle} formatter={(v) => [`S/ ${fmt(v)}`]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: '4px' }}>
                        <StatRow label="Web" value={`S/ ${fmt(safeChannel.web.total)}`} color={T.primary} percentage={safeChannel.web.pct} />
                        <StatRow label="POS" value={`S/ ${fmt(safeChannel.pos.total)}`} color={T.warning} percentage={safeChannel.pos.pct} />
                    </div>
                </Card>

                {/* Cart Abandonment */}
                <Card>
                    <SectionTitle subtitle="Carritos sin convertir">
                        Carritos Abandonados
                    </SectionTitle>
                    <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
                        <div style={{
                            width: '90px', height: '90px', borderRadius: '50%', margin: '0 auto',
                            background: `conic-gradient(${T.danger} ${safeCart.rate}%, ${T.cardBorder} 0)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative',
                        }}>
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '50%',
                                background: '#0F172A', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', flexDirection: 'column',
                            }}>
                                <span style={{ fontSize: '22px', fontWeight: 700, color: T.danger }}>{safeCart.rate}%</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '4px' }}>
                        <StatRow label="Total carritos" value={safeCart.totalCarts} color={T.textSub} />
                        <StatRow label="Abandonados" value={safeCart.abandoned} color={T.danger} />
                    </div>
                </Card>

                {/* Returns / Devoluciones */}
                <Card>
                    <SectionTitle subtitle="Productos con devoluciones registradas">
                        Devoluciones
                    </SectionTitle>
                    {returnRates.length > 0 ? (
                        <div style={{ marginTop: '12px' }}>
                            {returnRates.map((r, i) => (
                                <StatRow
                                    key={i}
                                    label={r.nombre}
                                    value={`${r.devoluciones} dev.`}
                                    color={[T.danger, T.warning, T.primary, T.accent, T.success][i % 5]}
                                    percentage={r.porcentaje}
                                />
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: T.textMuted }}>
                            <span style={{ fontSize: '28px', marginBottom: '8px' }}>✅</span>
                            <span style={{ fontSize: '13px' }}>Sin devoluciones registradas</span>
                        </div>
                    )}
                </Card>
            </div>

            {/* ───── Peak Hours Heatmap ───── */}
            <Card style={{ marginBottom: '16px' }}>
                <SectionTitle subtitle="Intensidad de pedidos completados por día y hora">
                    Mapa de Calor · Horarios Pico
                </SectionTitle>
                <div style={{ marginTop: '16px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px', textAlign: 'center' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '6px 8px', fontSize: '11px', color: T.textMuted, fontWeight: 600, textAlign: 'left' }}>Día</th>
                                {Array.from({ length: 24 }, (_, i) => (
                                    <th key={i} style={{ padding: '6px 2px', fontSize: '10px', color: T.textMuted, fontWeight: 500 }}>
                                        {i.toString().padStart(2, '0')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(peakHoursHeatmap || {}).map(([dayIdx, hours]) => (
                                <tr key={dayIdx}>
                                    <td style={{
                                        padding: '6px 8px', fontSize: '12px', color: T.textSub,
                                        fontWeight: 500, textAlign: 'left', whiteSpace: 'nowrap',
                                    }}>
                                        {dayNames[(dayIdx - 1)] || ''}
                                    </td>
                                    {(hours || []).map((cnt, h) => {
                                        const intensity = maxHour > 0 ? cnt / maxHour : 0;
                                        return (
                                            <td key={h} style={{
                                                padding: '4px 2px', fontSize: '10px',
                                                background: intensity > 0
                                                    ? `rgba(0, 71, 151, ${0.08 + intensity * 0.55})`
                                                    : 'rgba(255,255,255,0.02)',
                                                borderRadius: '4px',
                                                color: intensity > 0.5 ? '#fff' : intensity > 0 ? T.primary : T.textMuted,
                                                fontWeight: intensity > 0.5 ? 700 : 400,
                                                transition: 'all 0.2s ease',
                                                minWidth: '22px',
                                            }}>
                                                {cnt > 0 ? cnt : '·'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* ───── Geographic Data (only if available) ───── */}
            {(geographicHeatmap || []).length > 0 && (
                <Card style={{ marginBottom: '16px' }}>
                    <SectionTitle subtitle="Ciudades con mayor volumen de ventas">
                        Top Ciudades
                    </SectionTitle>
                    <div style={{ marginTop: '12px' }}>
                        {geographicHeatmap.map((g, i) => (
                            <StatRow
                                key={i}
                                label={g.ciudad || 'Sin ciudad'}
                                value={`S/ ${fmt(g.total)}`}
                                color={CHART_COLORS[i % CHART_COLORS.length]}
                            />
                        ))}
                    </div>
                </Card>
            )}

        </AdminLayout>
    );
}
