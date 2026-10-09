import React from 'react';

export default function ProductCardSkeleton({ className = "efe-product-card" }) {
    return (
        <div className={className} style={{ pointerEvents: 'none', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
            <div className="efe-product-img-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
                <div className="efe-skeleton" style={{ width: '80%', height: '80%', borderRadius: '8px' }}></div>
            </div>
            <div className="efe-product-info">
                <div className="efe-skeleton" style={{ width: '40%', height: '12px', marginBottom: '8px' }}></div>
                <div className="efe-skeleton" style={{ width: '90%', height: '16px', marginBottom: '4px' }}></div>
                <div className="efe-skeleton" style={{ width: '70%', height: '16px', marginBottom: '12px' }}></div>
                
                <div className="efe-price-row">
                    <div className="efe-skeleton" style={{ width: '80px', height: '24px' }}></div>
                </div>
            </div>
            <div className="efe-product-actions">
                <div className="efe-skeleton" style={{ width: '100%', height: '36px', borderRadius: '6px' }}></div>
            </div>
        </div>
    );
}
