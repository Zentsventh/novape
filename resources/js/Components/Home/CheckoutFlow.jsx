import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Check, ChevronLeft, CreditCard, MapPin, Package, ShieldCheck, Store, Tag, Truck, X } from 'lucide-react';
import PurchaseHeader, { PurchaseBackLink } from './PurchaseHeader';
import NiubizTestCard from './NiubizTestCard';

const money = value => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value) || 0);
function Field({ id, label, children, wide = false }) {
    return <div className={`purchase-field${wide ? ' is-wide' : ''}`}><label htmlFor={id}>{label}</label>{children}</div>;
}

export default function CheckoutFlow({ model: m, map }) {
    const [now, setNow] = useState(Date.now());
    const [mapOpen, setMapOpen] = useState(false);
    useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(timer); }, []);
    useEffect(() => { document.getElementById('purchase-current-step')?.focus(); }, [m.step]);
    const quoteMatches = m.quote?.quoteKey === m.quoteKey;
    const ready = quoteMatches && m.quote.expiresAt > now + 300000 && !m.quoteFetching && !m.couponPending && m.billingConfirmed;
    const expired = quoteMatches && m.quote.expiresAt <= now + 300000;
    const summary = quoteMatches ? m.quote.summary : null;
    const items = quoteMatches && m.quote.items ? m.quote.items : m.cartItems;
    const pickup = m.pickupLocations.find(location => location.id === Number(m.address.pickup_location_id));
    const shippingInfo = quoteMatches ? m.quote.shipping : m.shippingInfo;
    const shippingLabel = shippingInfo?.source === 'shippo'
        ? `${shippingInfo.test ? 'Cotización de prueba · ' : ''}${shippingInfo.courier}${shippingInfo.service ? ` · ${shippingInfo.service}` : ''}`
        : shippingInfo?.source === 'store' ? 'Tarifa de entrega Novape' : shippingInfo?.source === 'free_shipping' ? 'Envío gratis por el importe de tu compra' : '';
    const titles = ['¿Cómo recibirás tu pedido?', 'Revisa los datos de entrega', 'Comprobante y pago'];
    const addressField = (key, label, options = {}) => <Field key={key} id={`purchase-address-${key}`} label={label} wide={options.wide}>
        <input id={`purchase-address-${key}`} name={key} value={m.address[key] || ''} onChange={event => m.onAddressChange(key, event.target.value)} disabled={m.isCreating} required={options.required !== false} maxLength={options.maxLength || 100} {...options.input} />
    </Field>;
    const billingField = (key, label, options = {}) => <Field key={key} id={`purchase-billing-${key}`} label={label} wide={options.wide}>
        <input id={`purchase-billing-${key}`} name={key} value={m.billing[key] || ''} onChange={event => m.onBillingChange(key, event.target.value)} required={options.required !== false} maxLength={options.maxLength || 255} {...options.input} />
    </Field>;

    return <div className="purchase-page">
        <Head title="Finalizar compra"><meta name="robots" content="noindex,nofollow" /></Head>
        <PurchaseHeader stage={m.step === 3 ? 3 : 2} onDelivery={m.onEditAddress} />
        <main className="purchase-container">
            <PurchaseBackLink href="/carrito">Volver al carrito</PurchaseBackLink>
            <div className="purchase-title"><span className="purchase-eyebrow">{m.step === 3 ? 'ÚLTIMO PASO' : 'ENTREGA EN LIMA'}</span><h1 tabIndex={-1} id="purchase-current-step">{titles[m.step - 1]}</h1><p>{m.step === 3 ? 'Confirma tu comprobante y revisa el importe antes de pagar.' : 'Completa la información necesaria para recibir tu compra.'}</p></div>
            {m.flashError && <div className="purchase-alert is-error" role="alert">{m.flashError}<Link href="/ayuda">Contactar con ayuda</Link></div>}
            <div className="purchase-layout">
                <div className="purchase-main">
                    {m.step === 1 && <form className="purchase-card purchase-section" onSubmit={event => { event.preventDefault(); m.onAddressSubmit(); }}>
                        <div className="purchase-section-heading"><span className="purchase-section-icon"><Truck size={20} /></span><div><h2>Forma de entrega</h2><p>Por ahora hacemos envíos solo en Lima.</p></div></div>
                        <fieldset className="purchase-delivery-options" disabled={m.isCreating}><legend className="purchase-sr-only">Elige cómo recibir tu pedido</legend>
                            {[['domicilio', 'Envío a domicilio', 'Entrega a la dirección que indiques', Truck], ['tienda', 'Retiro en tienda', 'Recoge tu pedido, sin costo de envío', Store]].map(([value, label, hint, Icon]) => <label key={value} className={`purchase-delivery-option${m.deliveryType === value ? ' is-selected' : ''}`}>
                                <input type="radio" name="delivery" value={value} disabled={value === 'tienda' && !m.pickupLocations.length} checked={m.deliveryType === value} onChange={() => m.onDeliveryChange(value)} /><Icon size={21} aria-hidden="true" /><span><strong>{label}</strong><small>{value === 'tienda' && !m.pickupLocations.length ? 'Retiro temporalmente no disponible' : hint}</small></span>
                            </label>)}
                        </fieldset>
                        <div className="purchase-form-block"><h3>{m.deliveryType === 'tienda' ? 'Datos de quien recoge' : 'Datos de quien recibe'}</h3><p>Los campos marcados con * son obligatorios.</p>
                            <div className="purchase-form-grid">
                                {addressField('nombres', 'Nombres *', { input: { autoComplete: 'given-name' } })}
                                {addressField('apellidos', 'Apellidos *', { input: { autoComplete: 'family-name' } })}
                                <Field id="purchase-document-type" label="Tipo de documento *"><select id="purchase-document-type" value={m.address.tipoDoc} disabled={m.isCreating} onChange={event => { m.onAddressChange('tipoDoc', event.target.value); m.onAddressChange('doc', ''); }}><option>DNI</option><option value="CE">Carné de extranjería</option><option value="PASAPORTE">Pasaporte</option></select></Field>
                                {addressField('doc', 'Número de documento *', { maxLength: m.address.tipoDoc === 'DNI' ? 8 : 20, input: { inputMode: m.address.tipoDoc === 'DNI' ? 'numeric' : 'text', pattern: m.address.tipoDoc === 'DNI' ? '[0-9]{8}' : '[A-Za-z0-9]{4,20}', title: m.address.tipoDoc === 'DNI' ? 'Ingresa los 8 dígitos del DNI' : 'Ingresa entre 4 y 20 letras o números' } })}
                                {addressField('celular', 'Celular *', { maxLength: 9, input: { type: 'tel', inputMode: 'tel', autoComplete: 'tel-national', pattern: '9[0-9]{8}', title: 'Ingresa un celular peruano de 9 dígitos' } })}
                            </div>
                        </div>
                        {m.deliveryType === 'domicilio' ? <div className="purchase-form-block"><h3>Dirección en Lima</h3><div className="purchase-form-grid">
                            <Field id="purchase-district" label="Distrito *"><select id="purchase-district" value={m.address.distrito || ''} onChange={event => m.onAddressChange('distrito', event.target.value)} disabled={m.isCreating} required><option value="">Selecciona un distrito</option>{m.districts.map(district => <option key={district}>{district}</option>)}</select></Field>
                            {addressField('tipo', 'Tipo de dirección', { required: false })}
                            {addressField('codigo_postal', 'Código postal (opcional)', { required: false, maxLength: 5, input: { inputMode: 'numeric', autoComplete: 'postal-code', pattern: '[0-9]{5}', title: 'Ingresa 5 dígitos o deja el campo vacío' } })}
                            {addressField('direccion', 'Calle, número y departamento *', { wide: true, maxLength: 255, input: { autoComplete: 'street-address', placeholder: 'Ej. Av. Los Olivos 123, departamento 201' } })}
                            {addressField('referencia', 'Referencia (opcional)', { wide: true, required: false, maxLength: 255, input: { placeholder: 'Una indicación que ayude a ubicar la dirección' } })}
                            {m.canSaveAddress && <label className="purchase-points"><input type="checkbox" checked={Boolean(m.address.guardarDireccion)} onChange={event => m.onAddressChange('guardarDireccion', event.target.checked)} /><span>Guardar dirección en mi cuenta</span></label>}
                        </div>
                        {m.isCalculatingShipping ? (
                            <div className="purchase-delivery-rate-preview is-loading" role="status" aria-live="polite">
                                <span className="purchase-spinner" />
                                <div className="purchase-delivery-rate-info">
                                    <strong>Calculando costo de entrega…</strong>
                                    <small className="purchase-delivery-rate-note">Consultando tarifa automática para {m.address.distrito || 'tu dirección'}</small>
                                </div>
                            </div>
                        ) : m.shippingCalculated && m.address.distrito ? (
                            <div className={`purchase-delivery-rate-preview ${m.shippingCost === 0 ? 'is-free' : 'is-success'}`} role="status" aria-live="polite">
                                <div className="purchase-delivery-rate-icon">
                                    <Truck size={18} />
                                </div>
                                <div className="purchase-delivery-rate-info">
                                    <div className="purchase-delivery-rate-header">
                                        <span>Costo de entrega para <strong>{m.address.distrito}</strong>:</span>
                                        <span className="purchase-delivery-rate-price">
                                            {m.shippingCost === 0 ? <span className="purchase-badge-free">¡Envío Gratis!</span> : <strong>{money(m.shippingCost)}</strong>}
                                        </span>
                                    </div>
                                    <small className="purchase-delivery-rate-note">
                                        {m.shippingInfo?.source === 'free_shipping'
                                            ? '¡Tu compra califica para envío gratis!'
                                            : (m.shippingInfo?.courier || 'Entrega Novape')}
                                        {m.shippingInfo?.delivery_window?.min_business_days && m.shippingInfo?.delivery_window?.max_business_days
                                            ? ` · Llegada estimada: ${m.shippingInfo.delivery_window.min_business_days} a ${m.shippingInfo.delivery_window.max_business_days} días hábiles`
                                            : ' · Llegada estimada: 1 a 3 días hábiles'}
                                    </small>
                                </div>
                            </div>
                        ) : !m.address.distrito ? (
                            <div className="purchase-delivery-rate-preview is-hint">
                                <Truck size={18} />
                                <p>Selecciona tu distrito para calcular el costo de entrega automáticamente.</p>
                            </div>
                        ) : null}
                        {m.deliveryCalcError && <div className="purchase-alert is-error" role="alert" style={{ marginTop: '12px', marginBottom: 0 }}>{m.deliveryCalcError}</div>}
                        <details className="purchase-map-details" onToggle={event => setMapOpen(event.currentTarget.open)}><summary><MapPin size={16} />Precisar ubicación en el mapa (opcional)</summary>{mapOpen && map}</details></div>
                            : <div className="purchase-form-block"><label>Sede de retiro<select required value={m.address.pickup_location_id} onChange={event => m.onAddressChange('pickup_location_id', Number(event.target.value))}><option value="">Selecciona una sede</option>{m.pickupLocations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
                                {m.pickupLocations.filter(location => location.id === Number(m.address.pickup_location_id)).map(location => <div key={location.id} className="purchase-notice"><Store size={18} /><p>{location.address}<br />Horario: {location.hours}<br />Espera el aviso «Listo para recoger» y presenta tu documento y código de pedido.</p></div>)}
                                <div className="purchase-delivery-rate-preview is-free" style={{ marginTop: '14px' }}>
                                    <div className="purchase-delivery-rate-icon">
                                        <Store size={18} />
                                    </div>
                                    <div className="purchase-delivery-rate-info">
                                        <div className="purchase-delivery-rate-header">
                                            <span>Retiro en tienda seleccionado:</span>
                                            <span className="purchase-delivery-rate-price"><span className="purchase-badge-free">¡Sin costo!</span></span>
                                        </div>
                                        <small className="purchase-delivery-rate-note">Recoge gratis en la sede seleccionada una vez preparado el pedido.</small>
                                    </div>
                                </div>
                            </div>}
                        {m.addressError && <div className="purchase-alert is-error" role="alert">{m.addressError}</div>}
                        <div className="purchase-section-actions"><button type="submit" className="purchase-primary" disabled={m.isCreating}>{m.isCreating ? 'Validando datos…' : 'Revisar entrega'}<ArrowRight size={18} /></button></div>
                    </form>}

                    {m.step === 2 && <section className="purchase-card purchase-section">
                        <div className="purchase-section-heading"><span className="purchase-section-icon"><Check size={20} /></span><div><h2>Todo listo para continuar</h2><p>Comprueba que estos datos sean correctos.</p></div></div>
                        <div className="purchase-review-block"><div><h3>{m.deliveryType === 'tienda' ? 'Retiro en tienda' : 'Envío a domicilio'}</h3><button type="button" className="purchase-text-button" onClick={m.onEditAddress}>Cambiar</button></div><p>{m.deliveryType === 'tienda' ? `${pickup?.name || ''}: ${pickup?.address || ''} \u00b7 ${pickup?.hours || ''}. Sin costo de env\u00edo` : `${m.address.direccion}, ${m.address.distrito}, Lima`}</p>{m.address.referencia && m.deliveryType === 'domicilio' && <p className="purchase-muted">Referencia: {m.address.referencia}</p>}</div>
                        <div className="purchase-review-block"><h3>{m.deliveryType === 'tienda' ? 'Persona que recoge' : 'Persona que recibe'}</h3><p>{m.address.nombres} {m.address.apellidos}</p><p className="purchase-muted">{m.address.tipoDoc}: {m.address.doc} · Celular: {m.address.celular}</p></div>
                        <div className="purchase-review-block"><h3>Costo de entrega</h3><p>{m.deliveryType === 'tienda' || m.shippingCost === 0 ? 'Sin costo' : money(m.shippingCost)}</p><p className="purchase-muted">{m.deliveryType === 'tienda' ? 'Las indicaciones de retiro se confirman con el pedido.' : 'El importe se vuelve a comprobar al preparar el pago.'}</p></div>
                        <div className="purchase-section-actions"><button type="button" className="purchase-text-button" onClick={m.onEditAddress}><ChevronLeft size={16} />Editar entrega</button><button type="button" className="purchase-primary" onClick={m.onDeliveryConfirm}>Continuar al pago<ArrowRight size={18} /></button></div>
                    </section>}

                    {m.step === 3 && <>
                        <section className="purchase-card purchase-section">
                            <div className="purchase-section-heading"><span className="purchase-section-icon"><Package size={20} /></span><div><h2>Tu entrega</h2><p>{m.deliveryType === 'tienda' ? 'Retiro en tienda' : `${m.address.distrito}, Lima`}</p></div><button type="button" className="purchase-text-button" onClick={m.onEditAddress}>Editar</button></div>
                        </section>
                        <section className="purchase-card purchase-section">
                            <div className="purchase-section-heading"><span className="purchase-section-icon"><CreditCard size={20} /></span><div><h2>Datos del comprobante</h2><p>Usaremos este correo para la confirmación de compra.</p></div>{m.billingConfirmed && <button type="button" className="purchase-text-button" onClick={m.onEditBilling}>Editar</button>}</div>
                            {m.billingConfirmed ? <div className="purchase-review-block"><h3>{m.billing.comprobante}</h3><p>{m.billing.comprobante === 'Factura' ? `${m.billing.razonSocial} · RUC ${m.billing.ruc}` : m.billing.nombres || `${m.address.nombres} ${m.address.apellidos}`}</p><p className="purchase-muted">{m.billing.email}</p></div>
                                : <form onSubmit={event => { event.preventDefault(); m.onBillingConfirm(); }}>
                                    <fieldset className="purchase-billing-options"><legend className="purchase-sr-only">Tipo de comprobante</legend>{['Boleta', 'Factura'].map(type => <label key={type} className={m.billing.comprobante === type ? 'is-selected' : ''}><input type="radio" name="receipt" checked={m.billing.comprobante === type} onChange={() => m.onBillingChange('comprobante', type)} />{type}</label>)}</fieldset>
                                    <div className="purchase-form-grid">
                                        {m.billing.comprobante === 'Boleta' ? <>
                                            {billingField('nombres', 'Nombre para el comprobante', { required: false, wide: true })}
                                            {billingField('dni', 'DNI del comprobante (opcional)', { required: false, maxLength: 8, input: { inputMode: 'numeric', pattern: '[0-9]{8}', title: 'Ingresa 8 dígitos o deja el campo vacío' } })}
                                        </> : <>
                                            {billingField('ruc', 'RUC *', { maxLength: 11, input: { inputMode: 'numeric', pattern: '[0-9]{11}', title: 'Ingresa los 11 dígitos del RUC' } })}
                                            <div className="purchase-field purchase-lookup"><button type="button" className="purchase-outline" onClick={m.onLookupDocument} disabled={m.loadingDocument || !/^[0-9]{11}$/.test(m.billing.ruc)}>{m.loadingDocument ? 'Consultando…' : 'Consultar RUC'}</button></div>
                                            {billingField('razonSocial', 'Razón social *', { wide: true })}
                                            {billingField('direccionFiscal', 'Dirección fiscal *', { wide: true })}
                                        </>}
                                        {billingField('email', 'Correo electrónico *', { wide: true, maxLength: 254, input: { type: 'email', autoComplete: 'email', placeholder: 'tu@correo.com' } })}
                                    </div><div className="purchase-section-actions"><button type="submit" className="purchase-primary">Confirmar datos de pago<Check size={17} /></button></div>
                                </form>}
                        </section>
                        <section className="purchase-card purchase-section"><details className="purchase-benefits" open={Boolean(m.appliedCoupon || m.usePoints)}><summary><Tag size={17} />Cupón y puntos (opcional)</summary>
                            <form className="purchase-coupon-form" onSubmit={event => { event.preventDefault(); m.onApplyCoupon(); }}><label htmlFor="purchase-coupon" className="purchase-sr-only">Código de cupón</label><input id="purchase-coupon" value={m.couponCode} onChange={event => m.setCouponCode(event.target.value)} placeholder="Ingresa tu código" maxLength={100} disabled={m.couponPending} /><button type="submit" className="purchase-outline" disabled={m.couponPending || !m.couponCode.trim()}>{m.couponPending ? 'Validando…' : 'Aplicar'}</button></form>
                            {m.appliedCoupon && <div className="purchase-coupon-applied"><span>{m.appliedCoupon.codigo}</span><button type="button" className="purchase-text-button" aria-label="Quitar cupón" onClick={m.onRemoveCoupon}><X size={16} />Quitar</button></div>}
                            {m.couponMessage && <p className={`purchase-inline-message${m.couponMessage.type === 'error' ? ' is-error' : ''}`} role="status">{m.couponMessage.text}</p>}
                            {m.loyaltyPoints > 0 && <label className="purchase-points"><input type="checkbox" checked={m.usePoints} onChange={event => m.setUsePoints(event.target.checked)} /><span>Usar mis {m.loyaltyPoints} puntos<small>El descuento se confirma en el importe de pago.</small></span></label>}
                        </details></section>
                        <section className="purchase-card purchase-section purchase-payment" aria-labelledby="purchase-payment-title" aria-busy={m.quoteFetching}>
                            <div className="purchase-section-heading"><span className="purchase-section-icon"><ShieldCheck size={20} /></span><div><h2 id="purchase-payment-title">Pago con Niubiz</h2><p>Las opciones disponibles se muestran en la pasarela.</p></div></div>
                            {quoteMatches && <NiubizTestCard quote={m.quote} />}
                            {quoteMatches && m.quote.orderAccessUrl && <p className="purchase-helper"><a href={m.quote.orderAccessUrl}>Guardar enlace privado para consultar o recuperar esta compra</a></p>}
                            {!m.billingConfirmed ? <p className="purchase-notice">Confirma los datos del comprobante para preparar el pago.</p>
                                : m.quoteFetching || m.couponPending ? <div className="purchase-payment-loading" role="status"><span className="purchase-spinner" />{m.couponPending ? 'Validando el cupón…' : 'Comprobando el importe y preparando el pago…'}</div>
                                    : m.quoteError ? <div className="purchase-alert is-error" role="alert"><p>{m.quoteError}</p><button type="button" className="purchase-outline" onClick={m.onRetry}>Reintentar preparación</button></div>
                                        : ready ? <><p className="purchase-payment-amount">Total a pagar<strong>{money(m.quote.amount)}</strong></p><button type="button" className="purchase-primary" onClick={m.onPay}>Pagar {money(m.quote.amount)}<ArrowRight size={18} /></button><p className="purchase-helper">La compra se confirma cuando la pasarela y la tienda validan el pago.</p></>
                                            : <><p className="purchase-muted">{expired ? 'La sesión de pago necesita renovarse. Actualízala antes de continuar.' : 'Necesitamos actualizar el importe antes de pagar.'}</p><button type="button" className="purchase-outline" onClick={m.onRetry}>Actualizar pago</button></>}
                        </section>
                    </>}
                    {m.addressSaved && shippingLabel && <p className="purchase-helper" role="status">{shippingLabel}</p>}
                </div>
                <aside className="purchase-card purchase-summary" aria-labelledby="checkout-summary-title"><header><h2 id="checkout-summary-title">Resumen de tu pedido</h2><p>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p></header><div className="purchase-summary-content">
                    <div className="purchase-summary-items">{items.map(item => <article key={item.id}><span className="purchase-summary-image"><Package size={20} />{item.imagen && <img src={item.imagen} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />}</span><div><h3>{item.nombre}</h3><p>{item.cantidad} {item.cantidad === 1 ? 'unidad' : 'unidades'} · {money(item.precio * item.cantidad)}</p></div></article>)}</div>
                    <Link href="/carrito" className="purchase-secondary-link">Editar productos</Link>
                    <dl className="purchase-totals"><div><dt>Subtotal</dt><dd>{money(summary?.subtotal ?? m.baseTotal)}</dd></div>
                        {(summary?.couponDiscount ?? m.discountAmount) > 0 && <div className="is-discount"><dt>Cupón</dt><dd>− {money(summary?.couponDiscount ?? m.discountAmount)}</dd></div>}
                        {(summary?.pointsDiscount ?? m.pointsDiscount) > 0 && <div className="is-discount"><dt>Puntos</dt><dd>− {money(summary?.pointsDiscount ?? m.pointsDiscount)}</dd></div>}
                        <div><dt>Entrega</dt><dd>{m.deliveryType === 'tienda' ? 'Sin costo' : m.isCalculatingShipping ? 'Calculando…' : (m.shippingCalculated || m.addressSaved) ? (Number(summary?.shipping ?? m.shippingCost) === 0 ? 'Gratis' : money(summary?.shipping ?? m.shippingCost)) : 'Por calcular'}</dd></div>
                        <div className="is-total"><dt>{ready ? 'Total a pagar' : 'Total estimado'}</dt><dd>{money(quoteMatches ? m.quote.amount : m.cartTotal)}</dd></div>
                    </dl><p className="purchase-helper">{ready ? 'Importe confirmado para esta sesión de pago.' : 'El importe final se confirma al preparar el pago.'}</p>
                </div></aside>
            </div>
        </main>
    </div>;
}
