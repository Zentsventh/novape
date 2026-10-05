import { useForm, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function LoginModal({ isOpen, onClose, onSuccessCallback }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    if (!isOpen) return null;

    const submit = (e) => {
        e.preventDefault();
        post('/login', {
            onSuccess: () => {
                reset();
                onClose();
                if (onSuccessCallback) {
                    onSuccessCallback();
                }
            }
        });
    };

    return (
        <div className="store-modal-overlay" style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="store-modal-panel" style={{
                background: 'white',
                padding: 'clamp(0.75rem, 3vw, 2.5rem)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                width: '100%',
                maxWidth: '450px',
                position: 'relative'
            }}>
                <button 
                    onClick={onClose}
                    style={{ 
                        position: 'absolute', top: '15px', right: '15px', 
                        background: 'transparent', border: 'none', 
                        color: '#666', fontSize: '20px', fontWeight: 'bold', 
                        cursor: 'pointer' 
                    }}
                >
                    ✕
                </button>

                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#111' }}>Bienvenido</h1>
                </div>

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '14px', left: '14px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                        </div>
                        <input 
                            type="email" 
                            name="email" 
                            value={data.email} 
                            onChange={e => setData('email', e.target.value)} 
                            placeholder="Email" 
                            required 
                            style={{ width: '100%', padding: '14px 14px 14px 45px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '15px', background: '#fafafa', outline: 'none', color: '#333' }} 
                        />
                        {errors.email && <div style={{color: 'red', fontSize: '12px', marginTop: '4px'}}>{errors.email}</div>}
                    </div>

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '14px', left: '14px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            name="password" 
                            value={data.password} 
                            onChange={e => setData('password', e.target.value)} 
                            placeholder="********" 
                            required 
                            style={{ width: '100%', padding: '14px 45px 14px 45px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '15px', background: '#fafafa', outline: 'none', color: '#333' }} 
                        />
                        <span 
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#888', cursor: 'pointer' }}
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
                        {errors.password && <div style={{color: 'red', fontSize: '12px', marginTop: '4px'}}>{errors.password}</div>}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '13px' }}>
                        <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '500' }}>¿Olvidaste tu contraseña?</a>
                    </div>

                    <button type="submit" disabled={processing} style={{ width: '100%', background: 'var(--color-primary)', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', cursor: processing ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '5px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)', letterSpacing: '1px' }}>
                        {processing ? 'INGRESANDO...' : 'INGRESAR'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0' }}>
                        <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
                        <div style={{ margin: '0 10px', color: '#888', fontSize: '12px', fontWeight: '500' }}>O</div>
                        <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '13px', color: '#555', marginBottom: '5px' }}>
                        Ingresa con tu red social favorita
                    </div>
                    
                    <a href="/auth/google" style={{ width: '100%', background: 'white', border: '1px solid var(--color-border)', color: 'var(--color-text-title)', padding: '14px', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        Google
                    </a>

                    <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#555' }}>
                        ¿Todavía no tienes una cuenta? <Link href="/registro" onClick={onClose} style={{ color: 'var(--color-primary)', fontWeight: 'bold', textDecoration: 'none' }}>Regístrate</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
