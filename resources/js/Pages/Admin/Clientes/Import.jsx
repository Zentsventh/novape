import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { Upload, FileText, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import '../../../../css/admin/admin.css';

export default function Import() {
    const [file, setFile] = useState(null);
    const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Success/Error
    const [loading, setLoading] = useState(false);
    
    // Preview Data
    const [headers, setHeaders] = useState([]);
    const [preview, setPreview] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [mapping, setMapping] = useState({});
    
    // Result Data
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/admin/clientes/importar/preview', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: formData
            });

            const data = await res.json();
            
            if (res.ok) {
                setHeaders(data.headers);
                setPreview(data.preview);
                setTotalRows(data.totalRows);
                setMapping(data.suggestedMapping || {});
                setStep(2);
            } else {
                alert(data.error || 'Error al procesar el archivo');
            }
        } catch (error) {
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async () => {
        if (!mapping.nombres) {
            alert("El campo 'Nombres' es obligatorio.");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);
        Object.entries(mapping).forEach(([key, val]) => {
            if (val) formData.append(`mapping[${key}]`, val);
        });

        try {
            const res = await fetch('/admin/clientes/importar/process', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: formData
            });

            const data = await res.json();
            
            if (res.ok) {
                setResult(data);
                setStep(3);
            } else {
                alert(data.error || 'Error al procesar la importación');
            }
        } catch (error) {
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const targetFields = [
        { key: 'nombres', label: 'Nombres (Requerido)', required: true },
        { key: 'apellidos', label: 'Apellidos', required: false },
        { key: 'email', label: 'Email', required: false },
        { key: 'telefono', label: 'Teléfono', required: false },
        { key: 'dni', label: 'DNI / Documento', required: false },
    ];

    return (
        <AdminLayout logoUrl={null}>
            <Head title="Importar Clientes CSV" />
            
            <div className="admin-page-header" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link href="/admin/clientes" className="admin-btn-secondary" style={{ padding: '8px' }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Importar Clientes</h1>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: 'var(--admin-bg-panel)', padding: '16px', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
                <div style={{ flex: 1, textAlign: 'center', fontWeight: step >= 1 ? 'bold' : 'normal', color: step >= 1 ? 'var(--admin-primary)' : 'var(--admin-text-muted)' }}>1. Subir Archivo</div>
                <div style={{ color: 'var(--admin-border)' }}>→</div>
                <div style={{ flex: 1, textAlign: 'center', fontWeight: step >= 2 ? 'bold' : 'normal', color: step >= 2 ? 'var(--admin-primary)' : 'var(--admin-text-muted)' }}>2. Mapear Columnas</div>
                <div style={{ color: 'var(--admin-border)' }}>→</div>
                <div style={{ flex: 1, textAlign: 'center', fontWeight: step === 3 ? 'bold' : 'normal', color: step === 3 ? 'var(--admin-primary)' : 'var(--admin-text-muted)' }}>3. Resultado</div>
            </div>

            {/* STEP 1: UPLOAD */}
            {step === 1 && (
                <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '40px', border: '1px solid var(--admin-border)', textAlign: 'center' }}>
                    <Upload size={48} color="var(--admin-text-muted)" style={{ margin: '0 auto 16px' }} />
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Sube tu archivo CSV</h2>
                    <p style={{ color: 'var(--admin-text-muted)', marginBottom: '24px' }}>El archivo debe contener columnas con los datos de los clientes.</p>
                    
                    <input 
                        type="file" 
                        accept=".csv, .txt" 
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        id="csv-upload"
                    />
                    <label 
                        htmlFor="csv-upload" 
                        className="admin-btn-secondary" 
                        style={{ display: 'inline-block', cursor: 'pointer', marginBottom: '16px', padding: '10px 24px' }}
                    >
                        {file ? file.name : 'Seleccionar Archivo'}
                    </label>

                    {file && (
                        <div style={{ marginTop: '24px' }}>
                            <button 
                                onClick={handleUpload} 
                                disabled={loading}
                                className="admin-btn-primary"
                                style={{ width: '100%', maxWidth: '300px' }}
                            >
                                {loading ? 'Procesando...' : 'Continuar al Mapeo'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* STEP 2: MAPPING */}
            {step === 2 && (
                <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', border: '1px solid var(--admin-border)', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px' }}>Mapeo de Columnas</h2>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                                Encontramos {totalRows} filas. Asocia las columnas de tu CSV con los campos del sistema.
                            </p>
                        </div>
                        <button 
                            onClick={handleProcess} 
                            disabled={loading}
                            className="admin-btn-primary"
                        >
                            {loading ? 'Importando...' : 'Comenzar Importación'}
                        </button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', padding: '24px' }}>
                        {/* Mapping Form */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {targetFields.map(field => (
                                <div key={field.key}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                                        {field.label}
                                    </label>
                                    <select 
                                        value={mapping[field.key] || ''}
                                        onChange={(e) => setMapping({...mapping, [field.key]: e.target.value})}
                                        className="admin-input"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">-- Ignorar --</option>
                                        {headers.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        {/* Data Preview */}
                        <div style={{ overflowX: 'auto', border: '1px solid var(--admin-border)', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--admin-bg-body)', textAlign: 'left' }}>
                                        {headers.map(h => (
                                            <th key={h} style={{ padding: '12px', borderBottom: '1px solid var(--admin-border)', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.map((row, idx) => (
                                        <tr key={idx}>
                                            {headers.map(h => (
                                                <td key={h} style={{ padding: '10px 12px', borderBottom: '1px solid var(--admin-border)' }}>
                                                    {row[h]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: RESULT */}
            {step === 3 && result && (
                <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '40px', border: '1px solid var(--admin-border)', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', padding: '20px', background: 'var(--admin-green-100)', borderRadius: '50%', marginBottom: '24px' }}>
                        <CheckCircle size={48} color="var(--admin-green-600)" />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Importación Completada</h2>
                    <p style={{ color: 'var(--admin-text-muted)', marginBottom: '32px', fontSize: '15px' }}>
                        Se importaron <strong>{result.imported}</strong> clientes correctamente. 
                        Se omitieron <strong>{result.skipped}</strong> filas.
                    </p>

                    {result.errors && result.errors.length > 0 && (
                        <div style={{ background: 'var(--admin-red-50)', padding: '16px', borderRadius: '8px', textAlign: 'left', marginBottom: '32px', border: '1px solid var(--admin-red-200)' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--admin-red-800)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={16} /> Detalles de Omisiones
                            </h3>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--admin-red-700)', fontSize: '13px' }}>
                                {result.errors.map((err, i) => <li key={i} style={{ marginBottom: '4px' }}>{err}</li>)}
                            </ul>
                        </div>
                    )}

                    <Link href="/admin/clientes" className="admin-btn-primary" style={{ display: 'inline-flex', padding: '12px 32px' }}>
                        Volver a la Lista de Clientes
                    </Link>
                </div>
            )}
        </AdminLayout>
    );
}
