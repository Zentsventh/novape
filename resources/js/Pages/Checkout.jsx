import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import Header from '../Components/Home/Header';
import StripePaymentForm from '../Components/Home/StripePaymentForm';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../../css/home/checkout.css';

const stripePromise = loadStripe(
    'pk_test_51TVepVLBzrJGakQp4jrQwXP4IEj9xESBwsS0QFqj4eqouPLBrjaoVarXNQb0lC6vISU0RQDtMCpPZiLueNFiQxdB005pcaUaRH'
);

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
    const { auth } = usePage().props;
    const user = auth?.user;

    // Si no hay items en props directos, usamos el formato de estructura del array
    const cartItems = Array.isArray(cart) ? cart : cart.items || Object.values(cart || {});
    const baseCartTotal =
        total || cartItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    // Estados
    const [step, setStep] = useState(1);

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
                    confirmButtonColor: '#00B4FF',
                });
            }
        } catch (err) {
            Swal.fire({ text: 'Error de conexión.', icon: 'error', confirmButtonColor: '#00B4FF' });
        } finally {
            setLoadingApiDoc(false);
        }
    };

    // Estado Stripe
    const [clientSecret, setClientSecret] = useState(null);

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
                confirmButtonColor: '#00B4FF',
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
                    confirmButtonColor: '#00B4FF',
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

    const [isFetchingIntent, setIsFetchingIntent] = useState(false);
    const [intentError, setIntentError] = useState(null);
    const [usePoints, setUsePoints] = useState(false);
    const user = auth?.user;
    const loyaltyPoints = user?.loyalty_points || 0;

    useEffect(() => {
        if (step === 3) {
            fetchIntent(appliedCoupon?.codigo || '');
        }
    }, [usePoints]);

    const fetchIntent = async (couponCodeStr) => {
        setIsFetchingIntent(true);
        setIntentError(null);
        const emailValue =
            facturacionData.email || document.getElementById('checkout-email')?.value || '';
        try {
            const res = await axios.post('/api/checkout/stripe/intent', {
                email: emailValue,
                coupon: couponCodeStr || '',
                deliveryType: deliveryType,
                distrito: addressData.distrito,
                shippingCost: apiShippingCost,
                facturacion: facturacionData,
                shippingAddress: addressData,
                usePoints: usePoints,
            });
            const data = res.data;
            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
            } else if (data.error) {
                setIntentError(data.error);
            }
        } catch (e) {
            console.error('Error intent:', e);
            if (e.response && e.response.data && e.response.data.error) {
                setIntentError(e.response.data.error);
            } else {
                setIntentError('Error de conexión al procesar el pago seguro.');
            }
        } finally {
            setIsFetchingIntent(false);
        }
    };

    const handleDeliveryConfirm = async () => {
        if (deliveryType) {
            setDeliverySaved(true);
            setStep(3);
            sessionStorage.setItem('checkout_delivery', deliveryType);

            await fetchIntent(appliedCoupon?.codigo || '');
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
                await fetchIntent(data.codigo);
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
            <Header
                cartCount={cartItems.length}
                onOpenCart={() => {}}
                onOpenCategories={() => {}}
                minimal={true}
            />

            <div className="efe-checkout-container">
                {/* Columna Stepper */}
                <div className="efe-checkout-main">
                    {/* PASO 1: DIRECCIÓN */}
                    <div className="efe-checkout-step">
                        <div className="efe-checkout-step-header">
                            <div
                                className={`efe-checkout-step-number ${step < 1 ? 'inactive' : ''}`}
                            >
                                1
                            </div>
                            <h2>Dirección</h2>
                            {addressSaved && (
                                <button
                                    className="efe-checkout-edit-top-btn"
                                    onClick={() => {
                                        setAddressSaved(false);
                                        setStep(1);
                                    }}
                                >
                                    Editar dirección
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    >
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                            )}
                        </div>

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

                                            <div
                                                style={{
                                                    marginTop: '25px',
                                                    borderTop: '1px solid #f3f4f6',
                                                    paddingTop: '25px',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: '15px',
                                                    }}
                                                >
                                                    <h3
                                                        style={{
                                                            fontSize: '14px',
                                                            fontWeight: 'bold',
                                                            margin: 0,
                                                        }}
                                                    >
                                                        Ubicación en el Mapa
                                                    </h3>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button
                                                            className="efe-btn-outline"
                                                            onClick={buscarEnMapa}
                                                            style={{
                                                                padding: '6px 12px',
                                                                fontSize: '12px',
                                                                borderRadius: '20px',
                                                            }}
                                                        >
                                                            <svg
                                                                width="12"
                                                                height="12"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                style={{ marginRight: '5px' }}
                                                            >
                                                                <circle
                                                                    cx="11"
                                                                    cy="11"
                                                                    r="8"
                                                                ></circle>
                                                                <line
                                                                    x1="21"
                                                                    y1="21"
                                                                    x2="16.65"
                                                                    y2="16.65"
                                                                ></line>
                                                            </svg>
                                                            Buscar
                                                        </button>
                                                        <button
                                                            className="efe-btn-outline"
                                                            onClick={usarGPS}
                                                            disabled={loadingGps}
                                                            style={{
                                                                padding: '6px 12px',
                                                                fontSize: '12px',
                                                                background: '#e0f2fe',
                                                                color: '#0369a1',
                                                                borderColor: '#bae6fd',
                                                                borderRadius: '20px',
                                                            }}
                                                        >
                                                            <svg
                                                                width="12"
                                                                height="12"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                style={{ marginRight: '5px' }}
                                                            >
                                                                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                                                            </svg>
                                                            {loadingGps ? 'Ubicando...' : 'GPS'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {mapError && (
                                                    <p
                                                        style={{
                                                            color: '#ef4444',
                                                            fontSize: '12px',
                                                            marginBottom: '10px',
                                                        }}
                                                    >
                                                        {mapError}
                                                    </p>
                                                )}

                                                <div
                                                    style={{
                                                        height: '200px',
                                                        width: '100%',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        border: '1px solid #d1d5db',
                                                        marginBottom: '5px',
                                                    }}
                                                >
                                                    <APIProvider apiKey="AIzaSyCqF7-TBcJND7uC63s0qbd0PWU9ZEdE7q8">
                                                        <Map
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                            }}
                                                            center={mapCenter}
                                                            onCenterChanged={(e) =>
                                                                setMapCenter(e.detail.center)
                                                            }
                                                            zoom={16}
                                                            disableDefaultUI={true}
                                                        >
                                                            <Marker
                                                                position={mapCenter}
                                                                draggable={true}
                                                                onDragEnd={(e) => {
                                                                    if (e.latLng) {
                                                                        setMapCenter({
                                                                            lat: e.latLng.lat(),
                                                                            lng: e.latLng.lng(),
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        </Map>
                                                    </APIProvider>
                                                </div>
                                                <p
                                                    style={{
                                                        fontSize: '12px',
                                                        color: '#6b7280',
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    Mueve el pin rojo para ajustar tu ubicación
                                                    exacta.
                                                </p>
                                            </div>

                                            <div
                                                style={{
                                                    marginTop: '20px',
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                }}
                                            >
                                                <button
                                                    className="efe-btn-primary"
                                                    style={{ padding: '10px 25px' }}
                                                    onClick={handleAddressSubmit}
                                                >
                                                    Confirmar Dirección
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="efe-address-card">
                                            <div className="efe-address-card-icon">
                                                <svg
                                                    width="20"
                                                    height="20"
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
                                            </div>
                                            <div className="efe-address-card-info">
                                                <h4 className="efe-address-card-title">
                                                    {addressData.tipo}
                                                </h4>
                                                <p className="efe-address-card-text">
                                                    {addressData.direccion}, {addressData.distrito},
                                                    LIMA, LIMA
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PASO 2: TIPO DE ENTREGA */}
                    <div className="efe-checkout-step">
                        <div className="efe-checkout-step-header">
                            <div
                                className={`efe-checkout-step-number ${step < 2 ? 'inactive' : ''}`}
                            >
                                2
                            </div>
                            <h2>Tipo de Entrega</h2>
                        </div>

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
                        <div className="efe-checkout-step-header">
                            <div
                                className={`efe-checkout-step-number ${step < 3 ? 'inactive' : ''}`}
                            >
                                3
                            </div>
                            <h2>Método de pago</h2>
                        </div>

                        {step === 3 && (
                            <div className="efe-checkout-step-content">
                                {isFetchingIntent ? (
                                    <div
                                        style={{
                                            padding: '40px',
                                            textAlign: 'center',
                                            color: '#6b7280',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                border: '3px solid #f3f3f3',
                                                borderTop: '3px solid #2563eb',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite',
                                                margin: '0 auto 15px',
                                            }}
                                        ></div>
                                        <p style={{ fontWeight: 'bold' }}>
                                            Cargando pasarela de pago segura...
                                        </p>
                                    </div>
                                ) : intentError ? (
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
                                        <p style={{ fontSize: '14px' }}>{intentError}</p>
                                        <button
                                            onClick={() => fetchIntent(appliedCoupon?.codigo || '')}
                                            className="efe-btn-primary"
                                            style={{ marginTop: '15px', padding: '8px 20px' }}
                                        >
                                            Reintentar
                                        </button>
                                    </div>
                                ) : clientSecret ? (
                                    <div className="efe-checkout-box">
                                        <div style={{ marginBottom: '20px' }}>
                                            <h3
                                                style={{
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    marginBottom: '5px',
                                                }}
                                            >
                                                Cupón de descuento
                                            </h3>
                                            <p
                                                style={{
                                                    fontSize: '12px',
                                                    color: '#6b7280',
                                                    marginBottom: '10px',
                                                }}
                                            >
                                                Si tienes un cupón de descuento, asegúrate de
                                                ingresarlo antes de seleccionar el medio de pago.
                                            </p>

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: '10px',
                                                    alignItems: 'center',
                                                    padding: '15px',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                }}
                                            >
                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="#00B4FF"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                                                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                                                </svg>
                                                <span
                                                    style={{
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                        color: '#111827',
                                                    }}
                                                >
                                                    Agrega un cupón de descuento
                                                </span>

                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        marginLeft: 'auto',
                                                        gap: '5px',
                                                    }}
                                                >
                                                    <input
                                                        type="text"
                                                        className="efe-form-input"
                                                        placeholder="Ingrese un cupón"
                                                        value={couponCode}
                                                        onChange={(e) =>
                                                            setCouponCode(
                                                                e.target.value.toUpperCase()
                                                            )
                                                        }
                                                        style={{
                                                            padding: '5px 10px',
                                                            width: '150px',
                                                            textTransform: 'uppercase',
                                                        }}
                                                        disabled={isApplyingCoupon || appliedCoupon}
                                                    />
                                                    {!appliedCoupon ? (
                                                        <button
                                                            className="efe-btn-outline"
                                                            onClick={handleApplyCoupon}
                                                            style={{
                                                                padding: '5px 15px',
                                                                borderColor: couponCode
                                                                    ? '#00B4FF'
                                                                    : '#d1d5db',
                                                                color: couponCode
                                                                    ? '#00B4FF'
                                                                    : '#9ca3af',
                                                                minWidth: '80px',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                            }}
                                                            disabled={
                                                                isApplyingCoupon || !couponCode
                                                            }
                                                        >
                                                            {isApplyingCoupon ? (
                                                                <div
                                                                    style={{
                                                                        width: '14px',
                                                                        height: '14px',
                                                                        border: '2px solid rgba(0,180,255,0.3)',
                                                                        borderTop:
                                                                            '2px solid #00B4FF',
                                                                        borderRadius: '50%',
                                                                        animation:
                                                                            'spin 1s linear infinite',
                                                                    }}
                                                                ></div>
                                                            ) : (
                                                                'Aplicar'
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="efe-btn-outline"
                                                            onClick={() => {
                                                                setAppliedCoupon(null);
                                                                setCouponCode('');
                                                                setCouponMessage(null);
                                                                fetchIntent('');
                                                            }}
                                                            style={{
                                                                padding: '5px 15px',
                                                                borderColor: '#ef4444',
                                                                color: '#ef4444',
                                                            }}
                                                            disabled={isFetchingIntent}
                                                        >
                                                            Quitar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {couponMessage && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        marginTop: '8px',
                                                        padding: '8px 12px',
                                                        background:
                                                            couponMessage.type === 'error'
                                                                ? '#fef2f2'
                                                                : '#f0fdf4',
                                                        borderRadius: '6px',
                                                        border: `1px solid ${couponMessage.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                                                    }}
                                                >
                                                    {couponMessage.type === 'error' ? (
                                                        <svg
                                                            width="14"
                                                            height="14"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="#ef4444"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <line
                                                                x1="12"
                                                                y1="8"
                                                                x2="12"
                                                                y2="12"
                                                            ></line>
                                                            <line
                                                                x1="12"
                                                                y1="16"
                                                                x2="12.01"
                                                                y2="16"
                                                            ></line>
                                                        </svg>
                                                    ) : (
                                                        <svg
                                                            width="14"
                                                            height="14"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="#10b981"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                        </svg>
                                                    )}
                                                    <p
                                                        style={{
                                                            fontSize: '12px',
                                                            color:
                                                                couponMessage.type === 'error'
                                                                    ? '#ef4444'
                                                                    : '#10b981',
                                                            margin: 0,
                                                            fontWeight: '500',
                                                        }}
                                                    >
                                                        {couponMessage.text}
                                                    </p>
                                                </div>
                                            )}

                                            {user && loyaltyPoints > 0 && (
                                                <div style={{ marginTop: '20px', padding: '16px', border: '1px dashed #f59e0b', borderRadius: '8px', background: '#fffbeb' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', margin: 0 }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={usePoints}
                                                            onChange={(e) => setUsePoints(e.target.checked)}
                                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                        />
                                                        <div>
                                                            <div style={{ fontWeight: 'bold', color: '#b45309' }}>Usar mis Novapuntos</div>
                                                            <div style={{ fontSize: '13px', color: '#d97706' }}>Tienes {loyaltyPoints} puntos disponibles (S/ {(loyaltyPoints/10).toFixed(2)} de descuento)</div>
                                                        </div>
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <h3
                                            style={{
                                                fontSize: '15px',
                                                fontWeight: 'bold',
                                                marginBottom: '15px',
                                                borderBottom: '1px solid #e5e7eb',
                                                paddingBottom: '10px',
                                            }}
                                        >
                                            Tarjeta de crédito o débito
                                        </h3>

                                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                                            <StripePaymentForm
                                                clientSecret={clientSecret}
                                                onSuccess={(intent) => {
                                                    const successUrl = `/checkout/success?payment_intent=${intent.id}`;
                                                    router.visit(successUrl);
                                                }}
                                                onFail={(msg) => console.error(msg)}
                                            />
                                        </Elements>
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
                        <div
                            className="efe-summary-comprobante"
                            style={{
                                background: '#f8fafc',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                marginBottom: '20px',
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: '14px',
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
                                                ? '2px solid #00B4FF'
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
                                                ? '2px solid #00B4FF'
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
                        {cartItems.map((item) => (
                            <div
                                key={item.id}
                                className="efe-summary-item"
                                style={{
                                    borderBottom: '1px solid #f3f4f6',
                                    paddingBottom: '10px',
                                    marginBottom: '10px',
                                }}
                            >
                                <img
                                    src={item.imagen}
                                    alt={item.nombre}
                                    className="efe-summary-item-img"
                                />
                                <div className="efe-summary-item-info">
                                    <h4
                                        className="efe-summary-item-title"
                                        style={{ fontSize: '12px', lineHeight: '1.4' }}
                                    >
                                        {item.nombre}
                                    </h4>
                                    <div
                                        className="efe-summary-item-meta"
                                        style={{ marginTop: '5px' }}
                                    >
                                        <span className="efe-summary-item-qty">
                                            Cant: {item.cantidad}
                                        </span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span
                                                className="efe-summary-item-price"
                                                style={{ fontSize: '14px', fontWeight: 'bold' }}
                                            >
                                                S/ {formatPrice(item.precio)}
                                            </span>
                                            {item.precio_original > item.precio && (
                                                <span
                                                    className="efe-summary-item-old-price"
                                                    style={{
                                                        display: 'block',
                                                        fontSize: '11px',
                                                        color: '#9ca3af',
                                                        textDecoration: 'line-through',
                                                    }}
                                                >
                                                    S/ {formatPrice(item.precio_original)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

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
            {isCreating && <div className="efe-loader-overlay">Creando dirección...</div>}
        </div>
    );
}
