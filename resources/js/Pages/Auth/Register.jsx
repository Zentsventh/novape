import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import Header from '../../Components/Home/Header';
import Footer from '../../Components/Home/Footer';
import Swal from 'sweetalert2';
import '../../../css/home/base.css';
import '../../../css/home/header.css';
import '../../../css/home/footer.css';
import '../../../css/auth.css';

export default function Register({ errors }) {
    const [form, setForm] = useState({
        nombres: '',
        apellidos: '',
        tipo_documento: 'DNI',
        dni: '',
        email: '',
        codigo_pais: '+51',
        telefono: '',
        password: '',
        password_confirmation: '',
        acepta_programa: false,
        acepta_terminos: false,
        acepta_promociones: false
    });
    const [loading, setLoading] = useState(false);
    const [loadingApi, setLoadingApi] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const buscarDocumento = async () => {
        if (!form.dni) return;
        setLoadingApi(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
            const res = await fetch('/api/documento/consultar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({ tipo: form.tipo_documento, numero: form.dni })
            });
            const json = await res.json();
            if (res.ok && json.success) {
                const data = json.data;
                if (form.tipo_documento === 'DNI') {
                    setForm(prev => ({
                        ...prev,
                        nombres: data.nombres || '',
                        apellidos: `${data.apellido_paterno || ''} ${data.apellido_materno || ''}`.trim()
                    }));
                } else if (form.tipo_documento === 'RUC') {
                    setForm(prev => ({
                        ...prev,
                        nombres: data.nombre_o_razon_social || '',
                        apellidos: '-'
                    }));
                }
            } else {
                Swal.fire({text: 'No se pudo encontrar el documento.', icon: 'error', confirmButtonColor: '#00B4FF'});
            }
        } catch (err) {
            Swal.fire({text: 'Error de conexión.', icon: 'error', confirmButtonColor: '#00B4FF'});
        } finally {
            setLoadingApi(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        router.post('/registro', form, {
            preserveScroll: true,
            onError: () => setLoading(false)
        });
    };

    const hasMinLength = form.password.length >= 8;
    const hasUpperCase = (form.password.match(/[A-Z]/g) || []).length >= 2;
    const hasNumbers = (form.password.match(/[0-9]/g) || []).length >= 2;
    const hasSpecialChar = (form.password.match(/[^A-Za-z0-9\s]/g) || []).length >= 2;
    const hasLowerCase = (form.password.match(/[a-z]/g) || []).length >= 2;
    const hasNoSpaces = form.password.length > 0 && !/\s/.test(form.password);

    const renderIcon = (isValid) => {
        if (isValid) {
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            );
        }
        return (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        );
    };

    return (
        <div className="auth-page-wrapper">
            <Head title="Crear Cuenta" />
            <Header />
            
            <div className="auth-content">
                <div className="auth-card">
                    <div className="auth-header-links">
                        Si ya te registraste, <Link href="/login">click aquí</Link>
                    </div>

                    <div className="auth-title-container">
                        <div className="auth-welcome">¡Te damos la BIENVENIDA!</div>
                        <h2 className="auth-title">Crea tu cuenta</h2>
                        <p className="auth-subtitle">Ingresa los siguientes datos para registrarte</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <input type="text" name="nombres" value={form.nombres} onChange={handleChange} placeholder="Nombres" required className="auth-input" />
                            {errors?.nombres && <div className="error-msg">{errors.nombres}</div>}
                        </div>
                        <div className="form-group">
                            <input type="text" name="apellidos" value={form.apellidos} onChange={handleChange} placeholder="Apellidos" required className="auth-input" />
                            {errors?.apellidos && <div className="error-msg">{errors.apellidos}</div>}
                        </div>
                        
                        <div className="form-group">
                            <div className="form-row">
                                <select name="tipo_documento" value={form.tipo_documento} onChange={handleChange} className="auth-select fixed-width" style={{ width: '120px' }}>
                                    <option value="DNI">DNI</option>
                                    <option value="RUC">RUC</option>
                                    <option value="CE">CE</option>
                                    <option value="PASAPORTE">PASAPORTE</option>
                                </select>
                                <input type="text" name="dni" value={form.dni} onChange={handleChange} placeholder="Número de documento" required className="auth-input" />
                                <button 
                                    type="button" 
                                    onClick={buscarDocumento} 
                                    disabled={loadingApi || !form.dni} 
                                    className="btn-search-doc fixed-width"
                                >
                                    {loadingApi ? (
                                        'Buscando...'
                                    ) : (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="11" cy="11" r="8"></circle>
                                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                            </svg>
                                            Buscar
                                        </>
                                    )}
                                </button>
                            </div>
                            {errors?.dni && <div className="error-msg">{errors.dni}</div>}
                        </div>

                        <div className="form-group">
                            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Correo electrónico" required className="auth-input" />
                            {errors?.email && <div className="error-msg">{errors.email}</div>}
                        </div>

                        <div className="form-group">
                            <div className="form-row">
                                <div className="country-code fixed-width">
                                    +51
                                </div>
                                <input type="text" name="telefono" value={form.telefono} onChange={handleChange} placeholder="Celular" required className="auth-input" />
                            </div>
                            {errors?.telefono && <div className="error-msg">{errors.telefono}</div>}
                        </div>

                        <div className="form-group">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="password" 
                                value={form.password} 
                                onChange={handleChange} 
                                placeholder="Contraseña" 
                                required 
                                className="auth-input"
                                style={{ paddingRight: '45px' }}
                            />
                            <span 
                                onClick={() => setShowPassword(!showPassword)}
                                className="input-icon-btn"
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                )}
                            </span>
                        </div>

                        <div className="form-group">
                            <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                name="password_confirmation" 
                                value={form.password_confirmation} 
                                onChange={handleChange} 
                                placeholder="Ingresar la contraseña nuevamente" 
                                required 
                                className="auth-input"
                                style={{ paddingRight: '45px' }}
                            />
                            <span 
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="input-icon-btn"
                            >
                                {showConfirmPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                )}
                            </span>
                        </div>
                        {errors?.password && <div className="error-msg">{errors.password}</div>}

                        <div className="password-rules">
                            <div className="password-rules-title">La contraseña debe tener:</div>
                            <div className="password-rules-grid">
                                <div className={`rule-item ${hasMinLength ? 'valid' : ''}`}>
                                    <span className="rule-icon">{renderIcon(hasMinLength)}</span>
                                    Mínimo de 8 caracteres
                                </div>
                                <div className={`rule-item ${hasUpperCase ? 'valid' : ''}`}>
                                    <span className="rule-icon">{renderIcon(hasUpperCase)}</span>
                                    2 letras mayúsculas
                                </div>
                                <div className={`rule-item ${hasNumbers ? 'valid' : ''}`}>
                                    <span className="rule-icon">{renderIcon(hasNumbers)}</span>
                                    2 números como mínimo
                                </div>
                                <div className={`rule-item ${hasSpecialChar ? 'valid' : ''}`}>
                                    <span className="rule-icon">{renderIcon(hasSpecialChar)}</span>
                                    2 caracteres especiales
                                </div>
                                <div className={`rule-item ${hasLowerCase ? 'valid' : ''}`}>
                                    <span className="rule-icon">{renderIcon(hasLowerCase)}</span>
                                    2 letras minúsculas
                                </div>
                                <div className={`rule-item ${hasNoSpaces ? 'valid' : ''}`}>
                                    <span className="rule-icon">{renderIcon(hasNoSpaces)}</span>
                                    Sin espacios
                                </div>
                            </div>
                        </div>

                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input type="checkbox" name="acepta_programa" checked={form.acepta_programa} onChange={handleChange} className="checkbox-input" />
                                <span>Acepto formar parte del Programa de Puntos y <a href="#">Acepto el Reglamento del Programa</a></span>
                            </label>
                            <label className="checkbox-label">
                                <input type="checkbox" name="acepta_terminos" checked={form.acepta_terminos} onChange={handleChange} required className="checkbox-input" />
                                <span>Acepto <a href="#">Términos y Condiciones</a> y la <a href="#">Política de Privacidad</a></span>
                            </label>
                            <label className="checkbox-label">
                                <input type="checkbox" name="acepta_promociones" checked={form.acepta_promociones} onChange={handleChange} className="checkbox-input" />
                                <span>Acepto el uso de mi información personal para <a href="#">fines promocionales</a></span>
                            </label>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'REGISTRANDO...' : 'REGÍSTRATE'}
                        </button>
                        
                        <div className="divider">o</div>

                        <a href="/auth/google" className="btn-google">
                            <svg width="22" height="22" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continuar con Google
                        </a>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
}
