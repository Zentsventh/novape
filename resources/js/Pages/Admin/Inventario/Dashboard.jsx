import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import RemoteSelect from '../../../Components/Admin/RemoteSelect';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, BarElement, Filler } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, BarElement, Filler);

export default function Dashboard({ logoUrl, productos, categorias, marcas, demandaRaw, kpis, groups, filters = {}, usuario_nombre }) {
    const [form, setForm] = useState({ categoria_id: filters.categoria_id || '', marca_id: filters.marca_id || '', variante_id: filters.variante_id || '', q: filters.q || '' });
    const money = value => Number(value || 0).toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
    const number = value => Number(value || 0).toLocaleString('es-PE');
    const box = { padding: 20, background: 'var(--admin-bg-card, white)', border: '1px solid #e2e8f0', borderRadius: 12 };
    const chart = (field, label, color) => ({ labels: groups.map(g => g.nombre), datasets: [{ label, data: groups.map(g => Number(g[field])), backgroundColor: color }] });
    const demand = { labels: demandaRaw.map(d => d.fecha), datasets: [{ label: 'Unidades vendidas', data: demandaRaw.map(d => Number(d.cantidad)), borderColor: '#004797', backgroundColor: '#00479722', fill: true }] };
    return <AdminLayout logoUrl={logoUrl} usuario_nombre={usuario_nombre}><Head title="Inventario" /><main style={{ padding: 24, maxWidth: 1500, margin: 'auto' }}>
        <h1>Inventario</h1><p>Disponibilidad y valorización del catálogo activo. Los indicadores abarcan todos los resultados del filtro.</p>
        <Link href="/admin/inventario/movimientos">Ver kardex y registrar ajustes</Link>
        <form style={{ ...box, marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }} onSubmit={e => { e.preventDefault(); router.get('/admin/inventario', Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '')), { preserveState: true }); }}>
            <label>Categoría<select style={{ width: '100%' }} value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value, variante_id: '' })}><option value="">Todas</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
            <label>Marca<select style={{ width: '100%' }} value={form.marca_id} onChange={e => setForm({ ...form, marca_id: e.target.value, variante_id: '' })}><option value="">Todas</option>{marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}</select></label>
            <RemoteSelect endpoint="/admin/selectores/variantes" label="Producto" value={form.variante_id} onChange={value => setForm({ ...form, variante_id: value })} params={{ categoria_id: form.categoria_id, marca_id: form.marca_id }} getLabel={row => row.nombre + ' · ' + row.sku} />
            <label>Nombre o SKU<input maxLength={100} value={form.q} onChange={e => setForm({ ...form, q: e.target.value })} style={{ width: '100%' }} /></label>
            <div><button type="submit">Aplicar filtros</button> <button type="button" onClick={() => { setForm({ categoria_id: '', marca_id: '', variante_id: '', q: '' }); router.get('/admin/inventario'); }}>Limpiar</button></div>
        </form>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, margin: '20px 0' }}>
            {Object.entries({ 'Valor del inventario': money(kpis.costo_total), 'Unidades disponibles': number(kpis.stock_disponible), 'Unidades vendidas': number(kpis.unidades_vendidas), 'Unidades compradas': number(kpis.unidades_compradas), 'Stock mínimo': number(kpis.stock_minimo), 'Stock de seguridad': number(kpis.stock_seguridad), 'Reposición sugerida': number(kpis.reposicion) }).map(([label, value]) => <div key={label} style={box}><div>{label}</div><strong style={{ fontSize: 24 }}>{value}</strong></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <section style={box}><h2>Valor por categoría</h2><Bar data={chart('cost', 'Valor registrado', '#004797')} /></section>
            <section style={box}><h2>Unidades por categoría</h2><Bar data={chart('stock', 'Stock físico', '#0082b8')} /></section>
            <section style={box}><h2>Demanda de los últimos 15 días</h2><Line data={demand} /></section>
        </div>
        <section style={{ ...box, marginTop: 20, overflowX: 'auto' }}><h2>Productos ({number(productos.total)})</h2><table style={{ width: '100%' }}><thead><tr><th>Producto</th><th>SKU</th><th>Stock</th><th>Mínimo</th><th>Coste unitario</th><th>Precio</th><th>Vendidos</th></tr></thead><tbody>
            {productos.data.map(p => <tr key={p.id}><td><Link href={'/admin/products/' + p.producto_id}>{p.producto_nombre}</Link></td><td>{p.sku}</td><td>{number(p.stock)}</td><td>{number(p.stock_minimo)}</td><td>{money(p.precio_compra)}</td><td>{money(p.precio)}</td><td>{number(p.unidades_vendidas)}</td></tr>)}
        </tbody></table>{!productos.data.length && <p>No hay productos con estos filtros.</p>}
            <nav aria-label="Páginas de inventario" style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>{productos.links.map((link, i) => link.url ? <Link key={i} href={link.url} preserveScroll aria-current={link.active ? 'page' : undefined}><span dangerouslySetInnerHTML={{ __html: link.label }} /></Link> : <span key={i} dangerouslySetInnerHTML={{ __html: link.label }} />)}</nav>
        </section>
    </main></AdminLayout>;
}
