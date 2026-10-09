import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from 'recharts';

/* ═══════════════════════════════════════════════
   DESIGN TOKENS — Premium SaaS palette (Strict #004797)
   ═══════════════════════════════════════════════ */
const T = {
    primary:      '#004797',
    primaryLight: '#E6F0F9',
    primaryDark:  '#002D62',
    // Surfaces
    cardBg:       '#ffffff',
    cardBorder:   '#E2E8F0',
    cardHover:    '#F8FAFC',
    // Text
    textMain:     '#1E293B',
    textSub:      '#475569',
    textMuted:    '#94A3B8',
    // Chart
    gridStroke:   '#F1F5F9',
    tooltipBg:    '#ffffff',
};

// Monochromatic derivatives of #004797 for charts
const CHART_COLORS = ['#002D62', '#004797', '#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE'];

/* ═══════════════════════════════════════════════
   Reusable micro-components & SVGs
   ═══════════════════════════════════════════════ */

const Icons = {
    Money: () => (
        <svg width="24" height="24" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
    ),
    Box: () => (
        <svg width="24" height="24" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
        </svg>
    ),
    Ticket: () => (
        <svg width="24" height="24" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5.25a3 3 0 0 1-6 0V5H4v14h16V5h-5v.25z"/>
            <path d="M9 10h6M9 14h6"/>
        </svg>
    ),
    Repeat: () => (
        <svg width="24" height="24" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 1l4 4-4 4"/>
            <path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4"/>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
    )
};

const tooltipStyle = {
    background: T.tooltipBg,
    border: `1px solid ${T.cardBorder}`,
    borderRadius: '8px',
    color: T.textMain,
    boxShadow: '0 10px 25px -5px rgba(0, 71, 151, 0.1), 0 8px 10px -6px rgba(0, 71, 151, 0.1)',
    padding: '12px 16px',
};

function Card({ children, style, hover = true, className = '' }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className={className}
            onMouseEnter={() => hover && setHovered(true)}
            onMouseLeave={() => hover && setHovered(false)}
            style={{
                background: T.cardBg,
                border: `1px solid ${T.cardBorder}`,
                borderRadius: '12px',
                padding: '24px',
                transition: 'all 0.2s ease',
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hovered
                    ? '0 10px 25px -5px rgba(0, 71, 151, 0.08), 0 8px 10px -6px rgba(0, 71, 151, 0.04)'
                    : '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
                ...style,
            }}
        >
            {children}
        </div>
    );
}

function KpiCard({ label, value, subValue, IconComponent }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: T.cardBg,
                border: `1px solid ${hovered ? T.primary : T.cardBorder}`,
                borderRadius: '12px',
                padding: '24px',
                transition: 'all 0.2s ease',
                transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                boxShadow: hovered
                    ? `0 12px 25px -5px ${T.primaryLight}, 0 8px 10px -6px ${T.primaryLight}`
                    : '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Subtle glow accent */}
            <div style={{
                position: 'absolute', top: '-20%', right: '-20%', width: '100px', height: '100px',
                background: `radial-gradient(circle, ${T.primaryLight} 0%, transparent 70%)`,
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                <div>
                    <div style={{
                        fontSize: '13px', fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.05em', color: T.textMuted, marginBottom: '8px',
                    }}>
                        {label}
                    </div>
                    <div style={{
                        fontSize: '22px', fontWeight: 700, color: T.textMain,
                        lineHeight: 1.1, letterSpacing: '-0.02em',
                    }}>
                        {value}
                    </div>
                    {subValue && (
                        <div style={{ fontSize: '14px', color: T.textSub, marginTop: '8px' }}>
                            {subValue}
                        </div>
                    )}
                </div>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: T.primaryLight, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                    transition: 'all 0.2s ease',
                    transform: hovered ? 'scale(1.05)' : 'scale(1)',
                }}>
                    <IconComponent />
                </div>
            </div>
        </div>
    );
}

