import React, { useState, useEffect } from 'react';
import useStoreDialog from '../../Hooks/useStoreDialog';
import { Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_IMAGE } from './constants';
import '../../../css/home/quick-view.css';

export default function QuickViewModal({ product, isOpen, onClose, onAddToCart, adding = false }) {
    const panel = useStoreDialog(isOpen && !!product, onClose);
    const { errors } = usePage().props;
    const [quantity, setQuantity] = useState(1);
    const isAdding = adding;
    useEffect(() => { setQuantity(1); }, [product?.id, isOpen]);
    if (!product) return null;
    const maxPermitido = Math.min(5, product?.stock || 0);

    const formatPrice = (price) =>
        new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);

    const handleAdd = (e) => {
        // Call the parent's add to cart
        onAddToCart(product, quantity, e);
    };

    const goToProduct = () => {
        router.get(`/producto/${product.slug || product.id}`);
    };

    return (
        <AnimatePresence>
            {isOpen && product && (
                <motion.div 
                    className="efe-quick-view-overlay" 
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div 
                        ref={panel} role="dialog" aria-modal="true" aria-label={`Vista rápida: ${product.nombre}`} tabIndex={-1}
                        className="efe-quick-view-modal" 
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <button className="efe-quick-view-close" onClick={onClose} aria-label="Cerrar vista rápida">&times;</button>
                
                <div className="efe-qv-content">
                    <div className="efe-qv-image-side" onClick={goToProduct} style={{ cursor: 'pointer' }}>
                        <img 
                            src={product.imagen || DEFAULT_IMAGE} 
                            alt={product.nombre} 
                            className="efe-qv-main-img"
                        />
                        {product.descuento > 0 && (
                            <span className="efe-qv-discount">-{product.descuento}%</span>
                        )}
                    </div>
                    
                    <div className="efe-qv-info-side">
                        <div className="efe-qv-brand">{product.marca || 'Generico'}</div>
                        <h2 className="efe-qv-title" onClick={goToProduct} style={{ cursor: 'pointer' }}>{product.nombre}</h2>
                        {errors?.cart && <p role="alert">{errors.cart}</p>}
                        
                        <div className="efe-qv-prices">
                            {product.precio_anterior && product.precio_anterior > product.precio_actual && (
                                <span className="efe-qv-old-price">S/ {formatPrice(product.precio_anterior)}</span>
                            )}
                            <span className="efe-qv-current-price">S/ {formatPrice(product.precio_actual)}</span>
                        </div>
                        
                        <p className="efe-qv-desc">
                            {product.descripcion ? (product.descripcion.substring(0, 150) + '...') : 'Un excelente producto disponible ahora.'}
                        </p>

                        {product.stock > 0 && product.stock <= 5 && (
                            <div className="efe-qv-urgency">
                                ¡Date prisa! Solo quedan {product.stock} unidades.
                            </div>
                        )}

                        <div className="efe-qv-actions">
                            {product.stock > 0 ? (
                                <>
                                    <div className="efe-qv-primary-actions">
                                        <div className="efe-qv-qty">
                                            <button 
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                disabled={quantity <= 1}
                                            >-</button>
                                            <span>{quantity}</span>
                                            <button 
                                                onClick={() => setQuantity(Math.min(maxPermitido, quantity + 1))}
                                                disabled={quantity >= maxPermitido}
                                            >+</button>
                                        </div>
                                        
                                        <button 
                                            className="efe-qv-btn-secondary" 
                                            onClick={(e) => handleAdd(e)}
                                            disabled={isAdding}
                                        >
                                            {isAdding ? 'Agregando...' : 'Agregar al carrito'}
                                        </button>
                                    </div>
                                    <button 
                                        className="efe-qv-btn-primary efe-qv-buy-now" 
                                        onClick={(e) => {
                                            onAddToCart(product, quantity, e, true);
                                        }}
                                        disabled={isAdding}
                                    >
                                        Comprar ahora
                                    </button>
                                </>
                            ) : (
                                <button className="efe-qv-add-btn disabled" disabled style={{width: '100%'}}>
                                    Sin stock
                                </button>
                            )}
                        </div>
                        
                        <div className="efe-qv-more">
                            <Link href={`/producto/${product.slug || product.id}`}>Ver todos los detalles ➝</Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
        )}
        </AnimatePresence>
    );
}
