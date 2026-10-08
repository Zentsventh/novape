import React from 'react';
import { Link } from '@inertiajs/react';
import '../../../css/home/favorite-categories.css';

const FavoriteCategories = () => {
    const categories = [
        { img: '/storage/categorias_img/LB.webp', link: '/catalogo?categoria_id=229' },
        { img: '/storage/categorias_img/IMG_6666_1.webp', link: '/catalogo?categoria_id=127' },
        { img: '/storage/categorias_img/TELEVISORES.webp', link: '/catalogo?categoria_id=136' },
        { img: '/storage/categorias_img/ELECTRO.webp', link: '/catalogo?categoria_id=254' },
        { img: '/storage/categorias_img/LAPTOPS.webp', link: '/catalogo?categoria_id=148' },
        { img: '/storage/categorias_img/DORMITORIOS.webp', link: '/catalogo?categoria_id=413' },
    ];

    return (
        <section className="favorite-categories-section">
            <h2 className="section-title">Las categorías <strong>favoritas</strong></h2>
            <div className="favorite-categories-grid">
                {categories.map((cat, index) => (
                    <Link href={cat.link} key={index} className="favorite-category-card">
                        <img src={cat.img} alt={`Categoría ${index + 1}`} className="favorite-category-image" />
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default FavoriteCategories;
