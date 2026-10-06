import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import Header from '../Components/Home/Header';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../../css/home/base.css';
import '../../css/home/header.css';
import '../../css/home/checkout.css';

const formatPrice = (price) =>
    new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        price
    );

const LIMA_DISTRITOS = [
    'Ancón',
    'Ate',
    'Barranco',
    'Breña',
    'Carabayllo',
    'Chaclacayo',
    'Chorrillos',
    'Cieneguilla',
    'Comas',
    'El Agustino',
    'Independencia',
    'Jesús María',
    'La Molina',
    'La Victoria',
    'Lima',
    'Lince',
    'Los Olivos',
    'Lurigancho',
    'Lurín',
    'Magdalena del Mar',
    'Miraflores',
    'Pachacámac',
    'Pucusana',
    'Pueblo Libre',
    'Puente Piedra',
    'Punta Hermosa',
    'Punta Negra',
    'Rímac',
    'San Bartolo',
    'San Borja',
    'San Isidro',
    'San Juan de Lurigancho',
    'San Juan de Miraflores',
    'San Luis',
    'San Martín de Porres',
    'San Miguel',
    'Santa Anita',
    'Santa María del Mar',
    'Santa Rosa',
    'Santiago de Surco',
    'Surquillo',
    'Villa El Salvador',
    'Villa María del Triunfo',
].sort();

const COSTOS_ENVIO = {
    Barranco: 10,
    Breña: 10,
    'Jesús María': 10,
    'La Victoria': 10,
    Lima: 10,
    Lince: 10,
    'Magdalena del Mar': 10,
    Miraflores: 10,
    'Pueblo Libre': 10,
    'San Borja': 10,
    'San Isidro': 10,
    'San Luis': 10,
    'San Miguel': 10,
    Surquillo: 10,
    Ate: 15,
    Chorrillos: 15,
    'El Agustino': 15,
    Independencia: 15,
    'La Molina': 15,
    'Los Olivos': 15,
    Rímac: 15,
    'San Juan de Lurigancho': 15,
    'San Juan de Miraflores': 15,
    'San Martín de Porres': 15,
    'Santa Anita': 15,
    'Santiago de Surco': 15,
    'Villa El Salvador': 15,
    'Villa María del Triunfo': 15,
    Ancón: 25,
    Carabayllo: 25,
    Chaclacayo: 25,
    Cieneguilla: 25,
    Comas: 25,
    Lurigancho: 25,
    Lurín: 25,
    Pachacámac: 25,
    Pucusana: 25,
    'Puente Piedra': 25,
    'Punta Hermosa': 25,
    'Punta Negra': 25,
    'San Bartolo': 25,
    'Santa María del Mar': 25,
    'Santa Rosa': 25,
};

