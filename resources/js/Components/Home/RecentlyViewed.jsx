import '../../../css/home/recently-viewed.css';
import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';

export default function RecentlyViewed() {
    const [viewed, setViewed] = useState([]);

    useEffect(() => {
        try {
            const data = localStorage.getItem('recently_viewed');
            if (data) {
                setViewed(JSON.parse(data));
            }
        } catch (e) {
            console.error("Error reading recently viewed", e);
        }
    }, []);

    if (viewed.length === 0) return null;

    return (
        <div className="efe-recently-viewed-section">
            <h3 className="efe-recently-viewed-title">Visto Recientemente</h3>
            <div className="efe-recently-viewed-stories">
                {viewed.map((prod) => (
                    <Link key={prod.id} href={`/producto/${prod.slug}`} className="efe-story-item">
                        <div className="efe-story-ring">
                            <img src={prod.imagen?.startsWith('http') || prod.imagen?.startsWith('/storage') || prod.imagen?.startsWith('/images') ? prod.imagen : `/storage/${prod.imagen}`} alt={prod.nombre} className="efe-story-img" />
                        </div>
                        <span className="efe-story-name">{prod.nombre.substring(0, 15)}...</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
