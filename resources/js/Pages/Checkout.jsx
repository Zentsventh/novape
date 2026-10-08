import { loadNiubizCheckout } from '../utils/niubizCheckout';
import React, { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        map.setView([center.lat, center.lng], map.getZoom());
    }, [center, map]);
    return null;
}
import CheckoutFlow from '../Components/Home/CheckoutFlow';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../../css/home/base.css';
import '../../css/home/header.css';
import '../../css/home/checkout.css';

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

export default function Checkout({ cart = [], total = 0, loyaltyPoints = 0, savedAddress = null, pickupLocations = [], googleMapsKey }) {
    const { auth, flash, globalConfig } = usePage().props;
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
        direccion: savedAddress?.direccion || user?.direccion || '',
        distrito: savedAddress?.distrito || user?.distrito || '',
        codigo_postal: savedAddress?.codigo_postal || '',
        referencia: savedAddress?.referencia || user?.referencia || '',
        receptor: 'Seré yo',
        nombres: user ? user.nombres : '',
        apellidos: user ? user.apellidos || '' : '',
        tipoDoc: 'DNI',
        doc: user?.dni || '',
        celular: user?.telefono || '',
        guardarDireccion: true,
        pickup_location_id: pickupLocations[0]?.id || '',
    });

    const [isCreating, setIsCreating] = useState(false);

    // Estado Entrega
    const [deliveryType, setDeliveryType] = useState('domicilio');
    const [apiShippingCost, setApiShippingCost] = useState(0);
    const [shippingInfo, setShippingInfo] = useState(null);
    const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
    const [shippingCalculated, setShippingCalculated] = useState(false);
    const [deliveryCalcError, setDeliveryCalcError] = useState(null);
    const shippingAbortRef = useRef(null);

    // Estado Comprobante
    const [facturacionData, setFacturacionData] = useState({
        comprobante: 'Boleta',
        cambiarDatos: false,
        nombres: user ? `${user.nombres} ${user.apellidos || ''}`.trim() : '',
        dni: /^[0-9]{8}$/.test(user?.dni || '') ? user.dni : '',
        razonSocial: '',
        ruc: '',
        direccionFiscal: '',
        email: user?.email || '',
    });

    const [billingConfirmed, setBillingConfirmed] = useState(false);
    const [addressError, setAddressError] = useState(null);

    const handleFacturacionChange = (field, value) => {
        setBillingConfirmed(false);
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
    const [paymentRetry, setPaymentRetry] = useState(0);
    const paymentRequests = useRef(Promise.resolve());

    // Estado Cupón
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponMessage, setCouponMessage] = useState(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    // Puntos de fidelidad
    const [usePoints, setUsePoints] = useState(false);

    useEffect(() => {
        // Restore a draft only for its owner; never restore completed steps or cached tariffs.
        const owner = String(user?.id ?? 'guest');
        if (sessionStorage.getItem('checkout_customer') !== owner) {
            ['checkout_address', 'checkout_delivery', 'checkout_shipping_cost'].forEach(key => sessionStorage.removeItem(key));
            return;
        }
        try {
            const parsed = JSON.parse(sessionStorage.getItem('checkout_address') || 'null');
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                setAddressData(previous => ({ ...previous, ...Object.fromEntries(Object.keys(previous)
                    .filter(key => typeof parsed[key] === typeof previous[key] && ['string', 'boolean'].includes(typeof parsed[key])).map(key => [key, parsed[key]])) }));
            }
        } catch { sessionStorage.removeItem('checkout_address'); }
        const delivery = sessionStorage.getItem('checkout_delivery');
        if (delivery === 'domicilio' || (delivery === 'tienda' && pickupLocations.length > 0)) setDeliveryType(delivery);
    }, []);

    const handleAddressChange = (field, value) => {
        setAddressError(null);
        setAddressData((prev) => ({ ...prev, [field]: value }));
    };

    // Cálculo automático de costo de delivery en tiempo real
    const calculateShippingAuto = async (address, currentDeliveryType) => {
        if (currentDeliveryType === 'tienda') {
            setApiShippingCost(0);
            setShippingInfo({ source: 'pickup', courier: 'Retiro en tienda', test: false });
            setShippingCalculated(true);
            setIsCalculatingShipping(false);
            setDeliveryCalcError(null);
            return;
        }

        if (!address?.distrito || !LIMA_DISTRITOS.includes(address.distrito)) {
            setApiShippingCost(0);
            setShippingInfo(null);
            setShippingCalculated(false);
            setIsCalculatingShipping(false);
            setDeliveryCalcError(null);
            return;
        }

        if (shippingAbortRef.current) {
            shippingAbortRef.current.abort();
        }
        const abortController = new AbortController();
        shippingAbortRef.current = abortController;

        setIsCalculatingShipping(true);
        setDeliveryCalcError(null);

        try {
            const payload = {
                address: {
                    ...address,
                    departamento: 'LIMA',
                    provincia: 'LIMA',
                    codigo_postal: /^[0-9]{5}$/.test(address.codigo_postal || '') ? address.codigo_postal : null,
                },
            };
            const res = await axios.post('/api/shipping/calculate', payload, {
                signal: abortController.signal,
            });
            const data = res.data;
            if (Number.isFinite(Number(data.costo)) && data.costo != null && Number(data.costo) >= 0) {
                setApiShippingCost(Number(data.costo));
                setShippingInfo(data);
                setShippingCalculated(true);
                setDeliveryCalcError(null);
                sessionStorage.setItem('checkout_shipping_cost', String(data.costo));
            } else {
                setDeliveryCalcError('No pudimos calcular la tarifa de entrega.');
            }
        } catch (err) {
            if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
                return;
            }
            const msg = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat()[0]
                : (err.response?.data?.message || err.message || 'Error al calcular entrega');
            setDeliveryCalcError(msg);
            setShippingCalculated(false);
        } finally {
            if (shippingAbortRef.current === abortController) {
                setIsCalculatingShipping(false);
            }
        }
    };

    useEffect(() => {
        if (deliveryType === 'tienda') {
            calculateShippingAuto(addressData, 'tienda');
            return;
        }

        if (!addressData.distrito || !LIMA_DISTRITOS.includes(addressData.distrito)) {
            setApiShippingCost(0);
            setShippingInfo(null);
            setShippingCalculated(false);
            setIsCalculatingShipping(false);
            setDeliveryCalcError(null);
            return;
        }

        const timer = setTimeout(() => {
            calculateShippingAuto(addressData, deliveryType);
        }, 250);

        return () => clearTimeout(timer);
    }, [deliveryType, addressData.distrito, addressData.direccion, addressData.codigo_postal]);

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
                        if (fullAddr) {
                            handleAddressChange('direccion', fullAddr);
                        }
                        // Intentar autodetectar distrito
                        const possibleFields = [
                            addr.city_district, addr.suburb, addr.village,
                            addr.town, addr.municipality, addr.county,
                            addr.city, addr.state_district
                        ];
                        let match = null;
                        for (const field of possibleFields) {
                            if (field && typeof field === 'string') {
                                const found = LIMA_DISTRITOS.find(
                                    (d) =>
                                        d.toLowerCase() === field.toLowerCase() ||
                                        field.toLowerCase().includes(d.toLowerCase())
                                );
                                if (found) {
                                    match = found;
                                    break;
                                }
                            }
                        }
                        if (match) {
                            handleAddressChange('distrito', match);
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
            if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                setMapCenter({ lat, lng });
            } else {
                setMapError('Ingresa una latitud entre −90 y 90 y una longitud entre −180 y 180.');
            }
        } else {
            setMapError('Formato inválido. Debe ser: Latitud, Longitud');
        }
    };

    const handleAddressSubmit = async () => {
        if (isCreating || loadingGps) return;
        setAddressError(null);
        const required = ['nombres', 'apellidos', 'doc', 'celular', ...(deliveryType === 'domicilio' ? ['direccion', 'distrito'] : [])];
        if (required.some(key => !String(addressData[key] || '').trim()) || !/^9[0-9]{8}$/.test(addressData.celular)
            || (addressData.tipoDoc === 'DNI' && !/^[0-9]{8}$/.test(addressData.doc))) {
            setAddressError('Revisa los campos obligatorios, el documento y el celular antes de continuar.');
            return;
        }
        if (deliveryType === 'domicilio' && !LIMA_DISTRITOS.includes(addressData.distrito)) {
            setAddressError('Selecciona un distrito de Lima de la lista.');
            return;
        }
        setIsCreating(true);
        try {
            if (deliveryType === 'domicilio') {
                const validation = (await axios.post('/api/shipping/validate-address', addressData)).data;
                if (!validation.is_valid) throw new Error('No pudimos validar la dirección. Revisa los datos.');
                const data = (await axios.post('/api/shipping/calculate', {
                    address: {
                        ...addressData,
                        departamento: 'LIMA',
                        provincia: 'LIMA',
                        codigo_postal: /^[0-9]{5}$/.test(addressData.codigo_postal || '') ? addressData.codigo_postal : null,
                    },
                })).data;
                if (!Number.isFinite(Number(data.costo)) || data.costo == null || Number(data.costo) < 0) throw new Error('No pudimos confirmar el costo de envío.');
                setApiShippingCost(Number(data.costo));
                setShippingInfo(data);
                setShippingCalculated(true);
            } else {
                setApiShippingCost(0);
                setShippingInfo({ source: 'pickup', courier: 'Retiro en tienda', test: false });
            }
            setFacturacionData(previous => ({ ...previous,
                nombres: previous.cambiarDatos ? previous.nombres : `${addressData.nombres} ${addressData.apellidos}`.trim(),
                dni: previous.cambiarDatos ? previous.dni : addressData.tipoDoc === 'DNI' ? addressData.doc : '',
            }));
            setBillingConfirmed(false);
            setAddressSaved(true);
            setStep(2);
            sessionStorage.setItem('checkout_customer', String(user?.id ?? 'guest'));
            sessionStorage.setItem('checkout_address', JSON.stringify({ ...addressData, coordinates: mapCenter }));
            sessionStorage.setItem('checkout_delivery', deliveryType);
        } catch (error) {
            setAddressError(error.response?.data?.errors ? Object.values(error.response.data.errors).flat()[0]
                : error.message && !error.isAxiosError ? error.message : 'No pudimos confirmar la entrega. Reintenta antes de continuar.');
        } finally { setIsCreating(false); }
    };

    const [isFetchingNiubiz, setIsFetchingNiubiz] = useState(false);
    const [niubizError, setNiubizError] = useState(null);


    const paymentKey = JSON.stringify({ cartItems, deliveryType, addressData, facturacionData, coupon: appliedCoupon?.codigo || '', usePoints });
    useEffect(() => {
        let cancelled = false;
        setNiubizSession(null);
        if (step !== 3 || !billingConfirmed) { setIsFetchingNiubiz(false); return; }
        setIsFetchingNiubiz(true);
        const timer = setTimeout(() => {
            paymentRequests.current = paymentRequests.current.catch(() => {}).then(async () => {
                if (!cancelled) await fetchNiubizSession(appliedCoupon?.codigo || '', () => !cancelled, paymentKey);
            });
        }, 350);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [step, paymentKey, paymentRetry, billingConfirmed]);

    // Eliminamos el useEffect que cargaba el script estáticamente.
    // Lo cargaremos dinámicamente cuando tengamos la sesión de Niubiz para usar el entorno correcto.

    const openNiubizModal = () => {
        if (niubizSession && niubizSession.expiresAt <= Date.now() + 300000) {
            setPaymentRetry(value => value + 1);
            return;
        }
        if (!niubizSession || niubizSession.quoteKey !== paymentKey || isFetchingNiubiz || isApplyingCoupon || !billingConfirmed || !window.VisanetCheckout) {
            Swal.fire('Error', 'La pasarela aún no está lista', 'error');
            return;
        }

        window.VisanetCheckout.configure({
            sessiontoken: niubizSession.sessionKey,
            channel: 'web',
            merchantid: niubizSession.merchantId,
            purchasenumber: niubizSession.purchaseNumber,
            amount: niubizSession.amount,
            expirationminutes: String(Math.floor((niubizSession.expiresAt - Date.now()) / 60000)),
            ...(niubizSession.env === 'sandbox' ? {
                cardholdername: addressData.nombres.trim(),
                cardholderlastname: addressData.apellidos.trim(),
                cardholderemail: facturacionData.email.trim(),
            } : {}),
            timeouturl: window.location.origin + '/checkout',
            merchantlogo: globalConfig?.logo_url || window.location.origin + '/images/logo.png',
            formbuttoncolor: '#004797',
            action: niubizSession.callbackUrl,
            complete: function(params) {
                // Not strictly needed if action URL is set, the form will auto-submit
            }
        });
        window.VisanetCheckout.open();
    };

    const fetchNiubizSession = async (couponCodeStr, isCurrent, quoteKey) => {

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
                facturacion: { ...facturacionData, dni: facturacionData.comprobante === 'Factura' ? '' : facturacionData.dni },
                shippingAddress: addressData,
                usePoints: usePoints,
                items: cartItems.map(item => ({ id: item.id, precio_final: item.precio_final, cantidad: item.cantidad }))
            });
            const data = res.data;
            if (!isCurrent()) return;

            if (data.sessionKey) {
                setNiubizSession(null);

                await loadNiubizCheckout(data.env);
                if (isCurrent()) setNiubizSession({ ...data, quoteKey });

            } else if (data.error) {
                setNiubizError(data.error);
            } else {
                setNiubizError("Respuesta desconocida del servidor");
            }
        } catch (e) {
            if (!isCurrent()) return;
            if (e.response && e.response.data && e.response.data.error) {
                setNiubizError(e.response.data.error);
            } else if (e.response?.data?.errors) {
                setNiubizError(Object.values(e.response.data.errors).flat()[0]);
            } else {
                setNiubizError('No pudimos preparar el pago. Comprueba tu conexión y reintenta.');
            }
        } finally {
            if (isCurrent()) setIsFetchingNiubiz(false);
        }
    };

    const handleDeliveryConfirm = async () => {
        if (addressSaved && deliveryType) {
            setStep(3);
            sessionStorage.setItem('checkout_delivery', deliveryType);


        }
    };

    const handleApplyCoupon = async () => {
        setCouponMessage(null);
        if (isApplyingCoupon || !couponCode.trim()) return;

        setIsApplyingCoupon(true);
        try {
            const res = await axios.post('/api/checkout/apply-coupon', { codigo: couponCode.trim() });
            const data = res.data;
            if (data.error) {
                setCouponMessage({ type: 'error', text: data.error });
                setAppliedCoupon(null);
            } else {
                setAppliedCoupon(data);
                setCouponMessage({
                    type: 'success',
                    text: 'Cupón aceptado. El descuento se confirma al preparar el pago.',
                });

                // Highlight total animation

                // Refrescar el PaymentIntent con el nuevo monto

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

    discountAmount = Math.min(baseCartTotal, Math.max(0, discountAmount));

    let pointsDiscount = 0;
    if (usePoints && loyaltyPoints > 0) {
        const remainingTotal = Math.max(0, baseCartTotal - discountAmount);
        pointsDiscount = Math.min(loyaltyPoints, Math.floor(remainingTotal * 10)) / 10;
    }

    const deliveryCost = deliveryType === 'tienda' ? 0 : ((shippingCalculated || addressSaved) && addressData.distrito ? apiShippingCost : 0);
    const cartTotal = niubizSession?.quoteKey === paymentKey ? niubizSession.amount : Math.max(0, baseCartTotal - discountAmount - pointsDiscount) + deliveryCost;

    const editAddress = () => { setAddressSaved(false); setBillingConfirmed(false); setStep(1); };
    return <CheckoutFlow model={{
        step, address: addressData, addressSaved, deliveryType, shippingCost: deliveryCost, shippingInfo, canSaveAddress: Boolean(user),
        pickupLocations,
        addressError, isCreating: isCreating || loadingGps, districts: LIMA_DISTRITOS,
        isCalculatingShipping, shippingCalculated, deliveryCalcError,
        onAddressChange: handleAddressChange, onAddressSubmit: handleAddressSubmit,
        onDeliveryChange: value => {
            setDeliveryType(value);
            setAddressSaved(false);
            if (value === 'tienda') {
                setApiShippingCost(0);
                setShippingInfo({ source: 'pickup', courier: 'Retiro en tienda', test: false });
                setShippingCalculated(true);
            }
        },
        onDeliveryConfirm: handleDeliveryConfirm, onEditAddress: editAddress,
        billing: facturacionData, billingConfirmed,
        onBillingChange: (field, value) => { handleFacturacionChange(field, value); if (['nombres', 'dni'].includes(field)) setFacturacionData(previous => ({ ...previous, cambiarDatos: true })); },
        onBillingConfirm: () => setBillingConfirmed(true), onEditBilling: () => setBillingConfirmed(false),
        onLookupDocument: buscarDocumentoCheckout, loadingDocument: loadingApiDoc,
        couponCode, setCouponCode, appliedCoupon, couponMessage, couponPending: isApplyingCoupon,
        onApplyCoupon: handleApplyCoupon, onRemoveCoupon: () => { setAppliedCoupon(null); setCouponCode(''); setCouponMessage(null); },
        loyaltyPoints, usePoints, setUsePoints, quote: niubizSession, quoteKey: paymentKey,
        quoteFetching: isFetchingNiubiz, quoteError: niubizError,
        onPay: openNiubizModal, onRetry: () => setPaymentRetry(value => value + 1),
        cartItems, baseTotal: baseCartTotal, discountAmount, pointsDiscount, cartTotal, flashError: flash?.error,
    }} map={<>
        <div className="purchase-map-controls"><button type="button" className="purchase-outline" onClick={buscarEnMapa} disabled={isCreating}>Buscar dirección</button>
            <button type="button" className="purchase-outline" onClick={usarGPS} disabled={loadingGps || isCreating}>{loadingGps ? 'Ubicando…' : 'Usar mi ubicación'}</button></div>
        <div className="purchase-map" style={{ height: '300px', width: '100%', zIndex: 0, borderRadius: '8px', overflow: 'hidden' }}>
            <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={16} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                />
                <Marker 
                    position={[mapCenter.lat, mapCenter.lng]} 
                    draggable={true}
                    eventHandlers={{
                        dragend: (e) => {
                            const marker = e.target;
                            setMapCenter({ lat: marker.getLatLng().lat, lng: marker.getLatLng().lng });
                        }
                    }}
                />
                <MapUpdater center={mapCenter} />
            </MapContainer>
        </div>
        <div className="purchase-map-controls"><label className="purchase-field" htmlFor="purchase-map-coordinates"><span>Coordenadas (opcional)</span><input id="purchase-map-coordinates" value={coordInput} onChange={event => setCoordInput(event.target.value)} placeholder="Latitud, longitud" /></label><button type="button" className="purchase-outline" onClick={aplicarCoordenadas}>Ubicar pin</button></div>
        {mapError && <p className="purchase-inline-message is-error" role="status">{mapError}</p>}
        <p className="purchase-helper">El mapa es opcional. Confirma siempre la dirección y el distrito escritos.</p>
    </>} />;
}