export default function Checkout({ cart = [], total = 0, loyaltyPoints = 0 }) {
    const { auth, flash, globalConfig } = usePage().props;
    const user = auth?.user;

    // Si no hay items en props directos, usamos el formato de estructura del array
    const cartItems = Array.isArray(cart) ? cart : cart.items || Object.values(cart || {});
    const baseCartTotal =
        total || cartItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    // Estados
    const [step, setStep] = useState(1);

    // Mostrar errores flash si el servidor redirige de vuelta con un error (ej. Tarjeta rechazada)
    useEffect(() => {
        if (flash?.error) {
            Swal.fire({
                title: 'Atención',
                text: flash.error,
                icon: 'error',
                confirmButtonColor: '#004797'
            });
        }
    }, [flash]);

    // Estado Dirección
    const [addressSaved, setAddressSaved] = useState(false);
    const [addressData, setAddressData] = useState({
        tipo: 'Casa',
        direccion: user?.direccion || '',
        distrito: user?.distrito || '',
        referencia: user?.referencia || '',
        receptor: 'Seré yo',
        nombres: user ? user.nombres : '',
        apellidos: user ? user.apellidos || '' : '',
        tipoDoc: 'DNI',
        doc: user?.dni || '',
        celular: user?.telefono || '',
        guardarDireccion: true,
    });

    const [isCreating, setIsCreating] = useState(false);

    // Estado Entrega
    const [deliveryType, setDeliveryType] = useState('');
    const [deliverySaved, setDeliverySaved] = useState(false);
    const [apiShippingCost, setApiShippingCost] = useState(0);

    // Estado Comprobante
    const [facturacionData, setFacturacionData] = useState({
        comprobante: 'Boleta',
        cambiarDatos: false,
        nombres: user ? `${user.nombres} ${user.apellidos || ''}`.trim() : '',
        dni: user?.dni || '',
        razonSocial: '',
        ruc: '',
        direccionFiscal: '',
        email: user?.email || '',
    });

    const handleFacturacionChange = (field, value) => {
        setFacturacionData((prev) => ({ ...prev, [field]: value }));
    };

    const [loadingApiDoc, setLoadingApiDoc] = useState(false);

    const buscarDocumentoCheckout = async () => {
        const tipo = facturacionData.comprobante === 'Boleta' ? 'DNI' : 'RUC';
        const numero =
            facturacionData.comprobante === 'Boleta' ? facturacionData.dni : facturacionData.ruc;

        if (!numero) return;
        setLoadingApiDoc(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
            const res = await fetch('/api/documento/consultar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ tipo, numero }),
            });
            const json = await res.json();
            if (res.ok && json.success) {
                const data = json.data;
                if (tipo === 'DNI') {
                    setFacturacionData((prev) => ({
                        ...prev,
                        nombres:
                            `${data.nombres || ''} ${data.apellido_paterno || ''} ${data.apellido_materno || ''}`
                                .replace(/\s+/g, ' ')
                                .trim(),
                    }));
                } else if (tipo === 'RUC') {
                    setFacturacionData((prev) => ({
                        ...prev,
                        razonSocial: data.nombre_o_razon_social || '',
                        direccionFiscal: data.direccion_completa || prev.direccionFiscal,
                    }));
                }
            } else {
                Swal.fire({
                    text: 'No se pudo encontrar el documento.',
                    icon: 'error',
                    confirmButtonColor: '#004797',
                });
            }
        } catch (err) {
            Swal.fire({ text: 'Error de conexión.', icon: 'error', confirmButtonColor: '#004797' });
        } finally {
            setLoadingApiDoc(false);
        }
    };

    const [niubizSession, setNiubizSession] = useState(null);

    // Estado Cupón
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponMessage, setCouponMessage] = useState(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    
    // Puntos de fidelidad
    const [usePoints, setUsePoints] = useState(false);
    const [highlightTotal, setHighlightTotal] = useState(false);

    useEffect(() => {
        const savedAddress = sessionStorage.getItem('checkout_address');
        const savedDelivery = sessionStorage.getItem('checkout_delivery');
        const savedShippingCost = sessionStorage.getItem('checkout_shipping_cost');

        if (savedAddress) {
            setAddressData(JSON.parse(savedAddress));
            setAddressSaved(true);
            setStep(2);
        }
        if (savedShippingCost) {
            setApiShippingCost(parseFloat(savedShippingCost));
        }
        if (savedDelivery) {
            setDeliveryType(savedDelivery);
            setDeliverySaved(true);
            setStep(3);
        }
    }, []);

    const handleAddressChange = (field, value) => {
        setAddressData((prev) => ({ ...prev, [field]: value }));
    };

    const defaultCenter = { lat: -12.046374, lng: -77.042793 };
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [coordInput, setCoordInput] = useState('');
    const [mapError, setMapError] = useState('');

    // Algoritmo de búsqueda de dirección (Nominatim - OpenStreetMap, 100% GRATIS)
    const buscarEnMapa = async () => {
        setMapError('');
        if (!addressData.direccion || !addressData.distrito) {
            setMapError('Por favor ingresa tu Dirección y Distrito para buscar en el mapa.');
            return;
        }
        const query = `${addressData.direccion}, ${addressData.distrito}, Lima, Peru`;
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=pe&limit=1`,
                {
                    headers: { 'Accept-Language': 'es' },
                }
            );
            const data = await res.json();
            if (data && data.length > 0) {
                setMapCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
            } else {
                setMapError(
                    'No pudimos ubicar la dirección exacta. Intenta con GPS o mueve el pin manualmente.'
                );
            }
        } catch (e) {
            setMapError('Error al buscar dirección. Intenta con el botón GPS.');
        }
    };

    // GPS: Detectar ubicación automática del dispositivo
    const [loadingGps, setLoadingGps] = useState(false);
    const usarGPS = () => {
        setMapError('');
        if (!navigator.geolocation) {
            setMapError('Tu navegador no soporta geolocalización.');
            return;
        }
        setLoadingGps(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setMapCenter({ lat, lng });
                // Reverse geocoding con Nominatim para autocompletar dirección
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                        {
                            headers: { 'Accept-Language': 'es' },
                        }
                    );
                    const data = await res.json();
                    if (data && data.address) {
                        const addr = data.address;
                        const road = addr.road || addr.pedestrian || addr.footway || '';
                        const houseNumber = addr.house_number || '';
                        const suburb = addr.suburb || addr.neighbourhood || '';
                        const fullAddr = [road, houseNumber, suburb].filter(Boolean).join(', ');
                        if (fullAddr && !addressData.direccion) {
                            handleAddressChange('direccion', fullAddr);
                        }
                        // Intentar autodetectar distrito
                        const detectedDistrict =
                            addr.city_district || addr.suburb || addr.town || '';
                        if (detectedDistrict) {
                            // Buscar coincidencia parcial en LIMA_DISTRITOS
                            const match = LIMA_DISTRITOS.find(
                                (d) =>
                                    d.toLowerCase().includes(detectedDistrict.toLowerCase()) ||
                                    detectedDistrict.toLowerCase().includes(d.toLowerCase())
                            );
                            if (match && !addressData.distrito) {
                                handleAddressChange('distrito', match);
                            }
                        }
                    }
                } catch (e) {
                    // Reverse geocoding falló, pero la ubicación GPS sí se obtuvo
                }
                setLoadingGps(false);
            },
            (error) => {
                setLoadingGps(false);
                if (error.code === 1) {
                    setMapError('Permiso de ubicación denegado. Activa el GPS en tu navegador.');
                } else {
                    setMapError('No se pudo obtener tu ubicación. Intenta buscar manualmente.');
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const aplicarCoordenadas = () => {
        setMapError('');
        // Formato esperado: -12.047778761857543, -77.05840290487406
        const parts = coordInput.split(',');
        if (parts.length === 2) {
            const lat = parseFloat(parts[0].trim());
            const lng = parseFloat(parts[1].trim());
            if (!isNaN(lat) && !isNaN(lng)) {
                setMapCenter({ lat, lng });
            } else {
                setMapError('Formato inválido. Usa números separados por coma.');
            }
        } else {
            setMapError('Formato inválido. Debe ser: Latitud, Longitud');
        }
    };

    const handleAddressSubmit = async () => {
        // Validación estricta tradicional
        if (
            !addressData.nombres ||
            !addressData.apellidos ||
            !addressData.doc ||
            !addressData.celular ||
            !addressData.direccion ||
            !addressData.distrito
        ) {
            Swal.fire({
                text: 'Por favor completa todos los campos obligatorios (*).',
                icon: 'warning',
                confirmButtonColor: '#004797',
            });
            return;
        }

        setIsCreating(true);

        try {
            // 1. Validar la dirección con Shippo
            const valRes = await axios.post('/api/shipping/validate-address', addressData);
            const validation = valRes.data;

            if (!validation.is_valid) {
                const msg =
                    validation.messages && validation.messages.length > 0
                        ? validation.messages[0].text
                        : 'La dirección ingresada no parece válida. Por favor verifica los datos.';
                Swal.fire({
                    text: 'Shippo Validación: ' + msg,
                    icon: 'error',
                    confirmButtonColor: '#004797',
                });
                setIsCreating(false);
                return; // Detener si la dirección es inválida
            }

            // 2. Calcular tarifa de envío
            const res = await axios.post('/api/shipping/calculate', {
                address: {
                    departamento: 'LIMA',
                    provincia: 'LIMA',
                    distrito: addressData.distrito,
                    codigo_postal: '',
                },
                cart: cartItems,
            });
            const data = res.data;
            if (data.costo !== undefined) {
                setApiShippingCost(data.costo);
                sessionStorage.setItem('checkout_shipping_cost', data.costo);
            }
        } catch (e) {
            console.error('Error calculando envío:', e);
        }

        setIsCreating(false);
        setAddressSaved(true);
        setStep(2);
        sessionStorage.setItem(
            'checkout_address',
            JSON.stringify({ ...addressData, coordinates: mapCenter })
        );
    };

    const [isFetchingNiubiz, setIsFetchingNiubiz] = useState(false);
    const [niubizError, setNiubizError] = useState(null);


    useEffect(() => {
        if (step === 3 && !niubizSession) {
            fetchNiubizSession(appliedCoupon?.codigo || '');
        }
    }, [step, usePoints]);

    // Eliminamos el useEffect que cargaba el script estáticamente.
    // Lo cargaremos dinámicamente cuando tengamos la sesión de Niubiz para usar el entorno correcto.

    const openNiubizModal = () => {
        if (!niubizSession || !window.VisanetCheckout) {
            Swal.fire('Error', 'La pasarela aún no está lista', 'error');
            return;
        }

        window.VisanetCheckout.configure({
            sessiontoken: niubizSession.sessionKey,
            channel: 'web',
            merchantid: niubizSession.merchantId,
            purchasenumber: niubizSession.purchaseNumber,
            amount: niubizSession.amount,
            expirationminutes: '20',
            timeouturl: 'about:blank',
            merchantlogo: 'https://novape.pe/images/logo.png',
            formbuttoncolor: '#004797',
            action: window.location.origin + '/api/checkout/niubiz/authorize',
            complete: function(params) {
                // Not strictly needed if action URL is set, the form will auto-submit
            }
        });
        window.VisanetCheckout.open();
    };

    const fetchNiubizSession = async (couponCodeStr) => {

        setIsFetchingNiubiz(true);
        setNiubizError(null);
        const emailValue =
            facturacionData.email || document.getElementById('checkout-email')?.value || '';
        try {

            const res = await axios.post('/api/checkout/niubiz/session', {
                email: emailValue,
                coupon: couponCodeStr || '',
                deliveryType: deliveryType,
                distrito: addressData.distrito,
                shippingCost: apiShippingCost,
                facturacion: facturacionData,
                shippingAddress: addressData,
                usePoints: usePoints,
                items: cartItems.map(item => ({ id: item.id, precio_final: item.precio_final, cantidad: item.cantidad }))
            });
            const data = res.data;

            if (data.sessionKey) {
                setNiubizSession(data);
                
                // Cargar el script de Niubiz dinámicamente basado en el entorno
                const existingScript = document.getElementById('niubiz-checkout-script');
                if (existingScript) {
                    existingScript.remove();
                }
                
                const script = document.createElement('script');
                script.id = 'niubiz-checkout-script';
                script.src = data.env === 'production' 
                    ? 'https://static-content.vnforapps.com/v2/js/checkout.js?qs=x' 
                    : 'https://static-content-qas.vnforapps.com/env/sandbox/js/checkout.js?qs=x';
                script.async = true;
                document.body.appendChild(script);
                
            } else if (data.error) {
                setNiubizError(data.error);
            } else {
                setNiubizError("Respuesta desconocida del servidor");
            }
        } catch (e) {
            console.error('Error intent:', e);
            if (e.response && e.response.data && e.response.data.error) {
                setNiubizError(e.response.data.error);
            } else {
                setNiubizError('Error de conexión al procesar el pago seguro.');
            }
        } finally {
            setIsFetchingNiubiz(false);
        }
    };

    const handleDeliveryConfirm = async () => {
        if (deliveryType) {
            setDeliverySaved(true);
            setStep(3);
            sessionStorage.setItem('checkout_delivery', deliveryType);

            await fetchNiubizSession(appliedCoupon?.codigo || '');
        }
    };

    const handleApplyCoupon = async () => {
        setCouponMessage(null);
        if (!couponCode) return;

        setIsApplyingCoupon(true);
        try {
            const res = await axios.post('/api/checkout/apply-coupon', { codigo: couponCode });
            const data = res.data;
            if (data.error) {
                setCouponMessage({ type: 'error', text: data.error });
                setAppliedCoupon(null);
            } else {
                setAppliedCoupon(data);
                setCouponMessage({
                    type: 'success',
                    text: `¡Cupón aplicado! Se descontó ${data.tipo === 'porcentaje' ? data.valor + '%' : 'S/ ' + data.valor}`,
                });

                // Highlight total animation
                setHighlightTotal(true);
                setTimeout(() => setHighlightTotal(false), 1500);

                // Refrescar el PaymentIntent con el nuevo monto
                await fetchNiubizSession(data.codigo);
            }
        } catch (e) {
            if (e.response && e.response.data && e.response.data.error) {
                setCouponMessage({ type: 'error', text: e.response.data.error });
            } else {
                setCouponMessage({
                    type: 'error',
                    text: 'Error al conectar con el servidor para aplicar el cupón.',
                });
            }
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    let discountAmount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.tipo === 'porcentaje') {
            discountAmount = baseCartTotal * (parseFloat(appliedCoupon.valor) / 100);
        } else {
            discountAmount = parseFloat(appliedCoupon.valor);
        }
    }

    let pointsDiscount = 0;
    if (usePoints && loyaltyPoints > 0) {
        pointsDiscount = loyaltyPoints / 10; // 10 puntos = 1 sol
        const remainingTotal = Math.max(0, baseCartTotal - discountAmount);
        if (pointsDiscount > remainingTotal) {
            pointsDiscount = remainingTotal;
        }
    }

    const deliveryCost = deliveryType === 'domicilio' && addressData.distrito ? apiShippingCost : 0;
    const cartTotal = Math.max(0, baseCartTotal - discountAmount - pointsDiscount) + deliveryCost;

    return (
        <div className="efe-checkout-page">
            <Head title="Checkout" />
            {/* HEADER EXACTLY LIKE REFERENCE */}
            <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', padding: '16px 0', position: 'sticky', top: 0, zIndex: 50 }}>
                <div className="store-checkout-header" style={{ maxWidth: '68.75rem', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', position: 'relative' }}>
                    
                    {/* LOGO */}
                    <Link href="/" style={{ textDecoration: 'none', position: 'relative', zIndex: 2 }}>
                        {globalConfig?.logo_url ? (
                            <img src={globalConfig.logo_url} alt="NovaPe" style={{ height: '40px' }} />
                        ) : (
                            <div style={{ background: '#004797', color: '#fff', padding: '8px 16px', borderRadius: '50px', fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px' }}>
                                NovaPe<span style={{ color: '#E0F7FF' }}>.</span>
                            </div>
                        )}
                    </Link>

                    {/* Stepper Center (Absolute to ensure perfect centering) */}
                    <div className="store-checkout-progress">
                        <div className="store-checkout-steps">
                            
                            {/* Dotted line behind circles */}
                            <div style={{ position: 'absolute', top: '12px', left: '20px', right: '20px', borderBottom: '2px dotted #004797', zIndex: -1 }}></div>

                            {/* Carrito */}
                            <Link href="/carrito" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: '#fff', padding: '0 10px' }}>
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #004797', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#004797' }}></div>
                                </div>
                                <span style={{ fontSize: '13px', color: '#004797', fontWeight: '500' }}>Carrito</span>
                            </Link>

                            {/* Entrega */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: '#fff', padding: '0 10px' }}>
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${step < 3 ? '#004797' : '#94A3B8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                                    {step >= 1 && step < 3 && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#004797' }}></div>}
                                </div>
                                <span style={{ fontSize: '13px', color: step < 3 ? '#004797' : '#94A3B8', fontWeight: step < 3 ? '500' : '400' }}>Entrega</span>
                            </div>

                            {/* Pago */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: '#fff', padding: '0 10px' }}>
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${step === 3 ? '#004797' : '#94A3B8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                                    {step === 3 && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#004797' }}></div>}
                                </div>
                                <span style={{ fontSize: '13px', color: step === 3 ? '#004797' : '#94A3B8', fontWeight: step === 3 ? '500' : '400' }}>Pago</span>
                            </div>

                        </div>
                    </div>

                </div>
            </header>

            <div className="efe-checkout-container">
                {/* Columna Stepper */}
                <div className="efe-checkout-main">
                    {/* PASO 1: DIRECCIÓN */}
                    <div className="efe-checkout-step">
                        {/* Header removido para diseño limpio */}

                        {(step === 1 || !addressSaved) && (
                            <div className="efe-checkout-step-content">
                                <div className="efe-checkout-box">
                                    {!addressSaved ? (
                                        <div
                                            className="efe-checkout-address-form"
                                            style={{ marginTop: '10px' }}
                                        >
                                            <div className="efe-address-header-modern">
                                                <div>
                                                    <h3
                                                        style={{
                                                            fontSize: '18px',
                                                            fontWeight: '600',
                                                            color: '#111827',
                                                            margin: '0 0 5px 0',
                                                        }}
                                                    >
                                                        Datos de Envío
                                                    </h3>
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            color: '#6b7280',
                                                            fontSize: '14px',
                                                        }}
                                                    >
                                                        Completa tu información para asegurar una
                                                        entrega exitosa.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="efe-form-grid-modern">
                                                <div className="efe-form-group">
                                                    <label className="efe-form-label">
                                                        Nombres *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="efe-form-input-modern"
                                                        placeholder="Ej. Juan Pablo"
                                                        value={addressData.nombres}
                                                        onChange={(e) =>
                                                            handleAddressChange(
                                                                'nombres',
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="efe-form-group">
                                                    <label className="efe-form-label">
                                                        Apellidos *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="efe-form-input-modern"
                                                        placeholder="Ej. Vargas"
                                                        value={addressData.apellidos}
                                                        onChange={(e) =>
                                                            handleAddressChange(
                                                                'apellidos',
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="efe-form-group efe-col-span-full">
                                                    <label className="efe-form-label">
                                                        Dirección Exacta *
                                                    </label>
                                                    <div className="efe-input-with-icon">
                                                        <svg
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="#9ca3af"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                            <circle cx="12" cy="10" r="3"></circle>
                                                        </svg>
                                                        <input
                                                            type="text"
                                                            className="efe-form-input-modern has-icon"
                                                            placeholder="Av, Calle, Jr, Nro, Dpto"
                                                            value={addressData.direccion}
                                                            onChange={(e) =>
                                                                handleAddressChange(
                                                                    'direccion',
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="efe-form-group">
                                                    <label className="efe-form-label">
                                                        Distrito *
                                                    </label>
                                                    <select
                                                        className="efe-form-select-modern"
                                                        value={addressData.distrito}
                                                        onChange={(e) =>
                                                            handleAddressChange(
                                                                'distrito',
                                                                e.target.value
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            Selecciona tu distrito
                                                        </option>
                                                        {LIMA_DISTRITOS.map((d) => (
                                                            <option key={d} value={d}>
                                                                {d}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="efe-form-group">
                                                    <label className="efe-form-label">
                                                        Referencia (Opcional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="efe-form-input-modern"
                                                        placeholder="Cerca al parque, casa azul..."
                                                        value={addressData.referencia}
                                                        onChange={(e) =>
                                                            handleAddressChange(
                                                                'referencia',
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>

                                                <div className="efe-form-group">
                                                    <label className="efe-form-label">
                                                        Documento *
                                                    </label>
                                                    <div className="efe-doc-group">
                                                        <select
                                                            className="efe-form-select-modern short"
                                                            value={addressData.tipoDoc}
                                                            onChange={(e) => {
                                                                handleAddressChange(
                                                                    'tipoDoc',
                                                                    e.target.value
                                                                );
                                                                handleAddressChange('doc', '');
                                                            }}
                                                        >
                                                            <option value="DNI">DNI</option>
                                                            <option value="CE">CE</option>
                                                            <option value="RUC">RUC</option>
                                                        </select>
                                                        <input
                                                            type="text"
                                                            className="efe-form-input-modern flex-1"
                                                            placeholder="Número"
                                                            value={addressData.doc}
                                                            onChange={(e) =>
                                                                handleAddressChange(
                                                                    'doc',
                                                                    e.target.value
                                                                        .replace(/\D/g, '')
                                                                        .slice(0, 15)
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div className="efe-form-group">
                                                    <label className="efe-form-label">
                                                        Celular *
                                                    </label>
                                                    <div className="efe-input-with-icon">
                                                        <svg
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="#9ca3af"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                                        </svg>
                                                        <input
                                                            type="text"
                                                            className="efe-form-input-modern has-icon"
                                                            placeholder="987654321"
                                                            value={addressData.celular}
                                                            onChange={(e) =>
                                                                handleAddressChange(
                                                                    'celular',
                                                                    e.target.value
                                                                        .replace(/\D/g, '')
                                                                        .slice(0, 9)
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Guardar Dirección Checkbox */}
                                            {auth?.user && (
                                                <div className="efe-save-address-wrapper">
                                                    <label className="efe-custom-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={addressData.guardarDireccion}
                                                            onChange={(e) =>
                                                                handleAddressChange(
                                                                    'guardarDireccion',
                                                                    e.target.checked
                                                                )
                                                            }
                                                        />
                                                        <span className="efe-checkmark"></span>
                                                        <span className="efe-checkbox-text">
                                                            Guardar esta dirección en mis
                                                            direcciones para futuras compras
                                                        </span>
                                                    </label>
                                                </div>
                                            )}

                                            <div style={{ marginTop: '28px', borderTop: '1px solid #E8ECF0', paddingTop: '24px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                                    <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                                                        Ubicación en el Mapa
                                                    </h3>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            className="efe-btn-outline"
                                                            onClick={buscarEnMapa}
                                                            style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '600' }}
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="11" cy="11" r="8"></circle>
                                                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                                            </svg>
                                                            Buscar
                                                        </button>
                                                        <button
                                                            onClick={usarGPS}
                                                            disabled={loadingGps}
                                                            style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '600', background: '#F0F9FF', color: '#0369A1', border: '1.5px solid #BAE6FD', borderRadius: '10px', cursor: loadingGps ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all .2s ease', opacity: loadingGps ? .6 : 1 }}
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                                                            </svg>
                                                            {loadingGps ? 'Ubicando...' : 'GPS'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {mapError && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', marginBottom: '12px' }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                                        <p style={{ color: '#EF4444', fontSize: '12px', margin: 0, fontWeight: '500' }}>{mapError}</p>
                                                    </div>
                                                )}

                                                <div style={{ height: '200px', width: '100%', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #E8ECF0', marginBottom: '8px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                                                    <APIProvider apiKey="AIzaSyCqF7-TBcJND7uC63s0qbd0PWU9ZEdE7q8">
                                                        <Map
                                                            style={{ width: '100%', height: '100%' }}
                                                            center={mapCenter}
                                                            onCenterChanged={(e) => setMapCenter(e.detail.center)}
                                                            zoom={16}
                                                            disableDefaultUI={true}
                                                        >
                                                            <Marker
                                                                position={mapCenter}
                                                                draggable={true}
                                                                onDragEnd={(e) => {
                                                                    if (e.latLng) {
                                                                        setMapCenter({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                                                                    }
                                                                }}
                                                            />
                                                        </Map>
                                                    </APIProvider>
                                                </div>
                                                <p style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', margin: '0 0 4px' }}>
                                                    Arrastra el pin para ajustar tu ubicación exacta
                                                </p>
                                            </div>

                                            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                                                <button
                                                    className="efe-btn-primary"
                                                    style={{ padding: '12px 28px', fontSize: '14px' }}
                                                    onClick={handleAddressSubmit}
                                                >
                                                    Confirmar Dirección
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="efe-address-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div className="efe-address-card-icon">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                                    </svg>
                                                </div>
                                                <div className="efe-address-card-info">
                                                    <h4 className="efe-address-card-title">{addressData.tipo}</h4>
                                                    <p className="efe-address-card-text">{addressData.direccion}, {addressData.distrito}, LIMA, LIMA</p>
                                                </div>
                                            </div>
                                            <button className="efe-checkout-edit-top-btn" onClick={() => { setAddressSaved(false); setStep(1); }}>
                                                Editar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PASO 2: TIPO DE ENTREGA */}
                    <div className="efe-checkout-step">
                        {/* Header removido */}

                        {step === 2 && addressSaved && (
                            <div className="efe-checkout-step-content">
                                <div className="efe-checkout-box">
                                    <h3 className="efe-delivery-type-title">
                                        Escoge el método de despacho disponible
                                    </h3>
                                    <h4 className="efe-delivery-type-subtitle">GETHEX</h4>

                                    {/* Dummy Product Header */}
                                    {cartItems[0] && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '10px',
                                                alignItems: 'center',
                                                marginBottom: '20px',
                                            }}
                                        >
                                            <img
                                                src={cartItems[0].imagen}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    objectFit: 'contain',
                                                }}
                                                alt="Prod"
                                            />
                                            <span
                                                style={{
                                                    fontSize: '13px',
                                                    color: '#374151',
                                                    fontWeight: '500',
                                                }}
                                            >
                                                {cartItems[0].nombre}
                                            </span>
                                        </div>
                                    )}

                                    <div
                                        className={`efe-delivery-card ${deliveryType === 'domicilio' ? 'is-active' : ''}`}
                                        onClick={() => setDeliveryType('domicilio')}
                                    >
                                        <div className="efe-delivery-card-content">
                                            <h4 className="efe-delivery-card-title">
                                                <svg
                                                    width="18"
                                                    height="18"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <rect x="1" y="3" width="15" height="13"></rect>
                                                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                                                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                                                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                                                </svg>
                                                Envío a domicilio Shippo
                                            </h4>
                                            <div className="efe-delivery-card-desc">
                                                <span>2-3 Días Hábiles</span>
                                                <span className="efe-delivery-card-price">
                                                    S/ {formatPrice(apiShippingCost)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="efe-delivery-card-radio"></div>
                                    </div>

                                    <div
                                        className={`efe-delivery-card ${deliveryType === 'tienda' ? 'is-active' : ''}`}
                                        onClick={() => setDeliveryType('tienda')}
                                    >
                                        <div className="efe-delivery-card-content">
                                            <h4 className="efe-delivery-card-title">
                                                <svg
                                                    width="18"
                                                    height="18"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                                </svg>
                                                Retiro en tienda{' '}
                                                <span
                                                    className="efe-delivery-card-price"
                                                    style={{ marginLeft: '4px' }}
                                                >
                                                    Gratis
                                                </span>
                                            </h4>
                                            <div className="efe-delivery-card-desc">
                                                <span>
                                                    Recoge tu pedido en nuestra tienda central
                                                </span>
                                            </div>
                                        </div>
                                        <div className="efe-delivery-card-radio"></div>
                                    </div>

                                    <button
                                        className={
                                            deliveryType ? 'efe-btn-primary' : 'efe-btn-outline'
                                        }
                                        style={{
                                            color: !deliveryType ? '#d1d5db' : 'white',
                                            borderColor: !deliveryType ? '#d1d5db' : '',
                                            marginTop: '15px',
                                        }}
                                        onClick={handleDeliveryConfirm}
                                        disabled={!deliveryType}
                                    >
                                        Confirmar y continuar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PASO 3: MÉTODO DE PAGO */}
                    <div className="efe-checkout-step">
                        {/* Header removido */}

                        {step === 3 && (
                            <div className="efe-checkout-step-content">
                                {isFetchingNiubiz ? (
                                    <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '44px', height: '44px', border: '3px solid #E8ECF0', borderTop: '3px solid #004797', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                                        <p style={{ fontWeight: '600', color: '#0F172A', margin: 0, fontSize: '15px' }}>Preparando pago seguro...</p>
                                        <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0 }}>Conectando con la pasarela de pagos</p>
                                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                    </div>
                                ) : niubizError ? (
                                    <div
                                        style={{
                                            padding: '20px',
                                            textAlign: 'center',
                                            color: '#ef4444',
                                            background: '#fef2f2',
                                            borderRadius: '8px',
                                            border: '1px solid #fecaca',
                                        }}
                                    >
                                        <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                                            No se pudo cargar el pago
                                        </p>
                                        <p style={{ fontSize: '14px' }}>{niubizError}</p>
                                        <button
                                            onClick={() => fetchNiubizSession(appliedCoupon?.codigo || '')}
                                            className="efe-btn-primary"
                                            style={{ marginTop: '15px', padding: '8px 20px' }}
                                        >
                                            Reintentar
                                        </button>
                                    </div>
                                ) : (true) ? (
                                    <div className="efe-checkout-box">
                                        {/* CUPÓN */}
                                        <div style={{ marginBottom: '24px', padding: '20px', background: '#F8FAFC', border: '1px solid #E8ECF0', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                                <div style={{ width: '32px', height: '32px', background: '#E0F7FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004797" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                                                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>Cupón de descuento</div>
                                                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>Ingresa el código antes de seleccionar el pago</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="text"
                                                    className="efe-form-input"
                                                    placeholder="CÓDIGO DE CUPÓN"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                    style={{ flex: 1, textTransform: 'uppercase', fontWeight: '600', letterSpacing: '.06em', fontSize: '13px' }}
                                                    disabled={isApplyingCoupon || appliedCoupon}
                                                />
                                                {!appliedCoupon ? (
                                                    <button
                                                        onClick={handleApplyCoupon}
                                                        disabled={isApplyingCoupon || !couponCode}
                                                        style={{ padding: '0 20px', background: couponCode ? '#004797' : '#E2E8F0', color: couponCode ? '#fff' : '#94A3B8', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: couponCode && !isApplyingCoupon ? 'pointer' : 'not-allowed', transition: 'all .2s ease', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, boxShadow: couponCode ? '0 4px 14px rgba(0, 71, 151,.25)' : 'none' }}
                                                    >
                                                        {isApplyingCoupon ? (
                                                            <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }}></div>
                                                        ) : 'Aplicar'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => { setAppliedCoupon(null); setCouponCode(''); setCouponMessage(null); fetchNiubizSession(''); }}
                                                        disabled={isFetchingNiubiz}
                                                        style={{ padding: '0 16px', background: '#FEF2F2', color: '#EF4444', border: '1.5px solid #FECACA', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all .2s ease', flexShrink: 0 }}
                                                    >
                                                        Quitar
                                                    </button>
                                                )}
                                            </div>
                                            {couponMessage && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', padding: '10px 14px', background: couponMessage.type === 'error' ? '#FEF2F2' : '#F0FDF4', borderRadius: '8px', border: `1px solid ${couponMessage.type === 'error' ? '#FECACA' : '#BBF7D0'}` }}>
                                                    {couponMessage.type === 'error' ? (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                                    ) : (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                                    )}
                                                    <p style={{ fontSize: '12.5px', color: couponMessage.type === 'error' ? '#EF4444' : '#10B981', margin: 0, fontWeight: '600' }}>{couponMessage.text}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* NOVAPUNTOS */}
                                        {user && loyaltyPoints > 0 && (
                                            <div style={{ marginBottom: '24px', padding: '18px', border: '1.5px dashed #FCD34D', borderRadius: '12px', background: '#FFFBEB' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', margin: 0 }}>
                                                    <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#F59E0B' }} />
                                                    <div>
                                                        <div style={{ fontWeight: '700', color: '#92400E', fontSize: '14px' }}>⭐ Usar mis Novapuntos</div>
                                                        <div style={{ fontSize: '12.5px', color: '#D97706', marginTop: '2px' }}>Tienes <strong>{loyaltyPoints} pts</strong> disponibles = <strong>S/ {(loyaltyPoints/10).toFixed(2)}</strong> de descuento</div>
                                                    </div>
                                                </label>
                                            </div>
                                        )}


                                        {/* PAGO SEGURO */}
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E8ECF0', borderRadius: '14px', padding: 'clamp(0.75rem, 3vw, 1.5rem)', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid #E8ECF0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '36px', height: '36px', background: '#D1FAE5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>Pago 100% Seguro</div>
                                                        <div style={{ fontSize: '12px', color: '#94A3B8' }}>Encriptado y certificado</div>
                                                    </div>
                                                </div>
                                                <img src="https://www.niubiz.com.pe/wp-content/uploads/2021/04/Logo-Niubiz-PNG.png" alt="Niubiz" style={{ height: '28px', opacity: .85 }} />
                                            </div>
                                            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px', lineHeight: '1.6', margin: '0 0 20px' }}>
                                                Todas las transacciones están encriptadas y aseguradas. Paga con tarjeta, Yape, Plin o efectivo en agentes.
                                            </p>

                                            {isFetchingNiubiz && (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(0.75rem, 3vw, 2rem)', gap: '14px', background: '#fff', borderRadius: '10px', border: '1px solid #E8ECF0' }}>
                                                    <div style={{ width: '32px', height: '32px', border: '3px solid #E8ECF0', borderTopColor: '#004797', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                                                    <span style={{ color: '#64748B', fontSize: '13.5px', fontWeight: '500' }}>Conectando con Niubiz...</span>
                                                </div>
                                            )}

                                            {!isFetchingNiubiz && niubizSession && (
                                                <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #E8ECF0', textAlign: 'center' }}>
                                                    <p style={{ color: '#0F172A', fontWeight: '600', marginBottom: '16px', fontSize: '14.5px' }}>
                                                        🎉 Estás a un paso de completar tu compra
                                                    </p>
                                                    <button
                                                        className="efe-btn-primary"
                                                        onClick={openNiubizModal}
                                                        style={{ width: '100%', padding: '14px 0', fontSize: '15px', letterSpacing: '.01em' }}
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                                        Pagar de Forma Segura
                                                    </button>
                                                    <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', gap: '8px', opacity: .7 }}>
                                                        <img src="https://static-content.vnforapps.com/v2/img/brands/visa.png" alt="Visa" style={{ height: '22px' }} />
                                                        <img src="https://static-content.vnforapps.com/v2/img/brands/mastercard.png" alt="Mastercard" style={{ height: '22px' }} />
                                                    </div>
                                                </div>
                                            )}

                                            {!isFetchingNiubiz && !niubizSession && !niubizError && (
                                                <div style={{ textAlign: 'center', padding: '28px 20px', background: '#fff', borderRadius: '10px', border: '1px solid #E8ECF0' }}>
                                                    <div style={{ width: '48px', height: '48px', background: '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                                    </div>
                                                    <p style={{ color: '#0F172A', fontWeight: '600', fontSize: '14.5px', margin: '0 0 6px' }}>Conexión interrumpida</p>
                                                    <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 18px' }}>No pudimos cargar la pasarela de pagos.</p>
                                                    <button
                                                        onClick={() => fetchNiubizSession(appliedCoupon?.codigo || '')}
                                                        className="efe-btn-primary"
                                                        style={{ padding: '10px 24px', fontSize: '13.5px' }}
                                                    >
                                                        Reintentar Conexión
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna Resumen */}
                <div className="efe-checkout-sidebar">
                    <div className="efe-checkout-sidebar-header">
                        Resumen de la compra ({cartItems.length})
                    </div>
                    <div className="efe-checkout-sidebar-body">
                        {/* Comprobante */}
                        <div className="efe-summary-comprobante">
                            <h3
                                style={{
                                    fontSize: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '.05em',
                                    fontWeight: 'bold',
                                    marginBottom: '10px',
                                    color: '#0f172a',
                                }}
                            >
                                Datos de Facturación
                            </h3>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                <label
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        border:
                                            facturacionData.comprobante === 'Boleta'
                                                ? '2px solid #004797'
                                                : '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background:
                                            facturacionData.comprobante === 'Boleta'
                                                ? '#e0f7fa'
                                                : 'white',
                                        fontWeight:
                                            facturacionData.comprobante === 'Boleta'
                                                ? 'bold'
                                                : 'normal',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="comprobante"
                                        value="Boleta"
                                        checked={facturacionData.comprobante === 'Boleta'}
                                        onChange={() =>
                                            handleFacturacionChange('comprobante', 'Boleta')
                                        }
                                        style={{ display: 'none' }}
                                    />
                                    Boleta
                                </label>
                                <label
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        border:
                                            facturacionData.comprobante === 'Factura'
                                                ? '2px solid #004797'
                                                : '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background:
                                            facturacionData.comprobante === 'Factura'
                                                ? '#e0f7fa'
                                                : 'white',
                                        fontWeight:
                                            facturacionData.comprobante === 'Factura'
                                                ? 'bold'
                                                : 'normal',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="comprobante"
                                        value="Factura"
                                        checked={facturacionData.comprobante === 'Factura'}
                                        onChange={() =>
                                            handleFacturacionChange('comprobante', 'Factura')
                                        }
                                        style={{ display: 'none' }}
                                    />
                                    Factura
                                </label>
                            </div>

                            {facturacionData.comprobante === 'Boleta' ? (
                                <div>
                                    <label
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            marginBottom: '10px',
                                            color: '#475569',
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={facturacionData.cambiarDatos}
                                            onChange={(e) =>
                                                handleFacturacionChange(
                                                    'cambiarDatos',
                                                    e.target.checked
                                                )
                                            }
                                        />
                                        Deseo cambiar mis datos de boleta
                                    </label>

                                    {!facturacionData.cambiarDatos ? (
                                        <div
                                            style={{
                                                padding: '10px',
                                                background: 'white',
                                                borderRadius: '6px',
                                                border: '1px solid #e2e8f0',
                                                fontSize: '13px',
                                            }}
                                        >
                                            <p style={{ margin: 0, fontWeight: 'bold' }}>
                                                {facturacionData.nombres || 'Nombre no registrado'}
                                            </p>
                                            <p style={{ margin: 0, color: '#64748b' }}>
                                                DNI: {facturacionData.dni || 'No registrado'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '10px',
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <input
                                                    type="text"
                                                    className="efe-form-input"
                                                    placeholder="DNI *"
                                                    value={facturacionData.dni}
                                                    onChange={(e) =>
                                                        handleFacturacionChange(
                                                            'dni',
                                                            e.target.value
                                                                .replace(/\D/g, '')
                                                                .slice(0, 8)
                                                        )
                                                    }
                                                    style={{ flex: 1 }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={buscarDocumentoCheckout}
                                                    disabled={loadingApiDoc || !facturacionData.dni}
                                                    style={{
                                                        padding: '0 15px',
                                                        borderRadius: '8px',
                                                        border: 'none',
                                                        background:
                                                            loadingApiDoc || !facturacionData.dni
                                                                ? '#9ca3af'
                                                                : '#2563eb',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        cursor:
                                                            loadingApiDoc || !facturacionData.dni
                                                                ? 'not-allowed'
                                                                : 'pointer',
                                                        transition: 'background 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '5px',
                                                    }}
                                                >
                                                    {loadingApiDoc ? 'Buscando...' : 'Buscar'}
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                className="efe-form-input"
                                                placeholder="Nombres Completos *"
                                                value={facturacionData.nombres}
                                                onChange={(e) =>
                                                    handleFacturacionChange(
                                                        'nombres',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px',
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            className="efe-form-input"
                                            placeholder="RUC (11 dígitos) *"
                                            value={facturacionData.ruc}
                                            onChange={(e) =>
                                                handleFacturacionChange(
                                                    'ruc',
                                                    e.target.value.replace(/\D/g, '').slice(0, 11)
                                                )
                                            }
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={buscarDocumentoCheckout}
                                            disabled={loadingApiDoc || !facturacionData.ruc}
                                            style={{
                                                padding: '0 15px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background:
                                                    loadingApiDoc || !facturacionData.ruc
                                                        ? '#9ca3af'
                                                        : '#2563eb',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                cursor:
                                                    loadingApiDoc || !facturacionData.ruc
                                                        ? 'not-allowed'
                                                        : 'pointer',
                                                transition: 'background 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                            }}
                                        >
                                            {loadingApiDoc ? 'Buscando...' : 'Buscar'}
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        className="efe-form-input"
                                        placeholder="Razón Social *"
                                        value={facturacionData.razonSocial}
                                        onChange={(e) =>
                                            handleFacturacionChange('razonSocial', e.target.value)
                                        }
                                    />
                                    <input
                                        type="text"
                                        className="efe-form-input"
                                        placeholder="Dirección Fiscal *"
                                        value={facturacionData.direccionFiscal}
                                        onChange={(e) =>
                                            handleFacturacionChange(
                                                'direccionFiscal',
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                            )}

                            <div style={{ marginTop: '15px' }}>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        marginBottom: '5px',
                                    }}
                                >
                                    Correo de Contacto *
                                </label>
                                <input
                                    type="email"
                                    id="checkout-email"
                                    className="efe-form-input"
                                    placeholder="Para enviar el comprobante"
                                    value={facturacionData.email}
                                    onChange={(e) =>
                                        handleFacturacionChange('email', e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {/* Items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                        {cartItems.map((item) => (
                            <div
                                key={item.id}
                                className="efe-summary-item"
                                style={{ padding: '10px', borderRadius: '10px', border: '1px solid #E8ECF0', background: '#F8FAFC', transition: 'all .2s ease' }}
                            >
                                <img src={item.imagen} alt={item.nombre} className="efe-summary-item-img" />
                                <div className="efe-summary-item-info">
                                    <h4 className="efe-summary-item-title">{item.nombre}</h4>
                                    {item.variante && <p style={{ fontSize: '11.5px', color: '#94A3B8', margin: '0 0 6px' }}>{item.variante}</p>}
                                    <div className="efe-summary-item-meta">
                                        <span className="efe-summary-item-qty">Cant: {item.cantidad}</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className="efe-summary-item-price">S/ {formatPrice(item.precio)}</span>
                                            {item.precio_original > item.precio && (
                                                <span className="efe-summary-item-old-price">S/ {formatPrice(item.precio_original)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        </div>

                        <Link
                            href="/"
                            className="efe-summary-back-link"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                color: '#111827',
                                fontSize: '13px',
                                fontWeight: '500',
                                textDecoration: 'underline',
                                marginBottom: '20px',
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M19 12H5"></path>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Regresar a la tienda
                        </Link>

                        {/* Totales */}
                        <div className="efe-summary-totals">
                            <div className="efe-summary-total-row">
                                <span>
                                    Subtotal ({cartItems.length} item
                                    {cartItems.length > 1 ? 's' : ''})
                                </span>
                                <span style={{ fontWeight: '500' }}>
                                    S/ {formatPrice(baseCartTotal)}
                                </span>
                            </div>
                            {appliedCoupon && (
                                <div className="efe-summary-total-row" style={{ color: '#10b981' }}>
                                    <span>Descuento ({appliedCoupon.codigo})</span>
                                    <span>- S/ {formatPrice(discountAmount)}</span>
                                </div>
                            )}
                            {pointsDiscount > 0 && (
                                <div className="efe-summary-total-row" style={{ color: '#f59e0b' }}>
                                    <span>Descuento por Puntos</span>
                                    <span>- S/ {formatPrice(pointsDiscount)}</span>
                                </div>
                            )}
                            <div
                                className="efe-summary-total-row"
                                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Costo de envío</span>
                                    <span>
                                        {deliveryType === 'domicilio' ? (
                                            <span style={{ color: '#10b981' }}>
                                                + S/ {formatPrice(deliveryCost)}
                                            </span>
                                        ) : deliveryType === 'tienda' ? (
                                            '-'
                                        ) : (
                                            'Pendiente'
                                        )}
                                    </span>
                                </div>
                                {deliveryType === 'domicilio' && (
                                    <span style={{ fontSize: '12px', color: '#4b5563' }}>
                                        Aprox. 2-3 días hábiles
                                    </span>
                                )}
                            </div>
                            <div
                                className="efe-summary-total-row is-final"
                                style={{
                                    marginTop: '10px',
                                    paddingTop: '10px',
                                    borderTop: '1px solid #e5e7eb',
                                }}
                            >
                                <span style={{ fontSize: '16px' }}>Total</span>
                                <span
                                    style={{
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        color: highlightTotal ? '#10b981' : '#111827',
                                        transform: highlightTotal ? 'scale(1.1)' : 'scale(1)',
                                        transition:
                                            'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    }}
                                >
                                    S/ {formatPrice(cartTotal)}
                                </span>
                            </div>

                            {step < 3 && (
                                <button
                                    className="efe-summary-btn"
                                    disabled={true}
                                    style={{
                                        backgroundColor: '#d1d5db',
                                        cursor: 'not-allowed',
                                        transition: 'background 0.3s',
                                    }}
                                >
                                    Finalizar compra
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* LOADING: CREANDO DIRECCIÓN */}
            {isCreating && (
                <div className="efe-loader-overlay">
                    <div style={{ width: '32px', height: '32px', border: '3px solid #E8ECF0', borderTopColor: '#004797', borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0 }}></div>
                    Validando dirección y calculando envío...
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}
        </div>
    );
}
