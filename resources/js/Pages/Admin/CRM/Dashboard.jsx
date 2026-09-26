import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import TwentyCrmLayout from '../../../Layouts/TwentyCrmLayout';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    ScatterChart,
    Scatter,
    ZAxis,
} from 'recharts';
import {
    Users,
    DollarSign,
    Target,
    Clock,
    TrendingUp,
    TrendingDown,
    Activity,
    ArrowUpRight,
    Zap,
    ChevronLeft,
} from 'lucide-react';

export default function Dashboard({ metrics }) {
    const {
        kpis = { total_revenue: 0, win_rate: 0, avg_ltv: 0, deal_velocity: 0, total_deals: 0 },
        top_deals = [],
        funnel = [],
        monthly_sales = [],
        win_loss_ratio = [],
        scatter_data = [],
        pipeline_forecast = [],
    } = metrics || {};
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        setAnimated(true);
    }, []);

    const formatMoney = (value) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
            maximumFractionDigits: 0,
        }).format(value || 0);
    };

    const handleRefresh = () => {
        router.reload({ only: ['metrics'] });
    };

    // Staggered animation styles
    const fadeUpStyle = (delay) => ({
        opacity: animated ? 1 : 0,
        transform: animated ? 'translateY(0)' : 'translateY(20px)',
        transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
    });

    const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
        if (active && payload && payload.length) {
            return (
                <div
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid var(--twenty-border)',
                        padding: '12px',
                        borderRadius: '8px',
                        boxShadow:
                            '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <p
                        style={{
                            margin: '0 0 8px 0',
                            fontWeight: 600,
                            fontSize: '13px',
                            color: 'var(--twenty-text-muted)',
                        }}
                    >
                        {label}
                    </p>
                    {payload.map((entry, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '4px',
                            }}
                        >
                            <div
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor:
                                        entry.color || entry.fill || 'var(--twenty-primary)',
                                }}
                            />
                            <span
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: 'var(--twenty-text-main)',
                                }}
                            >
                                {entry.name}: {prefix}
                                {prefix === 'S/'
                                    ? formatMoney(entry.value).replace('S/', '').trim()
                                    : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <TwentyCrmLayout title="Dashboard Analítico">
            <Head title="Dashboard - CRM" />

            <style>{`
                .twenty-card {
                    background: #ffffff;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
                    transition: all 0.2s ease;
                }
                .twenty-card:hover {
                    box-shadow: 0 10px 25px -5px rgba(0, 180, 255, 0.15);
                    transform: translateY(-2px);
                    border-color: rgba(0, 180, 255, 0.3);
                }
                .kpi-icon-wrapper {
                    width: 48px; height: 48px;
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s ease;
                }
                .twenty-card:hover .kpi-icon-wrapper {
                    transform: scale(1.05);
                }
                .recharts-default-tooltip {
                    border-radius: 12px !important;
                    border: 1px solid #E2E8F0 !important;
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important;
                }
                .gradient-text {
                    background: linear-gradient(135deg, #00B4FF 0%, #009BE0 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .btn-volver {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: #ffffff;
                    border: 1px solid #E2E8F0;
                    border-radius: 8px;
                    color: #475569;
                    font-weight: 600;
                    font-size: 13px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                }
                .btn-volver:hover, .btn-volver:focus {
                    background: #F1F5F9;
                    color: #1E293B;
                    border-color: #94A3B8;
                    transform: translateY(-1px);
                    outline: none;
                }
            `}</style>

            <div
                style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    paddingBottom: '40px',
                }}
            >
                {/* Header Section */}
                <div
                    style={{
                        ...fadeUpStyle(0),
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #E2E8F0',
                        paddingBottom: '24px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', backgroundColor: '#F0F9FF', borderRadius: '10px', color: '#00B4FF' }}>
                            <Activity size={24} />
                        </div>
                        <h2
                            style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#1E293B', letterSpacing: '-0.02em' }}
                        >
                            Visión General
                        </h2>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <a
                            href="/admin/crm/export?type=dashboard"
                            className="btn-volver"
                        >
                            Exportar
                        </a>
                        <button
                            onClick={handleRefresh}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#00B4FF', color: '#fff', border: 'none',
                                borderRadius: '8px', padding: '10px 16px', fontWeight: 600, fontSize: '13px',
                                cursor: 'pointer', boxShadow: '0 2px 4px rgba(0, 180, 255, 0.2)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 180, 255, 0.3)'; e.currentTarget.style.backgroundColor = '#009BE0'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 180, 255, 0.2)'; e.currentTarget.style.backgroundColor = '#00B4FF'; }}
                        >
                            <Zap size={16} /> Actualizar
                        </button>
                    </div>
                </div>

                {/* KPIs Row */}
                <div
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}
                >
                    {/* KPI 1: Ingresos Totales */}
                    <div className="twenty-card" style={fadeUpStyle(0.1)}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '16px',
                            }}
                        >
                            <div
                                className="kpi-icon-wrapper"
                                style={{ background: 'rgba(0, 180, 255, 0.1)', color: '#00B4FF' }}
                            >
                                <DollarSign size={20} />
                            </div>
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: '#00B4FF',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    background: 'rgba(0, 180, 255, 0.1)',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                }}
                            >
                                <TrendingUp size={12} /> +12.5%
                            </span>
                        </div>
                        <div
                            style={{
                                fontSize: '13px',
                                color: '#64748B',
                                fontWeight: 600,
                                marginBottom: '4px',
                            }}
                        >
                            Ingresos Totales
                        </div>
                        <div
                            style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                color: '#1E293B',
                                letterSpacing: '-0.5px',
                            }}
                        >
                            {formatMoney(kpis?.total_revenue)}
                        </div>
                    </div>

                    {/* KPI 2: Tasa de Conversión */}
                    <div className="twenty-card" style={fadeUpStyle(0.2)}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '16px',
                            }}
                        >
                            <div
                                className="kpi-icon-wrapper"
                                style={{ background: 'rgba(0, 180, 255, 0.1)', color: '#00B4FF' }}
                            >
                                <Target size={20} />
                            </div>
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: '#00B4FF',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    background: 'rgba(0, 180, 255, 0.1)',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                }}
                            >
                                <ArrowUpRight size={12} /> Óptimo
                            </span>
                        </div>
                        <div
                            style={{
                                fontSize: '13px',
                                color: '#64748B',
                                fontWeight: 600,
                                marginBottom: '4px',
                            }}
                        >
                            Tasa de Éxito
                        </div>
                        <div
                            style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                color: '#1E293B',
                                letterSpacing: '-0.5px',
                            }}
                        >
                            {kpis?.win_rate || 0}%
                        </div>
                    </div>

                    {/* KPI 3: Valor Promedio */}
                    <div className="twenty-card" style={fadeUpStyle(0.3)}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '16px',
                            }}
                        >
                            <div
                                className="kpi-icon-wrapper"
                                style={{ background: 'rgba(0, 180, 255, 0.1)', color: '#00B4FF' }}
                            >
                                <Users size={20} />
                            </div>
                        </div>
                        <div
                            style={{
                                fontSize: '13px',
                                color: '#64748B',
                                fontWeight: 600,
                                marginBottom: '4px',
                            }}
                        >
                            Ticket Promedio
                        </div>
                        <div
                            style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                color: '#1E293B',
                                letterSpacing: '-0.5px',
                            }}
                        >
                            {formatMoney(kpis?.avg_ltv)}
                        </div>
                    </div>

                    {/* KPI 4: Ciclo de Ventas */}
                    <div className="twenty-card" style={fadeUpStyle(0.4)}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '16px',
                            }}
                        >
                            <div
                                className="kpi-icon-wrapper"
                                style={{ background: 'rgba(0, 180, 255, 0.1)', color: '#00B4FF' }}
                            >
                                <Clock size={20} />
                            </div>
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: '#00B4FF',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    background: 'rgba(0, 180, 255, 0.1)',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                }}
                            >
                                <TrendingDown size={12} /> +2 días
                            </span>
                        </div>
                        <div
                            style={{
                                fontSize: '13px',
                                color: '#64748B',
                                fontWeight: 600,
                                marginBottom: '4px',
                            }}
                        >
                            Velocidad Promedio
                        </div>
                        <div
                            style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                color: '#1E293B',
                                letterSpacing: '-0.5px',
                            }}
                        >
                            {kpis?.deal_velocity || 0}{' '}
                            <span
                                style={{
                                    fontSize: '14px',
                                    color: '#64748B',
                                    fontWeight: 500,
                                }}
                            >
                                días
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Charts Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    {/* Revenue Area Chart */}
                    <div className="twenty-card" style={{ ...fadeUpStyle(0.5), padding: '24px' }}>
                        <div
                            style={{
                                marginBottom: '24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <h3
                                    style={{
                                        margin: 0,
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        color: '#1E293B',
                                    }}
                                >
                                    Ingresos Generados
                                </h3>
                            </div>
                        </div>
                        <div style={{ height: '320px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={monthly_sales}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="colorRevenue"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#00B4FF"
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#00B4FF"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#E2E8F0"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#64748B' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#64748B' }}
                                        tickFormatter={(value) => `S/${value / 1000}k`}
                                        dx={-10}
                                    />
                                    <RechartsTooltip content={<CustomTooltip prefix="S/" />} />
                                    <Area
                                        type="monotone"
                                        dataKey="Ventas"
                                        stroke="#00B4FF"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Win/Loss Pie Chart */}
                    <div
                        className="twenty-card"
                        style={{
                            ...fadeUpStyle(0.6),
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div style={{ marginBottom: '16px' }}>
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    color: '#1E293B',
                                }}
                            >
                                Estado del Pipeline
                            </h3>
                        </div>
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                            }}
                        >
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie
                                        data={win_loss_ratio}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        animationDuration={1500}
                                    >
                                        {win_loss_ratio.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Inner text for Donut */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '24px',
                                        fontWeight: 700,
                                        color: '#1E293B',
                                    }}
                                >
                                    {kpis?.total_deals || 0}
                                </div>
                                <div
                                    style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}
                                >
                                    Deals
                                </div>
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '16px',
                                marginTop: '16px',
                            }}
                        >
                            {win_loss_ratio.map((entry, index) => (
                                <div
                                    key={index}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <div
                                        style={{
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            background: entry.color,
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontSize: '13px',
                                            color: 'var(--twenty-text-muted)',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {entry.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Pipeline Funnel */}
                    <div className="twenty-card" style={fadeUpStyle(0.7)}>
                        <div style={{ marginBottom: '20px' }}>
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    color: '#1E293B',
                                }}
                            >
                                Embudo de Conversión
                            </h3>
                        </div>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={funnel}
                                    layout="vertical"
                                    margin={{ top: 0, right: 20, left: 40, bottom: 0 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        horizontal={true}
                                        vertical={false}
                                        stroke="#E2E8F0"
                                    />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fontSize: 13,
                                            fill: '#64748B',
                                            fontWeight: 600,
                                        }}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: '#F8FAFC' }}
                                        content={<CustomTooltip />}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill="#00B4FF"
                                        radius={[0, 6, 6, 0]}
                                        barSize={36}
                                        animationDuration={1500}
                                    >
                                        {funnel.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={`rgba(0, 180, 255, ${1 - index * 0.18})`}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Deals List */}
                    <div
                        className="twenty-card"
                        style={{
                            ...fadeUpStyle(0.8),
                            padding: 0,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div
                            style={{
                                padding: '20px',
                                borderBottom: '1px solid #E2E8F0',
                            }}
                        >
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    color: '#1E293B',
                                }}
                            >
                                Top Oportunidades
                            </h3>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {top_deals.map((deal, index) => (
                                <div
                                    key={deal.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '16px 20px',
                                        borderBottom:
                                            index < top_deals.length - 1
                                                ? '1px solid var(--twenty-border)'
                                                : 'none',
                                        transition: 'background 0.2s ease',
                                        cursor: 'pointer',
                                    }}
                                    className="hover:bg-gray-50"
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '8px',
                                                background: 'var(--twenty-bg-hover)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--twenty-primary)',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {deal.cliente?.nombres
                                                ? deal.cliente.nombres.charAt(0).toUpperCase()
                                                : 'C'}
                                        </div>
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    color: 'var(--twenty-text-main)',
                                                }}
                                            >
                                                {deal.titulo}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    color: 'var(--twenty-text-muted)',
                                                }}
                                            >
                                                {deal.cliente
                                                    ? `${deal.cliente.nombres} ${deal.cliente.apellidos}`
                                                    : 'Cliente Desconocido'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div
                                            style={{
                                                fontSize: '15px',
                                                fontWeight: 700,
                                                color: 'var(--twenty-text-main)',
                                            }}
                                        >
                                            {formatMoney(deal.valor)}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '12px',
                                                padding: '4px 8px',
                                                background: deal.stage?.color
                                                    ? `${deal.stage.color}15`
                                                    : 'var(--twenty-bg-hover)',
                                                color:
                                                    deal.stage?.color ||
                                                    'var(--twenty-text-secondary)',
                                                borderRadius: '12px',
                                                display: 'inline-flex',
                                                marginTop: '4px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {deal.stage?.nombre || 'Sin Etapa'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {top_deals.length === 0 && (
                                <div
                                    style={{
                                        padding: '40px',
                                        textAlign: 'center',
                                        color: 'var(--twenty-text-muted)',
                                        fontSize: '14px',
                                    }}
                                >
                                    <Target
                                        size={32}
                                        style={{ margin: '0 auto 12px', opacity: 0.5 }}
                                    />
                                    No hay oportunidades activas.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </TwentyCrmLayout>
    );
}
