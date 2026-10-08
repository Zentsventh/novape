import { Head } from '@inertiajs/react';
import Header from '../Components/Home/Header';
import Footer from '../Components/Home/Footer';

import '../../css/home/base.css';
import '../../css/home/header.css';
import '../../css/home/info-pages.css';
import '../../css/home/footer.css';

export default function InfoPage({ title, sections = [], logoUrl }) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFA', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <Head title={title} />
            <Header minimal={true} logoUrl={logoUrl} />

            <main style={{ flex: '1', display: 'flex', justifyContent: 'center', padding: '60px 20px', background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)' }}>
                <div style={{ width: '100%', maxWidth: '800px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.03em', margin: '0 0 16px 0' }}>{title}</h1>
                        <div style={{ height: '4px', width: '40px', background: '#004797', margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>

                    <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {sections.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                                <p style={{ fontSize: '15px', fontWeight: '500' }}>Contenido en preparación.</p>
                            </div>
                        ) : (
                            sections.map((section, index) => (
                                <div key={index} style={{ borderBottom: index !== sections.length - 1 ? '1px solid #F1F5F9' : 'none', paddingBottom: index !== sections.length - 1 ? '32px' : '0' }}>
                                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1E293B', letterSpacing: '-0.01em', marginBottom: '16px', lineHeight: '1.3' }}>
                                        {section.heading}
                                    </h2>
                                    <div 
                                        dangerouslySetInnerHTML={{ __html: section.body }} 
                                        style={{ 
                                            fontSize: '15px', 
                                            lineHeight: '1.7', 
                                            color: '#475569',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px'
                                        }}
                                        className="cms-content-wrapper"
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* Inyectamos estilos globales para el contenido HTML renderizado */}
            <style dangerouslySetInnerHTML={{__html: `
                .cms-content-wrapper p { margin: 0; }
                .cms-content-wrapper strong, .cms-content-wrapper b { color: '#0F172A'; font-weight: 600; }
                .cms-content-wrapper ul { margin: 0; padding-left: 20px; }
                .cms-content-wrapper li { margin-bottom: 8px; }
                .cms-content-wrapper a { color: #004797; text-decoration: none; font-weight: 500; }
                .cms-content-wrapper a:hover { text-decoration: underline; }
            `}} />

            <Footer />
        </div>
    );
}
