import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import { Lock, FileText, Search, Package, ShoppingCart, Trash2, User, Receipt, DollarSign, Printer, Settings } from 'lucide-react';
import AdminLayout from '../../../Layouts/AdminLayout';
import '../../../../css/admin/admin.css';
import { useConfirm } from '@/Contexts/ConfirmContext';
import Swal from 'sweetalert2';


export default function PosIndex({ productos, metodosPago, categorias = [], ventasHoy, ticketsHoy, cajaAbierta, ventasCajaTotal, ventasCajaEfectivo, logoUrl, igv_porcentaje = 18, cajas = [], cajaRequiereCierre = false }) {
    const confirmDialog = useConfirm();

    const { flash, errors, auth } = usePage().props;
    const [carrito, setCarrito] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [metodoPagoId, setMetodoPagoId] = useState(metodosPago?.[0]?.id || '');
    const [tipoComprobante, setTipoComprobante] = useState('ticket');
    const [selectedCategory, setSelectedCategory] = useState('Todas');

    // Estados del cliente
    const [clienteDoc, setClienteDoc] = useState('');
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteDireccion, setClienteDireccion] = useState('');
    const [isSearchingCliente, setIsSearchingCliente] = useState(false);

    // Caja states
    const [showCierre, setShowCierre] = useState(false);
    const [cajaId, setCajaId] = useState(cajas[0]?.id || '');
    const sellingRef = useRef(false);
    const operationRef = useRef(null);
    const [isSelling, setIsSelling] = useState(false);
    const canDiscount = auth?.user?.roles?.some(r => r.nombre === 'admin') || auth?.user?.permisos?.includes('pos.descontar');
    const [montoInicial, setMontoInicial] = useState('');
    const [montoDeclarado, setMontoDeclarado] = useState('');
    const [isAperturando, setIsAperturando] = useState(false);

    const [showMovimiento, setShowMovimiento] = useState(false);
    const [movimientoData, setMovimientoData] = useState({ tipo: 'ingreso', monto: '', concepto: '' });
    
    // Ventas pausadas
    const [showPausadas, setShowPausadas] = useState(false);
    const [ventasPausadas, setVentasPausadas] = useState(() => (() => { try { return JSON.parse(localStorage.getItem(`pos_ventas_pausadas_${auth?.user?.id}`)) || []; } catch { return []; } })());

    const { cajaIngresos = 0, cajaEgresos = 0 } = usePage().props;
    const searchInputRef = useRef(null);

    // Checkout / Pagos Mixtos
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [pagos, setPagos] = useState([{ metodo_pago_id: metodosPago?.[0]?.id || '', monto: 0 }]);
    const [montoRecibido, setMontoRecibido] = useState('');

    // Descuentos
    const [descuentoTipo, setDescuentoTipo] = useState('fijo'); // 'fijo' o 'porcentaje'
    const [descuentoValor, setDescuentoValor] = useState('');

    const aperturarCaja = (e) => {
        e.preventDefault();
        if (isAperturando) return;
        setIsAperturando(true);
        router.post('/admin/caja/aperturar', { monto_inicial: montoInicial, caja_id: cajaId }, {
            onFinish: () => setIsAperturando(false)
        });
    };

    const cerrarCaja = (e) => {
        e.preventDefault();
        router.post('/admin/caja/cerrar', { monto_final_declarado: montoDeclarado }, {
            onSuccess: () => setShowCierre(false)
        });
    };

    const registrarMovimiento = (e) => {
        e.preventDefault();
        router.post('/admin/caja/movimiento', movimientoData, {
            onSuccess: () => {
                setShowMovimiento(false);
                setMovimientoData({ tipo: 'ingreso', monto: '', concepto: '' });
            }
        });
    };

    const [productList, setProductList] = useState(productos || []);

    const categoriasDisponibles = useMemo(() => {
        if (categorias && categorias.length > 0) {
            return ['Todas', ...categorias];
        }
        const cats = new Set(productos.map(p => p.categoria_nombre).filter(Boolean));
        return ['Todas', ...Array.from(cats)];
    }, [productos, categorias]);

    useEffect(() => {
        const controller = new AbortController();
        const fetchProducts = async () => {
            try {
                const params = new URLSearchParams();
                if (searchTerm) params.append('search', searchTerm);
                if (selectedCategory && selectedCategory !== 'Todas') params.append('categoria', selectedCategory);
                
                const res = await fetch(`/admin/pos/buscar-productos?${params.toString()}`, { signal: controller.signal });
                const json = await res.json();
                if (json.success) {
                    setProductList(json.data);
                }
            } catch (e) {
                console.error("Error fetching products", e);
            }
        };

        const timer = setTimeout(() => {
            fetchProducts();
        }, 300);

        return () => { clearTimeout(timer); controller.abort(); };
    }, [searchTerm, selectedCategory, cajaAbierta?.id]);

    const agregarAlCarrito = (producto) => {
        const idx = carrito.findIndex(i => i.variante_id === producto.variante_id);
        if (idx >= 0) {
            if (carrito[idx].cantidad < producto.stock) {
                const updated = [...carrito];
                updated[idx].cantidad += 1;
                setCarrito(updated);
            }
        } else {
            setCarrito([...carrito, {
                variante_id: producto.variante_id,
                producto_nombre: producto.nombre,
                precio_unitario: parseFloat(producto.precio),
                cantidad: 1,
                stock: producto.stock,
                imagen: producto.imagen,
                sku: producto.sku,
            }]);
        }
    };

    const cambiarCantidad = (idx, delta) => {
        const updated = [...carrito];
        const newQty = updated[idx].cantidad + delta;
        if (newQty <= 0) {
            updated.splice(idx, 1);
        } else if (newQty <= updated[idx].stock) {
            updated[idx].cantidad = newQty;
        }
        setCarrito(updated);
    };

    const eliminarItem = (idx) => {
        setCarrito(carrito.filter((_, i) => i !== idx));
    };

    const subtotalBruto = carrito.reduce((sum, i) => sum + (i.precio_unitario * i.cantidad), 0);
    const montoDescuento = descuentoTipo === 'porcentaje' ? (subtotalBruto * (Number(descuentoValor) / 100)) : Number(descuentoValor);
    const total = Math.max(0, subtotalBruto - montoDescuento);
    
    // El precio ya incluye IGV. Calculamos el valor neto (sin IGV) y el monto del IGV.
    const factor = 1 + (Number(igv_porcentaje) / 100);
    const subtotal = total / factor;
    const igv = total - subtotal;

    // Actualizar el monto del primer pago si solo hay uno
    useEffect(() => {
        if (pagos.length === 1 && !showCheckoutModal) {
            setPagos([{ metodo_pago_id: metodoPagoId, monto: total }]);
        }
    }, [total, metodoPagoId]);

    const buscarCliente = async () => {
        if (!clienteDoc) return;
        setIsSearchingCliente(true);
        const tipo = tipoComprobante === 'factura' ? 'RUC' : 'DNI';

        try {
            const res = await fetch(`/admin/pos/buscar-cliente?tipo_documento=${tipo}&numero_documento=${clienteDoc}`);
            const json = await res.json();
            if (json.success) {
                setClienteNombre(json.data.nombre_razon_social);
                setClienteDireccion(json.data.direccion || '');
            } else {
                alert(json.error || 'No encontrado');
                setClienteNombre('');
                setClienteDireccion('');
            }
        } catch (e) {
            console.error(e);
            alert('Error al buscar cliente');
        } finally {
            setIsSearchingCliente(false);
        }
    };

    // Hotkeys
    useEffect(() => {
        const handleKeyDown = async (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                iniciarCobro();
            } else if (e.key === 'F4') {
                e.preventDefault();
                if (searchInputRef.current) searchInputRef.current.focus();
            } else if (e.key === 'F8') {
                e.preventDefault();
                pausarVenta();
            } else if (e.key === 'Escape') {
                if (showCheckoutModal || showCierre || showMovimiento || showPausadas) {
                    setShowCheckoutModal(false);
                    setShowCierre(false);
                    setShowMovimiento(false);
                    setShowPausadas(false);
                } else if (carrito.length > 0) {
                    if(await confirmDialog("¿Limpiar el carrito actual?")) {
                        setCarrito([]);
                        setClienteDoc('');
                        setClienteNombre('');
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    const pausarVenta = () => {
        if (carrito.length === 0) return;
        const nuevaPausada = {
            id: Date.now(),
            fecha: new Date().toLocaleString(),
            carrito,
            clienteDoc,
            clienteNombre,
            clienteDireccion,
            total
        };
        const actualizadas = [...ventasPausadas, nuevaPausada];
        setVentasPausadas(actualizadas);
        localStorage.setItem(`pos_ventas_pausadas_${auth?.user?.id}`, JSON.stringify(actualizadas));
        
        setCarrito([]);
        setClienteDoc('');
        setClienteNombre('');
        alert('Venta pausada y guardada temporalmente.');
    };

    const recuperarVenta = (ventaPausada) => {
        setCarrito(ventaPausada.carrito);
        setClienteDoc(ventaPausada.clienteDoc || '');
        setClienteNombre(ventaPausada.clienteNombre || '');
        setClienteDireccion(ventaPausada.clienteDireccion || '');
        
        const actualizadas = ventasPausadas.filter(v => v.id !== ventaPausada.id);
        setVentasPausadas(actualizadas);
        localStorage.setItem(`pos_ventas_pausadas_${auth?.user?.id}`, JSON.stringify(actualizadas));
        setShowPausadas(false);
    };

    const iniciarCobro = () => {
        if (carrito.length === 0) return;
        if (tipoComprobante === 'factura') {
            if (!clienteDoc || clienteDoc.length !== 11) {
                alert("Para emitir Factura es obligatorio ingresar un RUC válido de 11 dígitos.");
                return;
            }
            if (!clienteNombre) {
                alert("Para emitir Factura es obligatorio ingresar la Razón Social.");
                return;
            }
        } else if (tipoComprobante === 'boleta' && total >= 700) {
            if (!clienteDoc || clienteDoc.length < 8) {
                alert("Por norma de SUNAT, toda boleta de S/ 700 a más exige identificar al cliente con DNI o Carné de Extranjería.");
                return;
            }
        }
        // Always sync the primary payment method when opening checkout
        setPagos([{ metodo_pago_id: metodoPagoId, monto: total }]);
        
        setShowCheckoutModal(true);
    };

    const completarVenta = () => {
        if (sellingRef.current || !cajaAbierta || cajaRequiereCierre) return;
        const sumaPagos = pagos.reduce((sum, p) => sum + Number(p.monto), 0);
        if (Math.abs(sumaPagos - total) > 0.05) {
            alert(`La suma de los pagos (S/ ${sumaPagos.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}) debe ser igual al total de la venta (S/ ${total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}).`);
            return;
        }

        sellingRef.current = true;
        setIsSelling(true);
        operationRef.current ||= crypto.randomUUID();
        router.post('/admin/pos/venta', {
            operation_key: operationRef.current,
            items: carrito.map(i => ({
                variante_id: i.variante_id,
                producto_nombre: i.producto_nombre,
                precio_unitario: i.precio_unitario,
                cantidad: i.cantidad,
            })),
            metodo_pago_id: pagos[0]?.metodo_pago_id || metodoPagoId,
            pagos: pagos,
            tipo_comprobante: tipoComprobante,
            descuento: montoDescuento,
            cliente: tipoComprobante === 'ticket' ? null : {
                tipo_documento: tipoComprobante === 'factura' ? 'RUC' : 'DNI',
                numero_documento: clienteDoc,
                nombre_razon_social: clienteNombre,
                direccion: clienteDireccion
            }
        }, {
            onSuccess: (page) => {
                if (!page.props.flash?.venta_id) return;
                operationRef.current = null;
                setCarrito([]);
                setClienteDoc('');
                setClienteNombre('');
                setClienteDireccion('');
                setTipoComprobante('ticket');
                setDescuentoValor('');
                setShowCheckoutModal(false);
                setPagos([{ metodo_pago_id: metodosPago?.[0]?.id || '', monto: 0 }]);
            },
            onFinish: () => { sellingRef.current = false; setIsSelling(false); },
            onError: (errs) => {
                console.error("Validation errors:", errs);
                alert('No se pudo guardar la venta:\n' + Object.values(errs).join('\n'));
            }
        });
    };

    useEffect(() => {
        if (flash?.error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: flash.error,
                confirmButtonColor: '#0066cc',
                confirmButtonText: 'Aceptar'
            });
        }
        if (flash?.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Venta Exitosa!',
                text: flash.success,
                confirmButtonColor: '#0066cc',
                confirmButtonText: 'Aceptar',
                timer: 3000,
                timerProgressBar: true
            });
            if (flash?.venta_id) {
                window.open(`/admin/pos/ticket/${flash.venta_id}`, '_blank');
            }
        }
    }, [flash]);

    // Barcode Scanner Listener
    useEffect(() => {
        let barcodeBuffer = '';
        let lastKeyTime = Date.now();

        const handleKeyDown = (e) => {
            // Si el usuario está escribiendo en el buscador manual, no interceptar
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                // Permitir que el scanner dispare 'Enter' dentro del input de búsqueda
                if (e.key === 'Enter' && barcodeBuffer.length > 2) {
                    e.preventDefault();
                    const localMatch = productList.find(p => p.sku === barcodeBuffer);
                    if (localMatch && localMatch.stock > 0) {
                        agregarAlCarrito(localMatch);
                        setSearchTerm('');
                    } else if (!localMatch) {
                        fetch(`/admin/pos/buscar-productos?search=${barcodeBuffer}`)
                            .then(r => r.json())
                            .then(json => {
                                if (json.success && json.data.length > 0) {
                                    const prod = json.data[0];
                                    if (prod.stock > 0) agregarAlCarrito(prod);
                                    else alert('Sin stock: ' + prod.nombre);
                                } else {
                                    alert('Código no encontrado: ' + barcodeBuffer);
                                }
                                setSearchTerm('');
                            });
                    }
                    barcodeBuffer = '';
                }
                return;
            }

            const currentTime = Date.now();
            // Los scanners leen rapidísimo (<30ms por tecla)
            if (currentTime - lastKeyTime > 50) {
                barcodeBuffer = '';
            }
            lastKeyTime = currentTime;

            if (e.key === 'Enter') {
                if (barcodeBuffer.length > 2) {
                    e.preventDefault();
                    const localMatch = productList.find(p => p.sku === barcodeBuffer);
                    if (localMatch && localMatch.stock > 0) {
                        agregarAlCarrito(localMatch);
                    } else if (localMatch && localMatch.stock <= 0) {
                        alert('El producto escaneado no tiene stock: ' + localMatch.nombre);
                    } else {
                        fetch(`/admin/pos/buscar-productos?search=${barcodeBuffer}`)
                            .then(r => r.json())
                            .then(json => {
                                if (json.success && json.data.length > 0) {
                                    const prod = json.data[0];
                                    if (prod.stock > 0) agregarAlCarrito(prod);
                                    else alert('Sin stock: ' + prod.nombre);
                                } else {
                                    alert('Código no encontrado: ' + barcodeBuffer);
                                }
                            });
                    }
                }
                barcodeBuffer = '';
            } else if (e.key.length === 1) {
                barcodeBuffer += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [productList, carrito]);

    return (
        <AdminLayout logoUrl={logoUrl}>
            {cajaRequiereCierre && <p role="alert" style={{padding: 16, background: '#FFF4CC'}}>Esta sesión antigua no tiene almacén. Cierra el turno y abre una caja física para continuar.</p>}
            <Head title="Terminal POS" />

            {/* Header KPIs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
                    <div style={{ padding: '8px', backgroundColor: '#F0F9FF', borderRadius: '10px', color: '#004797' }}>
                        <ShoppingCart size={24} />
                    </div>
                    Terminal POS
                </h1>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>
                        <User size={16} style={{ color: '#94A3B8' }} /> {auth?.user?.nombres || 'Cajero'}
                    </div>
                    {cajaAbierta && (
                        <button
                            onClick={() => {
                                const esperado = Number(cajaAbierta.monto_inicial) + Number(ventasCajaEfectivo);
                                setMontoDeclarado(esperado.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}));
                                setShowCierre(true);
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0F172A'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1E293B'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                            style={{ padding: '8px 16px', background: '#1E293B', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }}>
                            <Lock size={14} /> Cerrar Turno
                        </button>
                    )}
                    <Link 
                        href="/admin/pos/historial" 
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        style={{ padding: '8px 16px', background: '#ffffff', border: '1px solid #E2E8F0', color: '#475569', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <FileText size={14} style={{ color: '#94A3B8' }} /> Historial
                    </Link>
                    <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', letterSpacing: '0.05em' }}>VENTAS HOY</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#004797' }}>S/ {Number(ventasHoy).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', letterSpacing: '0.05em' }}>TICKETS</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#004797' }}>{ticketsHoy}</div>
                    </div>
                </div>
            </div>

            <div className="pos-grid" style={{ gap: '24px' }}>
                {/* Cuadrícula de Productos */}
                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Buscar por código de barras o nombre (F4)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={(e) => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.15)'; e.target.style.backgroundColor = '#ffffff'; }}
                            onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = '#F8FAFC'; }}
                            style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease', backgroundColor: '#F8FAFC', color: '#1E293B' }}
                        />
                    </div>
                    
                    {/* Filtro de Categorías */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '12px', scrollbarWidth: 'none' }}>
                        {categoriasDisponibles.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                onMouseEnter={(e) => { if(selectedCategory !== cat) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                onMouseLeave={(e) => { if(selectedCategory !== cat) e.currentTarget.style.backgroundColor = '#ffffff'; }}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: `1px solid ${selectedCategory === cat ? '#004797' : '#E2E8F0'}`,
                                    background: selectedCategory === cat ? '#004797' : '#ffffff',
                                    color: selectedCategory === cat ? '#ffffff' : '#475569',
                                    fontSize: '13px',
                                    fontWeight: selectedCategory === cat ? '600' : '500',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease',
                                    boxShadow: selectedCategory === cat ? '0 2px 4px rgba(0, 71, 151, 0.25)' : 'none'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', overflowY: 'auto', flex: 1, paddingRight: '6px' }}>
                        {productList.map((prod) => (
                            <div
                                key={prod.id}
                                onClick={() => prod.stock > 0 && agregarAlCarrito(prod)}
                                onMouseEnter={(e) => { if(prod.stock > 0) { e.currentTarget.style.borderColor = '#004797'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(0, 71, 151, 0.15)'; } }}
                                onMouseLeave={(e) => { if(prod.stock > 0) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; } }}
                                style={{
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '10px',
                                    padding: '16px 12px',
                                    cursor: prod.stock > 0 ? 'pointer' : 'not-allowed',
                                    opacity: prod.stock > 0 ? 1 : 0.6,
                                    textAlign: 'center',
                                    background: '#ffffff',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <div>
                                    <div style={{ color: '#004797', marginBottom: '12px' }}>
                                        <Package size={32} style={{ margin: '0 auto' }} strokeWidth={1.5} />
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '38px', lineHeight: '1.4' }}>
                                        {prod.nombre}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>{prod.sku}</div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '16px', marginTop: '12px' }}>S/ {Number(prod.precio).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                    <div style={{ fontSize: '11px', fontWeight: '600', color: prod.stock <= 5 ? '#EF4444' : '#10B981', marginTop: '6px', padding: '2px 6px', backgroundColor: prod.stock <= 5 ? '#FEF2F2' : '#ECFDF5', borderRadius: '4px', display: 'inline-block' }}>Stock: {prod.stock}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ticket / Carrito */}
                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ textAlign: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '0.05em' }}>
                            <Receipt size={18} style={{ color: '#004797' }} /> TICKET DE VENTA
                        </h2>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
                        {carrito.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#94A3B8', marginTop: '60px' }}>
                                <div style={{ background: '#F8FAFC', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', marginBottom: '16px' }}>
                                    <ShoppingCart size={32} style={{ color: '#CBD5E1' }} />
                                </div>
                                <p style={{ fontSize: '14px', fontWeight: '500' }}>Selecciona productos de la grilla</p>
                            </div>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {carrito.map((item, index) => (
                                    <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F1F5F9', gap: '12px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.producto_nombre}</div>
                                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>S/ {item.precio_unitario.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} c/u</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                                            <button onClick={() => cambiarCantidad(index, -1)} style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#475569', transition: 'color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                                            <span style={{ fontWeight: '600', minWidth: '24px', textAlign: 'center', fontSize: '13px', color: '#1E293B' }}>{item.cantidad}</span>
                                            <button onClick={() => cambiarCantidad(index, 1)} style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#475569', transition: 'color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                        </div>
                                        <div style={{ fontWeight: '700', minWidth: '70px', textAlign: 'right', fontSize: '14px', color: '#1E293B' }}>
                                            S/ {(item.precio_unitario * item.cantidad).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </div>
                                        <button 
                                            onClick={() => eliminarItem(index)} 
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                                            style={{ color: '#94A3B8', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', transition: 'color 0.2s ease', display: 'flex' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Totals & Discounts */}
                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                        {/* Control de Descuento */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <select
                                value={descuentoTipo}
                                onChange={e => setDescuentoTipo(e.target.value)}
                                style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none', backgroundColor: '#F8FAFC', color: '#1E293B', fontWeight: '500' }}
                            >
                                <option value="fijo">Descuento (S/)</option>
                                <option value="porcentaje">Descuento (%)</option>
                            </select>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={descuentoValor}
                                disabled={!canDiscount}
                                onChange={e => setDescuentoValor(e.target.value)}
                                min="0"
                                step={descuentoTipo === 'porcentaje' ? "1" : "0.50"}
                                onFocus={(e) => { e.target.style.borderColor = '#004797'; e.target.style.backgroundColor = '#ffffff'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.backgroundColor = '#F8FAFC'; e.target.style.boxShadow = 'none'; }}
                                style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none', backgroundColor: '#F8FAFC', transition: 'all 0.2s ease', color: '#1E293B' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B', marginBottom: '6px' }}>
                            <span>Subtotal Bruto:</span><span style={{ fontWeight: '500', color: '#1E293B' }}>S/ {subtotalBruto.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        {montoDescuento > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#004797', marginBottom: '6px', fontWeight: '500' }}>
                                <span>Descuento:</span><span>- S/ {montoDescuento.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B', marginBottom: '6px' }}>
                            <span>Subtotal Neto:</span><span style={{ fontWeight: '500', color: '#1E293B' }}>S/ {subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
                            <span>IGV ({igv_porcentaje}%):</span><span style={{ fontWeight: '500', color: '#1E293B' }}>S/ {igv.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '24px', fontWeight: '800', color: '#1E293B', marginBottom: '20px', padding: '12px 16px', background: '#F0F9FF', borderRadius: '8px' }}>
                            <span>TOTAL:</span><span style={{ color: '#004797' }}>S/ {total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>

                        {/* Tipo de Comprobante */}
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: '#F8FAFC', padding: '6px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            {['ticket', 'boleta', 'factura'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => {
                                        setTipoComprobante(t);
                                        setClienteDoc('');
                                        setClienteNombre('');
                                    }}
                                    style={{
                                        flex: 1, padding: '8px 0', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textTransform: 'capitalize',
                                        background: tipoComprobante === t ? '#ffffff' : 'transparent',
                                        color: tipoComprobante === t ? '#004797' : '#64748B',
                                        boxShadow: tipoComprobante === t ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {t === 'ticket' ? 'V. Simple' : t}
                                </button>
                            ))}
                        </div>

                        {/* Datos del Cliente si no es Ticket */}
                        {tipoComprobante !== 'ticket' && (
                            <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#ffffff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#1E293B' }}>
                                    <User size={16} style={{ color: '#004797' }} /> <strong style={{ fontSize: '13px' }}>Datos del Cliente</strong> 
                                    {tipoComprobante === 'factura' || (tipoComprobante === 'boleta' && total >= 700) ? (
                                        <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: '600' }}>(Obligatorio)</span>
                                    ) : (
                                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>(Opcional)</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder={tipoComprobante === 'factura' ? 'RUC' : 'DNI'}
                                        value={clienteDoc}
                                        onChange={e => setClienteDoc(e.target.value)}
                                        onFocus={(e) => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                                        style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none', transition: 'all 0.2s ease', color: '#1E293B' }}
                                    />
                                    <button
                                        onClick={buscarCliente}
                                        disabled={isSearchingCliente || !clienteDoc}
                                        onMouseEnter={(e) => { if(!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#009BE0'; }}
                                        onMouseLeave={(e) => { if(!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#004797'; }}
                                        style={{ padding: '0 16px', background: '#004797', color: 'white', border: 'none', borderRadius: '6px', cursor: (isSearchingCliente || !clienteDoc) ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s ease', opacity: (isSearchingCliente || !clienteDoc) ? 0.6 : 1 }}
                                    >
                                        {isSearchingCliente ? '...' : 'Buscar'}
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    placeholder={tipoComprobante === 'factura' ? 'Razón Social' : 'Nombre Completo'}
                                    value={clienteNombre}
                                    onChange={e => setClienteNombre(e.target.value)}
                                    onFocus={(e) => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none', marginBottom: '8px', transition: 'all 0.2s ease', boxSizing: 'border-box', color: '#1E293B' }}
                                />
                                {tipoComprobante === 'factura' && (
                                    <input
                                        type="text"
                                        placeholder="Dirección Fiscal"
                                        value={clienteDireccion}
                                        onChange={e => setClienteDireccion(e.target.value)}
                                        onFocus={(e) => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none', transition: 'all 0.2s ease', boxSizing: 'border-box', color: '#1E293B' }}
                                    />
                                )}
                            </div>
                        )}

                        {/* Método de pago */}
                        <div style={{ marginBottom: '16px' }}>
                            <select 
                                value={metodoPagoId} 
                                onChange={e => setMetodoPagoId(e.target.value)} 
                                onFocus={(e) => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none', backgroundColor: '#F8FAFC', transition: 'all 0.2s ease', color: '#1E293B', fontWeight: '500', cursor: 'pointer' }}>
                                {metodosPago?.map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={pausarVenta}
                                disabled={carrito.length === 0 || !cajaAbierta}
                                onMouseEnter={(e) => { if(!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#E2E8F0'; }}
                                onMouseLeave={(e) => { if(!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                style={{ flex: 1, padding: '12px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: (carrito.length === 0 || !cajaAbierta) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s ease', opacity: (carrito.length === 0 || !cajaAbierta) ? 0.6 : 1 }}
                            >
                                Pausar (F8)
                            </button>
                            <button
                                onClick={iniciarCobro}
                                disabled={carrito.length === 0 || !cajaAbierta}
                                onMouseEnter={(e) => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = '#009BE0'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 71, 151, 0.3)'; } }}
                                onMouseLeave={(e) => { if(!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = '#004797'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 71, 151, 0.2)'; } }}
                                style={{ flex: 2, padding: '12px', background: '#004797', color: 'white', fontSize: '14px', fontWeight: '700', borderRadius: '8px', border: 'none', cursor: (carrito.length === 0 || !cajaAbierta) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s ease', opacity: (carrito.length === 0 || !cajaAbierta) ? 0.6 : 1, boxShadow: '0 2px 4px rgba(0, 71, 151, 0.2)' }}
                            >
                                <ShoppingCart size={18} />
                                COBRAR (F2)
                            </button>
                        </div>
                        {ventasPausadas.length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                                <button 
                                    onClick={() => setShowPausadas(true)}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                                    style={{ width: '100%', padding: '10px', background: '#ffffff', color: '#004797', border: '1px dashed #004797', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '13px' }}>
                                    Recuperar Pausadas ({ventasPausadas.length})
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* OVERLAY APERTURA DE CAJA */}
            {!cajaAbierta && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)'
                }}>
                    <div style={{ background: 'white', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <h2 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--admin-text-main)' }}>
                            <Lock size={20} /> Caja Cerrada
                        </h2>
                        <p style={{ color: '#4B5563', marginBottom: '25px', fontSize: '14px' }}>Para empezar a vender, debes aperturar tu turno ingresando el dinero base que hay actualmente en caja.</p>

                        <form onSubmit={aperturarCaja}>
                            <label htmlFor="physical-register">Caja y sucursal</label>
                            <select id="physical-register" required value={cajaId} onChange={e => setCajaId(e.target.value)} style={{width: "100%", marginBottom: 16, padding: 10}}>
                                <option value="">Selecciona una caja</option>
                                {cajas.map(c => <option key={c.id} value={c.id}>{c.sucursal_nombre} / {c.nombre}</option>)}
                            </select>
                            {!cajas.length && <p role="alert">Configura una caja con almacén en Sucursales antes de vender.</p>}
                            {errors.caja_id && <p role="alert">{errors.caja_id}</p>}
                            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>Monto Inicial (Efectivo Base) S/</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={montoInicial}
                                    onChange={(e) => setMontoInicial(e.target.value)}
                                    placeholder="Ej. 50.00"
                                    style={{ width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold' }}
                                />
                            </div>
                            <button type="submit" disabled={isAperturando || !cajaId} style={{ width: '100%', padding: '12px', background: 'var(--admin-text-main)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isAperturando ? 'not-allowed' : 'pointer', opacity: isAperturando ? 0.7 : 1 }}>
                                {isAperturando ? 'Aperturando...' : 'Aperturar Caja'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CIERRE DE CAJA */}
            {showCierre && cajaAbierta && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                        <h2 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-text-main)' }}>
                            <Lock size={20} /> Arqueo y Cierre de Caja
                        </h2>

                        <div style={{ background: '#F3F4F6', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#4B5563' }}>Fondo Inicial:</span>
                                <span style={{ fontWeight: 'bold' }}>S/ {Number(cajaAbierta.monto_inicial).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#4B5563' }}>Ingresos Manuales:</span>
                                <span style={{ fontWeight: 'bold', color: '#2563eb' }}>+ S/ {Number(cajaIngresos).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#4B5563' }}>Egresos Manuales:</span>
                                <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>- S/ {Number(cajaEgresos).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#4B5563' }}>Ventas del Turno (Efectivo):</span>
                                <span style={{ fontWeight: 'bold' }}>S/ {Number(ventasCajaEfectivo).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #D1D5DB', paddingTop: '8px', marginTop: '8px' }}>
                                <span style={{ color: '#4B5563', fontWeight: 'bold' }}>Esperado en EFECTIVO:</span>
                                <span style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '16px' }}>
                                    S/ {(Number(cajaAbierta.monto_inicial) + Number(ventasCajaEfectivo) + Number(cajaIngresos) - Number(cajaEgresos)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={cerrarCaja}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>¿Cuánto dinero en EFECTIVO hay realmente en la caja?</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={montoDeclarado}
                                    onChange={(e) => setMontoDeclarado(e.target.value)}
                                    placeholder="0.00"
                                    style={{ width: '100%', padding: '12px', border: '2px solid #E5E7EB', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => setShowCierre(false)} style={{ flex: 1, padding: '12px', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        type="button"
                                        onClick={() => setShowMovimiento(true)} 
                                        style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                                        Registrar Movimiento
                                    </button>
                                    <button type="submit" style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                                        Cerrar Turno
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL MOVIMIENTOS CAJA CHICA */}
            {showMovimiento && cajaAbierta && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                        <h2 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-text-main)' }}>
                            <Settings size={20} /> Registrar Movimiento de Caja
                        </h2>

                        <form onSubmit={registrarMovimiento}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Tipo de Movimiento</label>
                                <select 
                                    value={movimientoData.tipo}
                                    onChange={e => setMovimientoData({...movimientoData, tipo: e.target.value})}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                                >
                                    <option value="ingreso">Ingreso de Dinero (+)</option>
                                    <option value="egreso">Egreso de Dinero (-)</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Monto (S/)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.1"
                                    required
                                    value={movimientoData.monto}
                                    onChange={(e) => setMovimientoData({...movimientoData, monto: e.target.value})}
                                    placeholder="0.00"
                                    style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Concepto / Motivo</label>
                                <input
                                    type="text"
                                    required
                                    value={movimientoData.concepto}
                                    onChange={(e) => setMovimientoData({...movimientoData, concepto: e.target.value})}
                                    placeholder="Ej. Pago de agua, Sencillo..."
                                    style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => setShowMovimiento(false)} style={{ flex: 1, padding: '12px', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button type="submit" style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Pagos Mixtos / Checkout */}
            {showCheckoutModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--admin-surface)', padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: 'var(--admin-text-main)' }}>Confirmar Pago</h2>

                        <div style={{ background: '#F8FAFC', padding: '15px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 'bold' }}>TOTAL A COBRAR</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0F172A' }}>S/ {total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: 'var(--admin-text-main)' }}>Métodos de Pago</h3>
                            {pagos.map((pago, index) => (
                                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <select
                                        value={pago.metodo_pago_id}
                                        onChange={(e) => {
                                            const nuevos = [...pagos];
                                            nuevos[index].metodo_pago_id = e.target.value;
                                            setPagos(nuevos);
                                        }}
                                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text-main)', outline: 'none' }}
                                    >
                                        {metodosPago.map(m => (
                                            <option key={m.id} value={m.id}>{m.nombre}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        value={pago.monto}
                                        onChange={(e) => {
                                            const nuevos = [...pagos];
                                            nuevos[index].monto = e.target.value;
                                            setPagos(nuevos);
                                        }}
                                        step="0.01"
                                        style={{ width: '100px', padding: '8px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text-main)', outline: 'none', textAlign: 'right' }}
                                    />
                                    {pagos.length > 1 && (
                                        <button
                                            onClick={() => setPagos(pagos.filter((_, i) => i !== index))}
                                            style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button
                                onClick={() => setPagos([...pagos, { metodo_pago_id: metodosPago?.[0]?.id || '', monto: 0 }])}
                                style={{ background: 'transparent', color: 'var(--admin-primary)', border: '1px dashed var(--admin-primary)', borderRadius: '6px', padding: '8px', width: '100%', cursor: 'pointer', marginTop: '5px', fontSize: '13px', fontWeight: 'bold' }}
                            >
                                + Agregar otro método de pago
                            </button>
                        </div>

                        {/* Validar suma */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '15px', padding: '10px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                            <span style={{ fontWeight: 'bold', color: '#64748B' }}>Falta cobrar:</span>
                            <span style={{ fontWeight: 'bold', color: (total - pagos.reduce((sum, p) => sum + Number(p.monto), 0)) > 0 ? '#0F172A' : '#64748B' }}>
                                S/ {Math.max(0, total - pagos.reduce((sum, p) => sum + Number(p.monto), 0)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </span>
                        </div>

                        {/* Calculadora de Vuelto y Efectivo Rápido */}
                        {metodosPago?.find(m => m.id === pagos[0]?.metodo_pago_id)?.nombre?.toLowerCase().includes('efectivo') && pagos.length === 1 && (
                            <div style={{ marginBottom: '20px', padding: '15px', background: '#F1F5F9', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0F172A', marginBottom: '10px' }}>Efectivo Rápido y Vuelto</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
                                    {[
                                        { label: 'Exacto', val: total }, 
                                        { label: 'S/20', val: 20 }, 
                                        { label: 'S/50', val: 50 }, 
                                        { label: 'S/100', val: 100 }
                                    ].map(btn => (
                                        <button
                                            key={btn.label}
                                            type="button"
                                            onClick={() => setMontoRecibido(btn.val)}
                                            style={{ padding: '6px', fontSize: '12px', fontWeight: 'bold', background: 'white', border: '1px solid #CBD5E1', borderRadius: '6px', color: '#0F172A', cursor: 'pointer' }}
                                        >
                                            {btn.label}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>Recibido S/</div>
                                        <input
                                            type="number"
                                            value={montoRecibido}
                                            onChange={(e) => setMontoRecibido(e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '14px', fontWeight: 'bold', outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'right' }}>
                                        <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>Vuelto S/</div>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A' }}>
                                            {Number(montoRecibido) >= total ? (Number(montoRecibido) - total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setShowCheckoutModal(false)}
                                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={completarVenta}
                                disabled={isSelling || cajaRequiereCierre}
                                style={{ flex: 1, padding: '12px', background: '#0F172A', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                            >
                                <DollarSign size={18} />
                                Confirmar Venta
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL VENTAS PAUSADAS */}
            {showPausadas && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                        <h2 style={{ margin: '0 0 20px 0', color: 'var(--admin-text-main)' }}>Ventas Pausadas</h2>
                        
                        {ventasPausadas.length === 0 ? (
                            <p style={{ color: 'var(--admin-text-secondary)', textAlign: 'center' }}>No hay ventas en espera.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {ventasPausadas.map(vp => (
                                    <div key={vp.id} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{vp.fecha}</div>
                                            <div style={{ fontSize: '13px', color: '#6B7280' }}>
                                                {vp.carrito.length} items - S/ {vp.total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                            </div>
                                            {vp.clienteNombre && (
                                                <div style={{ fontSize: '12px', color: '#3B82F6' }}>Cliente: {vp.clienteNombre}</div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => recuperarVenta(vp)}
                                            style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                            Retomar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button onClick={() => setShowPausadas(false)} style={{ padding: '10px 20px', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
