import '../../../css/home/footer.css';
import { Link, usePage } from '@inertiajs/react';

/* Renderiza el pie de página con enlaces, contacto y redes sociales. */
export default function Footer() {
    const { globalConfig } = usePage().props;

    const aboutLinks = [
        { label: 'Quiénes somos', href: '/nosotros' },
        { label: 'Términos y condiciones', href: '/terminos' },
        { label: 'Políticas de privacidad', href: '/privacidad' }
    ];
    const helpLinks = [
        { label: 'Centro de ayuda', href: '/ayuda' },
        { label: 'Seguimiento de pedido', href: '/seguimiento' },
        { label: 'Devoluciones', href: '/devoluciones' },
        { label: 'Preguntas frecuentes', href: '/faq' }
    ];
    const socials = [
        { label: 'Facebook', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>, href: 'https://facebook.com' },
        { label: 'Instagram', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>, href: 'https://instagram.com' }
    ];

    return (
        <footer className="efe-footer">
            <div className="efe-footer-grid">
                {/* Columna 1: Sobre Nosotros */}
                <div>
                    <h4 className="efe-footer-title">Sobre Nosotros</h4>
                    {aboutLinks.map(item => (
                        <Link key={item.href} href={item.href} className="efe-footer-link">{item.label}</Link>
                    ))}
                </div>

                {/* Columna 2: Servicio al cliente (Ayuda) */}
                <div>
                    <h4 className="efe-footer-title">Servicio al cliente</h4>
                    {helpLinks.map(item => (
                        <Link key={item.href} href={item.href} className="efe-footer-link">{item.label}</Link>
                    ))}
                </div>

                {/* Columna 3: Síguenos & Contáctanos */}
                <div>
                    <h4 className="efe-footer-title">Síguenos en:</h4>
                    <div className="efe-footer-socials" style={{ marginBottom: '24px' }}>
                        {socials.map(social => (
                            <a key={social.href} href={social.label === 'Facebook' ? globalConfig?.facebook_url || social.href : globalConfig?.instagram_url || social.href} className="efe-footer-social" target="_blank" rel="noreferrer" title={social.label}>
                                {social.icon}
                            </a>
                        ))}
                    </div>

                    <h4 className="efe-footer-title" style={{ marginBottom: '12px' }}>Contáctanos:</h4>
                    <div className="efe-footer-contact" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>Teléfono: {globalConfig?.telefono_contacto || '+51 986 784 384'}</div>
                        <div>Email: <a href={`mailto:${globalConfig?.email_contacto || 'atencionalcliente@novape.me'}`}>{globalConfig?.email_contacto || 'atencionalcliente@novape.me'}</a></div>
                        {globalConfig?.contact_hours && <div>{globalConfig.contact_hours}</div>}
                        
                        <a href={`https://wa.me/${(globalConfig?.telefono_contacto || '+51 986 784 384').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'white', textDecoration: 'none', marginTop: '8px', fontWeight: '600', borderBottom: '1px solid transparent', transition: 'border 0.3s' }} onMouseOver={e => e.currentTarget.style.borderBottom = '1px solid white'} onMouseOut={e => e.currentTarget.style.borderBottom = '1px solid transparent'}>
                            Comprar por WhatsApp 
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </a>
                    </div>
                </div>

                {/* Columna 4: Libro de Reclamaciones */}
                <div>
                    <h4 className="efe-footer-title" style={{ visibility: 'hidden' }}>Legal</h4>
                    <Link href="/libro-de-reclamaciones" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', color: 'white', textDecoration: 'none' }}>
                        <span style={{ fontSize: '14px', marginBottom: '8px' }}>Libro de<br />Reclamaciones</span>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    </Link>
                </div>
            </div>

            <div className="efe-footer-divider" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '13px', paddingTop: '24px', marginTop: '40px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
                © 2026 Novape | Todos los derechos reservados
            </div>
        </footer>
    );
}
