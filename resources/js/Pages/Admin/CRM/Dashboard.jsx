import React from 'react';
import { Head } from '@inertiajs/react';
import CrmLayout from '../../../Layouts/CrmLayout';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis, AreaChart, Area,
    FunnelChart, Funnel, LabelList
} from 'recharts';
import { Users, DollarSign, Target, TrendingUp, Clock } from 'lucide-react';

export default function Dashboard({ metrics }) {
    const { kpis, funnel, monthly_sales, scatter_data, pipeline_forecast, win_loss_ratio, leaderboard, top_deals } = metrics;
    
    const COLORS = ['#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa'];

    const formatMoney = (value) => {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
    };

    return (
        <CrmLayout title="CRM">
            <Head title="Dashboard CRM" />

            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--admin-bg)', paddingBottom: '40px' }}>
                <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0' }}>
                        <div>
                            <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>
                                Dashboard General
                            </h1>
                            <p style={{ margin: '4px 0 0 0', color: 'var(--admin-text-muted)', fontSize: '14px' }}>
                                Métricas y rendimiento de ventas
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--admin-text-main)', backgroundColor: 'var(--admin-bg-panel)', border: '1px solid var(--admin-border)', padding: '6px 12px', borderRadius: '16px', fontWeight: 500 }}>
                                Últimos 6 Meses
                            </span>
                        </div>
                    </div>

                    {/* KPIs - Solid Panels (Matching Main Dashboard) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                        
                        <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-accent) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px var(--admin-primary-glow)' }}>
                                <DollarSign size={24} color="white" />
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: 'bold' }}>INGRESOS</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>{formatMoney(kpis.total_revenue)}</div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-accent) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px var(--admin-primary-glow)' }}>
                                <Target size={24} color="white" />
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: 'bold' }}>TASA DE ÉXITO</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>{kpis.win_rate}%</div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-accent) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px var(--admin-primary-glow)' }}>
                                <Users size={24} color="white" />
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: 'bold' }}>VALOR POR CLIENTE</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>{formatMoney(kpis.avg_ltv)}</div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-accent) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px var(--admin-primary-glow)' }}>
                                <Clock size={24} color="white" />
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '12px', fontWeight: 'bold' }}>TIEMPO DE CIERRE</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>{kpis.deal_velocity} <span style={{fontSize:'16px', fontWeight:'500'}}>días</span></div>
                            </div>
                        </div>

                    </div>

                    {/* Gráficas Principales - Fila 1 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                        
                        {/* AreaChart: Ingresos recurrentes */}
                        <div style={{ background: 'var(--admin-bg-panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--admin-border)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--admin-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={20} color="var(--admin-primary)"/> Evolución de Ingresos</h3>
                            <div style={{ height: '350px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthly_sales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--admin-text-muted)', fontSize: 12}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--admin-text-muted)', fontSize: 12}} tickFormatter={(val) => `S/ ${val/1000}k`} />
                                        <CartesianGrid vertical={false} stroke="var(--admin-border)" />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', background: 'var(--admin-bg-panel)', color: 'var(--admin-text-main)' }}
                                            formatter={(value) => formatMoney(value)}
                                        />
                                        <Area type="monotone" dataKey="Ventas" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* FunnelChart real (Recharts) */}
                        <div style={{ background: 'var(--admin-bg-panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--admin-border)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--admin-text-main)' }}>Embudo de Ventas</h3>
                            <div style={{ height: '350px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <FunnelChart>
                                        <Tooltip formatter={(value) => `${value} Negocios`} />
                                        <Funnel
                                            dataKey="value"
                                            data={funnel}
                                            isAnimationActive
                                        >
                                            <LabelList position="right" fill="var(--admin-text-muted)" stroke="none" dataKey="name" />
                                            {funnel.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                            ))}
                                        </Funnel>
                                    </FunnelChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>

                    {/* Gráficas Secundarias - Fila 2 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        
                        {/* Stacked BarChart: Pipeline Forecast */}
                        <div style={{ background: 'var(--admin-bg-panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--admin-border)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--admin-text-main)' }}>Historial del Pipeline</h3>
                            <div style={{ height: '320px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={pipeline_forecast} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--admin-border)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--admin-text-muted)', fontSize: 12}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--admin-text-muted)', fontSize: 12}} />
                                        <Tooltip cursor={{fill: 'var(--admin-bg)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="won" stackId="a" fill="#1e3a8a" name="Ganados" radius={[0, 0, 4, 4]} />
                                        <Bar dataKey="open" stackId="a" fill="#2563eb" name="En Proceso" />
                                        <Bar dataKey="lost" stackId="a" fill="#93c5fd" name="Perdidos" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* PieChart: Win/Loss Ratio */}
                        <div style={{ background: 'var(--admin-bg-panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--admin-border)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--admin-text-main)' }}>Tasa de Éxito Global</h3>
                            <div style={{ height: '320px', position: 'relative' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={win_loss_ratio}
                                            innerRadius={90}
                                            outerRadius={120}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {win_loss_ratio.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value} Negocios`} />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', marginTop: '-15px' }}>
                                    <span style={{ display: 'block', fontSize: '32px', fontWeight: 800, color: 'var(--admin-text-main)' }}>{kpis.win_rate}%</span>
                                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--admin-text-muted)', fontWeight: 600 }}>TASA DE ÉXITO</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Gráficas CEO - Fila 3 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginTop: '24px' }}>
                        
                        {/* Leaderboard */}
                        <div style={{ background: 'var(--admin-bg-panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--admin-border)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--admin-text-main)' }}>Ranking de Vendedores</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {leaderboard.map((user, index) => (
                                    <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: index < leaderboard.length - 1 ? '1px solid var(--admin-border)' : 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: index === 0 ? 'var(--admin-bg-hover)' : 'var(--admin-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: index === 0 ? 'var(--admin-primary)' : 'var(--admin-text-muted)' }}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 600, color: 'var(--admin-text-main)' }}>{user.vendedor}</p>
                                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--admin-text-muted)' }}>{user.deals_cerrados} tratos cerrados</p>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>
                                            {formatMoney(user.total_ventas)}
                                        </div>
                                    </div>
                                ))}
                                {leaderboard.length === 0 && (
                                    <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', fontSize: '14px' }}>No hay ventas registradas aún.</p>
                                )}
                            </div>
                        </div>

                        {/* Top Deals */}
                        <div style={{ background: 'var(--admin-bg-panel)', padding: '24px', borderRadius: '16px', border: '1px solid var(--admin-border)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--admin-text-main)' }}>Tratos Destacados</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--admin-border)' }}>
                                            <th style={{ padding: '12px 0', color: 'var(--admin-text-muted)', fontWeight: 600, fontSize: '13px' }}>Trato</th>
                                            <th style={{ padding: '12px 0', color: 'var(--admin-text-muted)', fontWeight: 600, fontSize: '13px' }}>Cliente</th>
                                            <th style={{ padding: '12px 0', color: 'var(--admin-text-muted)', fontWeight: 600, fontSize: '13px' }}>Etapa</th>
                                            <th style={{ padding: '12px 0', color: 'var(--admin-text-muted)', fontWeight: 600, fontSize: '13px', textAlign: 'right' }}>Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {top_deals.map((deal) => (
                                            <tr key={deal.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                <td style={{ padding: '16px 0', fontWeight: 600, color: '#111827' }}>{deal.nombre}</td>
                                                <td style={{ padding: '16px 0', color: '#4b5563' }}>{deal.cliente?.nombres}</td>
                                                <td style={{ padding: '16px 0' }}>
                                                    <span style={{ backgroundColor: `${deal.stage?.color}20`, color: deal.stage?.color, padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                                                        {deal.stage?.nombre}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatMoney(deal.valor)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {top_deals.length === 0 && (
                                    <p style={{ color: '#6b7280', textAlign: 'center', fontSize: '14px', marginTop: '20px' }}>No hay tratos abiertos de alto valor.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </CrmLayout>
    );
}
