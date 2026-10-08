import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../../../css/home/cintillo-carousel.css';

const CintilloCarousel = ({ banners = [] }) => {
    const [current, setCurrent] = useState(0);
    const count = banners.length;

    const go = (direction) => setCurrent((index) => (index + direction + count) % count);

    useEffect(() => {
        if (count < 2) return;
        const interval = setInterval(() => {
            setCurrent((index) => (index + 1) % count);
        }, 5000);
        return () => clearInterval(interval);
    }, [count]);

    if (count === 0) return null;

    return (
        <section className="cintillo-carousel-section">
            <div className="cintillo-carousel-container">
                <div className="cintillo-carousel-viewport">
                    <div className="cintillo-carousel-track" style={{ transform: `translateX(-${current * 100}%)` }}>
                        {banners.map((banner, index) => (
                            <div key={index} className="cintillo-carousel-slide">
                                {(() => {
                                    const isExternal = banner.link && (banner.link.startsWith('http://') || banner.link.startsWith('https://'));
                                    const hasLink = banner.link && banner.link !== '#';
                                    const imgEl = <img src={banner.img} alt={`Banner ${index + 1}`} />;
                                    
                                    if (!hasLink) return imgEl;
                                    if (isExternal) return <a href={banner.link} target="_blank" rel="noopener noreferrer">{imgEl}</a>;
                                    return <Link href={banner.link}>{imgEl}</Link>;
                                })()}
                            </div>
                        ))}
                    </div>
                </div>

                {count > 1 && (
                    <>
                        <button className="cintillo-arrow cintillo-arrow-prev" onClick={() => go(-1)} aria-label="Anterior">
                            <ChevronLeft size={20} strokeWidth={1.5} />
                        </button>
                        <button className="cintillo-arrow cintillo-arrow-next" onClick={() => go(1)} aria-label="Siguiente">
                            <ChevronRight size={20} strokeWidth={1.5} />
                        </button>
                    </>
                )}
            </div>
        </section>
    );
};

export default CintilloCarousel;
