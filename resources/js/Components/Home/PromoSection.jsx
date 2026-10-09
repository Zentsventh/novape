import React, { Suspense } from 'react';
import { Link } from '@inertiajs/react';
const CintilloCarousel = React.lazy(() => import('./CintilloCarousel'));
import '../../../css/home/promo-section.css';

const PromoSection = ({ title, mainBanners = [], subBanners = [] }) => {
    return (
        <section className="promo-section-grid">
            {title && <h2 className="section-title" dangerouslySetInnerHTML={{ __html: title }}></h2>}
            
            {mainBanners.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <Suspense fallback={<div style={{ minHeight: '5rem' }} />}><CintilloCarousel banners={mainBanners} /></Suspense>
                </div>
            )}

            {subBanners.length > 0 && (
                <div className={`promo-grid-container ${subBanners.some(b => b.colSpan === 3) ? 'promo-grid-bento-6' : subBanners.some(b => b.colSpan === 2) ? 'promo-grid-bento' : `cols-${subBanners.length}`}`}>
                    {subBanners.map((banner, index) => (
                        <div 
                            key={index} 
                            className={`promo-grid-slide ${banner.colSpan ? `span-${banner.colSpan}` : ''}`}
                        >
                            {(() => {
                                const isExternal = banner.link && (banner.link.startsWith('http://') || banner.link.startsWith('https://'));
                                const hasLink = banner.link && banner.link !== '#';
                                const imgEl = <img src={banner.img} alt={`Promo ${index + 1}`} />;
                                
                                if (!hasLink) return imgEl;
                                if (isExternal) return <a href={banner.link} target="_blank" rel="noopener noreferrer">{imgEl}</a>;
                                return <Link href={banner.link}>{imgEl}</Link>;
                            })()}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default PromoSection;

