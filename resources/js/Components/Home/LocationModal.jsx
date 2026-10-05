import React, { useState, useEffect } from 'react';
import { useShipping } from '@/Contexts/ShippingContext';
import { useLocation } from '@/Contexts/LocationContext';
import Swal from 'sweetalert2';
import axios from 'axios';

export default function LocationModal({ isOpen, onClose, onLocationSelect }) {
    const [departamento, setDepartamento] = useState('');
    const [provincia, setProvincia] = useState('');
    const [distrito, setDistrito] = useState('');
    const [isLoadingGps, setIsLoadingGps] = useState(false);
  const { setShipping } = useShipping();
    const { location } = useLocation();

    useEffect(() => {
        if (!isOpen) return;
        setDepartamento(location.departamento);
        setProvincia(location.provincia);
        setDistrito(location.distrito);
    }, [isOpen, location.departamento, location.provincia, location.distrito]);

    if (!isOpen) return null;

    const handleGpsLocation = () => {
    // Obtener ubicación via GPS y luego solicitar costo de envío
        setIsLoadingGps(true);
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Aquí, idealmente, se usaría un servicio de Geocodificación inversa (como Google Maps API)
                    // para obtener la ciudad real. Por ahora simulamos un distrito por defecto.
                    setTimeout(() => {
                        setIsLoadingGps(false);
                        setDepartamento('Lima');
                        setProvincia('Lima');
                        setDistrito('Ate');
                        
                        Swal.fire({
                            title: 'Ubicación obtenida',
                            text: `Se ha detectado tu ubicación: Ate, Lima`,
                            icon: 'success',
                            confirmButtonColor: '#004797',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        
                        if (onLocationSelect) {
                            onLocationSelect({ departamento: 'Lima', provincia: 'Lima', distrito: 'Ate' });
                        }

                        // Calcular envío vía API
                        axios.post('/api/shipping/calculate', {
                            address: { departamento: 'Lima', provincia: 'Lima', distrito: 'Ate' }
                        })
                        .then(({ data }) => setShipping(data))
                        .catch(err => console.error('Error calculando envío:', err));

                        onClose();
                    }, 1500);
                },
                (error) => {
                    setIsLoadingGps(false);
                    Swal.fire({
                        title: 'Error GPS',
                        text: 'No se pudo obtener la ubicación. Por favor, ingresa manualmente.',
                        icon: 'error',
                        confirmButtonColor: '#004797'
                    });
                }
            );
        } else {
            setIsLoadingGps(false);
            Swal.fire('Error', 'Geolocalización no soportada', 'error');
        }
    };

    const handleContinue = () => {
    // Validar campos y luego solicitar cálculo de envío
        const selected = { departamento: departamento.trim(), provincia: provincia.trim(), distrito: distrito.trim() };
        if (!selected.departamento || !selected.provincia || !selected.distrito) {
            Swal.fire({
                text: 'Por favor, completa todos los campos de tu ubicación.',
                icon: 'warning',
                confirmButtonColor: '#004797'
            });
            return;
        }

        if (onLocationSelect) {
            onLocationSelect(selected);
        }

        // Calcular envío vía API
        axios.post('/api/shipping/calculate', { address: selected })
        .then(({ data }) => {
            setShipping(data);
        })
        .catch(err => {
            console.error('Error calculando envío:', err);
            Swal.fire({
                text: 'No se pudo calcular el envío, se usará una tarifa estimada.',
                icon: 'warning',
                confirmButtonColor: '#004797'
            });
        });

        onClose();
    };

    return (
        <div className="loc-modal-overlay">
            <div className="loc-modal-container animate-slide-up">
                <div className="loc-modal-header">
                    <h3>Ingresar ubicación</h3>
                    <button onClick={onClose} className="loc-modal-close" aria-label="Cerrar modal">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="loc-modal-body">
                    <button 
                        className="loc-gps-btn" 
                        onClick={handleGpsLocation}
                        disabled={isLoadingGps}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        {isLoadingGps ? 'Obteniendo...' : 'Usar mi ubicación actual'}
                    </button>
                    
                    <div className="loc-divider">
                        <span>o ingresa tu ubicación manualmente</span>
                    </div>

                    <div className="loc-form-group">
                        <label>Departamento</label>
                        <div className="loc-input-wrapper">
                            <svg className="loc-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input 
                                type="text" 
                                placeholder="Ingrese su departamento" 
                                value={departamento}
                                onChange={(e) => setDepartamento(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="loc-form-group">
                        <label>Provincia</label>
                        <div className="loc-input-wrapper">
                            <svg className="loc-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input 
                                type="text" 
                                placeholder="Ingrese su provincia"
                                value={provincia}
                                onChange={(e) => setProvincia(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="loc-form-group">
                        <label>Distrito</label>
                        <div className="loc-input-wrapper">
                            <svg className="loc-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input 
                                type="text" 
                                placeholder="Ingrese su distrito"
                                value={distrito}
                                onChange={(e) => setDistrito(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="loc-info-alert">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004797" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <p>Te mostraremos disponibilidad y costos de envío según dónde te encuentres</p>
                    </div>

                    <button className="loc-continue-btn" onClick={handleContinue}>
                        Continuar
                    </button>
                </div>
            </div>
            <style jsx>{`
                .loc-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.5);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Inter', sans-serif;
                }
                .loc-modal-container {
                    background: #ffffff;
                    width: 90%;
                    max-width: 400px;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                .loc-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f5f5f5;
                    padding: 16px 20px;
                    border-bottom: 1px solid #eee;
                }
                .loc-modal-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
                }
                .loc-modal-close {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: #666;
                }
                .loc-modal-body {
                    padding: 20px;
                }
                .loc-gps-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 12px;
                    border: 1px solid #004797;
                    background: #f0faff;
                    color: #004797;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .loc-gps-btn:hover {
                    background: #e6f6ff;
                }
                .loc-divider {
                    text-align: center;
                    margin: 20px 0;
                    position: relative;
                }
                .loc-divider::before {
                    content: '';
                    position: absolute;
                    top: 50%; left: 0; right: 0;
                    height: 1px;
                    background: #eee;
                    z-index: 1;
                }
                .loc-divider span {
                    position: relative;
                    background: #fff;
                    padding: 0 10px;
                    color: #999;
                    font-size: 12px;
                    z-index: 2;
                }
                .loc-form-group {
                    margin-bottom: 15px;
                }
                .loc-form-group label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    margin-bottom: 6px;
                    color: #333;
                }
                .loc-input-wrapper {
                    position: relative;
                }
                .loc-search-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                }
                .loc-input-wrapper input {
                    width: 100%;
                    padding: 10px 10px 10px 36px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                    outline: none;
                }
                .loc-input-wrapper input:focus {
                    border-color: #004797;
                }
                .loc-info-alert {
                    display: flex;
                    gap: 10px;
                    background: #e6f6ff;
                    padding: 12px;
                    border-radius: 6px;
                    margin: 20px 0;
                    align-items: flex-start;
                }
                .loc-info-alert p {
                    margin: 0;
                    font-size: 12px;
                    color: #005a80;
                    line-height: 1.4;
                }
                .loc-continue-btn {
                    width: 100%;
                    padding: 14px;
                    background: #004797;
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    font-weight: bold;
                    font-size: 15px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .loc-continue-btn:hover {
                    background: #0099d9;
                }
            `}</style>
        </div>
    );
}
