import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import TwentyCrmLayout from '../../../Layouts/TwentyCrmLayout';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        nombres: '',
        apellidos: '',
        email: '',
        password: '',
        tipo_documento: 'DNI',
        dni: '',
        telefono: '+51 ',
        telefono_secundario: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/admin/clientes');
    };

    return (
        <TwentyCrmLayout title="Nueva Persona">
            <Head title="Nueva Persona - CRM" />

            <style>{`
                .premium-container {
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                    font-family: inherit;
                }
                .premium-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                }
                .premium-title-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .premium-icon-box {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: #F0F9FF;
                    color: #004797;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #E0F2FE;
                    box-shadow: 0 2px 4px rgba(0, 71, 151, 0.05);
                }
                .premium-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #1E293B;
                    margin: 0;
                    letter-spacing: -0.02em;
                }
                .premium-back-link {
                    color: #64748B;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: color 0.2s ease;
                    padding: 8px 12px;
                    border-radius: 8px;
                }
                .premium-back-link:hover {
                    color: #1E293B;
                    background: #F1F5F9;
                }
                .premium-card {
                    background: #FFFFFF;
                    border-radius: 16px;
                    border: 1px solid #E2E8F0;
                    padding: 40px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02);
                }
                .premium-form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }
                .premium-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .premium-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #1E293B;
                }
                .premium-input {
                    padding: 12px 16px;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    font-size: 14px;
                    color: #1E293B;
                    background: #F8FAFC;
                    outline: none;
                    transition: all 0.2s ease;
                    width: 100%;
                    box-sizing: border-box;
                }
                .premium-input:focus {
                    border-color: #004797;
                    background: #FFFFFF;
                    box-shadow: 0 0 0 3px rgba(0, 71, 151, 0.15);
                }
                .premium-input::placeholder {
                    color: #94A3B8;
                }
                .premium-error {
                    color: #EF4444;
                    font-size: 12px;
                    margin-top: 4px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .premium-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 40px;
                    padding-top: 24px;
                    border-top: 1px solid #E2E8F0;
                }
                .premium-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px 24px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    text-decoration: none;
                    outline: none;
                }
                .premium-btn:active {
                    transform: translateY(0) scale(0.98);
                }
                .premium-btn-secondary {
                    background: #FFFFFF;
                    color: #475569;
                    border: 1px solid #E2E8F0;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
                }
                .premium-btn-secondary:hover {
                    background: #F8FAFC;
                    border-color: #CBD5E1;
                    color: #1E293B;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
                }
                .premium-btn-primary {
                    background: #004797;
                    color: #FFFFFF;
                    box-shadow: 0 2px 4px rgba(0, 71, 151, 0.2);
                }
                .premium-btn-primary:hover:not(:disabled) {
                    background: #00A2E8;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(0, 71, 151, 0.3);
                }
                .premium-btn-primary:disabled {
                    background: #94A3B8;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }
            `}</style>

            <div className="premium-container">
                <div className="premium-header">
                    <div className="premium-title-wrapper">
                        <div className="premium-icon-box">
                            <UserPlus size={24} />
                        </div>
                        <h1 className="premium-title">Añadir Persona</h1>
                    </div>
                    <Link href="/admin/clientes" className="premium-back-link">
                        <ArrowLeft size={16} />
                        Volver a Personas
                    </Link>
                </div>

                <div className="premium-card">
                    <form onSubmit={submit} autoComplete="off">
                        
                        <div className="premium-form-grid" style={{ marginBottom: '24px' }}>
                            <div className="premium-form-group">
                                <label className="premium-label">Nombres *</label>
                                <input
                                    type="text"
                                    value={data.nombres}
                                    onChange={e => setData('nombres', e.target.value)}
                                    className="premium-input"
                                    placeholder=""
                                    required
                                    autoComplete="off"
                                />
                                {errors.nombres && (
                                    <div className="premium-error">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                        {errors.nombres}
                                    </div>
                                )}
                            </div>
                            <div className="premium-form-group">
                                <label className="premium-label">Apellidos *</label>
                                <input
                                    type="text"
                                    value={data.apellidos}
                                    onChange={e => setData('apellidos', e.target.value)}
                                    className="premium-input"
                                    placeholder=""
                                    required
                                    autoComplete="off"
                                />
                                {errors.apellidos && (
                                    <div className="premium-error">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                        {errors.apellidos}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="premium-form-grid" style={{ marginBottom: '24px' }}>
                            <div className="premium-form-group">
                                <label className="premium-label">Email *</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="premium-input"
                                    placeholder="you@example.com"
                                    required
                                    autoComplete="new-password"
                                />
                                {errors.email && (
                                    <div className="premium-error">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                        {errors.email}
                                    </div>
                                )}
                            </div>
                            <div className="premium-form-group">
                                <label className="premium-label">Contraseña *</label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    className="premium-input"
                                    placeholder=""
                                    required
                                    autoComplete="new-password"
                                />
                                {errors.password && (
                                    <div className="premium-error">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                        {errors.password}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="premium-form-grid" style={{ marginBottom: '24px' }}>
                            <div className="premium-form-group">
                                <label className="premium-label">Documento de Identidad</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select
                                        value={data.tipo_documento}
                                        onChange={e => setData('tipo_documento', e.target.value)}
                                        className="premium-input"
                                        style={{ width: '130px', cursor: 'pointer' }}
                                    >
                                        <option value="DNI">DNI</option>
                                        <option value="RUC">RUC</option>
                                        <option value="CE">C.E.</option>
                                        <option value="PAS">PAS</option>
                                        <option value="OTRO">OTRO</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={data.dni}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (data.tipo_documento === 'DNI') {
                                                if (/^\d{0,8}$/.test(val)) {
                                                    setData('dni', val);
                                                }
                                            } else {
                                                setData('dni', val);
                                            }
                                        }}
                                        minLength={data.tipo_documento === 'DNI' ? 8 : undefined}
                                        maxLength={data.tipo_documento === 'DNI' ? 8 : undefined}
                                        className="premium-input"
                                        placeholder=""
                                        required={data.tipo_documento === 'DNI'}
                                    />
                                </div>
                                {errors.dni && (
                                    <div className="premium-error">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                        {errors.dni}
                                    </div>
                                )}
                            </div>
                            <div className="premium-form-group">
                                <label className="premium-label">Teléfono Principal</label>
                                <input
                                    type="text"
                                    value={data.telefono}
                                    onChange={e => setData('telefono', e.target.value)}
                                    className="premium-input"
                                    placeholder=""
                                />
                                {errors.telefono && (
                                    <div className="premium-error">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                        {errors.telefono}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="premium-form-grid">
                            <div className="premium-form-group">
                                <label className="premium-label">Teléfono Secundario <span style={{ color: '#94A3B8', fontWeight: 500 }}>(Opcional)</span></label>
                                <input
                                    type="text"
                                    value={data.telefono_secundario}
                                    onChange={e => setData('telefono_secundario', e.target.value)}
                                    className="premium-input"
                                    placeholder=""
                                />
                                {errors.telefono_secundario && (
                                    <div className="premium-error">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                        {errors.telefono_secundario}
                                    </div>
                                )}
                            </div>
                            <div className="premium-form-group">
                                {/* Espacio en blanco para cuadrar la grilla */}
                            </div>
                        </div>


                        <div className="premium-footer">
                            <Link href="/admin/clientes" className="premium-btn premium-btn-secondary">
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="premium-btn premium-btn-primary"
                            >
                                <Save size={18} />
                                {processing ? 'Guardando...' : 'Crear Persona'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </TwentyCrmLayout>
    );
}
