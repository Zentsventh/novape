import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import RemoteSelect from '../../../Components/Admin/RemoteSelect';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, BarElement, Filler } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Package, DollarSign, ShoppingCart, Truck, AlertTriangle, ShieldCheck, ArrowRightLeft, Filter, RefreshCcw, Search, ExternalLink } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, BarElement, Filler);

export default function Dashboard({ logoUrl, productos, categorias, marcas, demandaRaw, kpis, groups, filters = {}, usuario_nombre }) {
    const [form, setForm] = useState({ categoria_id: filters.categoria_id || '', marca_id: filters.marca_id || '', variante_id: filters.variante_id || '', q: filters.q || '' });
    
    const money = value => Number(value || 0).toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
    const number = value => Number(value || 0).toLocaleString('es-PE');
    
    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } };
    const chart = (field, label, color) => ({ labels: groups.map(g => g.nombre), datasets: [{ label, data: groups.map(g => Number(g[field])), backgroundColor: color, borderRadius: 6 }] });
    const demand = { labels: demandaRaw.map(d => d.fecha), datasets: [{ label: 'Unidades vendidas', data: demandaRaw.map(d => Number(d.cantidad)), borderColor: '#3b82f6', backgroundColor: '#3b82f622', fill: true, tension: 0.4 }] };

    const kpiCards = [
        { label: 'Valor del inventario', value: money(kpis.costo_total), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Unidades disponibles', value: number(kpis.stock_disponible), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Unidades vendidas', value: number(kpis.unidades_vendidas), icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Unidades compradas', value: number(kpis.unidades_compradas), icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Stock mínimo', value: number(kpis.stock_minimo), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Stock de seguridad', value: number(kpis.stock_seguridad), icon: ShieldCheck, color: 'text-teal-600', bg: 'bg-teal-50' },
        { label: 'Reposición sugerida', value: number(kpis.reposicion), icon: ArrowRightLeft, color: 'text-rose-600', bg: 'bg-rose-50' },
    ];

    const applyFilters = e => { e.preventDefault(); router.get('/admin/inventario', Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '')), { preserveState: true }); };
    const clearFilters = () => { setForm({ categoria_id: '', marca_id: '', variante_id: '', q: '' }); router.get('/admin/inventario'); };

    return (
        <AdminLayout logoUrl={logoUrl} usuario_nombre={usuario_nombre}>
            <Head title="Inventario" />
            <main className="p-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Inventario y Catálogo</h1>
                        <p className="text-slate-500 mt-1">Disponibilidad, valorización y estado del catálogo activo.</p>
                    </div>
                    <Link href="/admin/inventario/movimientos" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                        <ArrowRightLeft className="w-5 h-5" />
                        Ver Kardex y Ajustes
                    </Link>
                </div>

                {/* Filters Section */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-8">
                    <div className="flex items-center gap-2 mb-4 text-slate-700 font-semibold">
                        <Filter className="w-5 h-5" />
                        <h2>Filtros de Búsqueda</h2>
                    </div>
                    <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-600">Categoría</label>
                            <select className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value, variante_id: '' })}>
                                <option value="">Todas las categorías</option>
                                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-600">Marca</label>
                            <select className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" value={form.marca_id} onChange={e => setForm({ ...form, marca_id: e.target.value, variante_id: '' })}>
                                <option value="">Todas las marcas</option>
                                {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <RemoteSelect label="Producto específico" labelClassName="text-sm font-medium text-slate-600 block mb-1.5" endpoint="/admin/selectores/variantes" value={form.variante_id} onChange={value => setForm({ ...form, variante_id: value })} params={{ categoria_id: form.categoria_id, marca_id: form.marca_id }} getLabel={row => row.nombre + ' · ' + row.sku} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-600">Nombre o SKU</label>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <input maxLength={100} value={form.q} onChange={e => setForm({ ...form, q: e.target.value })} className="w-full pl-9 border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Ej: Laptop HP..." />
                            </div>
                        </div>
                        <div className="lg:col-span-4 flex items-center justify-end gap-3 pt-2">
                            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors">
                                <RefreshCcw className="w-4 h-4" /> Limpiar
                            </button>
                            <button type="submit" className="inline-flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors">
                                <Search className="w-4 h-4" /> Buscar
                            </button>
                        </div>
                    </form>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {kpiCards.map((card, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className={`p-4 rounded-full ${card.bg}`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-0.5">{card.label}</p>
                                <h3 className="text-2xl font-bold text-slate-800">{card.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-1">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Valor por Categoría</h2>
                        <div className="h-64"><Bar data={chart('cost', 'Valor registrado', '#10b981')} options={chartOptions} /></div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-1">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Stock Físico</h2>
                        <div className="h-64"><Bar data={chart('stock', 'Stock físico', '#3b82f6')} options={chartOptions} /></div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-1">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Demanda (15 días)</h2>
                        <div className="h-64"><Line data={demand} options={chartOptions} /></div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800">Resultados del Catálogo <span className="text-slate-400 font-normal text-sm ml-2">({number(productos.total)} productos)</span></h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                                    <th className="px-6 py-3 font-semibold">Producto</th>
                                    <th className="px-6 py-3 font-semibold">SKU</th>
                                    <th className="px-6 py-3 font-semibold text-right">Stock</th>
                                    <th className="px-6 py-3 font-semibold text-right">Mínimo</th>
                                    <th className="px-6 py-3 font-semibold text-right">Coste</th>
                                    <th className="px-6 py-3 font-semibold text-right">Precio Venta</th>
                                    <th className="px-6 py-3 font-semibold text-right">Vendidos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {productos.data.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <Link href={'/admin/products/' + p.producto_id} className="text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1">
                                                {p.producto_nombre} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Link>
                                            <div className="text-xs text-slate-400 mt-0.5">{p.categoria} • {p.marca}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-mono text-sm">{p.sku}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-2.5 py-1 rounded-full text-sm font-semibold ${p.stock <= p.stock_minimo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {number(p.stock)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500">{number(p.stock_minimo)}</td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-700">{money(p.precio_compra)}</td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-700">{money(p.precio)}</td>
                                        <td className="px-6 py-4 text-right text-slate-500">{number(p.unidades_vendidas)}</td>
                                    </tr>
                                ))}
                                {!productos.data.length && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                            <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                            <p className="text-lg font-medium">No se encontraron productos</p>
                                            <p className="text-sm">Prueba ajustando los filtros de búsqueda.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {productos.links && productos.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-slate-200 flex justify-center">
                            <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                {productos.links.map((link, i) => (
                                    link.url ? 
                                    <Link key={i} href={link.url} preserveScroll className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${link.active ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'} ${i === 0 ? 'rounded-l-md' : ''} ${i === productos.links.length - 1 ? 'rounded-r-md' : ''}`}>
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    </Link>
                                    : 
                                    <span key={i} className={`relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-300 ${i === 0 ? 'rounded-l-md' : ''} ${i === productos.links.length - 1 ? 'rounded-r-md' : ''}`}>
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    </span>
                                ))}
                            </nav>
                        </div>
                    )}
                </div>
            </main>
        </AdminLayout>
    );
}
