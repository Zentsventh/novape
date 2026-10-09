import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, MapPin, Package, ShieldCheck } from 'lucide-react';
import Header from '../../Components/Home/Header';
import Footer from '../../Components/Home/Footer';
import CartDrawer from '../../Components/Home/CartDrawer';
import CategoryDrawer from '../../Components/Home/CategoryDrawer';
import { AccountProductImage, accountMoney } from '../../Components/Home/AccountSections';
import '../../../css/home/base.css';
import '../../../css/home/header.css';
import '../../../css/home/footer.css';
import '../../../css/home/profile.css';
import '../../../css/home/account.css';

export default function OrderDetails({ pedido, categoriaProductos = [] }) {
    const { cart } = usePage().props;
    const [cartOpen, setCartOpen] = useState(false);
    const [categoriesOpen, setCategoriesOpen] = useState(false);
    const items = pedido?.items || [];
    const address = pedido?.direccion_envio_snapshot || {};
    const paid = ['pagado', 'procesando', 'enviado', 'completado'].includes(pedido?.estado?.toLowerCase());
    return <div className="efe-home account-page" style={{ minHeight: '100vh' }}>
        <Head title={pedido ? `Pedido ${pedido.codigo}` : 'Pedido no encontrado'} />
        <Header cartCount={cart?.count || 0} onOpenCart={() => setCartOpen(true)} onOpenCategories={() => setCategoriesOpen(true)} />
        <main className="account-detail-container">
            <Link className="account-text-link" href="/perfil?tab=compras"><ArrowLeft size={17} />Volver a mis compras</Link>
            {!pedido ? <div className="account-empty"><Package size={34} /><h1>Pedido no encontrado</h1><p>Vuelve a tus compras para consultar tus pedidos.</p></div> : <>
                <div className="account-section-heading" style={{ marginTop: 20 }}><div><h1 style={{ fontSize: 'clamp(22px,3vw,30px)', margin: '0 0 9px' }}>Pedido {pedido.codigo}</h1><p>{new Date(pedido.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div><span className={`account-status${paid ? ' is-paid' : ''}`}>{pedido.estado}</span></div>
                <div className="account-detail-layout"><div>
                    <section className="account-detail-card"><h2>Productos de tu compra</h2>{items.map(item => <article className="account-detail-item" key={item.id}>
                        <AccountProductImage src={item.image_url} name={item.product_name} /><div><h3>{item.product_name || item.producto_nombre || 'Producto de tu pedido'}</h3><p>Cantidad: {item.cantidad} · {accountMoney(item.precio_unitario)} por unidad</p>{item.sku && <p>SKU: {item.sku}</p>}</div><strong>{accountMoney(item.precio_unitario * item.cantidad)}</strong>
                    </article>)}</section>
                    <div className="account-detail-information"><section className="account-detail-card"><h2><MapPin size={17} /> Entrega</h2>{address.direccion ? <><p>{address.direccion}</p><p className="account-muted">{[address.distrito, address.provincia || 'Lima'].filter(Boolean).join(', ')}</p>{address.referencia && <p className="account-muted">Referencia: {address.referencia}</p>}</> : <p>Retiro en tienda</p>}<p className="account-muted">{address.nombres} {address.apellidos}</p>{address.celular && <p className="account-muted">Celular: {address.celular}</p>}</section>
                        <section className="account-detail-card"><h2>Datos del comprobante</h2><p><strong>{pedido.tipo_comprobante || 'Boleta'}</strong></p><p>{pedido.invoice_snapshot?.nombre_cliente || pedido.nombre_facturacion}</p><p className="account-muted">{pedido.invoice_snapshot?.documento_cliente || pedido.documento_cliente}</p><p className="account-muted">{address.email}</p>{paid && <a className="account-text-link" href={`/factura/ecommerce/${pedido.id}/descargar`}><Download size={16} />Descargar comprobante</a>}</section>
                    </div>
                </div><aside><section className="account-detail-card"><h2>Resumen del pedido</h2><dl className="account-detail-totals"><div><dt>Productos</dt><dd>{accountMoney(pedido.subtotal ?? items.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0))}</dd></div><div><dt>Envío</dt><dd>{accountMoney(pedido.costo_envio)}</dd></div>{Number(pedido.descuento) > 0 && <div><dt>Descuentos</dt><dd>− {accountMoney(pedido.descuento)}</dd></div>}<div><dt>Total</dt><dd>{accountMoney(pedido.total)}</dd></div></dl>
                    <p className="account-muted"><ShieldCheck size={15} /> {paid ? 'Pago confirmado.' : `Estado actual: ${pedido.estado}.`}</p><Link className="efe-btn-primary" href={`/seguimiento?codigo=${encodeURIComponent(pedido.codigo)}`} style={{ width: '100%' }}>Ver seguimiento</Link>
                </section><section className="account-detail-card"><h2>Estamos para ayudarte</h2><p className="account-muted">Consulta cualquier duda sobre tu compra con tu código de pedido.</p><Link className="account-text-link" href="/ayuda">Contactar con ayuda</Link></section></aside></div>
            </>}
        </main><Footer />
        <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} cart={cart} />
        <CategoryDrawer isOpen={categoriesOpen} onClose={() => setCategoriesOpen(false)} categorias={categoriaProductos} />
    </div>;
}
