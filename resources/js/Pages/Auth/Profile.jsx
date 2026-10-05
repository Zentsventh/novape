import { useState, useEffect, useMemo } from 'react';
import { Head, router, usePage, Link, useForm } from '@inertiajs/react';
import Header from '../../Components/Home/Header';
import CategoryNavBar from '../../Components/Home/CategoryNavBar';
import CategoryDrawer from '../../Components/Home/CategoryDrawer';
import CartDrawer from '../../Components/Home/CartDrawer';
import Toast from '../../Components/Home/Toast';
import Footer from '../../Components/Home/Footer';
import '../../../css/home/base.css';
import '../../../css/home/header.css';
import '../../../css/home/category-nav.css';
import '../../../css/home/category-drawer.css';
import '../../../css/home/cart-drawer.css';
import '../../../css/home/footer.css';
import ubigeoData from 'ubigeo-peru';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { Star } from 'lucide-react';


const ubigeo = ubigeoData.reniec;

export default function Profile({ usuario = {}, pedidos = [], direcciones = [], tarjetas = [], datosReembolso = null, listas = [], sesiones = [], pointsHistory = [], activeTabParam = 'home', categoriaProductos = [] }) {
    const confirmDialog = useConfirm();

    const { auth, flash, errors: pageErrors, cart } = usePage().props;
    const user = auth?.user || usuario;
    const [currentView, setCurrentView] = useState(activeTabParam === 'ordenes' ? 'compras' : activeTabParam);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCatOpen, setIsCatOpen] = useState(false);

    
    // Modals state
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [showAddTarjeta, setShowAddTarjeta] = useState(false);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [showAddLista, setShowAddLista] = useState(false);
    const [selectedList, setSelectedList] = useState(null);
    const [selectedItems, setSelectedItems] = useState({});
    const [showEditPassword, setShowEditPassword] = useState(false);

    // Form for profile
    const profileForm = useForm({
        nombres: user.nombres || '',
        apellidos: user.apellidos || '',
        fecha_nacimiento: user.fecha_nacimiento || '',
        dni: user.dni || '',
        telefono: user.telefono || '',
    });

    const addressForm = useForm({
        direccion: '', referencia: '', departamento: '', provincia: '', distrito: '', codigo_postal: '', principal: false
    });

    const tarjetaForm = useForm({
        numero_tarjeta: '', fecha_vencimiento: '', cvv: '', nombre_titular: ''
    });

    const reembolsoForm = useForm({
        tipo_documento: datosReembolso?.tipo_documento || 'DNI',
        numero_documento: datosReembolso?.numero_documento || '',
        nombres_titular: datosReembolso?.nombres_titular || '',
        apellidos_titular: datosReembolso?.apellidos_titular || '',
        telefono_titular: datosReembolso?.telefono_titular || '',
        correo_titular: datosReembolso?.correo_titular || '',
        banco: datosReembolso?.banco || '',
        tipo_cuenta: datosReembolso?.tipo_cuenta || '',
        numero_cuenta: datosReembolso?.numero_cuenta || '',
        cci: datosReembolso?.cci || ''
    });

    const passwordForm = useForm({
        current_password: '', password: '', password_confirmation: ''
    });

    const deleteAccountForm = useForm({
        password: ''
    });

    const [showEditPhone, setShowEditPhone] = useState(false);
    const [phoneOtpStep, setPhoneOtpStep] = useState('phone');
    const [showTooltip, setShowTooltip] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const phoneForm = useForm({
        telefono: user.telefono || '',
        codigo: ''
    });

    const submitPhoneRequest = (e) => {
        e.preventDefault();
        phoneForm.post('/perfil/celular/solicitar-codigo', {
            preserveScroll: true,
            onSuccess: () => setPhoneOtpStep('otp')
        });
    };

    const submitPhoneVerify = (e) => {
        e.preventDefault();
        phoneForm.post('/perfil/celular/verificar-codigo', {
            preserveScroll: true,
            onSuccess: () => {
                setShowEditPhone(false);
                setPhoneOtpStep('phone');
                phoneForm.reset('codigo');
            }
        });
    };

    const listaForm = useForm({
        nombre: '', es_publica: false
    });

    const [depCode, setDepCode] = useState('');
    const [provCode, setProvCode] = useState('');

    const departamentos = useMemo(() => ubigeo.filter(u => u.provincia === '00' && u.distrito === '00'), []);
    const provincias = useMemo(() => depCode ? ubigeo.filter(u => u.departamento === depCode && u.provincia !== '00' && u.distrito === '00') : [], [depCode]);
    const distritos = useMemo(() => provCode ? ubigeo.filter(u => u.departamento === depCode && u.provincia === provCode && u.distrito !== '00') : [], [depCode, provCode]);

    const handleDepChange = (e) => {
        const dName = e.target.value;
        addressForm.setData('departamento', dName);
        addressForm.setData('provincia', '');
        addressForm.setData('distrito', '');
        const dep = departamentos.find(d => d.nombre === dName);
        setDepCode(dep ? dep.departamento : '');
        setProvCode('');
    };

    const handleProvChange = (e) => {
        const pName = e.target.value;
        addressForm.setData('provincia', pName);
        addressForm.setData('distrito', '');
        const prov = provincias.find(p => p.nombre === pName);
        setProvCode(prov ? prov.provincia : '');
    };

    const submitProfile = (e) => {
        e.preventDefault();
        profileForm.post('/perfil/update', { preserveScroll: true, onSuccess: () => setShowEditProfile(false) });
    };

    const submitAddress = (e) => {
        e.preventDefault();
        addressForm.post('/perfil/direccion', { preserveScroll: true, onSuccess: () => { setShowAddAddress(false); addressForm.reset(); } });
    };

    const submitTarjeta = (e) => {
        e.preventDefault();
        tarjetaForm.post('/perfil/tarjetas', { preserveScroll: true, onSuccess: () => { setShowAddTarjeta(false); tarjetaForm.reset(); } });
    };

    const submitReembolso = (e) => {
        e.preventDefault();
        reembolsoForm.post('/perfil/reembolso', { preserveScroll: true });
    };

    const submitPassword = async (e) => {
        e.preventDefault();
        passwordForm.post('/perfil/password', { preserveScroll: true, onSuccess: () => { setShowEditPassword(false); passwordForm.reset(); } });
    };

    const submitDeleteAccount = async (e) => {
        e.preventDefault();
        if(await confirmDialog("¿Estás completamente seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.")) {
            deleteAccountForm.delete('/perfil/cuenta', { preserveScroll: true });
        }
    };

    const submitLista = (e) => {
        e.preventDefault();
        listaForm.post('/perfil/listas', { preserveScroll: true, onSuccess: () => { setShowAddLista(false); listaForm.reset(); } });
    };

    useEffect(() => {
        if (activeTabParam !== currentView) {
            setCurrentView(activeTabParam);
        }
    }, [activeTabParam]);

    const [filterOrder, setFilterOrder] = useState('');
    const formatCurrency = (val) => 'S/ ' + new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2 }).format(val);

    const changeView = (view) => {
        setCurrentView(view);
        router.get('/perfil', { tab: view }, { preserveState: true, replace: true, preserveScroll: true });
    };

    const renderHome = () => (
        <div style={{ flex: 1, animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>Panel de Control</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18.75rem), 1fr))', gap: '24px', marginBottom: '48px' }}>
                <div style={{ background: '#ffffff', borderRadius: '16px', padding: 'clamp(0.75rem, 3vw, 1.5rem)', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', cursor: 'default' }}
                     onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 71, 151, 0.1)'; e.currentTarget.style.borderColor = '#004797'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.03)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 71, 151, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#004797' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748B', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Información Personal</div>
                    </div>
                    <div style={{ fontSize: '18px', color: '#1E293B', fontWeight: '700', marginBottom: '4px' }}>{user.nombres} {user.apellidos}</div>
                    <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>{user.email}</div>
                    <button onClick={() => changeView('perfil')} style={{ alignSelf: 'flex-start', marginTop: 'auto', color: '#004797', fontSize: '14px', fontWeight: '600', border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px 0', display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.8'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        Editar perfil <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </button>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '16px', padding: 'clamp(0.75rem, 3vw, 1.5rem)', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', cursor: 'default' }}
                     onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 71, 151, 0.1)'; e.currentTarget.style.borderColor = '#004797'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.03)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 71, 151, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#004797' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748B', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dirección Principal</div>
                    </div>
                    {direcciones.find(d => d.principal) ? (
                        <>
                            <div style={{ fontSize: '16px', color: '#1E293B', fontWeight: '600', marginBottom: '4px' }}>{direcciones.find(d => d.principal).direccion}</div>
                            <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>{direcciones.find(d => d.principal).distrito}, {direcciones.find(d => d.principal).provincia}</div>
                        </>
                    ) : (
                        <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px', flex: 1, display: 'flex', alignItems: 'center' }}>No tienes dirección principal configurada.</div>
                    )}
                    <button onClick={() => changeView('direcciones')} style={{ alignSelf: 'flex-start', marginTop: 'auto', color: '#004797', fontSize: '14px', fontWeight: '600', border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px 0', display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.8'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        Gestionar direcciones <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Últimas compras <span style={{ color: '#94A3B8', fontWeight: '500', fontSize: '16px' }}>({Math.min(pedidos.length, 3)})</span></h2>
                    <button onClick={() => changeView('compras')} style={{ fontSize: '14px', color: '#004797', fontWeight: '600', background: 'rgba(0, 71, 151, 0.05)', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 71, 151, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 71, 151, 0.05)'}>Ver todas</button>
                </div>
                {pedidos.length === 0 ? (
                    <div style={{ padding: '60px 40px', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '16px', textAlign: 'center', color: '#64748B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                        <span style={{ fontSize: '15px', fontWeight: '500' }}>Aún no tienes compras realizadas.</span>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))', gap: '20px' }}>
                        {pedidos.slice(0, 3).map(pedido => {
                            const primerItem = pedido.items && pedido.items.length > 0 ? pedido.items[0] : null;
                            const imagenUrl = primerItem?.variante?.producto?.imagenes?.[0]?.url || primerItem?.variante?.producto?.imagenes?.[0]?.ruta || '/img/placeholder.jpg';
                            const nombreProd = primerItem?.variante?.producto?.nombre || 'Producto';
                            
                            return (
                                <div key={pedido.id} onClick={() => changeView('compras')} style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', gap: '16px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
                                     onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                                     onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                                >
                                    <div style={{ width: '80px', height: '80px', flexShrink: 0, background: '#F8FAFC', borderRadius: '12px', padding: '8px', border: '1px solid #F1F5F9' }}>
                                        <img src={imagenUrl} alt={nombreProd} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                                        <div style={{ fontSize: '14px', color: '#1E293B', fontWeight: '600', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>{nombreProd}</div>
                                        <div style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>{new Date(pedido.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric'})}</div>
                                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
                                            <span style={{ background: pedido.estado === 'Completado' ? 'rgba(22, 163, 74, 0.1)' : (pedido.estado === 'Enviado' ? 'rgba(2, 132, 199, 0.1)' : '#F1F5F9'), color: pedido.estado === 'Completado' ? '#16A34A' : (pedido.estado === 'Enviado' ? '#0284C7' : '#475569'), fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>
                                                {pedido.estado === 'Completado' ? 'Entregado' : pedido.estado}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', color: '#CBD5E1' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    const renderCompras = () => {
        let filtered = pedidos;
        if (filterOrder) filtered = filtered.filter(p => p.codigo.toLowerCase().includes(filterOrder.toLowerCase()));

        return (
            <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', width: '100%' }}>
                <div onClick={() => changeView('home')} style={{ color: '#444', fontSize: '13px', fontWeight: '500', marginBottom: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg> Mi cuenta
                </div>
                <h1 style={{ fontSize: '24px', color: '#333', fontWeight: '400', marginBottom: '30px' }}>Mis compras</h1>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', top: '12px', left: '15px' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" placeholder="Buscar por N° de pedido" value={filterOrder} onChange={(e) => setFilterOrder(e.target.value)} style={{ width: '100%', padding: '12px 15px 12px 45px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
                    </div>
                </div>

                {filtered.map(pedido => {
                    const primerItem = pedido.items && pedido.items.length > 0 ? pedido.items[0] : null;
                    const imagenUrl = primerItem?.variante?.producto?.imagenes?.[0]?.ruta || '/img/placeholder.jpg';
                    const vendedor = primerItem?.variante?.producto?.proveedor?.nombre || 'Tienda Principal';

                    return (
                        <div key={pedido.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '20px', overflow: 'hidden' }}>
                            <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#333', fontWeight: '500' }}>
                                <span>{new Date(pedido.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })}</span>
                                <span>{formatCurrency(pedido.total)}</span>
                            </div>
                            <div style={{ padding: '25px 20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                                <div style={{ display: 'flex', gap: '20px', flex: '1 1 250px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>Compras N° {pedido.codigo}</div>
                                        <div style={{ fontSize: '14px', color: '#333', fontWeight: '500', marginBottom: '15px' }}>
                                            {pedido.estado === 'Completado' ? 'Entregado' : `Estado: ${pedido.estado}`} 
                                            <span style={{ fontWeight: 'normal', color: '#64748b', marginLeft: '5px' }}>
                                                el {new Date(pedido.created_at).toLocaleString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                            <div style={{ width: '60px', height: '60px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '5px' }}>
                                                <img src={imagenUrl} alt="Producto" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            </div>
                                            <div>
                                                <a href={`/seguimiento?codigo=${pedido.codigo}`} style={{ color: '#444', textDecoration: 'underline', fontSize: '13px' }}>
                                                    {pedido.estado === 'Completado' ? 'Entregado' : 'Hacer seguimiento'}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: '1 1 150px', padding: '10px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Vendido por:</div>
                                    <div style={{ fontSize: '13px', color: '#333' }}>{vendedor}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center', flex: '1 1 200px' }}>
                                    <Link href={`/perfil/compras/${pedido.codigo}`} style={{ width: '100%', padding: '10px 0', background: '#004797', color: 'white', borderRadius: '24px', textAlign: 'center', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>Revisar detalle</Link>
                                    {(pedido.estado === 'Completado' || pedido.estado === 'Entregado') && (
                                        <button onClick={() => {
                                            router.post('/perfil/devoluciones', {
                                                pedido_id: pedido.id,
                                                type: 'warranty',
                                                reason: 'defective',
                                                description: 'Solicito iniciar un proceso de garantía/devolución para este pedido.'
                                            });
                                        }} style={{ width: '100%', padding: '10px 0', marginTop: '10px', background: 'transparent', color: '#e11d48', border: '1px solid #e11d48', borderRadius: '24px', textAlign: 'center', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                                            Solicitar Garantía/Devolución
                                        </button>
                                    )}
                                    <button onClick={() => { 
                                        const prodId = primerItem?.variante?.producto_id || primerItem?.variante?.producto?.id;
                                        if (prodId) {
                                            router.post('/cart/add', { producto_id: prodId, cantidad: 1 }, { 
                                                preserveScroll: true,
                                                onSuccess: () => window.dispatchEvent(new CustomEvent('open-cart'))
                                            });
                                        }
                                    }} style={{ width: '100%', padding: '10px 0', background: 'white', border: '1px solid #004797', color: '#004797', borderRadius: '24px', textAlign: 'center', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Comprar de nuevo</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderPerfilSidebar = () => {
        const getStyles = (view) => ({
            width: '100%', textAlign: 'left', padding: '12px 16px', background: currentView === view ? '#F0F9FF' : 'transparent', border: '1px solid', borderColor: currentView === view ? '#E0F2FE' : 'transparent', borderRadius: '10px', fontSize: '14px', color: currentView === view ? '#004797' : '#475569', fontWeight: currentView === view ? '600' : '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s ease', marginBottom: '4px'
        });
        
        return (
            <div className="efe-profile-sidebar" style={{ flexShrink: 0, width: '280px', background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '16px' }}>Mi cuenta</div>
                <button 
                    onClick={() => changeView('home')} 
                    style={getStyles('home')}
                    onMouseEnter={e => { if(currentView !== 'home') { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; } }}
                    onMouseLeave={e => { if(currentView !== 'home') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect></svg>
                    Panel de control
                </button>
                <button 
                    onClick={() => changeView('compras')} 
                    style={getStyles('compras')}
                    onMouseEnter={e => { if(currentView !== 'compras') { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; } }}
                    onMouseLeave={e => { if(currentView !== 'compras') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    Mis compras
                </button>
                <button 
                    onClick={() => changeView('perfil')} 
                    style={getStyles('perfil')}
                    onMouseEnter={e => { if(currentView !== 'perfil') { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; } }}
                    onMouseLeave={e => { if(currentView !== 'perfil') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    Datos personales
                </button>
                
                <div style={{ height: '1px', background: '#E2E8F0', margin: '16px 0', borderRadius: '1px' }}></div>
                
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '16px' }}>Gestión</div>
                <button 
                    onClick={() => { router.get('/perfil/devoluciones') }} 
                    style={getStyles('devoluciones')}
                    onMouseEnter={e => { if(currentView !== 'devoluciones') { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; } }}
                    onMouseLeave={e => { if(currentView !== 'devoluciones') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    Devoluciones y Garantías
                </button>
                <button 
                    onClick={() => changeView('direcciones')} 
                    style={getStyles('direcciones')}
                    onMouseEnter={e => { if(currentView !== 'direcciones') { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; } }}
                    onMouseLeave={e => { if(currentView !== 'direcciones') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    Direcciones
                </button>
                <button 
                    onClick={() => changeView('tarjetas')} 
                    style={getStyles('tarjetas')}
                    onMouseEnter={e => { if(currentView !== 'tarjetas') { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; } }}
                    onMouseLeave={e => { if(currentView !== 'tarjetas') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                    Tarjetas
                </button>
                <button 
                    onClick={() => changeView('reembolso')} 
                    style={getStyles('reembolso')}
                    onMouseEnter={e => { if(currentView !== 'reembolso') { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; } }}
                    onMouseLeave={e => { if(currentView !== 'reembolso') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    Reembolsos / CCI
                </button>
                <button 
                    onClick={() => changeView('listas')} 
                    style={getStyles('listas')}
                    onMouseEnter={e => { if(currentView !== 'listas') { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; } }}
                    onMouseLeave={e => { if(currentView !== 'listas') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    Mis listas
                </button>
                
                <div style={{ height: '1px', background: '#E2E8F0', margin: '16px 0', borderRadius: '1px' }}></div>
                
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '16px' }}>Seguridad</div>
                <button 
                    onClick={() => changeView('sesiones')} 
                    style={getStyles('sesiones')}
                    onMouseEnter={e => { if(currentView !== 'sesiones') { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; } }}
                    onMouseLeave={e => { if(currentView !== 'sesiones') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                    Dispositivos vinculados
                </button>
                <button 
                    onClick={() => changeView('configuracion')} 
                    style={getStyles('configuracion')}
                    onMouseEnter={e => { if(currentView !== 'configuracion') { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; } }}
                    onMouseLeave={e => { if(currentView !== 'configuracion') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    Configurar cuenta
                </button>
                
                <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                    <button 
                        onClick={() => { router.post('/logout') }} 
                        style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: '1px solid transparent', borderRadius: '10px', fontSize: '14px', color: '#EF4444', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#EF4444'; }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Cerrar sesión
                    </button>
                </div>
            </div>
        );
    };

    const renderDatosPersonales = () => (
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>Datos personales</h2>
            </div>
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', overflow: 'hidden' }}>
                {/* Row: Nombre */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Nombre y apellidos</div>
                        <div style={{ fontSize: '16px', color: '#1E293B', fontWeight: '500' }}>{user.nombres} {user.apellidos}</div>
                    </div>
                    <button onClick={() => setShowEditProfile(true)} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #E2E8F0', color: '#004797', fontSize: '14px', fontWeight: '600', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={e => { e.currentTarget.style.background = '#F0F9FF'; e.currentTarget.style.borderColor = '#004797'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E2E8F0'; }}>Editar</button>
                </div>
                {/* Row: Documento */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Tipo de documento</div>
                        <div style={{ fontSize: '16px', color: '#1E293B', fontWeight: '500' }}>{user.tipo_documento || 'DNI'} {user.dni || <span style={{ color: '#CBD5E1' }}>No registrado</span>}</div>
                    </div>
                    <span style={{ padding: '6px 14px', background: '#F0F9FF', color: '#0284C7', fontSize: '12px', fontWeight: '600', borderRadius: '20px' }}>Verificado</span>
                </div>
                {/* Row: Celular */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Celular</div>
                        <div style={{ fontSize: '16px', color: user.telefono ? '#1E293B' : '#CBD5E1', fontWeight: '500' }}>{user.telefono ? `+51 ${user.telefono}` : 'No registrado'}</div>
                    </div>
                    <button onClick={() => setShowEditPhone(true)} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #E2E8F0', color: '#004797', fontSize: '14px', fontWeight: '600', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={e => { e.currentTarget.style.background = '#F0F9FF'; e.currentTarget.style.borderColor = '#004797'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E2E8F0'; }}>Editar</button>
                </div>
                {/* Row: Email */}
                <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Correo electrónico</div>
                        <div style={{ fontSize: '16px', color: '#1E293B', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {user.email}
                            <div style={{ position: 'relative', display: 'inline-flex' }}>
                                <svg onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" style={{ cursor: 'help' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                {showTooltip && (
                                    <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '10px', background: '#1E293B', color: 'white', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', width: '260px', zIndex: 10, boxShadow: '0 8px 25px rgba(0,0,0,0.15)', lineHeight: '1.5' }}>
                                        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1E293B' }}></div>
                                        Por seguridad, no es posible editar el correo. Si necesitas usar otro, crea una nueva cuenta.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <span style={{ padding: '6px 14px', background: '#F0FFF4', color: '#16A34A', fontSize: '12px', fontWeight: '600', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Verificado
                    </span>
                </div>
            </div>
        </div>
    );

    const renderDirecciones = () => (
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>Direcciones</h2>
            </div>
            {direcciones.map(dir => (
                <div key={dir.id} style={{ background: '#ffffff', borderRadius: '16px', padding: '24px 28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', transition: 'all 0.2s ease' }}
                     onMouseEnter={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
                     onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)'; }}
                >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: dir.principal ? 'rgba(0, 71, 151, 0.1)' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dir.principal ? '#004797' : '#94A3B8', flexShrink: 0 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                <div style={{ fontSize: '15px', color: '#1E293B', fontWeight: '600' }}>{dir.direccion}</div>
                                {dir.principal && <span style={{ background: '#F0F9FF', color: '#0284C7', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.3px' }}>Principal</span>}
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748B' }}>{dir.distrito}, {dir.provincia}</div>
                            <div style={{ fontSize: '13px', color: '#64748B' }}>{dir.departamento}</div>
                            {dir.referencia && <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Ref: {dir.referencia}</div>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                        {!dir.principal && (
                            <button onClick={() => router.post(`/perfil/direccion/${dir.id}/principal`, {}, { preserveScroll: true })} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #E2E8F0', color: '#475569', fontSize: '12px', fontWeight: '600', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#004797'; e.currentTarget.style.color = '#004797'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}>Establecer principal</button>
                        )}
                        <button onClick={async () => { if(await confirmDialog('¿Eliminar dirección?')) router.delete(`/perfil/direccion/${dir.id}`, { preserveScroll: true }) }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #FEE2E2', color: '#EF4444', fontSize: '12px', fontWeight: '600', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>Eliminar</button>
                    </div>
                </div>
            ))}
            {direcciones.length === 0 && (
                <div style={{ padding: '60px 40px', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '16px', textAlign: 'center', color: '#64748B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span style={{ fontSize: '15px', fontWeight: '500' }}>Aún no tienes direcciones guardadas.</span>
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button onClick={() => setShowAddAddress(true)} style={{ padding: '12px 28px', background: '#004797', color: 'white', borderRadius: '24px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 71, 151, 0.25)', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 71, 151, 0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 71, 151, 0.25)'; }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Agregar dirección
                </button>
            </div>
        </div>
    );

    const renderTarjetas = () => (
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>Tarjetas guardadas</h2>
            </div>
            {tarjetas.map(t => (
                <div key={t.id} style={{ background: '#ffffff', borderRadius: '16px', padding: '20px 28px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease' }}
                     onMouseEnter={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
                     onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)'; }}
                >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '56px', height: '38px', background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', color: 'white', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>{t.marca || 'VISA'}</div>
                        <div>
                            <div style={{ fontSize: '15px', color: '#1E293B', fontWeight: '600', letterSpacing: '1px' }}>•••• •••• •••• {t.ultimos_digitos}</div>
                            {t.principal && <span style={{ background: '#F0F9FF', color: '#0284C7', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', marginTop: '4px', display: 'inline-block' }}>Principal</span>}
                        </div>
                    </div>
                    <button onClick={async () => { if(await confirmDialog('¿Eliminar tarjeta?')) router.delete(`/perfil/tarjetas/${t.id}`, { preserveScroll: true }) }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #FEE2E2', color: '#EF4444', fontSize: '12px', fontWeight: '600', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Eliminar</button>
                </div>
            ))}
            {tarjetas.length === 0 && (
                <div style={{ padding: '60px 40px', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '16px', textAlign: 'center', color: '#64748B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                    <span style={{ fontSize: '15px', fontWeight: '500' }}>No tienes tarjetas guardadas.</span>
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button onClick={() => setShowAddTarjeta(true)} style={{ padding: '12px 28px', background: '#004797', color: 'white', borderRadius: '24px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 71, 151, 0.25)', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 71, 151, 0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 71, 151, 0.25)'; }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Agregar tarjeta
                </button>
            </div>
        </div>
    );

    const renderReembolsos = () => {
        const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid #E2E8F0', borderRadius: '10px', outline: 'none', fontSize: '14px', color: '#1E293B', background: '#FAFAFA', transition: 'all 0.2s ease', boxSizing: 'border-box' };
        const labelStyle = { fontSize: '12px', fontWeight: '700', color: '#94A3B8', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' };
        return (
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>Datos de Reembolso / CCI</h2>
            </div>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: 'clamp(0.75rem, 3vw, 2rem)', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px 20px', background: '#F0F9FF', borderRadius: '10px', marginBottom: '28px', border: '1px solid #BAE6FD' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    <p style={{ fontSize: '14px', color: '#0369A1', margin: 0, lineHeight: '1.6' }}>Completa los datos de tu cuenta bancaria para recibir reembolsos en caso de cancelaciones o devoluciones.</p>
                </div>
                <form onSubmit={submitReembolso} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '24px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', marginBottom: '16px' }}>Información del titular</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Tipo Documento</label>
                                <select value={reembolsoForm.data.tipo_documento} onChange={e => reembolsoForm.setData('tipo_documento', e.target.value)} style={inputStyle}>
                                    <option value="DNI">DNI</option>
                                    <option value="RUC">RUC</option>
                                    <option value="CE">Carnet de Extranjería</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Número Documento</label>
                                <input type="text" value={reembolsoForm.data.numero_documento} onChange={e => reembolsoForm.setData('numero_documento', e.target.value)} style={inputStyle} required onFocus={e => e.target.style.borderColor = '#004797'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                            </div>
                            <div>
                                <label style={labelStyle}>Nombres Titular</label>
                                <input type="text" value={reembolsoForm.data.nombres_titular} onChange={e => reembolsoForm.setData('nombres_titular', e.target.value)} style={inputStyle} required onFocus={e => e.target.style.borderColor = '#004797'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                            </div>
                            <div>
                                <label style={labelStyle}>Apellidos Titular</label>
                                <input type="text" value={reembolsoForm.data.apellidos_titular} onChange={e => reembolsoForm.setData('apellidos_titular', e.target.value)} style={inputStyle} required onFocus={e => e.target.style.borderColor = '#004797'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                            </div>
                            <div>
                                <label style={labelStyle}>Celular Titular</label>
                                <input type="text" value={reembolsoForm.data.telefono_titular} onChange={e => reembolsoForm.setData('telefono_titular', e.target.value)} style={inputStyle} required onFocus={e => e.target.style.borderColor = '#004797'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                            </div>
                            <div>
                                <label style={labelStyle}>Correo Titular</label>
                                <input type="email" value={reembolsoForm.data.correo_titular} onChange={e => reembolsoForm.setData('correo_titular', e.target.value)} style={inputStyle} required onFocus={e => e.target.style.borderColor = '#004797'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                            </div>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', marginBottom: '16px' }}>Datos bancarios</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Banco</label>
                                <select value={reembolsoForm.data.banco} onChange={e => reembolsoForm.setData('banco', e.target.value)} style={inputStyle} required>
                                    <option value="">Seleccione banco</option>
                                    <option value="BCP">BCP</option>
                                    <option value="BBVA">BBVA</option>
                                    <option value="Interbank">Interbank</option>
                                    <option value="Scotiabank">Scotiabank</option>
                                    <option value="Banbif">Banbif</option>
                                    <option value="Banco de la Nación">Banco de la Nación</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Tipo de Cuenta</label>
                                <select value={reembolsoForm.data.tipo_cuenta} onChange={e => reembolsoForm.setData('tipo_cuenta', e.target.value)} style={inputStyle} required>
                                    <option value="">Seleccione tipo</option>
                                    <option value="Ahorros">Ahorros</option>
                                    <option value="Corriente">Corriente</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Número de Cuenta</label>
                                <input type="text" value={reembolsoForm.data.numero_cuenta} onChange={e => reembolsoForm.setData('numero_cuenta', e.target.value)} style={inputStyle} required onFocus={e => e.target.style.borderColor = '#004797'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                            </div>
                            <div>
                                <label style={labelStyle}>CCI</label>
                                <input type="text" value={reembolsoForm.data.cci} onChange={e => reembolsoForm.setData('cci', e.target.value)} style={inputStyle} required onFocus={e => e.target.style.borderColor = '#004797'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                        <button type="submit" disabled={reembolsoForm.processing} style={{ padding: '12px 32px', background: reembolsoForm.processing ? '#94A3B8' : '#004797', border: 'none', borderRadius: '24px', color: 'white', fontWeight: '700', cursor: reembolsoForm.processing ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(0, 71, 151, 0.25)', transition: 'all 0.2s ease', fontSize: '14px' }} onMouseEnter={e => { if(!reembolsoForm.processing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 71, 151, 0.3)'; } }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 71, 151, 0.25)'; }}>
                            {reembolsoForm.processing ? 'Guardando...' : 'Guardar datos bancarios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        );
    };

    const renderListas = () => {
        if (selectedList) {
            const lista = listas.find(l => l.id === selectedList.id) || selectedList;
            const items = lista.items || [];
            
            const handleSelectAll = async (e) => {
                if (e.target.checked) {
                    const allIds = {};
                    items.forEach(i => allIds[i.id] = true);
                    setSelectedItems(allIds);
                } else {
                    setSelectedItems({});
                }
            };
            
            const handleSelectItem = async (id, checked) => {
                setSelectedItems(prev => ({...prev, [id]: checked}));
            };
            
            const allSelected = items.length > 0 && Object.keys(selectedItems).length === items.length && Object.values(selectedItems).every(v => v);
            
            return (
                <div style={{ flex: 1, background: 'white', borderRadius: '12px', padding: 'clamp(0.75rem, 3vw, 1.875rem)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <button onClick={() => {setSelectedList(null); setSelectedItems({});}} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', color: '#333', fontWeight: '400', padding: 0 }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            {lista.nombre}
                        </button>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', color: '#64748b' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                                Compartir
                            </button>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                            </button>
                        </div>
                    </div>
                    
                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                            width: '20px', height: '20px', borderRadius: '4px', 
                            border: allSelected ? 'none' : '1px solid #94a3b8', 
                            background: allSelected ? '#334155' : 'white', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
                        }}>
                            {allSelected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                            <input type="checkbox" checked={allSelected} onChange={handleSelectAll} style={{ position: 'absolute', opacity: 0, cursor: 'pointer', width: '20px', height: '20px' }} />
                        </div>
                        <span style={{ fontSize: '14px', color: '#64748b' }}>Seleccionar todos ({items.length} productos)</span>
                    </div>
                    
                    <div>
                        {items.map(item => {
                            const prod = item.producto;
                            if (!prod) return null;
                            const isChecked = !!selectedItems[item.id];
                            return (
                                <div key={item.id} style={{ display: 'flex', gap: '20px', padding: '20px 0', borderTop: '1px solid #e2e8f0' }}>
                                    <div style={{ paddingTop: '10px' }}>
                                        <div style={{ 
                                            width: '20px', height: '20px', borderRadius: '4px', 
                                            border: isChecked ? 'none' : '1px solid #cbd5e1', 
                                            background: isChecked ? '#004797' : '#f8fafc', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
                                        }}>
                                            {isChecked && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                            <input type="checkbox" checked={isChecked} onChange={(e) => handleSelectItem(item.id, e.target.checked)} style={{ position: 'absolute', opacity: 0, cursor: 'pointer', width: '20px', height: '20px' }} />
                                        </div>
                                    </div>
                                    <div style={{ width: '100px', height: '100px', background: '#f8fafc', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                        <img src={prod.imagenes?.[0]?.url || prod.imagenes?.[0]?.ruta || '/img/placeholder.jpg'} alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>{prod.marca || 'Marca'}</div>
                                        <div style={{ fontSize: '14px', color: '#334155', fontWeight: '500', marginBottom: '8px', lineHeight: '1.4' }}>{prod.nombre}</div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>S/ {prod.precio_actual}</span>
                                            {prod.precio_anterior > prod.precio_actual && (
                                                <>
                                                    <span style={{ background: '#64748b', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>-{prod.descuento}%</span>
                                                    <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>S/ {prod.precio_anterior}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', gap: '20px', width: '120px' }}>
                                        <a href="#" style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', textDecoration: 'underline' }}>Buscar similares</a>
                                        <button onClick={async () => {if(await confirmDialog("¿Eliminar este producto de la lista?")) router.delete(`/perfil/listas/items/${item.id}`, { preserveScroll: true })}} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {items.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>Esta lista está vacía.</div>
                        )}
                    </div>
                </div>
            );
        }

        return (
        <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '20px', color: '#333', fontWeight: '400', marginBottom: '25px' }}>Mis listas</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 17.5rem), 1fr))', gap: '20px' }}>
                {listas.map(lista => (
                    <div 
                        key={lista.id} 
                        onClick={() => setSelectedList(lista)} 
                        style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '10px', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }} 
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#004797'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 71, 151, 0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} 
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr', gap: '5px', height: '140px' }}>
                            <div style={{ gridRow: 'span 2', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                                {lista.items?.[0] && <img src={lista.items[0].producto?.imagenes?.[0]?.url || lista.items[0].producto?.imagenes?.[0]?.ruta} style={{width:'100%', height:'100%', objectFit:'cover'}} />}
                            </div>
                            <div style={{ background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                                {lista.items?.[1] && <img src={lista.items[1].producto?.imagenes?.[0]?.url || lista.items[1].producto?.imagenes?.[0]?.ruta} style={{width:'100%', height:'100%', objectFit:'cover'}} />}
                            </div>
                            <div style={{ background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '18px', fontWeight: 'bold' }}>
                                +{(lista.items?.length || 0) > 2 ? lista.items.length - 2 : 0}
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                            <div style={{ fontSize: '15px', color: '#333', fontWeight: '600' }}>{lista.nombre}</div>
                            <button onClick={async (e) => { e.stopPropagation(); if(await confirmDialog("¿Eliminar lista?")) router.delete(`/perfil/listas/${lista.id}`, { preserveScroll: true })}} style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>{(lista.items?.length || 0)} productos • {lista.es_publica ? 'Pública' : 'Privada'}</div>
                    </div>
                ))}
                
                <div onClick={() => setShowAddLista(true)} style={{ background: 'rgba(0, 71, 151, 0.05)', border: '2px dashed #004797', borderRadius: '12px', padding: '20px', minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ width: '48px', height: '48px', background: '#004797', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '15px' }}>+</div>
                    <div style={{ fontSize: '15px', color: '#004797', fontWeight: '600' }}>Crear nueva lista</div>
                </div>
            </div>
        </div>
    );
    };
    const renderPuntos = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '16px', padding: 'clamp(0.75rem, 3vw, 2rem)', color: 'white', boxShadow: '0 10px 25px rgba(245,158,11,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Star fill="white" size={28} /> Novapuntos Disponibles
                    </h2>
                    <p style={{ margin: 0, opacity: 0.9 }}>Usa tus puntos para obtener descuentos en tus próximas compras.</p>
                    <div style={{ fontSize: '48px', fontWeight: '900', marginTop: '16px' }}>{usuario?.loyalty_points || 0}</div>
                    <p style={{ margin: '4px 0 0 0', opacity: 0.8 }}>Equivale a S/ {((usuario?.loyalty_points || 0) / 10).toFixed(2)} de descuento</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '20px', borderRadius: '12px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Cómo ganar puntos:</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>1 Punto</div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>por cada S/ 10 de compra</div>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Historial de Puntos</h3>
                </div>
                
                {pointsHistory && pointsHistory.length > 0 ? (
                    <div className="store-table-scroll" tabIndex={0} role="region" aria-label="Historial de puntos"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                                <th style={{ padding: '16px 24px', fontWeight: '600' }}>Fecha</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600' }}>Descripción</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600' }}>Tipo</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'right' }}>Puntos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pointsHistory.map((h) => (
                                <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '16px 24px', color: '#333', fontSize: '14px' }}>
                                        {new Date(h.created_at).toLocaleDateString('es-PE')}
                                    </td>
                                    <td style={{ padding: '16px 24px', color: '#475569', fontSize: '14px' }}>
                                        {h.description}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{ 
                                            padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                                            background: h.type === 'earned' ? '#dcfce7' : '#fee2e2',
                                            color: h.type === 'earned' ? '#16a34a' : '#ef4444'
                                        }}>
                                            {h.type === 'earned' ? 'Ganados' : 'Canjeados'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 'bold', color: h.type === 'earned' ? '#16a34a' : '#ef4444' }}>
                                        {h.type === 'earned' ? '+' : '-'}{h.points}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                ) : (
                    <div style={{ padding: 'clamp(0.75rem, 3vw, 2.5rem)', textAlign: 'center', color: '#94a3b8' }}>
                        <Star size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                        <p style={{ margin: 0 }}>No tienes historial de puntos aún.</p>
                    </div>
                )}
            </div>
        </div>
    );
    const renderSesiones = () => (
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>Dispositivos vinculados</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px 20px', background: '#FFFBEB', borderRadius: '10px', marginBottom: '24px', border: '1px solid #FDE68A' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <p style={{ fontSize: '14px', color: '#92400E', margin: 0, lineHeight: '1.6' }}>Aquí verás los dispositivos donde has iniciado sesión. Si ves algo sospechoso, cierra la sesión inmediatamente.</p>
            </div>
            {sesiones.length === 0 && (
                <div style={{ padding: '60px 40px', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '16px', textAlign: 'center', color: '#64748B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect></svg>
                    <span style={{ fontSize: '15px', fontWeight: '500' }}>No hay sesiones activas registradas.</span>
                </div>
            )}
            {sesiones.map(sesion => {
                const isCurrent = sesion.id === usePage().props.session_id;
                return (
                    <div key={sesion.id} style={{ background: '#ffffff', borderRadius: '16px', padding: '20px 24px', border: isCurrent ? '1px solid #BAE6FD' : '1px solid #E2E8F0', boxShadow: isCurrent ? '0 4px 20px rgba(0, 71, 151, 0.06)' : '0 4px 20px rgba(0, 0, 0, 0.03)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '44px', height: '44px', background: isCurrent ? 'rgba(0, 71, 151, 0.1)' : '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isCurrent ? '#004797' : '#94A3B8' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: '#1E293B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {sesion.user_agent ? sesion.user_agent.substring(0, 45) + '...' : 'Dispositivo desconocido'}
                                    {isCurrent && <span style={{ background: '#F0F9FF', color: '#0284C7', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Sesión actual</span>}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>IP: {sesion.ip_address || 'desconocida'}</span>
                                    <span>•</span>
                                    <span>Última actividad: {new Date(sesion.last_activity * 1000).toLocaleString('es-PE')}</span>
                                </div>
                            </div>
                        </div>
                        {!isCurrent && (
                            <button onClick={async () => { if(await confirmDialog('¿Cerrar sesión en este dispositivo?')) router.delete(`/perfil/sesiones/${sesion.id}`, { preserveScroll: true }) }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #FEE2E2', color: '#EF4444', fontSize: '12px', fontWeight: '600', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Cerrar sesión</button>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderConfiguracion = () => (
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '28px', color: '#1E293B', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>Configurar cuenta</h2>
            </div>
            
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(0, 71, 151, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#004797' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '16px', color: '#1E293B', fontWeight: '600', marginBottom: '4px' }}>Contraseña de acceso</div>
                            <div style={{ fontSize: '13px', color: '#64748B' }}>Actualiza tu contraseña para mantener tu cuenta segura.</div>
                        </div>
                    </div>
                    <button onClick={() => setShowEditPassword(true)} style={{ padding: '10px 24px', background: 'transparent', border: '1px solid #E2E8F0', color: '#1E293B', fontSize: '14px', fontWeight: '600', borderRadius: '24px', cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#004797'; e.currentTarget.style.color = '#004797'; e.currentTarget.style.background = '#F0F9FF'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.background = 'transparent'; }}>{!usuario?.has_set_password ? 'Establecer contraseña' : 'Cambiar contraseña'}</button>
                </div>
            </div>

            <div style={{ background: '#FFF1F2', borderRadius: '16px', border: '1px solid #FECDD3', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '16px', color: '#DC2626', fontWeight: '600', marginBottom: '4px' }}>Eliminar cuenta</div>
                            <div style={{ fontSize: '13px', color: '#9F1239' }}>Esta acción es permanente y eliminará todos tus datos, listas y preferencias.</div>
                        </div>
                    </div>
                    <button onClick={() => setShowDeleteAccount(true)} style={{ padding: '10px 24px', background: '#EF4444', border: 'none', borderRadius: '24px', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 }} onMouseEnter={e => { e.currentTarget.style.background = '#DC2626'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.transform = 'translateY(0)'; }}>Eliminar mi cuenta</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="efe-home" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Head title="Mi Cuenta" />
            <Toast message={flash?.success} type="success" />
            <Toast message={flash?.error} type="error" />
            
            <Header 
                cartCount={cart?.count || 0} 
                onOpenCart={() => setIsCartOpen(true)} 
                onOpenCategories={() => setIsCatOpen(true)}
                logoUrl={null} 
                minimal={false} 
            />
            {categoriaProductos && categoriaProductos.length > 0 && (
                <CategoryNavBar
                    categorias={categoriaProductos}
                    onOpenCategories={() => setIsCatOpen(true)}
                />
            )}
            
            <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', width: '100%', flex: 1 }}>
                <div className="efe-profile-layout" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                    {renderPerfilSidebar()}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {currentView === 'home' && renderHome()}
                        {currentView === 'compras' && renderCompras()}
                        {currentView === 'perfil' && renderDatosPersonales()}
                        {currentView === 'direcciones' && renderDirecciones()}
                        {currentView === 'tarjetas' && renderTarjetas()}
                        {currentView === 'reembolso' && renderReembolsos()}
                        {currentView === 'listas' && renderListas()}
                        {currentView === 'puntos' && renderPuntos()}
                        {currentView === 'sesiones' && renderSesiones()}
                        {currentView === 'configuracion' && renderConfiguracion()}
                    </div>
                </div>
            </div>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} />
            <CategoryDrawer isOpen={isCatOpen} onClose={() => setIsCatOpen(false)} categorias={categoriaProductos} />

            {/* Modal Editar Perfil */}
            {showEditProfile && (
                <>
                    <div onClick={() => setShowEditProfile(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', transition: 'all 0.3s' }}></div>
                    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'calc(100% - 1.5rem)', maxWidth: '400px', background: 'white', zIndex: 10000, boxShadow: '-5px 0 25px rgba(0,0,0,0.1)', padding: 'clamp(0.75rem, 3vw, 1.875rem)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004797" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                Editar datos personales
                            </h3>
                            <button onClick={() => setShowEditProfile(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>✕</button>
                        </div>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '25px', lineHeight: '1.5' }}>Usaremos estos datos en tus compras y en las comunicaciones que te enviemos.</p>
                        
                        <form onSubmit={submitProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Nombres</label>
                                <input type="text" value={profileForm.data.nombres} onChange={e => profileForm.setData('nombres', e.target.value)} style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', color: '#333' }} required />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Apellidos</label>
                                <input type="text" value={profileForm.data.apellidos} onChange={e => profileForm.setData('apellidos', e.target.value)} style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', color: '#333' }} required />
                            </div>
                            <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowEditProfile(false)} style={{ padding: '12px 24px', background: 'white', border: 'none', color: '#333', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" disabled={profileForm.processing} style={{ padding: '12px 30px', background: '#004797', border: 'none', borderRadius: '24px', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0, 71, 151, 0.2)' }}>{profileForm.processing ? 'Guardando...' : 'Guardar'}</button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {/* Modal Editar Celular */}
            {showEditPhone && (
                <>
                    <div onClick={() => setShowEditPhone(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', transition: 'all 0.3s' }}></div>
                    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'calc(100% - 1.5rem)', maxWidth: '400px', background: 'white', zIndex: 10000, boxShadow: '-5px 0 25px rgba(0,0,0,0.1)', padding: 'clamp(0.75rem, 3vw, 1.875rem)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                Editar celular
                            </h3>
                            <button onClick={() => setShowEditPhone(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>✕</button>
                        </div>
                        
                        {phoneOtpStep === 'phone' ? (
                            <form onSubmit={submitPhoneRequest} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                                <p style={{ fontSize: '13px', color: '#333', marginBottom: '10px', lineHeight: '1.5' }}>
                                    Necesitamos validar tu identidad. Al continuar, <strong>enviaremos un código verificador al correo {user.email.substring(0, 2)}********@{user.email.split('@')[1]}.</strong>
                                </p>
                                
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Celular</label>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid #cbd5e1' }}>
                                        <span style={{ padding: '10px 10px 10px 0', fontSize: '15px', color: '#333' }}>+51</span>
                                        <input type="text" value={phoneForm.data.telefono} onChange={e => phoneForm.setData('telefono', e.target.value)} style={{ width: '100%', padding: '10px 0', border: 'none', outline: 'none', fontSize: '15px', color: '#333' }} placeholder="Ingresa un celular" required />
                                    </div>
                                    {phoneForm.errors.telefono && <div style={{ color: '#e11d48', fontSize: '12px', marginTop: '5px' }}>{phoneForm.errors.telefono}</div>}
                                </div>
                                
                                <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowEditPhone(false)} style={{ padding: '12px 24px', background: 'white', border: 'none', color: '#333', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
                                    <button type="submit" disabled={phoneForm.processing} style={{ padding: '12px 30px', background: '#334155', border: 'none', borderRadius: '24px', color: 'white', fontWeight: '600', cursor: 'pointer' }}>{phoneForm.processing ? 'Enviando...' : 'Continuar'}</button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={submitPhoneVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                                <p style={{ fontSize: '13px', color: '#333', marginBottom: '10px', lineHeight: '1.5' }}>
                                    Ingresa el código de 6 dígitos que enviamos a tu correo.
                                </p>
                                
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Código de verificación</label>
                                    <input type="text" maxLength="6" value={phoneForm.data.codigo} onChange={e => phoneForm.setData('codigo', e.target.value.replace(/\D/g, ''))} style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '24px', letterSpacing: '10px', textAlign: 'center', color: '#333' }} placeholder="000000" required />
                                    {phoneForm.errors.codigo && <div style={{ color: '#e11d48', fontSize: '12px', marginTop: '5px' }}>{phoneForm.errors.codigo}</div>}
                                </div>
                                
                                <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setPhoneOtpStep('phone')} style={{ padding: '12px 24px', background: 'white', border: 'none', color: '#333', fontWeight: '600', cursor: 'pointer' }}>Volver</button>
                                    <button type="submit" disabled={phoneForm.processing} style={{ padding: '12px 30px', background: '#004797', border: 'none', borderRadius: '24px', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0, 71, 151, 0.2)' }}>{phoneForm.processing ? 'Validando...' : 'Verificar'}</button>
                                </div>
                            </form>
                        )}
                    </div>
                </>
            )}

            {/* Modal Agregar Dirección */}
            {showAddAddress && (
                <>
                    <div onClick={() => setShowAddAddress(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', transition: 'all 0.3s' }}></div>
                    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'calc(100% - 1.5rem)', maxWidth: '400px', background: 'white', zIndex: 10000, boxShadow: '-5px 0 25px rgba(0,0,0,0.1)', padding: 'clamp(0.75rem, 3vw, 1.875rem)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004797" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                Agregar dirección
                            </h3>
                            <button onClick={() => setShowAddAddress(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>✕</button>
                        </div>
                        
                        <form onSubmit={submitAddress} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Departamento</label>
                                <select value={addressForm.data.departamento} onChange={handleDepChange} style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', color: '#333', backgroundColor: 'transparent' }} required>
                                    <option value="" disabled>Selecciona una opción</option>
                                    {departamentos.map(d => <option key={d.departamento} value={d.nombre}>{d.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Provincia</label>
                                <select value={addressForm.data.provincia} onChange={handleProvChange} disabled={!depCode} style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', color: '#333', backgroundColor: 'transparent' }} required>
                                    <option value="" disabled>Selecciona una opción</option>
                                    {provincias.map(p => <option key={p.provincia} value={p.nombre}>{p.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Distrito</label>
                                <select value={addressForm.data.distrito} onChange={e => addressForm.setData('distrito', e.target.value)} disabled={!provCode} style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', color: '#333', backgroundColor: 'transparent' }} required>
                                    <option value="" disabled>Selecciona una opción</option>
                                    {distritos.map(d => <option key={d.distrito} value={d.nombre}>{d.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Dirección exacta</label>
                                <input type="text" value={addressForm.data.direccion} onChange={e => addressForm.setData('direccion', e.target.value)} placeholder="Ingresa calle y número / Mz / Lote" style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', color: '#333' }} required />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Referencia (Opcional)</label>
                                <input type="text" value={addressForm.data.referencia} onChange={e => addressForm.setData('referencia', e.target.value)} placeholder="Ej: Frente al parque" style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', color: '#333' }} />
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={addressForm.data.principal} onChange={e => addressForm.setData('principal', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#004797' }} />
                                <span style={{ fontSize: '14px', color: '#333' }}>Guardar como dirección principal.</span>
                            </label>

                            <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowAddAddress(false)} style={{ padding: '12px 24px', background: 'white', border: 'none', color: '#333', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" disabled={addressForm.processing} style={{ padding: '12px 30px', background: '#004797', border: 'none', borderRadius: '24px', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0, 71, 151, 0.2)' }}>{addressForm.processing ? 'Guardando...' : 'Continuar'}</button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {/* Modal Editar Contraseña */}
            {showEditPassword && (
                <>
                    <div onClick={() => setShowEditPassword(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', transition: 'all 0.3s' }}></div>
                    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'calc(100% - 1.5rem)', maxWidth: '400px', background: 'white', zIndex: 10000, boxShadow: '-5px 0 25px rgba(0,0,0,0.1)', padding: 'clamp(0.75rem, 3vw, 1.875rem)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004797" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                {!usuario?.has_set_password ? 'Establecer Contraseña' : 'Cambiar Contraseña'}
                            </h3>
                            <button onClick={() => setShowEditPassword(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>✕</button>
                        </div>
                        
                        <form onSubmit={submitPassword} style={{ display: 'flex', flexDirection: 'column', gap: '25px', flex: 1 }}>
                            {!usuario?.has_set_password ? null : (
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Contraseña actual</label>
                                    <input type="password" value={passwordForm.data.current_password} onChange={e => passwordForm.setData('current_password', e.target.value)} style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', color: '#333' }} required />
                                </div>
                            )}
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Nueva contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showPassword ? "text" : "password"} value={passwordForm.data.password} onChange={e => passwordForm.setData('password', e.target.value)} style={{ width: '100%', padding: '10px 40px 10px 0', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none', fontSize: '15px', color: '#333' }} required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                        {showPassword ? '👁' : '👁‍🗨'}
                                    </button>
                                </div>
                                
                                {/* Visual Password Check */}
                                <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ color: passwordForm.data.password.length >= 8 ? '#10b981' : '#94a3b8' }}>
                                        {passwordForm.data.password.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
                                    </span>
                                    <span style={{ color: /[A-Z]/.test(passwordForm.data.password) ? '#10b981' : '#94a3b8' }}>
                                        {/[A-Z]/.test(passwordForm.data.password) ? '✓' : '○'} Al menos una mayúscula
                                    </span>
                                    <span style={{ color: /[a-z]/.test(passwordForm.data.password) ? '#10b981' : '#94a3b8' }}>
                                        {/[a-z]/.test(passwordForm.data.password) ? '✓' : '○'} Al menos una minúscula
                                    </span>
                                    <span style={{ color: /[0-9]/.test(passwordForm.data.password) ? '#10b981' : '#94a3b8' }}>
                                        {/[0-9]/.test(passwordForm.data.password) ? '✓' : '○'} Al menos un número
                                    </span>
                                    <span style={{ color: /[@$!%*#?&]/.test(passwordForm.data.password) ? '#10b981' : '#94a3b8' }}>
                                        {/[@$!%*#?&]/.test(passwordForm.data.password) ? '✓' : '○'} Al menos un carácter especial (@$!%*#?&)
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Confirmar nueva contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        value={passwordForm.data.password_confirmation} 
                                        onChange={e => passwordForm.setData('password_confirmation', e.target.value)} 
                                        style={{ 
                                            width: '100%', 
                                            padding: '10px 40px 10px 0', 
                                            border: 'none', 
                                            borderBottom: passwordForm.data.password_confirmation === '' 
                                                ? '1px solid #cbd5e1' 
                                                : passwordForm.data.password === passwordForm.data.password_confirmation 
                                                    ? '2px solid #10b981' // Verde si coincide
                                                    : '2px solid #ef4444', // Rojo si no coincide
                                            outline: 'none', 
                                            fontSize: '15px', 
                                            color: passwordForm.data.password_confirmation !== '' && passwordForm.data.password !== passwordForm.data.password_confirmation ? '#ef4444' : '#333'
                                        }} 
                                        required 
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                        {showConfirmPassword ? '👁' : '👁‍🗨'}
                                    </button>
                                </div>
                                {passwordForm.data.password_confirmation !== '' && passwordForm.data.password === passwordForm.data.password_confirmation && (
                                    <div style={{ fontSize: '11px', color: '#10b981', marginTop: '5px' }}>✓ Las contraseñas coinciden</div>
                                )}
                                {passwordForm.data.password_confirmation !== '' && passwordForm.data.password !== passwordForm.data.password_confirmation && (
                                    <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '5px' }}>✕ Las contraseñas no coinciden</div>
                                )}
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowEditPassword(false)} style={{ padding: '12px 24px', background: 'white', border: 'none', color: '#333', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" disabled={passwordForm.processing} style={{ padding: '12px 30px', background: '#004797', border: 'none', borderRadius: '24px', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0, 71, 151, 0.2)' }}>{passwordForm.processing ? 'Actualizando...' : 'Actualizar'}</button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {/* Modal Agregar Tarjeta */}
            {showAddTarjeta && (
                <>
                    <div onClick={() => setShowAddTarjeta(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}></div>
                    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'calc(100% - 1.5rem)', maxWidth: '400px', background: 'white', zIndex: 10000, boxShadow: '-5px 0 25px rgba(0,0,0,0.1)', padding: 'clamp(0.75rem, 3vw, 1.875rem)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>Agregar tarjeta</h3>
                            <button onClick={() => setShowAddTarjeta(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <form onSubmit={submitTarjeta} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Número de tarjeta</label>
                                <input type="text" maxLength="16" value={tarjetaForm.data.numero_tarjeta} onChange={e => tarjetaForm.setData('numero_tarjeta', e.target.value)} style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none' }} required />
                            </div>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Vencimiento (MM/AA)</label>
                                    <input type="text" value={tarjetaForm.data.fecha_vencimiento} onChange={e => tarjetaForm.setData('fecha_vencimiento', e.target.value)} style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none' }} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>CVV</label>
                                    <input type="text" maxLength="4" value={tarjetaForm.data.cvv} onChange={e => tarjetaForm.setData('cvv', e.target.value)} style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none' }} required />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Nombre del titular</label>
                                <input type="text" value={tarjetaForm.data.nombre_titular} onChange={e => tarjetaForm.setData('nombre_titular', e.target.value)} style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none' }} required />
                            </div>
                            <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                                <button type="submit" disabled={tarjetaForm.processing} style={{ padding: '12px 30px', background: '#004797', border: 'none', borderRadius: '24px', color: 'white', fontWeight: '600' }}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {/* Modal Agregar Lista */}
            {showAddLista && (
                <>
                    <div onClick={() => setShowAddLista(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}></div>
                    <div className="store-modal-panel" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 1.5rem)', maxWidth: '400px', background: 'white', zIndex: 10000, borderRadius: '12px', padding: 'clamp(0.75rem, 3vw, 1.875rem)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>Nueva Lista</h3>
                            <button onClick={() => setShowAddLista(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <form onSubmit={submitLista} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '5px' }}>Nombre de la lista</label>
                                <input type="text" value={listaForm.data.nombre} onChange={e => listaForm.setData('nombre', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }} required placeholder="Ej: Favoritos, Para Navidad" />
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={listaForm.data.es_publica} onChange={e => listaForm.setData('es_publica', e.target.checked)} style={{ accentColor: '#004797' }} />
                                <span style={{ fontSize: '14px', color: '#333' }}>Hacer lista pública</span>
                            </label>
                            <button type="submit" disabled={listaForm.processing} style={{ padding: '12px', background: '#004797', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600', width: '100%' }}>Crear lista</button>
                        </form>
                    </div>
                </>
            )}

            {/* Modal Eliminar Cuenta */}
            {showDeleteAccount && (
                <>
                    <div onClick={() => setShowDeleteAccount(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}></div>
                    <div className="store-modal-panel" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 1.5rem)', maxWidth: '400px', background: 'white', zIndex: 10000, borderRadius: '12px', padding: 'clamp(0.75rem, 3vw, 1.875rem)' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#e11d48', marginBottom: '15px' }}>Eliminar Cuenta</h3>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Por favor ingresa tu contraseña para confirmar que deseas eliminar tu cuenta permanentemente.</p>
                        <form onSubmit={submitDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <input type="password" value={deleteAccountForm.data.password} onChange={e => deleteAccountForm.setData('password', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }} required placeholder="Tu contraseña" />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => setShowDeleteAccount(false)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '8px', color: '#333', fontWeight: '600' }}>Cancelar</button>
                                <button type="submit" disabled={deleteAccountForm.processing} style={{ flex: 1, padding: '10px', background: '#e11d48', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600' }}>Eliminar</button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            <Footer />
        </div>
    );
}