function SectionTitle({ children, subtitle }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <h2 style={{
                fontSize: '16px', fontWeight: 600, color: T.textMain,
                margin: 0, letterSpacing: '-0.01em',
            }}>
                {children}
            </h2>
            {subtitle && (
                <p style={{ fontSize: '14px', color: T.textMuted, margin: '4px 0 0' }}>
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
                    width: '8px', height: '8px', borderRadius: '4px',
                    background: color, flexShrink: 0,
                }} />
                <span style={{ fontSize: '14px', color: T.textSub }}>{label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: T.textMain }}>{value}</span>
                {percentage !== undefined && (
                    <span style={{
                        fontSize: '12px', fontWeight: 600, color: T.primaryDark, background: T.primaryLight,
                        padding: '4px 8px', borderRadius: '6px',
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
            fontSize: '12px', fontWeight: 600, color: T.primaryDark,
            background: T.primaryLight, padding: '4px 12px', borderRadius: '20px',
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

    // Peak hours — compute max for heat intensity
    const allHourCounts = Object.values(peakHoursHeatmap || {}).flat();
    const maxHour = Math.max(1, ...allHourCounts);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Overwrite any colored state data with our monochromatic theme
    const thematicEstados = chartEstados.map((st, i) => ({
        ...st,
        color: CHART_COLORS[i % CHART_COLORS.length]
    }));

    return (
        <AdminLayout logoUrl={null}>
            <Head title="Analíticas" />
            {metricErrors.length > 0 && (
                <div style={{
                    padding: '16px', background: '#F8FAFC', border: `1px solid ${T.cardBorder}`, 
                    borderRadius: '8px', marginBottom: '24px', color: T.textSub, fontSize: '14px'
                }}>
                    Nota: Algunas métricas no están disponibles. Revisa el registro de errores para más detalles.
                </div>
            )}

            {/* ───── Page Header ───── */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{
                    fontSize: '24px', fontWeight: 700, color: T.textMain,
                    margin: 0, letterSpacing: '-0.02em',
                }}>
                    Analíticas y Reportes
                </h1>
                <p style={{ fontSize: '15px', color: T.textMuted, margin: '8px 0 0' }}>
                    Visión general del rendimiento de tu negocio
                </p>
            </div>

            {/* ───── KPI Cards ───── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px',
                marginBottom: '32px',
            }}>
                <KpiCard
                    label="Ingresos Históricos"
                    value={`S/ ${fmt(safeKpis.ingresosHistorico)}`}
                    subValue="Total acumulado"
                    IconComponent={Icons.Money}
                />
                <KpiCard
                    label="Pedidos del Mes"
                    value={safeKpis.pedidosMes}
                    subValue="Mes actual"
                    IconComponent={Icons.Box}
                />
                <KpiCard
                    label="Ticket Promedio"
                    value={`S/ ${fmt(safeKpis.ticketPromedio)}`}
                    subValue="Por pedido completado"
                    IconComponent={Icons.Ticket}
                />
                <KpiCard
                    label="Tasa Repetición"
                    value={`${safeRetention.repeatRate}%`}
                    subValue={`CLV: S/ ${fmt(safeRetention.clv)}`}
                    IconComponent={Icons.Repeat}
                />
            </div>

            {/* ───── Charts Row 1: Revenue + Status ───── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '24px',
                marginBottom: '24px',
            }}>
                {/* Revenue Area Chart */}
                <Card>
                    <SectionTitle subtitle="Ingresos completados por mes">
                        Ventas · Últimos 6 Meses
                    </SectionTitle>
                    <div style={{ height: '300px', marginTop: '24px' }}>
                        <ResponsiveContainer>
                            <AreaChart data={chartVentas} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={T.primary} stopOpacity={0.2} />
                                        <stop offset="100%" stopColor={T.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke={T.gridStroke} vertical={false} />
                                <XAxis
                                    dataKey="mes" stroke={T.textMuted} fontSize={12}
                                    tickLine={false} axisLine={false} dy={10}
                                />
                                <YAxis
                                    stroke={T.textMuted} fontSize={12}
                                    tickLine={false} axisLine={false} dx={-10}
                                    tickFormatter={(v) => v >= 1000 ? `S/${(v / 1000).toFixed(0)}k` : `S/${v}`}
                                />
                                <RechartsTooltip
                                    contentStyle={tooltipStyle}
                                    formatter={(v) => [`S/ ${fmt(v)}`, 'Ventas']}
                                    cursor={{ stroke: T.primaryLight, strokeWidth: 2 }}
                                />
                                <Area
                                    type="monotone" dataKey="total"
                                    stroke={T.primary} strokeWidth={3}
                                    fill="url(#gradVentas)"
                                    dot={{ r: 4, fill: T.cardBg, stroke: T.primary, strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: T.primary, stroke: T.cardBg, strokeWidth: 2 }}
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
                    <div style={{ height: '220px', marginTop: '16px' }}>
                        {thematicEstados.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={thematicEstados} cx="50%" cy="50%"
                                        innerRadius={65} outerRadius={90}
                                        paddingAngle={2} dataKey="value"
                                        stroke={T.cardBg} strokeWidth={2}
                                    >
                                        {thematicEstados.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.textMuted, fontSize: '14px' }}>
                                Sin datos
                            </div>
                        )}
                    </div>
                    {/* Legend inline */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px', justifyContent: 'center' }}>
                        {thematicEstados.map((e, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '4px', background: e.color }} />
                                <span style={{ fontSize: '13px', color: T.textSub }}>{e.name} ({e.value})</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* ───── Charts Row 2: Profitability + Categories ───── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                marginBottom: '24px',
            }}>
                {/* Product Profitability */}
                <Card>
                    <SectionTitle subtitle="Top 5 por ingresos generados">
                        Ingresos por Producto
                    </SectionTitle>
                    <div style={{ height: '240px', marginTop: '24px' }}>
                        <ResponsiveContainer>
                            <BarChart data={productProfit} margin={{ top: 5, right: 8, left: -10, bottom: 0 }} layout="vertical">
                                <CartesianGrid stroke={T.gridStroke} horizontal={false} />
                                <XAxis type="number" stroke={T.textMuted} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `S/${(v/1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="nombre" stroke={T.textMuted} fontSize={12} tickLine={false} axisLine={false} width={100} />
                                <RechartsTooltip contentStyle={tooltipStyle} formatter={(v) => [`S/ ${fmt(v)}`, 'Ingreso']} cursor={{ fill: T.cardHover }} />
                                <Bar dataKey="profit" radius={[0, 4, 4, 0]} barSize={20}>
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
                    <div style={{ height: '240px', marginTop: '24px' }}>
                        <ResponsiveContainer>
                            <BarChart data={categoryAnalysis} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradCat" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={T.primary} stopOpacity={1} />
                                        <stop offset="100%" stopColor={T.primary} stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke={T.gridStroke} vertical={false} />
                                <XAxis dataKey="nombre" stroke={T.textMuted} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke={T.textMuted} fontSize={12} tickLine={false} axisLine={false} dx={-10} tickFormatter={(v) => `S/${(v/1000).toFixed(0)}k`} />
                                <RechartsTooltip contentStyle={tooltipStyle} formatter={(v) => [`S/ ${fmt(v)}`, 'Ingresos']} cursor={{ fill: T.cardHover }} />
                                <Bar dataKey="ingresos" fill="url(#gradCat)" radius={[4, 4, 0, 0]} barSize={36} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* ───── Top Products Table ───── */}
            <Card style={{ marginBottom: '24px' }}>
                <SectionTitle subtitle="Productos con más unidades vendidas">
                    Top Productos
                </SectionTitle>
                <div style={{ marginTop: '24px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.textMuted, borderBottom: `1px solid ${T.cardBorder}` }}>#</th>
                                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.textMuted, borderBottom: `1px solid ${T.cardBorder}` }}>Producto</th>
                                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.textMuted, borderBottom: `1px solid ${T.cardBorder}`, textAlign: 'center' }}>Unidades</th>
                                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.textMuted, borderBottom: `1px solid ${T.cardBorder}`, textAlign: 'right' }}>Ingresos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProductos.length > 0 ? topProductos.map((prod, i) => (
                                <tr
                                    key={i}
                                    style={{
                                        transition: 'all 0.2s ease',
                                        cursor: 'default',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = T.cardHover}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '16px', borderBottom: `1px solid ${T.cardBorder}` }}>
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '8px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '13px', fontWeight: 600,
                                            background: i < 3 ? T.primaryDark : T.cardHover,
                                            color: i < 3 ? '#ffffff' : T.textSub,
                                        }}>
                                            {i + 1}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', borderBottom: `1px solid ${T.cardBorder}`, color: T.textMain, fontWeight: 500, fontSize: '14px' }}>
                                        {prod.nombre}
                                    </td>
                                    <td style={{ padding: '16px', borderBottom: `1px solid ${T.cardBorder}`, textAlign: 'center' }}>
                                        <Badge>{prod.ventas} uds</Badge>
                                    </td>
                                    <td style={{ padding: '16px', borderBottom: `1px solid ${T.cardBorder}`, textAlign: 'right', color: T.textMain, fontWeight: 600, fontSize: '14px' }}>
                                        S/ {fmt(prod.ingresos)}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: T.textMuted, fontSize: '14px' }}>
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                marginBottom: '24px',
            }}>
                {/* Channel Comparison */}
                <Card>
                    <SectionTitle subtitle="Distribución de ingresos">
                        Canales de Venta
                    </SectionTitle>
                    <div style={{ height: '180px', marginTop: '16px' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={channelData} cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={75}
                                    paddingAngle={2} dataKey="value" stroke={T.cardBg} strokeWidth={2}
                                >
                                    <Cell fill={T.primary} />
                                    <Cell fill={T.primaryDark} />
                                </Pie>
                                <RechartsTooltip contentStyle={tooltipStyle} formatter={(v) => [`S/ ${fmt(v)}`]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                        <StatRow label="Web" value={`S/ ${fmt(safeChannel.web.total)}`} color={T.primary} percentage={safeChannel.web.pct} />
                        <StatRow label="POS" value={`S/ ${fmt(safeChannel.pos.total)}`} color={T.primaryDark} percentage={safeChannel.pos.pct} />
                    </div>
                </Card>

                {/* Cart Abandonment */}
                <Card>
                    <SectionTitle subtitle="Carritos sin convertir">
                        Carritos Abandonados
                    </SectionTitle>
                    <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
                        <div style={{
                            width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto',
                            background: `conic-gradient(${T.primary} ${safeCart.rate}%, ${T.primaryLight} 0)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative',
                        }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: T.cardBg, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', flexDirection: 'column',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                <span style={{ fontSize: '24px', fontWeight: 700, color: T.textMain }}>{safeCart.rate}%</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                        <StatRow label="Total carritos" value={safeCart.totalCarts} color={T.textMuted} />
                        <StatRow label="Abandonados" value={safeCart.abandoned} color={T.primary} />
                    </div>
                </Card>

                {/* Returns / Devoluciones */}
                <Card>
                    <SectionTitle subtitle="Productos con devoluciones registradas">
                        Devoluciones
                    </SectionTitle>
                    {returnRates.length > 0 ? (
                        <div style={{ marginTop: '24px' }}>
                            {returnRates.map((r, i) => (
                                <StatRow
                                    key={i}
                                    label={r.nombre}
                                    value={`${r.devoluciones} dev.`}
                                    color={CHART_COLORS[i % CHART_COLORS.length]}
                                    percentage={r.porcentaje}
                                />
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: T.textMuted }}>
                            <svg width="40" height="40" fill="none" stroke={T.primaryLight} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>Sin devoluciones registradas</span>
                        </div>
                    )}
                </Card>
            </div>

            {/* ───── Peak Hours Heatmap ───── */}
            <Card style={{ marginBottom: '24px' }}>
                <SectionTitle subtitle="Intensidad de pedidos completados por día y hora">
                    Mapa de Calor · Horarios Pico
                </SectionTitle>
                <div style={{ marginTop: '24px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '4px', textAlign: 'center' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '8px 12px', fontSize: '12px', color: T.textMuted, fontWeight: 600, textAlign: 'left' }}>Día</th>
                                {Array.from({ length: 24 }, (_, i) => (
                                    <th key={i} style={{ padding: '8px 4px', fontSize: '11px', color: T.textMuted, fontWeight: 500 }}>
                                        {i.toString().padStart(2, '0')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(peakHoursHeatmap || {}).map(([dayIdx, hours]) => (
                                <tr key={dayIdx}>
                                    <td style={{
                                        padding: '8px 12px', fontSize: '13px', color: T.textSub,
                                        fontWeight: 500, textAlign: 'left', whiteSpace: 'nowrap',
                                    }}>
                                        {dayNames[(dayIdx - 1)] || ''}
                                    </td>
                                    {(hours || []).map((cnt, h) => {
                                        const intensity = maxHour > 0 ? cnt / maxHour : 0;
                                        return (
                                            <td key={h} style={{
                                                padding: '6px 4px', fontSize: '11px',
                                                background: intensity > 0
                                                    ? `rgba(0, 71, 151, ${0.1 + intensity * 0.9})`
                                                    : T.cardHover,
                                                borderRadius: '6px',
                                                color: intensity > 0.5 ? '#ffffff' : intensity > 0 ? T.primaryDark : T.textMuted,
                                                fontWeight: intensity > 0.5 ? 600 : 400,
                                                transition: 'all 0.2s ease',
                                                minWidth: '28px',
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
                <Card style={{ marginBottom: '24px' }}>
                    <SectionTitle subtitle="Ciudades con mayor volumen de ventas">
                        Top Ciudades
                    </SectionTitle>
                    <div style={{ marginTop: '24px' }}>
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
