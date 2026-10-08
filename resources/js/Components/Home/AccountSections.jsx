import { cartPost } from '../../utils/cartRequest';
import { useEffect, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowRight, CreditCard, Heart, Home, LayoutGrid, LogOut, MapPin, Package, Plus, Search, Settings, Shield, Star, Trash2, Wallet } from 'lucide-react';

export const accountMoney = value => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value) || 0);
export function AccountProductImage({ src, name = '' }) {
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [src]);
    return <span className="account-product-image">{src && !failed ? <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} /> : <Package size={24} aria-hidden="true" />}</span>;
}
const sections = [
    ['home', 'Resumen', LayoutGrid], ['compras', 'Mis compras', Package], ['perfil', 'Datos personales', Shield],
    ['direcciones', 'Direcciones', MapPin], ['listas', 'Mis listas', Heart], ['puntos', 'Mis puntos', Star],
    ['tarjetas', 'Tarjetas', CreditCard], ['reembolso', 'Reembolsos / CCI', Wallet], ['sesiones', 'Dispositivos', Home],
    ['configuracion', 'Configurar cuenta', Settings],
];
export function AccountNavigation({ current, onChange }) {
    return <aside className="account-navigation">
        <label className="account-mobile-navigation">Sección de mi cuenta<select value={current} onChange={event => event.target.value === 'devoluciones' ? router.visit('/perfil/devoluciones') : onChange(event.target.value)}>{sections.map(([value, label]) => <option key={value} value={value}>{label}</option>)}<option value="devoluciones">Devoluciones y garantías</option></select></label>
        <nav className="account-desktop-navigation" aria-label="Mi cuenta"><p>MI CUENTA</p>{sections.map(([value, label, Icon]) => <button key={value} type="button" aria-current={current === value ? 'page' : undefined} className={current === value ? 'is-active' : ''} onClick={() => onChange(value)}><Icon size={18} />{label}</button>)}<Link href="/perfil/devoluciones"><Package size={18} />Devoluciones y garantías</Link></nav>
        <button type="button" className="account-logout" onClick={() => router.post('/logout')}><LogOut size={16} />Cerrar sesión</button>
    </aside>;
}
export function AccountOrders({ orders, onReturn }) {
    const [search, setSearch] = useState('');
    const [pending, setPending] = useState(false);
    const filtered = orders.filter(order => `${order.codigo} ${order.items?.map(item => item.product_name || item.producto_nombre || '').join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()));
    return <section><div className="account-section-heading"><div><h2>Mis compras</h2><p>Consulta tus pedidos, sus productos y comprobantes.</p></div><span className="account-count">{orders.length} pedidos</span></div>
        <label className="account-search"><Search size={18} /><span className="account-sr-only">Buscar pedido o producto</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por pedido o producto" type="search" /></label>
        <div className="account-orders">{filtered.map(order => {
            const item = order.items?.[0];
            const productId = item?.product_id || item?.variante?.producto_id;
            const paid = ['pagado', 'procesando', 'enviado', 'completado'].includes(order.estado.toLowerCase());
            return <article className="account-order-card" key={order.id}>
                <header><div><Link href={`/perfil/compras/${encodeURIComponent(order.codigo)}`}>{order.codigo}</Link><time dateTime={order.created_at}>{new Date(order.created_at).toLocaleDateString('es-PE', { timeZone: 'America/Lima', day: 'numeric', month: 'short', year: 'numeric' })}</time></div><strong>{accountMoney(order.total)}</strong></header>
                <div className="account-order-body"><AccountProductImage src={item?.image_url} name={item?.product_name} /><div className="account-order-product"><span className={`account-status${paid ? ' is-paid' : ''}`}>{order.estado}</span><h3>{item?.product_name || item?.producto_nombre || 'Productos de tu pedido'}</h3><p>{order.items?.length || 0} {order.items?.length === 1 ? 'producto' : 'productos'} · {order.items?.reduce((sum, entry) => sum + Number(entry.cantidad), 0) || 0} unidades</p></div></div>
                <footer><Link className="efe-btn-primary" href={`/perfil/compras/${encodeURIComponent(order.codigo)}`}>Ver detalle<ArrowRight size={16} /></Link>{paid && <a className="efe-btn-outline" href={`/factura/ecommerce/${order.id}/descargar`}>Comprobante</a>}<Link className="account-text-link" href={`/seguimiento?codigo=${encodeURIComponent(order.codigo)}`}>Seguimiento</Link>{order.estado === 'Completado' && <button type="button" className="efe-btn-outline" onClick={() => onReturn(order)}>Garantía / devolución</button>}{productId && <button type="button" disabled={pending} className="account-text-link" onClick={() => { setPending(true); cartPost('/cart/add', { producto_id: productId, cantidad: 1 }, { preserveScroll: true, onSuccess: () => window.dispatchEvent(new CustomEvent('open-cart')), onFinish: () => setPending(false) }); }}>Comprar de nuevo</button>}</footer>
            </article>;
        })}</div>{!filtered.length && <div className="account-empty"><Package size={35} /><h3>{orders.length ? 'No encontramos ese pedido' : 'Tus compras aparecerán aquí'}</h3><p>{orders.length ? 'Prueba otro código o nombre de producto.' : 'Explora la tienda y encuentra lo que necesitas.'}</p>{!orders.length && <Link className="efe-btn-primary" href="/catalogo">Explorar productos</Link>}</div>}
    </section>;
}
export function AccountAddresses({ addresses, onAdd, confirmDelete }) {
    const [pending, setPending] = useState(false);
    const action = (method, url) => { setPending(true); router[method](url, {}, { preserveScroll: true, onFinish: () => setPending(false) }); };
    return <section><div className="account-section-heading"><div><h2>Direcciones</h2><p>Guarda tus direcciones de entrega en Lima.</p></div><button type="button" className="efe-btn-primary" onClick={onAdd}><Plus size={17} />Agregar dirección</button></div>
        <div className="account-address-grid">{addresses.map(address => <article className="account-address-card" key={address.id}><div className="account-address-icon"><MapPin size={21} /></div><div><h3>{address.direccion}</h3><p>{address.distrito}, {address.provincia}</p>{address.referencia && <p className="account-muted">Referencia: {address.referencia}</p>}{address.codigo_postal && <p className="account-muted">Código postal: {address.codigo_postal}</p>}{address.principal && <span className="account-status is-paid">Dirección principal</span>}</div><footer>{!address.principal && <button type="button" className="account-text-link" disabled={pending} onClick={() => action('post', `/perfil/direccion/${address.id}/principal`)}>Usar como principal</button>}<button type="button" className="account-delete" disabled={pending} onClick={async () => { if (await confirmDelete('¿Eliminar esta dirección?')) { setPending(true); router.delete(`/perfil/direccion/${address.id}`, { preserveScroll: true, onFinish: () => setPending(false) }); } }}><Trash2 size={16} />Eliminar</button></footer></article>)}</div>
        {!addresses.length && <div className="account-empty"><MapPin size={36} /><h3>Una entrega más fácil</h3><p>Agrega tu primera dirección para usarla en tus próximas compras.</p><button className="efe-btn-primary" onClick={onAdd}>Agregar mi dirección<Plus size={17} /></button></div>}
    </section>;
}
export function AccountAddressForm({ form, districts, onSubmit, onCancel }) {
    const field = (name, label, extra = {}) => <div className="efe-form-group"><label className="efe-form-label" htmlFor={`account-address-${name}`}>{label}</label><input id={`account-address-${name}`} className="efe-input" value={form.data[name]} onChange={event => form.setData(name, event.target.value)} maxLength={255} aria-invalid={Boolean(form.errors[name])} aria-describedby={form.errors[name] ? `account-error-${name}` : undefined} {...extra} />{form.errors[name] && <p className="account-field-error" id={`account-error-${name}`} role="alert">{form.errors[name]}</p>}</div>;
    return <form className="account-address-form" onSubmit={onSubmit}><p className="account-muted">Entregamos únicamente en Lima Metropolitana.</p><div className="account-form-grid">{field('departamento', 'Departamento', { readOnly: true })}{field('provincia', 'Provincia', { readOnly: true })}</div><div className="efe-form-group"><label className="efe-form-label" htmlFor="account-district">Distrito *</label><select id="account-district" className="efe-select" required value={form.data.distrito} onChange={event => form.setData('distrito', event.target.value)} aria-invalid={Boolean(form.errors.distrito)}><option value="">Selecciona un distrito</option>{districts.map(district => <option key={district}>{district}</option>)}</select>{form.errors.distrito && <p role="alert" className="account-field-error">{form.errors.distrito}</p>}</div>
        {field('direccion', 'Dirección exacta *', { required: true, autoComplete: 'street-address', placeholder: 'Calle, número y departamento' })}{field('referencia', 'Referencia (opcional)')}{field('codigo_postal', 'Código postal (opcional)', { maxLength: 5, pattern: '[0-9]{5}', inputMode: 'numeric', autoComplete: 'postal-code' })}
        <label className="account-checkbox"><input type="checkbox" checked={form.data.principal} onChange={event => form.setData('principal', event.target.checked)} />Guardar como dirección principal</label>{form.errors.address && <p role="alert" className="account-field-error">{form.errors.address}</p>}
        <div className="account-form-actions"><button type="button" className="efe-btn-secondary" disabled={form.processing} onClick={onCancel}>Cancelar</button><button type="submit" disabled={form.processing} className="efe-btn-primary">{form.processing ? 'Guardando…' : 'Guardar dirección'}</button></div>
    </form>;
}
