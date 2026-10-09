import { cartPost } from '../utils/cartRequest';
import { useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, Minus, Package, Plus, ShoppingBag, Tag, Trash2, Truck } from 'lucide-react';
import Toast from '../Components/Home/Toast';
import PurchaseHeader, { PurchaseBackLink } from '../Components/Home/PurchaseHeader';

const money = value => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value) || 0);

export default function Cart() {
    const { cart = {}, flash, commercePolicy = {} } = usePage().props;
    const items = cart.items || [];
    const [pendingId, setPendingId] = useState(null);
    const busy = useRef(false);
    const mutate = (url, data) => {
        if (busy.current) return;
        busy.current = true;
        setPendingId(data.producto_id);
        cartPost(url, data, { preserveScroll: true, onFinish: () => { busy.current = false; setPendingId(null); } });
    };
    return <div className="purchase-page">
        <Head title="Carrito de compras"><meta name="robots" content="noindex,nofollow" /></Head>
        <Toast message={flash?.error || flash?.success} type={flash?.error ? 'error' : 'success'} />
        <PurchaseHeader stage={1} />
        <main className="purchase-container">
            <PurchaseBackLink />
            <div className="purchase-title"><span className="purchase-eyebrow">TU SELECCIÓN</span><h1>Carrito de compras</h1><p>Revisa tus productos antes de continuar.</p></div>
            {items.length ? <div className="purchase-layout">
                <section className="purchase-card purchase-cart-list" aria-label="Productos del carrito" aria-busy={pendingId !== null}>
                    {items.map(item => <article className="purchase-cart-item" key={item.line_id || item.variante_id || item.id}>
                        <Link href={`/producto/${item.id}`} className="purchase-product-image" tabIndex={-1} aria-hidden="true"><Package size={28} aria-hidden="true" />
                            {item.imagen && <img src={item.imagen} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />}</Link>
                        <div className="purchase-product-info">
                            {item.marca && <span className="purchase-eyebrow">{item.marca}</span>}
                            <h2><Link href={`/producto/${item.id}`}>{item.nombre}</Link></h2>
                            <p className="purchase-product-reference">{item.codigo ? `SKU: ${item.codigo}` : `Producto #${item.id}`}</p>
                            <span className="purchase-product-delivery"><Truck size={14} aria-hidden="true" />Entrega en Lima</span>
                        </div>
                        <div className="purchase-product-controls">
                            <div className="purchase-line-price"><strong>{money(item.precio * item.cantidad)}</strong>{item.cantidad > 1 && <small>{money(item.precio)} por unidad</small>}</div>
                            <div className="purchase-quantity-row"><div className="purchase-quantity">
                                <button type="button" disabled={pendingId !== null || item.cantidad <= 1} aria-label={`Reducir cantidad de ${item.nombre}`} onClick={() => mutate('/cart/update', { producto_id: item.id, variante_id: item.variante_id, cantidad: item.cantidad - 1 })}><Minus size={15} /></button>
                                <output aria-label={`Cantidad de ${item.nombre}`}>{item.cantidad}</output>
                                <button type="button" disabled={pendingId !== null || item.cantidad >= (commercePolicy.max_quantity ?? 5)} aria-label={`Aumentar cantidad de ${item.nombre}`} onClick={() => mutate('/cart/update', { producto_id: item.id, variante_id: item.variante_id, cantidad: item.cantidad + 1 })}><Plus size={15} /></button>
                            </div><button type="button" className="purchase-remove" disabled={pendingId !== null} aria-label={`Retirar ${item.nombre}`} onClick={() => mutate('/cart/remove', { producto_id: item.id, variante_id: item.variante_id })}><Trash2 size={17} /></button></div>
                            {pendingId === item.id && <small className="purchase-muted" role="status">Actualizando…</small>}
                        </div>
                    </article>)}
                </section>
                <aside className="purchase-card purchase-summary" aria-labelledby="cart-summary-title">
                    <header><h2 id="cart-summary-title">Resumen de tu pedido</h2><p>{cart.count || items.reduce((sum, item) => sum + item.cantidad, 0)} unidades · {items.length} {items.length === 1 ? 'producto' : 'productos'}</p></header>
                    <div className="purchase-summary-content"><dl className="purchase-totals"><div><dt>Subtotal</dt><dd>{money(cart.total)}</dd></div><div><dt>Entrega</dt><dd>Se calcula en el siguiente paso</dd></div><div className="is-total"><dt>Total de productos</dt><dd>{money(cart.total)}</dd></div></dl>
                        <button type="button" className="purchase-primary" disabled={pendingId !== null} onClick={() => router.visit('/checkout')}>Continuar con la entrega<ArrowRight size={18} /></button>
                        <Link href="/catalogo" className="purchase-secondary-link"><ShoppingBag size={16} />Añadir más productos</Link>
                        <p className="purchase-helper"><Tag size={15} aria-hidden="true" />Puedes ingresar tu cupón en el paso de pago.</p>
                    </div>
                </aside>
            </div> : <section className="purchase-card purchase-empty"><span className="purchase-status-icon"><ShoppingBag size={32} /></span><h2>Tu carrito está vacío</h2><p>Encuentra lo que necesitas y empieza tu compra.</p><Link className="purchase-primary" href="/catalogo">Explorar productos<ArrowRight size={18} /></Link></section>}
        </main>
    </div>;
}
