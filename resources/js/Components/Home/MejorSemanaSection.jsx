import ProductCarousel from './ProductCarousel';

/* Renderiza la sección "Lo mejor de la semana" con productos en promoción. */
export default function MejorSemanaSection({ productos }) {
    if (!productos || productos.length === 0) return null;

    return (
        <section className="efe-category-section efe-animate-in">
            <div className="efe-section-header">
                <div className="efe-section-icon efe-section-icon--highlight">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div>
                    <h2 className="efe-section-title">Lo mejor de la semana</h2>
                </div>
            </div>

            <ProductCarousel products={productos} />
        </section>
    );
}
