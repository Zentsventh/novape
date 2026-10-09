import React from 'react';

const LoadingSpinner = () => (
  <div className="spinner" aria-label="Cargando...">
    <svg viewBox="0 0 50 50" className="spinner-svg">
      <circle className="spinner-circle" cx="25" cy="25" r="20" fill="none" strokeWidth="5" />
    </svg>
  </div>
);

export default LoadingSpinner;
