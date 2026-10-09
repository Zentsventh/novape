import { Head, useForm, Link } from '@inertiajs/react';
import Header from '../../Components/Home/Header';
import Footer from '../../Components/Home/Footer';
import '../../../css/home/base.css';
import '../../../css/home/header.css';
import '../../../css/home/footer.css';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div style={{ background: '#64748b', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Head title="Iniciar Sesión" />
            <Header />
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'rgba(0,0,0,0.5)' }}>
                <div style={{ background: 'white', padding: 'clamp(0.75rem, 3vw, 2.5rem)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', width: '100%', maxWidth: '450px', position: 'relative' }}>
                    
                    <Link href="/" style={{ position: 'absolute', top: '20px', right: '20px', color: '#666', textDecoration: 'none', fontSize: '18px', fontWeight: 'bold' }}>✕</Link>

                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#000' }}>Bienvenido</h1>
                    </div>

                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            </span>
                            <input 
                                type="email" 
                                name="email" aria-label="Correo electrónico" autoComplete="email" 
                                value={data.email} 
                                onChange={e => setData('email', e.target.value)} 
                                placeholder="Email" 
                                required 
                                style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} 
                            />
                            {errors.email && <div style={{color: 'red', fontSize: '12px', marginTop: '4px'}}>{errors.email}</div>}
                        </div>

                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </span>
                            <input 
                                type="password" 
                                name="password" aria-label="Contraseña" autoComplete="current-password" 
                                value={data.password} 
                                onChange={e => setData('password', e.target.value)} 
                                placeholder="********" 
                                required 
                                style={{ width: '100%', padding: '12px 42px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', letterSpacing: '2px' }} 
                            />
                            <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                            </span>
                            {errors.password && <div style={{color: 'red', fontSize: '12px', marginTop: '4px'}}>{errors.password}</div>}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '13px', marginTop: '5px' }}>
                            <a href="/recuperar-contrasena" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: '500' }}>¿Olvidaste tu contraseña?</a>
                        </div>

                        <button type="submit" disabled={processing} style={{ width: '100%', background: '#0284c7', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', cursor: processing ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '10px' }}>
                            {processing ? 'INGRESANDO...' : 'INGRESAR'}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#94a3b8', fontSize: '12px' }}>
                            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                            <span style={{ margin: '0 15px' }}>o</span>
                            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                        </div>

                        <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                            Ingresa con tu red social favorita
                        </div>
                        
                        <a href="/auth/google" style={{ width: '100%', background: 'white', color: '#0f172a', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'background 0.2s' }}>
                            Google
                        </a>

                        <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '13px', color: '#64748b' }}>
                            ¿Todavía no tienes una cuenta? <Link href="/registro" style={{ color: '#0284c7', fontWeight: 'bold', textDecoration: 'none' }}>Regístrate</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
