import { useState, useEffect } from 'react';
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
import '../../../css/home/profile.css';
import { useConfirm } from '@/Contexts/ConfirmContext';
import RmaDialog from '../../Components/Home/RmaDialog';
import useStoreDialog from '../../Hooks/useStoreDialog';
import { Star } from 'lucide-react';
import { AccountNavigation, AccountOrders, AccountAddresses, AccountAddressForm } from '../../Components/Home/AccountSections';
import '../../../css/home/account.css';



export default function Profile({ usuario = {}, pedidos = [], direcciones = [], tarjetas = [], datosReembolso = null, listas = [], sesiones = [], pointsHistory = [], activeTabParam = 'home', categoriaProductos = [], deliveryDistricts = [] }) {
    const confirmDialog = useConfirm();

    const { auth, flash, errors: pageErrors, cart, session_id } = usePage().props;
    const user = { ...auth?.user, ...usuario };
    const [currentView, setCurrentView] = useState(activeTabParam === 'ordenes' ? 'compras' : activeTabParam);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCatOpen, setIsCatOpen] = useState(false);

    
    // Modals state
    const [rmaOrder, setRmaOrder] = useState(null);
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
        tipo_documento: user.tipo_documento || 'DNI',
        fecha_nacimiento: user.fecha_nacimiento || '',
        dni: user.dni || '',
        telefono: user.telefono || '',
    });

    const addressForm = useForm({
        direccion: '', referencia: '', departamento: 'Lima', provincia: 'Lima', distrito: '', codigo_postal: '', principal: false
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

    const submitProfile = (e) => {
        e.preventDefault();
        profileForm.post('/perfil/update', { preserveScroll: true, onSuccess: () => setShowEditProfile(false) });
    };

    const submitAddress = (e) => {
        e.preventDefault();
        addressForm.post('/perfil/direccion', { 
            preserveScroll: true, 
            onSuccess: () => { 
                setShowAddAddress(false); 
                addressForm.reset(); 
                addressForm.setData('departamento', 'Lima');
            } 
        });
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

    const formatCurrency = (val) => 'S/ ' + new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2 }).format(val);
    
    const formatDevice = (ua) => {
        if (!ua) return 'Dispositivo desconocido';
        let browser = 'Navegador Web';
        if (ua.includes('Edg/')) browser = 'Microsoft Edge';
        else if (ua.includes('Chrome/')) browser = 'Google Chrome';
        else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
        else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
        else if (ua.includes('Opera/') || ua.includes('OPR/')) browser = 'Opera';

        let os = 'Dispositivo';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'Mac';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone')) os = 'iPhone';
        else if (ua.includes('iPad')) os = 'iPad';
        else if (ua.includes('Linux')) os = 'Linux';

        return `${browser} en ${os}`;
    };

    const changeView = (view) => {
        setCurrentView(view);
        router.get('/perfil', { tab: view }, { preserveState: true, replace: true, preserveScroll: true });
    };
    const renderHome = () => (
        <div>
            <div className="efe-profile-header">
                <h2 className="efe-profile-heading">Resumen de mi cuenta</h2>
            </div>
            
            <div className="efe-overview-grid">
                <div className="efe-overview-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(0, 71, 151, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#004797' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                        <div>
                            <div className="efe-profile-label" style={{ margin: 0 }}>Información Personal</div>
                        </div>
                    </div>
                    <div style={{ fontSize: '18px', color: '#1E293B', fontWeight: '700', marginBottom: '4px' }}>{user.nombres} {user.apellidos}</div>
                    <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>{user.email}</div>
                    <button onClick={() => changeView('perfil')} className="efe-btn-outline" style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>
                        Editar datos
                    </button>
                </div>

                <div className="efe-overview-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(0, 71, 151, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#004797' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        </div>
                        <div>
                            <div className="efe-profile-label" style={{ margin: 0 }}>Dirección Principal</div>
                        </div>
                    </div>
                    {direcciones.find(d => d.principal) ? (
                        <>
                            <div style={{ fontSize: '16px', color: '#1E293B', fontWeight: '600', marginBottom: '4px' }}>{direcciones.find(d => d.principal).direccion}</div>
                            <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>{direcciones.find(d => d.principal).distrito}, {direcciones.find(d => d.principal).provincia}</div>
                        </>
                    ) : (
                        <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '20px', flex: 1, display: 'flex', alignItems: 'center' }}>No tienes dirección principal configurada.</div>
                    )}
                    <button onClick={() => changeView('direcciones')} className="efe-btn-outline" style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>
                        Gestionar direcciones
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Últimas compras 
                        <span style={{ color: '#94A3B8', fontWeight: '500', fontSize: '14px' }}>({Math.min(pedidos.length, 3)})</span>
                    </h3>
                    {pedidos.length > 0 && (
                        <button onClick={() => changeView('compras')} className="efe-btn-outline" style={{ padding: '6px 16px', fontSize: '13px' }}>
                            Ver todas
                        </button>
                    )}
                </div>
                {pedidos.length === 0 ? (
                    <div className="efe-empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                        <span style={{ fontSize: '15px', fontWeight: '500' }}>Aún no tienes compras realizadas.</span>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
                        {pedidos.slice(0, 3).map(pedido => {
                            const primerItem = pedido.items && pedido.items.length > 0 ? pedido.items[0] : null;
                            const imagenUrl = primerItem?.variante?.producto?.imagenes?.[0]?.url || primerItem?.variante?.producto?.imagenes?.[0]?.ruta || '/img/placeholder.jpg';
                            const nombreProd = primerItem?.variante?.producto?.nombre || 'Producto';
                            
                            return (
                                <div key={pedido.id} onClick={() => changeView('compras')} className="efe-profile-card" style={{ padding: '18px', display: 'flex', gap: '16px', cursor: 'pointer', marginBottom: 0 }}>
                                    <div style={{ width: '70px', height: '70px', flexShrink: 0, background: '#F8FAFC', borderRadius: '10px', padding: '6px', border: '1px solid #F1F5F9' }}>
                                        <img src={imagenUrl} alt={nombreProd} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                                        <div style={{ fontSize: '14px', color: '#1E293B', fontWeight: '600', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>{nombreProd}</div>
                                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{new Date(pedido.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric'})}</div>
                                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
                                            <span className={pedido.estado === 'Completado' ? 'efe-badge-success' : 'efe-badge-info'} style={{ padding: '3px 8px', fontSize: '11px' }}>
                                                {pedido.estado === 'Completado' ? 'Entregado' : pedido.estado}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', color: '#CBD5E1' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    const renderCompras = () => <AccountOrders orders={pedidos} onReturn={setRmaOrder} />;
    const renderPerfilSidebar = () => <AccountNavigation current={currentView} onChange={changeView} />;

    const renderDatosPersonales = () => (
        <div>
            <div className="efe-profile-header">
                <h2 className="efe-profile-heading">Datos personales</h2>
            </div>
            <div className="efe-profile-card">
                {/* Row: Nombre */}
                <div className="efe-profile-row">
                    <div>
                        <div className="efe-profile-label">Nombre y apellidos</div>
                        <div className="efe-profile-value">{user.nombres} {user.apellidos}</div>
                    </div>
                    <button onClick={() => setShowEditProfile(true)} className="efe-btn-outline">Editar</button>
                </div>
                {/* Row: Documento */}
                <div className="efe-profile-row">
                    <div>
                        <div className="efe-profile-label">Tipo de documento</div>
                        <div className="efe-profile-value">
                            {user.dni ? `${user.tipo_documento || 'DNI'} ${user.dni}` : <span className="efe-profile-value-empty">No registrado</span>}
                        </div>
                    </div>
                    {user.dni ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="efe-badge-success">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Verificado
                            </span>
                            <button onClick={() => setShowEditProfile(true)} className="efe-btn-outline" style={{ padding: '6px 14px', fontSize: '13px' }}>Editar</button>
                        </div>
                    ) : (
                        <button onClick={() => setShowEditProfile(true)} className="efe-btn-outline">Editar</button>
                    )}
                </div>
                {/* Row: Celular */}
                <div className="efe-profile-row">
                    <div>
                        <div className="efe-profile-label">Celular</div>
                        <div className="efe-profile-value">
                            {user.telefono ? `+51 ${user.telefono}` : <span className="efe-profile-value-empty">No registrado</span>}
                        </div>
                    </div>
                    <button onClick={() => setShowEditPhone(true)} className="efe-btn-outline">Editar</button>
                </div>
                {/* Row: Email */}
                <div className="efe-profile-row">
                    <div>
                        <div className="efe-profile-label">Correo electrónico</div>
                        <div className="efe-profile-value">
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
                    <span className="efe-badge-success">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Verificado
                    </span>
                </div>
            </div>
        </div>
    );

    const renderDirecciones = () => <AccountAddresses addresses={direcciones} confirmDelete={confirmDialog} onAdd={() => { addressForm.clearErrors(); setShowAddAddress(true); }} />;

    const renderTarjetas = () => (
        <div>
            <div className="efe-profile-header">
                <h2 className="efe-profile-heading">Tarjetas guardadas</h2><p id="cards-availability">El guardado de tarjetas aún no está disponible. Puedes pagar con tarjeta directamente en la pasarela segura.</p>
            </div>
            {tarjetas.map(t => (
                <div key={t.id} className="efe-profile-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '56px', height: '38px', background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', color: 'white', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>{t.marca || 'VISA'}</div>
                        <div>
                            <div style={{ fontSize: '15px', color: '#1E293B', fontWeight: '600', letterSpacing: '1px' }}>•••• •••• •••• {t.ultimos_digitos}</div>
                            {t.principal && <span className="efe-badge-info" style={{ padding: '2px 8px', fontSize: '11px', marginTop: '4px' }}>Principal</span>}
                        </div>
                    </div>
                    <button onClick={async () => { if(await confirmDialog('¿Eliminar tarjeta?')) router.delete(`/perfil/tarjetas/${t.id}`, { preserveScroll: true }) }} className="efe-profile-sidebar-btn efe-profile-sidebar-btn-danger" style={{ padding: '8px 16px', fontSize: '12px', border: '1px solid #FEE2E2', borderRadius: '20px', width: 'auto' }}>
                        Eliminar
                    </button>
                </div>
            ))}
            {tarjetas.length === 0 && (
                <div className="efe-empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                    <span style={{ fontSize: '15px', fontWeight: '500' }}>No tienes tarjetas guardadas.</span>
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button disabled aria-describedby="cards-availability" className="efe-btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Agregar tarjeta
                </button>
            </div>
        </div>
    );

    const renderReembolsos = () => (
        <div>
            <div className="efe-profile-header">
                <h2 className="efe-profile-heading">Datos de Reembolso / CCI</h2>
            </div>
            <div className="efe-profile-card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px 20px', background: '#F0F9FF', borderRadius: '12px', marginBottom: '28px', border: '1px solid #BAE6FD' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    <p style={{ fontSize: '14px', color: '#0369A1', margin: 0, lineHeight: '1.6' }}>Completa los datos de tu cuenta bancaria para recibir reembolsos rápidos y seguros en caso de cancelaciones o devoluciones.</p>
                </div>
                <form onSubmit={submitReembolso} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '28px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B', marginBottom: '18px' }}>Información del titular</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '18px' }}>
                            <div className="efe-form-group">
                                <label className="efe-form-label" htmlFor="profile-field-1">Tipo Documento</label>
                                <select id="profile-field-1" value={reembolsoForm.data.tipo_documento} onChange={e => reembolsoForm.setData('tipo_documento', e.target.value)} className="efe-select">
                                    <option value="DNI">DNI</option>
                                    <option value="RUC">RUC</option>
                                    <option value="CE">Carnet de Extranjería</option>
                                </select>
                            </div>
                            <div className="efe-form-group">
                                <label className="efe-form-label" htmlFor="profile-field-2">Número Documento</label>
                                <input id="profile-field-2" type="text" value={reembolsoForm.data.numero_documento} onChange={e => reembolsoForm.setData('numero_documento', e.target.value)} className="efe-input" required />
                            </div>
                            <div className="efe-form-group">
                                <label className="efe-form-label" htmlFor="profile-field-3">Nombres Titular</label>
                                <input id="profile-field-3" type="text" value={reembolsoForm.data.nombres_titular} onChange={e => reembolsoForm.setData('nombres_titular', e.target.value)} className="efe-input" required />
                            </div>
                            <div className="efe-form-group">
                                <label className="efe-form-label" htmlFor="profile-field-4">Apellidos Titular</label>
                                <input id="profile-field-4" type="text" value={reembolsoForm.data.apellidos_titular} onChange={e => reembolsoForm.setData('apellidos_titular', e.target.value)} className="efe-input" required />
                            </div>
                            <div className="efe-form-group">
                                <label className="efe-form-label" htmlFor="profile-field-5">Celular Titular</label>
                                <input id="profile-field-5" type="text" value={reembolsoForm.data.telefono_titular} onChange={e => reembolsoForm.setData('telefono_titular', e.target.value)} className="efe-input" required />
                            </div>
                            <div className="efe-form-group">
                                <label className="efe-form-label" htmlFor="profile-field-6">Correo Titular</label>
                                <input id="profile-field-6" type="email" value={reembolsoForm.data.correo_titular} onChange={e => reembolsoForm.setData('correo_titular', e.target.value)} className="efe-input" required />
                            </div>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B', marginBottom: '18px' }}>Datos bancarios</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '18px' }}>
                            <div className="efe-form-group">
                                <label className="efe-form-label" htmlFor="profile-field-7">Banco</label>
                                <select id="profile-field-7" value={reembolsoForm.data.banco} onChange={e => reembolsoForm.setData('banco', e.target.value)} className="efe-select" required>
                                    <option value="">Seleccione banco</option>
                                    <option value="BCP">BCP</option>
                                    <option value="BBVA">BBVA</option>
                                    <option value="Interbank">Interbank</option>
                                    <option value="Scotiabank">Scotiabank</option>
                                    <option value="Banbif">Banbif</option>
                                    <option value="Banco de la Nación">Banco de la Nación</option>
                                </select>
                            </div>
                            <div className="efe-form-group">
                                <label className="efe-form-label" htmlFor="profile-field-8">Tipo de Cuenta</label>
                                <select id="profile-field-8" value={reembolsoForm.data.tipo_cuenta} onChange={e => reembolsoForm.setData('tipo_cuenta', e.target.value)} className="efe-select" required>
                                    <option value="">Seleccione tipo</option>
                                    <option value="Ahorros">Ahorros</option>
                                    <option value="Corriente">Corriente</option>
                                </select>
                            </div>
                            <div className="efe-form-group">
                                <label className="efe-form-label" htmlFor="profile-field-9">Número de Cuenta</label>
                                <input id="profile-field-9" type="text" value={reembolsoForm.data.numero_cuenta} onChange={e => reembolsoForm.setData('numero_cuenta', e.target.value)} className="efe-input" required />
                            </div>
                            <div className="efe-form-group">
                                <label className="efe-form-label" htmlFor="profile-field-10">CCI (20 dígitos)</label>
                                <input id="profile-field-10" type="text" value={reembolsoForm.data.cci} onChange={e => reembolsoForm.setData('cci', e.target.value)} className="efe-input" required />
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                        <button type="submit" disabled={reembolsoForm.processing} className="efe-btn-primary">
                            {reembolsoForm.processing ? 'Guardando...' : 'Guardar datos bancarios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

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
                <div>
                    <div className="efe-profile-card" style={{ padding: '24px 32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                            <button onClick={() => {setSelectedList(null); setSelectedItems({});}} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', color: '#1E293B', fontWeight: '700', padding: 0 }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                {lista.nombre}
                            </button>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="efe-btn-outline" style={{ padding: '6px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                                    Compartir
                                </button>
                            </div>
                        </div>
                        
                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" checked={allSelected} onChange={handleSelectAll} style={{ width: '18px', height: '18px', accentColor: '#004797', cursor: 'pointer' }} />
                            <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '500' }}>Seleccionar todos ({items.length} productos)</span>
                        </div>
                        
                        <div>
                            {items.map(item => {
                                const prod = item.producto;
                                if (!prod) return null;
                                const isChecked = !!selectedItems[item.id];
                                return (
                                    <div key={item.id} style={{ display: 'flex', gap: '20px', padding: '18px 0', borderTop: '1px solid #F1F5F9', alignItems: 'center' }}>
                                        <div>
                                            <input type="checkbox" checked={isChecked} onChange={(e) => handleSelectItem(item.id, e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#004797', cursor: 'pointer' }} />
                                        </div>
                                        <div style={{ width: '72px', height: '72px', background: '#F8FAFC', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, border: '1px solid #F1F5F9', padding: '4px' }}>
                                            <img src={prod.imagenes?.[0]?.url || prod.imagenes?.[0]?.ruta || '/img/placeholder.jpg'} alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '2px' }}>{prod.marca || 'Marca'}</div>
                                            <div style={{ fontSize: '14px', color: '#1E293B', fontWeight: '600', marginBottom: '6px', lineHeight: '1.4' }}>{prod.nombre}</div>
                                            
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                                <span style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>S/ {prod.precio_actual}</span>
                                                {prod.precio_anterior > prod.precio_actual && (
                                                    <>
                                                        <span className="efe-badge-info" style={{ padding: '2px 6px', fontSize: '11px' }}>-{prod.descuento}%</span>
                                                        <span style={{ fontSize: '12px', color: '#94A3B8', textDecoration: 'line-through' }}>S/ {prod.precio_anterior}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', gap: '12px', width: '120px' }}>
                                            <button onClick={async () => {if(await confirmDialog("¿Eliminar este producto de la lista?")) router.delete(`/perfil/listas/items/${item.id}`, { preserveScroll: true })}} className="efe-profile-sidebar-btn efe-profile-sidebar-btn-danger" style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {items.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>Esta lista está vacía.</div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div>
                <div className="efe-profile-header">
                    <h2 className="efe-profile-heading">Mis listas</h2>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '20px' }}>
                    {listas.map(lista => (
                        <div 
                            key={lista.id} 
                            onClick={() => setSelectedList(lista)} 
                            className="efe-profile-card"
                            style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', marginBottom: 0 }}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr', gap: '6px', height: '140px' }}>
                                <div style={{ gridRow: 'span 2', background: '#F8FAFC', borderRadius: '10px', overflow: 'hidden', border: '1px solid #F1F5F9' }}>
                                    {lista.items?.[0] && <img src={lista.items[0].producto?.imagenes?.[0]?.url || lista.items[0].producto?.imagenes?.[0]?.ruta} style={{width:'100%', height:'100%', objectFit:'contain'}} />}
                                </div>
                                <div style={{ background: '#F8FAFC', borderRadius: '10px', overflow: 'hidden', border: '1px solid #F1F5F9' }}>
                                    {lista.items?.[1] && <img src={lista.items[1].producto?.imagenes?.[0]?.url || lista.items[1].producto?.imagenes?.[0]?.ruta} style={{width:'100%', height:'100%', objectFit:'contain'}} />}
                                </div>
                                <div style={{ background: '#F8FAFC', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '15px', fontWeight: '700', border: '1px solid #F1F5F9' }}>
                                    +{(lista.items?.length || 0) > 2 ? lista.items.length - 2 : 0}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                <div style={{ fontSize: '16px', color: '#1E293B', fontWeight: '700' }}>{lista.nombre}</div>
                                <button onClick={async (e) => { e.stopPropagation(); if(await confirmDialog("¿Eliminar lista?")) router.delete(`/perfil/listas/${lista.id}`, { preserveScroll: true })}} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748B' }}>{(lista.items?.length || 0)} productos • <span className={lista.es_publica ? "efe-badge-info" : "efe-badge-success"} style={{ padding: '2px 8px', fontSize: '10px' }}>{lista.es_publica ? 'Pública' : 'Privada'}</span></div>
                        </div>
                    ))}
                    
                    <div onClick={() => setShowAddLista(true)} style={{ background: 'rgba(0, 71, 151, 0.03)', border: '2px dashed #CBD5E1', borderRadius: '16px', padding: '24px', minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#004797'; e.currentTarget.style.background = 'rgba(0, 71, 151, 0.05)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = 'rgba(0, 71, 151, 0.03)'; }}>
                        <div style={{ width: '44px', height: '44px', background: '#004797', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}>+</div>
                        <div style={{ fontSize: '14px', color: '#004797', fontWeight: '700' }}>Crear nueva lista</div>
                    </div>
                </div>
            </div>
        );
    };
    const renderPuntos = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ 
                background: 'linear-gradient(135deg, #004797 0%, #002d62 100%)', 
                borderRadius: '16px', 
                padding: '28px 32px', 
                color: 'white', 
                boxShadow: '0 10px 25px rgba(0, 71, 151, 0.15)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px'
            }}>
                <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginBottom: '12px', backdropFilter: 'blur(4px)' }}>
                        <Star fill="#FCD34D" stroke="#FCD34D" size={14} /> Club de Beneficios
                    </div>
                    <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>
                        Novapuntos Disponibles
                    </h2>
                    <p style={{ margin: 0, opacity: 0.85, fontSize: '14px' }}>Usa tus puntos acumulados para obtener descuentos directos en tus compras.</p>
                    <div style={{ fontSize: '44px', fontWeight: '900', marginTop: '16px', letterSpacing: '-0.02em', color: '#FCD34D' }}>
                        {usuario?.loyalty_points || 0} <span style={{ fontSize: '18px', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>pts</span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '13px', fontWeight: '500' }}>
                        Equivale a <strong style={{ color: '#fff' }}>S/ {((usuario?.loyalty_points || 0) / 10).toFixed(2)}</strong> de descuento
                    </p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px 24px', borderRadius: '14px', textAlign: 'center', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', minWidth: '180px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', opacity: 0.9, marginBottom: '6px' }}>Regla de acumulación</div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#FCD34D' }}>1 Punto</div>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>por cada S/ 10 de compra</div>
                </div>
            </div>

            <div className="efe-profile-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>Historial de Movimientos</h3>
                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748B' }}>Registro detallado de puntos ganados y canjeados</p>
                    </div>
                </div>
                
                {pointsHistory && pointsHistory.length > 0 ? (
                    <div className="store-table-scroll" tabIndex={0} role="region" aria-label="Historial de puntos">
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <th style={{ padding: '14px 24px', fontWeight: '600' }}>Fecha</th>
                                    <th style={{ padding: '14px 24px', fontWeight: '600' }}>Descripción</th>
                                    <th style={{ padding: '14px 24px', fontWeight: '600' }}>Estado</th>
                                    <th style={{ padding: '14px 24px', fontWeight: '600', textAlign: 'right' }}>Puntos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pointsHistory.map((h) => (
                                    <tr key={h.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '16px 24px', color: '#475569', fontSize: '13px' }}>
                                            {new Date(h.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '16px 24px', color: '#1E293B', fontSize: '14px', fontWeight: '500' }}>
                                            {h.description}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span className={h.type === 'earned' ? 'efe-badge-success' : 'efe-badge-danger'} style={{ padding: '3px 10px', fontSize: '12px' }}>
                                                {h.type === 'earned' ? 'Ganados' : 'Canjeados'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '700', fontSize: '14px', color: h.type === 'earned' ? '#16A34A' : '#EF4444' }}>
                                            {h.type === 'earned' ? '+' : '-'}{h.points} pts
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="efe-empty-state">
                        <Star size={44} style={{ color: '#CBD5E1', marginBottom: '12px' }} />
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#475569' }}>No tienes historial de puntos aún</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94A3B8' }}>Tus puntos se registrarán automáticamente cuando realices compras.</p>
                    </div>
                )}
            </div>
        </div>
    );
    const renderSesiones = () => (
        <div>
            <div className="efe-profile-header">
                <h2 className="efe-profile-heading">Dispositivos vinculados</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px 20px', background: '#FFFBEB', borderRadius: '12px', marginBottom: '24px', border: '1px solid #FDE68A' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <p style={{ fontSize: '14px', color: '#92400E', margin: 0, lineHeight: '1.6' }}>Aquí verás los dispositivos donde has iniciado sesión. Si ves algo sospechoso, cierra la sesión inmediatamente para proteger tu cuenta.</p>
            </div>
            {sesiones.length === 0 && (
                <div className="efe-empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect></svg>
                    <span style={{ fontSize: '15px', fontWeight: '500' }}>No hay sesiones activas registradas.</span>
                </div>
            )}
            {sesiones.map(sesion => {
                const isCurrent = sesion.is_current;
                return (
                    <div key={sesion.id} className="efe-profile-card" style={{ padding: '20px 24px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: isCurrent ? '#BAE6FD' : '#E2E8F0' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '44px', height: '44px', background: isCurrent ? 'rgba(0, 71, 151, 0.08)' : '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isCurrent ? '#004797' : '#94A3B8' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: '#1E293B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {formatDevice(sesion.user_agent)}
                                    {isCurrent && <span className="efe-badge-info" style={{ padding: '2px 8px', fontSize: '11px' }}>Sesión actual</span>}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>IP: {sesion.ip_address || '127.0.0.1'}</span>
                                    <span>•</span>
                                    <span>Última actividad: {sesion.last_activity ? new Date(sesion.last_activity * 1000).toLocaleString('es-PE') : 'Reciente'}</span>
                                </div>
                            </div>
                        </div>
                        {!isCurrent && (
                            <button onClick={async () => { if(await confirmDialog('¿Cerrar sesión en este dispositivo?')) router.delete(`/perfil/sesiones/${sesion.id}`, { preserveScroll: true }) }} className="efe-profile-sidebar-btn efe-profile-sidebar-btn-danger" style={{ padding: '8px 16px', fontSize: '12px', border: '1px solid #FEE2E2', borderRadius: '20px', width: 'auto' }}>
                                Cerrar sesión
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderConfiguracion = () => (
        <div>
            <div className="efe-profile-header">
                <h2 className="efe-profile-heading">Configurar cuenta</h2>
            </div>
            
            <div className="efe-profile-card" style={{ marginBottom: '24px' }}>
                <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(0, 71, 151, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#004797' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '16px', color: '#1E293B', fontWeight: '600', marginBottom: '4px' }}>Contraseña de acceso</div>
                            <div style={{ fontSize: '13px', color: '#64748B' }}>Actualiza tu contraseña periódicamente para mantener tu cuenta segura.</div>
                        </div>
                    </div>
                    <button onClick={() => setShowEditPassword(true)} className="efe-btn-outline">
                        {!usuario?.has_set_password ? 'Establecer contraseña' : 'Cambiar contraseña'}
                    </button>
                </div>
            </div>

            <div className="efe-profile-card" style={{ borderColor: '#FECDD3', background: '#FFF1F2' }}>
                <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '16px', color: '#DC2626', fontWeight: '600', marginBottom: '4px' }}>Eliminar cuenta</div>
                            <div style={{ fontSize: '13px', color: '#9F1239' }}>Esta acción es permanente y eliminará todos tus datos, compras y listas guardadas.</div>
                        </div>
                    </div>
                    <button onClick={() => setShowDeleteAccount(true)} className="efe-profile-sidebar-btn efe-profile-sidebar-btn-danger" style={{ padding: '10px 20px', fontSize: '13px', border: '1px solid #FECDD3', background: 'white', borderRadius: '20px', width: 'auto' }}>
                        Eliminar mi cuenta
                    </button>
                </div>
            </div>
        </div>
    );

    const dialogEditProfile = useStoreDialog(showEditProfile, () => setShowEditProfile(false));
    const dialogEditPhone = useStoreDialog(showEditPhone, () => setShowEditPhone(false));
    const dialogAddAddress = useStoreDialog(showAddAddress, () => setShowAddAddress(false));
    const dialogEditPassword = useStoreDialog(showEditPassword, () => setShowEditPassword(false));
    const dialogAddTarjeta = useStoreDialog(showAddTarjeta, () => setShowAddTarjeta(false));
    const dialogAddLista = useStoreDialog(showAddLista, () => setShowAddLista(false));
    const dialogDeleteAccount = useStoreDialog(showDeleteAccount, () => setShowDeleteAccount(false));

    return (
        <div className="efe-home account-page" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
            
            <div className="efe-profile-page">
                <header className="account-hero"><span>MI CUENTA</span><h1>Hola, {user.nombres || 'bienvenido'}</h1><p>Tus compras, direcciones y datos, en un solo lugar.</p></header>
                <div className="efe-profile-container">
                    {renderPerfilSidebar()}
                    <div className="efe-profile-content">
                        <p><Link href="/perfil/comunicaciones">Preferencias de promociones</Link></p>
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

            <RmaDialog order={rmaOrder} onClose={() => setRmaOrder(null)} />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} />
            <CategoryDrawer isOpen={isCatOpen} onClose={() => setIsCatOpen(false)} categorias={categoriaProductos} />

            {/* Modal Editar Perfil */}
            {showEditProfile && (
                <>
                    <div onClick={() => setShowEditProfile(false)} className="efe-drawer-overlay"></div>
                    <div ref={dialogEditProfile} role="dialog" aria-modal="true" aria-label="Editar datos personales" tabIndex={-1} className="efe-drawer-content">
                        <div className="efe-drawer-header">
                            <h3 className="efe-drawer-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004797" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                Editar datos personales
                            </h3>
                            <button onClick={() => setShowEditProfile(false)} className="efe-drawer-close" aria-label="Cerrar ventana">✕</button>
                        </div>
                        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px', lineHeight: '1.5' }}>Usaremos estos datos en tus compras y en las comunicaciones que te enviemos.</p>
                        
                        <form onSubmit={submitProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                            <div className="efe-form-group">
                                <label className="efe-form-label" htmlFor="profile-field-11">Nombres</label>
                                <input id="profile-field-11" type="text" value={profileForm.data.nombres} onChange={e => profileForm.setData('nombres', e.target.value)} className="efe-input" required />
                            </div>
                            <div className="efe-form-group">
                                <label className="efe-form-label" htmlFor="profile-field-12">Apellidos</label>
                                <input id="profile-field-12" type="text" value={profileForm.data.apellidos} onChange={e => profileForm.setData('apellidos', e.target.value)} className="efe-input" required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))', gap: '12px' }}>
                                <div className="efe-form-group">
                                    <label className="efe-form-label" htmlFor="profile-field-13">Documento</label>
                                    <select id="profile-field-13" 
                                        value={profileForm.data.tipo_documento} 
                                        onChange={e => profileForm.setData('tipo_documento', e.target.value)} 
                                        className="efe-select"
                                    >
                                        <option value="DNI">DNI</option>
                                        <option value="CE">C.E.</option>
                                        <option value="Pasaporte">Pasaporte</option>
                                    </select>
                                </div>
                                <div className="efe-form-group">
                                    <label className="efe-form-label" htmlFor="profile-field-14">Número</label>
                                    <input id="profile-field-14" 
                                        type="text" 
                                        maxLength={profileForm.data.tipo_documento === 'DNI' ? 8 : 15}
                                        placeholder={profileForm.data.tipo_documento === 'DNI' ? '8 dígitos' : 'Número de doc.'}
                                        value={profileForm.data.dni} 
                                        onChange={e => profileForm.setData('dni', e.target.value.replace(/[^0-9a-zA-Z]/g, ''))} 
                                        className="efe-input" 
                                    />
                                    {profileForm.errors.dni && (
                                        <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{profileForm.errors.dni}</div>
                                    )}
                                </div>
                            </div>
                            <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowEditProfile(false)} className="efe-btn-secondary">Cancelar</button>
                                <button type="submit" disabled={profileForm.processing} className="efe-btn-primary">{profileForm.processing ? 'Guardando...' : 'Guardar cambios'}</button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {/* Modal Editar Celular */}
            {showEditPhone && (
                <>
                    <div onClick={() => setShowEditPhone(false)} className="efe-drawer-overlay"></div>
                    <div ref={dialogEditPhone} role="dialog" aria-modal="true" aria-label="Cambiar teléfono" tabIndex={-1} className="efe-drawer-content">
                        <div className="efe-drawer-header">
                            <h3 className="efe-drawer-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004797" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                Editar celular
                            </h3>
                            <button onClick={() => setShowEditPhone(false)} className="efe-drawer-close" aria-label="Cerrar ventana">✕</button>
                        </div>
                        
                        {phoneOtpStep === 'phone' ? (
                            <form onSubmit={submitPhoneRequest} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '10px', lineHeight: '1.5' }}>
                                    Necesitamos validar tu identidad. Al continuar, <strong>enviaremos un código verificador al correo {user.email.substring(0, 2)}********@{user.email.split('@')[1]}.</strong>
                                </p>
                                
                                <div className="efe-form-group">
                                    <label className="efe-form-label">Celular</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ padding: '12px 14px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '14px', fontWeight: '600', color: '#1E293B', display: 'flex', alignItems: 'center' }}>+51</div>
                                        <input type="text" value={phoneForm.data.telefono} onChange={e => phoneForm.setData('telefono', e.target.value)} className="efe-input" placeholder="Número de celular" required />
                                    </div>
                                    {phoneForm.errors.telefono && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{phoneForm.errors.telefono}</div>}
                                </div>
                                
                                <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowEditPhone(false)} className="efe-btn-secondary">Cancelar</button>
                                    <button type="submit" disabled={phoneForm.processing} className="efe-btn-primary">{phoneForm.processing ? 'Enviando...' : 'Continuar'}</button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={submitPhoneVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '10px', lineHeight: '1.5' }}>
                                    Ingresa el código de 6 dígitos que enviamos a tu correo.
                                </p>
                                
                                <div className="efe-form-group">
                                    <label className="efe-form-label" htmlFor="profile-field-15">Código de verificación</label>
                                    <input id="profile-field-15" type="text" maxLength="6" value={phoneForm.data.codigo} onChange={e => phoneForm.setData('codigo', e.target.value.replace(/\D/g, ''))} className="efe-input" style={{ fontSize: '24px', letterSpacing: '10px', textAlign: 'center', fontWeight: '700' }} placeholder="000000" required />
                                    {phoneForm.errors.codigo && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{phoneForm.errors.codigo}</div>}
                                </div>
                                
                                <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setPhoneOtpStep('phone')} className="efe-btn-secondary">Volver</button>
                                    <button type="submit" disabled={phoneForm.processing} className="efe-btn-primary">{phoneForm.processing ? 'Validando...' : 'Verificar'}</button>
                                </div>
                            </form>
                        )}
                    </div>
                </>
            )}

            {/* Modal Agregar Dirección */}
            {showAddAddress && (
                <>
                    <div onClick={() => setShowAddAddress(false)} className="efe-drawer-overlay"></div>
                    <div ref={dialogAddAddress} role="dialog" aria-modal="true" aria-label="Agregar dirección" tabIndex={-1} className="efe-drawer-content">
                        <div className="efe-drawer-header">
                            <h3 className="efe-drawer-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004797" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                Agregar dirección
                            </h3>
                            <button onClick={() => setShowAddAddress(false)} className="efe-drawer-close" aria-label="Cerrar ventana">✕</button>
                        </div>
                        
                        <AccountAddressForm form={addressForm} districts={deliveryDistricts} onSubmit={submitAddress} onCancel={() => setShowAddAddress(false)} />
                    </div>
                </>
            )}

            {/* Modal Editar Contraseña */}
            {showEditPassword && (
                <>
                    <div onClick={() => setShowEditPassword(false)} className="efe-drawer-overlay"></div>
                    <div ref={dialogEditPassword} role="dialog" aria-modal="true" aria-label="Cambiar contraseña" tabIndex={-1} className="efe-drawer-content">
                        <div className="efe-drawer-header">
                            <h3 className="efe-drawer-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004797" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                {!usuario?.has_set_password ? 'Establecer Contraseña' : 'Cambiar Contraseña'}
                            </h3>
                            <button onClick={() => setShowEditPassword(false)} className="efe-drawer-close" aria-label="Cerrar ventana">✕</button>
                        </div>
                        
                        <form onSubmit={submitPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                            {!usuario?.has_set_password ? null : (
                                <div className="efe-form-group">
                                    <label className="efe-form-label" htmlFor="profile-field-21">Contraseña actual</label>
                                    <input id="profile-field-21" type="password" value={passwordForm.data.current_password} onChange={e => passwordForm.setData('current_password', e.target.value)} className="efe-input" required />
                                </div>
                            )}
                            <div className="efe-form-group">
                                <label className="efe-form-label">Nueva contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showPassword ? "text" : "password"} value={passwordForm.data.password} onChange={e => passwordForm.setData('password', e.target.value)} className="efe-input" style={{ paddingRight: '44px' }} required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '14px' }}>
                                        {showPassword ? '👁' : '👁‍🗨'}
                                    </button>
                                </div>
                                
                                <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <span style={{ color: passwordForm.data.password.length >= 8 ? '#16A34A' : '#94A3B8' }}>
                                        {passwordForm.data.password.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
                                    </span>
                                    <span style={{ color: /[A-Z]/.test(passwordForm.data.password) ? '#16A34A' : '#94A3B8' }}>
                                        {/[A-Z]/.test(passwordForm.data.password) ? '✓' : '○'} Al menos una mayúscula
                                    </span>
                                    <span style={{ color: /[0-9]/.test(passwordForm.data.password) ? '#16A34A' : '#94A3B8' }}>
                                        {/[0-9]/.test(passwordForm.data.password) ? '✓' : '○'} Al menos un número
                                    </span>
                                </div>
                            </div>
                            <div className="efe-form-group">
                                <label className="efe-form-label">Confirmar nueva contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        value={passwordForm.data.password_confirmation} 
                                        onChange={e => passwordForm.setData('password_confirmation', e.target.value)} 
                                        className="efe-input"
                                        style={{ 
                                            paddingRight: '44px',
                                            borderColor: passwordForm.data.password_confirmation === '' 
                                                ? '#CBD5E1' 
                                                : passwordForm.data.password === passwordForm.data.password_confirmation 
                                                    ? '#16A34A' 
                                                    : '#EF4444'
                                        }} 
                                        required 
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '14px' }}>
                                        {showConfirmPassword ? '👁' : '👁‍🗨'}
                                    </button>
                                </div>
                                {passwordForm.data.password_confirmation !== '' && passwordForm.data.password === passwordForm.data.password_confirmation && (
                                    <div style={{ fontSize: '12px', color: '#16A34A', marginTop: '4px' }}>✓ Las contraseñas coinciden</div>
                                )}
                                {passwordForm.data.password_confirmation !== '' && passwordForm.data.password !== passwordForm.data.password_confirmation && (
                                    <div style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>✕ Las contraseñas no coinciden</div>
                                )}
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowEditPassword(false)} className="efe-btn-secondary">Cancelar</button>
                                <button type="submit" disabled={passwordForm.processing} className="efe-btn-primary">{passwordForm.processing ? 'Actualizando...' : 'Actualizar contraseña'}</button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {/* Modal Agregar Tarjeta */}
            {showAddTarjeta && (
                <>
                    <div onClick={() => setShowAddTarjeta(false)} className="efe-drawer-overlay"></div>
                    <div ref={dialogAddTarjeta} role="dialog" aria-modal="true" aria-label="Agregar tarjeta" tabIndex={-1} className="efe-drawer-content">
                        <div className="efe-drawer-header">
                            <h3 className="efe-drawer-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004797" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                Agregar tarjeta
                            </h3>
                            <button onClick={() => setShowAddTarjeta(false)} className="efe-drawer-close" aria-label="Cerrar ventana">✕</button>
                        </div>
                        <form onSubmit={submitTarjeta} style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
                            <div className="efe-form-group">
                                <label className="efe-form-label" htmlFor="profile-field-22">Número de tarjeta</label>
                                <input id="profile-field-22" type="text" maxLength="16" value={tarjetaForm.data.numero_tarjeta} onChange={e => tarjetaForm.setData('numero_tarjeta', e.target.value)} placeholder="Número de tarjeta (16 dígitos)" className="efe-input" required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '12px' }}>
                                <div className="efe-form-group">
                                    <label className="efe-form-label" htmlFor="profile-field-23">Vencimiento (MM/AA)</label>
                                    <input id="profile-field-23" type="text" maxLength="5" placeholder="MM/AA" value={tarjetaForm.data.fecha_vencimiento} onChange={e => tarjetaForm.setData('fecha_vencimiento', e.target.value)} className="efe-input" required />
                                </div>
                                <div className="efe-form-group">
                                    <label className="efe-form-label" htmlFor="profile-field-24">CVV</label>
                                    <input id="profile-field-24" type="password" maxLength="4" placeholder="CVV" value={tarjetaForm.data.cvv} onChange={e => tarjetaForm.setData('cvv', e.target.value)} className="efe-input" required />
                                </div>
                            </div>
                            <div className="efe-form-group">
                                <label className="efe-form-label" htmlFor="profile-field-25">Nombre del titular</label>
                                <input id="profile-field-25" type="text" placeholder="Nombre como figura en la tarjeta" value={tarjetaForm.data.nombre_titular} onChange={e => tarjetaForm.setData('nombre_titular', e.target.value)} className="efe-input" required />
                            </div>
                            <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowAddTarjeta(false)} className="efe-btn-secondary">Cancelar</button>
                                <button type="submit" disabled={tarjetaForm.processing} className="efe-btn-primary">Guardar tarjeta</button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {/* Modal Agregar Lista */}
            {showAddLista && (
                <>
                    <div onClick={() => setShowAddLista(false)} className="efe-drawer-overlay"></div>
                    <div ref={dialogAddLista} role="dialog" aria-modal="true" aria-label="Crear lista" tabIndex={-1} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 2rem)', maxWidth: '440px', background: 'white', zIndex: 10000, borderRadius: '16px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>Nueva Lista</h3>
                            <button onClick={() => setShowAddLista(false)} className="efe-drawer-close" aria-label="Cerrar ventana">✕</button>
                        </div>
                        <form onSubmit={submitLista} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div className="efe-form-group">
                                <label className="efe-form-label" htmlFor="profile-field-26">Nombre de la lista</label>
                                <input id="profile-field-26" type="text" value={listaForm.data.nombre} onChange={e => listaForm.setData('nombre', e.target.value)} className="efe-input" required placeholder="Nombre de la lista" />
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={listaForm.data.es_publica} onChange={e => listaForm.setData('es_publica', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#004797', cursor: 'pointer' }} />
                                <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: '500' }}>Hacer lista pública</span>
                            </label>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowAddLista(false)} className="efe-btn-secondary">Cancelar</button>
                                <button type="submit" disabled={listaForm.processing} className="efe-btn-primary">Crear lista</button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {/* Modal Eliminar Cuenta */}
            {showDeleteAccount && (
                <>
                    <div onClick={() => setShowDeleteAccount(false)} className="efe-drawer-overlay"></div>
                    <div ref={dialogDeleteAccount} role="dialog" aria-modal="true" aria-label="Eliminar cuenta" tabIndex={-1} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 2rem)', maxWidth: '440px', background: 'white', zIndex: 10000, borderRadius: '16px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#DC2626', margin: '0 0 10px 0' }}>Eliminar Cuenta</h3>
                        <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px', lineHeight: '1.5' }}>Por favor ingresa tu contraseña para confirmar que deseas eliminar tu cuenta permanentemente.</p>
                        <form onSubmit={submitDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div className="efe-form-group">
                                <input type="password" value={deleteAccountForm.data.password} onChange={e => deleteAccountForm.setData('password', e.target.value)} className="efe-input" required placeholder="Tu contraseña actual" />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <button type="button" onClick={() => setShowDeleteAccount(false)} className="efe-btn-secondary">Cancelar</button>
                                <button type="submit" disabled={deleteAccountForm.processing} className="efe-profile-sidebar-btn efe-profile-sidebar-btn-danger" style={{ padding: '10px 20px', fontSize: '14px', background: '#EF4444', color: 'white', borderRadius: '20px', width: 'auto' }}>
                                    {deleteAccountForm.processing ? 'Eliminando...' : 'Eliminar cuenta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            <Footer />
        </div>
    );
}
