import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import '../../../css/home/base.css'; 

export default function AdminLogin() {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [isFocusedEmail, setIsFocusedEmail] = useState(false);
    const [isFocusedPassword, setIsFocusedPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post('/admin/login');
    };

    // Tracking text length smoothly
    const maxMove = 8;
    // Base moving calculation
    const moveX = isFocusedEmail ? Math.min(Math.max((data.email.length - 15) * 0.8, -maxMove), maxMove) : 0;
    const lookDown = isFocusedEmail ? 6 : 0;

    // Panda states
    const isSurprised = isFocusedPassword && showPassword;
    const eyesClosed = isFocusedPassword && !showPassword;

    let leftHandTransform = 'translate(10px, 140px) rotate(0deg)';
    let rightHandTransform = 'translate(115px, 140px) rotate(0deg)';

    if (isFocusedPassword) {
        if (showPassword) {
            // Surprised! Hands drop slightly but remain visible
            leftHandTransform = 'translate(20px, 105px) rotate(-10deg)';
            rightHandTransform = 'translate(105px, 105px) rotate(10deg)';
        } else {
            // Covering eyes
            leftHandTransform = 'translate(35px, 45px) rotate(25deg)';
            rightHandTransform = 'translate(90px, 45px) rotate(-25deg)';
        }
    }

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'radial-gradient(circle at 20% 30%, #064b9c 0%, #021a42 60%, #010f26 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '20px'
        }}>
            <Head title="Login - Administrador" />
            
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px', marginTop: '70px' }}>
                
                {/* 3D ELEGANT PANDA CHARACTER (BEHIND THE CARD) */}
                <div style={{ position: 'absolute', top: '-110px', left: '50%', transform: 'translateX(-50%)', width: '160px', height: '140px', zIndex: 1, pointerEvents: 'none' }}>
                    <svg viewBox="0 0 160 140" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <defs>
                            {/* 3D Gradients for Elegant Look */}
                            <radialGradient id="pandaWhite" cx="40%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#ffffff"/>
                                <stop offset="100%" stopColor="#94a3b8"/>
                            </radialGradient>
                            <radialGradient id="pandaBlack" cx="40%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#334155"/>
                                <stop offset="100%" stopColor="#020617"/>
                            </radialGradient>
                            <radialGradient id="pandaPaw" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#64748b"/>
                                <stop offset="100%" stopColor="#334155"/>
                            </radialGradient>
                        </defs>
                        
                        <g stroke="none">
                            {/* Ears con borde blanco */}
                            <circle cx="35" cy="40" r="22" fill="url(#pandaBlack)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                            <circle cx="125" cy="40" r="22" fill="url(#pandaBlack)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                            {/* Inner ears - Darker slate */}
                            <circle cx="35" cy="40" r="12" fill="#0f172a" />
                            <circle cx="125" cy="40" r="12" fill="#0f172a" />
                            
                            {/* Head (3D Sphere) con borde blanco */}
                            <ellipse cx="80" cy="85" rx="65" ry="55" fill="url(#pandaWhite)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                            
                            {/* Eye patches (angled) */}
                            <g style={{ transform: 'rotate(-15deg)', transformOrigin: '50px 65px' }}>
                                <ellipse cx="50" cy="65" rx="18" ry="25" fill="url(#pandaBlack)" />
                                {/* Efecto 3D / Highlight blanco en los bordes del ojo */}
                                <path d="M 40 45 C 50 35, 65 50, 65 65" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
                            </g>
                            <g style={{ transform: 'rotate(15deg)', transformOrigin: '110px 65px' }}>
                                <ellipse cx="110" cy="65" rx="18" ry="25" fill="url(#pandaBlack)" />
                                {/* Efecto 3D / Highlight blanco en los bordes del ojo */}
                                <path d="M 120 45 C 110 35, 95 50, 95 65" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
                            </g>
                            
                            {/* Whites of eyes */}
                            <ellipse cx="50" cy="62" rx="8" ry="12" fill="#ffffff" />
                            <ellipse cx="110" cy="62" rx="8" ry="12" fill="#ffffff" />
                            
                            {/* Pupils & Animation */}
                            {eyesClosed ? (
                                /* Closed Eyes (Serious straight lines for elegant look) */
                                <g stroke="#020617" strokeWidth="4" fill="none" strokeLinecap="round">
                                    <line x1="44" y1="62" x2="56" y2="62" />
                                    <line x1="104" y1="62" x2="116" y2="62" />
                                </g>
                            ) : (
                                <g>
                                    <g style={{ transform: `translate(${moveX}px, ${lookDown}px)`, transition: 'transform 0.15s ease-out' }}>
                                        {/* Pupil base */}
                                        <ellipse cx="50" cy="62" rx={isSurprised ? 4 : 5} ry={isSurprised ? 4 : 7} fill="#020617" />
                                        {/* 3D reflection */}
                                        {!isSurprised && <circle cx="48" cy="59" r="2" fill="#ffffff" />}
                                    </g>
                                    <g style={{ transform: `translate(${moveX}px, ${lookDown}px)`, transition: 'transform 0.15s ease-out' }}>
                                        <ellipse cx="110" cy="62" rx={isSurprised ? 4 : 5} ry={isSurprised ? 4 : 7} fill="#020617" />
                                        {!isSurprised && <circle cx="108" cy="59" r="2" fill="#ffffff" />}
                                    </g>
                                </g>
                            )}
                            
                            {/* Nose */}
                            <ellipse cx="80" cy="85" rx="7" ry="4" fill="url(#pandaBlack)" />
                            
                            {/* Mouth - Serious/Elegant look */}
                            {isSurprised ? (
                                /* Subtle open mouth */
                                <ellipse cx="80" cy="100" rx="6" ry="8" fill="#020617" />
                            ) : (
                                /* Straight, confident smirk instead of cute smile */
                                <g stroke="#020617" strokeWidth="2.5" fill="none" strokeLinecap="round">
                                    <line x1="72" y1="96" x2="88" y2="96" />
                                </g>
                            )}
                        </g>
                        
                        {/* Hands (Animate up/down) with 3D gradient */}
                        <g style={{ 
                            transform: leftHandTransform, 
                            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                        }}>
                            <rect x="0" y="0" width="35" height="70" rx="17.5" fill="url(#pandaBlack)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                        </g>
                        <g style={{ 
                            transform: rightHandTransform, 
                            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                        }}>
                            <rect x="0" y="0" width="35" height="70" rx="17.5" fill="url(#pandaBlack)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                        </g>
                    </svg>
                </div>

                {/* THE LOGIN CARD (Restaurado a los colores azules brillantes anteriores) */}
                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    background: 'linear-gradient(135deg, #028dfc 0%, #0152cc 100%)',
                    padding: 'min(50px, 10vw) min(40px, 8vw)',
                    borderRadius: '12px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                    color: 'white'
                }}>
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                        <div style={{ width: '130px', margin: '0 auto' }}>
                            <img src="https://nyc.cloud.appwrite.io/v1/storage/buckets/69fc0f9d001d6274d5d1/files/6a0e952f002986fd57d7/view?project=69fc0953002b1ac465c5&mode=admin" alt="Logo" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                        </div>
                    </div>

                    {flash?.error && (
                        <div style={{ 
                            background: 'rgba(255, 0, 0, 0.2)', 
                            border: '1px solid #ff4d4d',
                            color: '#ff4d4d', 
                            padding: '10px', 
                            borderRadius: '4px',
                            marginBottom: '20px',
                            fontSize: '14px',
                            textAlign: 'center'
                        }}>
                            {flash.error}
                        </div>
                    )}

                    <form onSubmit={submit}>
                        {/* Email Input */}
                        <div style={{ marginBottom: '30px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '10px', left: '0' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                            </div>
                            <input
                                type="email"
                                placeholder="Correo Electrónico"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                onFocus={() => setIsFocusedEmail(true)}
                                onBlur={() => setIsFocusedEmail(false)}
                                style={{
                                    width: '100%',
                                    padding: '10px 10px 10px 35px',
                                    border: 'none',
                                    borderBottom: '1px solid rgba(255,255,255,0.5)',
                                    background: 'transparent',
                                    color: 'white',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'border-color 0.3s'
                                }}
                                required
                            />
                            {errors.email && <div style={{ color: '#ffb3b3', fontSize: '12px', marginTop: '4px' }}>{errors.email}</div>}
                        </div>

                        {/* Password Input */}
                        <div style={{ marginBottom: '25px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '10px', left: '0' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Contraseña"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                onFocus={() => setIsFocusedPassword(true)}
                                onBlur={() => setIsFocusedPassword(false)}
                                style={{
                                    width: '100%',
                                    padding: '10px 35px 10px 35px',
                                    border: 'none',
                                    borderBottom: '1px solid rgba(255,255,255,0.5)',
                                    background: 'transparent',
                                    color: 'white',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'border-color 0.3s'
                                }}
                                required
                            />
                            <div 
                                style={{ position: 'absolute', top: '10px', right: '0', cursor: 'pointer' }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                )}
                            </div>
                            {errors.password && <div style={{ color: '#ffb3b3', fontSize: '12px', marginTop: '4px' }}>{errors.password}</div>}
                        </div>

                        {/* Options (Remember Me) */}
                        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '35px', fontSize: '13px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#e0e0e0' }}>
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={e => setData('remember', e.target.checked)}
                                    style={{ marginRight: '8px', cursor: 'pointer' }}
                                />
                                Recordarme
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(90deg, #00d2ff 0%, #009cff 100%)',
                                color: '#fff',
                                padding: '15px',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                letterSpacing: '2px',
                                cursor: processing ? 'not-allowed' : 'pointer',
                                opacity: processing ? 0.8 : 1,
                                boxShadow: '0 4px 15px rgba(0, 210, 255, 0.4)',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseOver={e => !processing && (e.currentTarget.style.transform = 'translateY(-2px)')}
                            onMouseOut={e => !processing && (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                            {processing ? 'INICIANDO SESIÓN...' : 'INICIAR SESIÓN'}
                        </button>
                    </form>
                </div>

                {/* ELEGANT 3D PANDA PAWS (BOTTOM) */}
                <div style={{ position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '50px', zIndex: 1, pointerEvents: 'none' }}>
                    <svg width="50" height="40" viewBox="0 0 50 40">
                        <rect x="0" y="0" width="50" height="40" rx="20" fill="url(#pandaBlack)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                        <circle cx="15" cy="12" r="5" fill="url(#pandaPaw)" />
                        <circle cx="25" cy="9" r="5" fill="url(#pandaPaw)" />
                        <circle cx="35" cy="12" r="5" fill="url(#pandaPaw)" />
                        <ellipse cx="25" cy="25" rx="12" ry="9" fill="url(#pandaPaw)" />
                    </svg>
                    <svg width="50" height="40" viewBox="0 0 50 40">
                        <rect x="0" y="0" width="50" height="40" rx="20" fill="url(#pandaBlack)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                        <circle cx="15" cy="12" r="5" fill="url(#pandaPaw)" />
                        <circle cx="25" cy="9" r="5" fill="url(#pandaPaw)" />
                        <circle cx="35" cy="12" r="5" fill="url(#pandaPaw)" />
                        <ellipse cx="25" cy="25" rx="12" ry="9" fill="url(#pandaPaw)" />
                    </svg>
                </div>

            </div>
        </div>
    );
}
