import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import Header from '../../Components/Home/Header';
import Footer from '../../Components/Home/Footer';

export default function Devoluciones({ pedidos = [] }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        pedido_id: '',
        motivo: ''
    });

    const submit = (e) => {
        e.preventDefault();
        post('/perfil/devoluciones', {
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="layout-container" style={{ backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
            <Head title="Mis Devoluciones" />
            <Header />
            <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
                <div style={{ background: 'white', borderRadius: '12px', padding: 'clamp(0.75rem, 3vw, 1.875rem)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Solicitar Devolución / Garantía</h1>
                    
                    {flash?.success && (
                        <div style={{ background: '#dcfce7', color: '#166534', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: '500' }}>
                            {flash.success}
                        </div>
                    )}

                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Seleccionar Pedido</label>
                            <select value={data.pedido_id} onChange={e => setData('pedido_id', e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                <option value="">Seleccione un pedido entregado...</option>
                                {pedidos.map(pedido => (
                                    <option key={pedido.id} value={pedido.id}>Pedido #{pedido.codigo} - {pedido.total}</option>
                                ))}
                            </select>
                            {errors.pedido_id && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.pedido_id}</div>}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Motivo de la Devolución</label>
                            <textarea value={data.motivo} onChange={e => setData('motivo', e.target.value)} required rows="4" placeholder="Explique detalladamente por qué desea devolver el producto o usar la garantía..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical' }}></textarea>
                            {errors.motivo && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.motivo}</div>}
                        </div>

                        <button type="submit" disabled={processing} style={{ background: '#0073D8', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: processing ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
                            {processing ? 'Enviando solicitud...' : 'Enviar Solicitud de Devolución'}
                        </button>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
}
