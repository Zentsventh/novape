import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement, Filler } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import '../../../../css/admin/admin.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Title, Tooltip, Legend);

export default function Dashboard({ logoUrl, productos, categorias, demandaRaw, usuario_nombre }) {
    
    // Filtros
    const [selectedCategoria, setSelectedCategoria] = useState('todas');
    const [selectedMarca, setSelectedMarca] = useState('todas');
    const [selectedProducto, setSelectedProducto] = useState('todos');

    // Filtrar productos secuencialmente (Categoría -> Marca -> Producto)
    const filteredProductos = useMemo(() => {
        let filtrados = productos;
        if (selectedCategoria !== 'todas') {
            filtrados = filtrados.filter(p => String(p.categoria_id) === String(selectedCategoria));
        }
        if (selectedMarca !== 'todas') {
            filtrados = filtrados.filter(p => String(p.marca_id) === String(selectedMarca));
        }
        if (selectedProducto !== 'todos') {
            filtrados = filtrados.filter(p => String(p.producto_id) === String(selectedProducto));
        }
        return filtrados;
    }, [productos, selectedCategoria, selectedMarca, selectedProducto]);

    // Opciones dinámicas para los selectores basadas en la selección actual
    const marcasDisponibles = useMemo(() => {
        let base = productos;
        if (selectedCategoria !== 'todas') {
            base = base.filter(p => String(p.categoria_id) === String(selectedCategoria));
        }
        const marcasMap = new Map();
        base.forEach(p => {
            if (p.marca_id) marcasMap.set(p.marca_id, p.marca);
        });
        return Array.from(marcasMap, ([id, nombre]) => ({ id, nombre }));
    }, [productos, selectedCategoria]);

    const productosDisponibles = useMemo(() => {
        let base = productos;
        if (selectedCategoria !== 'todas') base = base.filter(p => String(p.categoria_id) === String(selectedCategoria));
        if (selectedMarca !== 'todas') base = base.filter(p => String(p.marca_id) === String(selectedMarca));
        
        const prodsMap = new Map();
        base.forEach(p => {
            if (p.producto_id) prodsMap.set(p.producto_id, p.producto_nombre);
        });
        return Array.from(prodsMap, ([id, nombre]) => ({ id, nombre }));
    }, [productos, selectedCategoria, selectedMarca]);

    // Métricas calculadas para la vista actual (global vs filtrada)
    const viewKpis = useMemo(() => {
        let stockDisp = 0;
        let costoTotal = 0;
        let unidadesVendidas = 0;
        let unidadesCompradas = 0;

        filteredProductos.forEach(p => {
            stockDisp += p.stock;
            costoTotal += (p.stock * p.precio_compra);
            unidadesVendidas += Number(p.unidades_vendidas || 0);
            unidadesCompradas += Number(p.unidades_compradas || 0);
        });

        let costoVentas = 0;
        filteredProductos.forEach(p => {
            costoVentas += (Number(p.unidades_vendidas || 0) * Number(p.precio_compra || 0));
        });
        
        let rotacionDias = 0;
        if (costoVentas > 0 && costoTotal > 0) {
            rotacionDias = Math.round((costoTotal / costoVentas) * 365);
        }

        return {
            costo_total: costoTotal,
            stock_disponible: stockDisp,
            unidades_vendidas: unidadesVendidas,
            unidades_compradas: unidadesCompradas,
            rotacion_dias: rotacionDias > 365 ? 365 : rotacionDias // Cap at 365 for visual
        };
    }, [filteredProductos]);

    // Función helper para determinar el eje X de las gráficas (Drill-down inteligente)
    const getGroupKey = (p) => {
        if (selectedCategoria === 'todas') return p.categoria || 'Sin Categoría';
        if (selectedMarca === 'todas') {
            // Si el producto no tiene marca, agruparlo por su nombre para no colapsar todos en 'Sin Marca'
            return (p.marca && p.marca !== 'Sin Marca') ? p.marca : (p.producto_nombre || 'Sin Nombre');
        }
        return p.producto_nombre || 'Producto';
    };

    const getGroupLabel = () => {
        if (selectedCategoria === 'todas') return 'Categorías';
        if (selectedMarca === 'todas') return 'Marcas';
        return 'Productos';
    };

    // Data para "Costo Total Inventario por Categorías" (Gráfico barras superior izq)
    const costoPorCategoria = useMemo(() => {
        const aggs = {};
        if (selectedCategoria === 'todas') {
            categorias.forEach(c => aggs[c.nombre] = 0);
        } else if (selectedMarca === 'todas') {
            marcasDisponibles.forEach(m => aggs[m.nombre] = 0);
        } else if (selectedProducto === 'todos') {
            productosDisponibles.forEach(p => aggs[p.nombre] = 0);
        } else {
            const prod = productosDisponibles.find(p => String(p.id) === String(selectedProducto));
            if (prod) aggs[prod.nombre] = 0;
        }

        filteredProductos.forEach(p => {
            const key = getGroupKey(p);
            if (aggs[key] !== undefined) {
                aggs[key] += (p.stock * p.precio_compra);
            } else {
                aggs[key] = (p.stock * p.precio_compra);
            }
        });
        const sorted = Object.entries(aggs).sort((a,b) => b[1] - a[1]);
        return {
            labels: sorted.map(i => i[0]),
            datasets: [{
                label: 'Costo Total',
                data: sorted.map(i => i[1]),
                backgroundColor: '#004797'
            }]
        };
    }, [filteredProductos, selectedCategoria, selectedMarca, categorias, marcasDisponibles, productosDisponibles]);

    // Data para "Inventario Disponible por Categoría" (Barras Horizontales inf izq)
    const inventarioPorCategoria = useMemo(() => {
        const aggs = {};
        if (selectedCategoria === 'todas') {
            categorias.forEach(c => aggs[c.nombre] = 0);
        } else if (selectedMarca === 'todas') {
            marcasDisponibles.forEach(m => aggs[m.nombre] = 0);
        } else if (selectedProducto === 'todos') {
            productosDisponibles.forEach(p => aggs[p.nombre] = 0);
        } else {
            const prod = productosDisponibles.find(p => String(p.id) === String(selectedProducto));
            if (prod) aggs[prod.nombre] = 0;
        }

        filteredProductos.forEach(p => {
            const key = getGroupKey(p);
            if (aggs[key] !== undefined) {
                aggs[key] += p.stock;
            } else {
                aggs[key] = p.stock;
            }
        });
        const sorted = Object.entries(aggs).sort((a,b) => b[1] - a[1]);
        return {
            labels: sorted.map(i => i[0]),
            datasets: [{
                label: 'Stock Disponible',
                data: sorted.map(i => i[1]),
                backgroundColor: '#66D2FF',
                indexAxis: 'y'
            }]
        };
    }, [filteredProductos, selectedCategoria, selectedMarca, categorias, marcasDisponibles, productosDisponibles]);

    // Data para "Demanda por Categoría" (Área chart centro)
    const demandaChartData = useMemo(() => {
        // Build array of last 15 days strings
        const dates = [];
        for (let i = 14; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]); // YYYY-MM-DD
        }

        const validProductIds = new Set(filteredProductos.map(p => p.id));
        
        // Sum demand per day matching active products
        const aggregatedDemand = dates.map(dateStr => {
            const daySales = demandaRaw.filter(dr => dr.fecha === dateStr && validProductIds.has(dr.variante_id));
            return daySales.reduce((sum, dr) => sum + Number(dr.cantidad), 0);
        });

        // Format labels for UI (e.g. 15 jul)
        const formatLabel = (dateStr) => {
            const d = new Date(dateStr + 'T12:00:00Z');
            return d.getDate() + ' ' + d.toLocaleString('es-ES', { month: 'short' }).substring(0,3);
        };

        return {
            labels: dates.map(formatLabel),
            datasets: [{
                label: 'Demanda',
                data: aggregatedDemand,
                borderColor: '#0082B8', 
                backgroundColor: 'rgba(0, 71, 151, 0.2)',
                fill: true,
                tension: 0.4
            }]
        };
    }, [filteredProductos, demandaRaw]);

    // Data para "Inventario Óptimo por Categoría" (Combo chart derecha)
    const optimoPorCategoria = useMemo(() => {
        const aggs = {};
        if (selectedCategoria === 'todas') {
            categorias.forEach(c => aggs[c.nombre] = { actual: 0, minimo: 0 });
        } else if (selectedMarca === 'todas') {
            marcasDisponibles.forEach(m => aggs[m.nombre] = { actual: 0, minimo: 0 });
        } else if (selectedProducto === 'todos') {
            productosDisponibles.forEach(p => aggs[p.nombre] = { actual: 0, minimo: 0 });
        } else {
            const prod = productosDisponibles.find(p => String(p.id) === String(selectedProducto));
            if (prod) aggs[prod.nombre] = { actual: 0, minimo: 0 };
        }

        filteredProductos.forEach(p => {
            const key = getGroupKey(p);
            if (!aggs[key]) aggs[key] = { actual: 0, minimo: 0 };
            aggs[key].actual += p.stock;
            aggs[key].minimo += p.stock_minimo;
        });
        const sorted = Object.entries(aggs).sort((a,b) => b[1].actual - a[1].actual);
        return {
            labels: sorted.map(i => i[0]),
            datasets: [
                {
                    type: 'line',
                    label: 'Stock Mínimo',
                    data: sorted.map(i => i[1].minimo),
                    borderColor: '#003A66', // Azul muy oscuro
                    borderDash: [5, 5],
                    pointBackgroundColor: '#003A66',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                },
                {
                    type: 'bar',
                    label: 'Stock Actual',
                    data: sorted.map(i => i[1].actual),
                    backgroundColor: sorted.map(i => {
                        // Si no hay minimo definido (0), gris neutral. Si esta ok, cyan. Si bajo, azul claro.
                        if (i[1].minimo === 0) return '#A0AEC0'; 
                        return i[1].actual > i[1].minimo ? '#004797' : '#B3E9FF';
                    }),
                }
            ]
        };
    }, [filteredProductos, selectedCategoria, selectedMarca, categorias, marcasDisponibles, productosDisponibles]);

    // KPIs Stock Óptimo inferior
    const opt_disp = filteredProductos.reduce((s,p) => s + p.stock, 0);
    const opt_min = filteredProductos.reduce((s,p) => s + p.stock_minimo, 0);
    const opt_seg = filteredProductos.reduce((s,p) => s + p.stock_seguridad, 0);
    const opt_rep = filteredProductos.reduce((s,p) => {
        const falta = p.stock_maximo - p.stock;
        return s + (falta > 0 ? falta : 0);
    }, 0);

    const formatShort = (val) => {
        return Number(val).toLocaleString('en-US');
    };

    const halfDoughnutOptions = {
        rotation: -90,
        circumference: 180,
        cutout: '75%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        maintainAspectRatio: false
    };

    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title="Inventario Dashboard" />

            <div style={{ padding: '20px', fontFamily: '"Inter", sans-serif', background: '#F4F7F6', minHeight: '100vh' }}>
                
                {/* Header Navbar */}
                <div style={{ 
                    background: 'linear-gradient(90deg, #4FD1C5 0%, #2B6CB0 100%)', 
                    borderRadius: '12px', 
                    padding: '15px 30px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    color: 'white',
                    marginBottom: '20px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>Inventario <span style={{ fontWeight: 'normal', fontSize: '20px' }}>Dashboard</span></h1>
                    </div>
                    <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                            {/* Filtro Categoría */}
                            <div>
                                <div style={{ fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}>Categoría</div>
                                <select 
                                    value={selectedCategoria} 
                                    onChange={e => {
                                        setSelectedCategoria(e.target.value);
                                        setSelectedMarca('todas');
                                        setSelectedProducto('todos');
                                    }}
                                    style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '4px', padding: '5px 10px', outline: 'none', fontSize: '13px' }}
                                >
                                    <option value="todas" style={{ color: 'black' }}>Todas las categorías</option>
                                    {categorias.map(c => <option key={c.id} value={c.id} style={{ color: 'black' }}>{c.nombre}</option>)}
                                </select>
                            </div>
                            
                            {/* Filtro Marca */}
                            <div>
                                <div style={{ fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}>Marca</div>
                                <select 
                                    value={selectedMarca} 
                                    onChange={e => {
                                        setSelectedMarca(e.target.value);
                                        setSelectedProducto('todos');
                                    }}
                                    style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '4px', padding: '5px 10px', outline: 'none', fontSize: '13px' }}
                                >
                                    <option value="todas" style={{ color: 'black' }}>Todas las marcas</option>
                                    {marcasDisponibles.map(m => <option key={m.id} value={m.id} style={{ color: 'black' }}>{m.nombre}</option>)}
                                </select>
                            </div>

                            {/* Filtro Producto */}
                            <div>
                                <div style={{ fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}>Producto</div>
                                <select 
                                    value={selectedProducto} 
                                    onChange={e => setSelectedProducto(e.target.value)}
                                    style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '4px', padding: '5px 10px', outline: 'none', fontSize: '13px', maxWidth: '200px' }}
                                >
                                    <option value="todos" style={{ color: 'black' }}>Todos los productos</option>
                                    {productosDisponibles.map(p => <option key={p.id} value={p.id} style={{ color: 'black' }}>{p.nombre}</option>)}
                                </select>
                            </div>

                            {/* Botón Limpiar */}
                            <button 
                                onClick={() => {
                                    setSelectedCategoria('todas');
                                    setSelectedMarca('todas');
                                    setSelectedProducto('todos');
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', 
                                    borderRadius: '4px', padding: '5px 12px', fontSize: '13px', cursor: 'pointer', height: '30px', transition: '0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                                onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                            >
                                Limpiar
                            </button>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Autor:</div>
                            <div style={{ fontSize: '14px' }}>{usuario_nombre}</div>
                        </div>
                    </div>
                </div>

                {/* Top KPIs Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    {/* Costo Total */}
                    <div style={{ background: 'white', borderRadius: '8px', display: 'flex', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <div style={{ background: '#0082B8', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><line x1="12" y1="18" x2="12" y2="22"></line><line x1="12" y1="2" x2="12" y2="6"></line></svg>
                        </div>
                        <div style={{ padding: '15px', flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#718096', marginBottom: '5px' }}>Valor de Inventario</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2D3748' }}>S/ {Number(viewKpis.costo_total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>
                    </div>
                    {/* Stock Disponible */}
                    <div style={{ background: 'white', borderRadius: '8px', display: 'flex', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <div style={{ background: '#004797', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                        </div>
                        <div style={{ padding: '15px', flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#718096', marginBottom: '5px' }}>Stock Disponible</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2D3748' }}>{Number(viewKpis.stock_disponible).toLocaleString('es-PE')}</div>
                        </div>
                    </div>
                    {/* Rotación Inventario */}
                    <div style={{ background: 'white', borderRadius: '8px', padding: '15px', border: '1px solid #E2E8F0', textAlign: 'center', position: 'relative' }}>
                        <div style={{ fontSize: '12px', color: '#718096', marginBottom: '10px' }}>Rotación Inventario (Días)</div>
                        <div style={{ height: '70px', position: 'relative' }}>
                            <Doughnut data={{ datasets: [{ data: [viewKpis.rotacion_dias, Math.max(365 - viewKpis.rotacion_dias, 0)], backgroundColor: ['#0082B8', '#E2E8F0'], borderWidth: 0 }] }} options={halfDoughnutOptions} />
                            <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#0082B8' }}>{viewKpis.rotacion_dias}</div>
                        </div>
                    </div>
                    {/* Unidades Vendidas */}
                    <div style={{ background: 'white', borderRadius: '8px', padding: '15px', border: '1px solid #E2E8F0', textAlign: 'center', position: 'relative' }}>
                        <div style={{ fontSize: '12px', color: '#718096', marginBottom: '10px' }}>Unidades Vendidas</div>
                        <div style={{ height: '70px', position: 'relative' }}>
                            <Doughnut data={{ datasets: [{ data: [viewKpis.unidades_vendidas, viewKpis.unidades_compradas], backgroundColor: ['#004797', '#E2E8F0'], borderWidth: 0 }] }} options={halfDoughnutOptions} />
                            <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#004797' }}>{formatShort(viewKpis.unidades_vendidas)}</div>
                        </div>
                    </div>
                    {/* Unidades Compradas */}
                    <div style={{ background: 'white', borderRadius: '8px', padding: '15px', border: '1px solid #E2E8F0', textAlign: 'center', position: 'relative' }}>
                        <div style={{ fontSize: '12px', color: '#718096', marginBottom: '10px' }}>Unidades Compradas</div>
                        <div style={{ height: '70px', position: 'relative' }}>
                            <Doughnut data={{ datasets: [{ data: [viewKpis.unidades_compradas, viewKpis.unidades_vendidas], backgroundColor: ['#66D2FF', '#E2E8F0'], borderWidth: 0 }] }} options={halfDoughnutOptions} />
                            <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#66D2FF' }}>{formatShort(viewKpis.unidades_compradas)}</div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grids */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', gridAutoRows: '300px' }}>
                    
                    {/* Top Left: Valor de Inventario por Categoria */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '12px', color: '#4A5568', margin: '0 0 15px 0' }}>Valor de Inventario por {getGroupLabel()}</h3>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Bar 
                                data={costoPorCategoria} 
                                options={{ 
                                    maintainAspectRatio: false, 
                                    plugins: { legend: { display: false } },
                                    scales: { y: { display: false, grid: { display: false } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } }
                                }} 
                            />
                        </div>
                    </div>

                    {/* Top Center: Demanda por Categoria */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '12px', color: '#4A5568', margin: '0 0 15px 0' }}>Demanda en los últimos 15 días</h3>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Line 
                                data={demandaChartData} 
                                options={{ 
                                    maintainAspectRatio: false, 
                                    plugins: { legend: { display: false } },
                                    scales: { y: { display: false, grid: { display: false } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } }
                                }} 
                            />
                        </div>
                    </div>

                    {/* Right Column spanning 2 rows: Inventario Optimo */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '15px', gridRow: 'span 2', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '13px', color: '#4A5568', margin: '0 0 5px 0' }}>Inventario Óptimo por {getGroupLabel()}</h3>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#718096', marginBottom: '15px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: '#004797', borderRadius: '50%' }}></div> Stock Actual (Bueno)</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: '#B3E9FF', borderRadius: '50%' }}></div> Stock Bajo</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: '#A0AEC0', borderRadius: '50%' }}></div> Sin Mínimo</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: '#003A66', borderRadius: '50%' }}></div> Stock Mínimo</span>
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Bar 
                                data={optimoPorCategoria} 
                                options={{ 
                                    maintainAspectRatio: false, 
                                    plugins: { legend: { display: false } },
                                    scales: { y: { display: false, grid: { display: false } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } }
                                }} 
                            />
                        </div>
                    </div>

                    {/* Bottom Left: Inventario Disponible */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '12px', color: '#4A5568', margin: '0 0 15px 0' }}>Inventario Disponible por {getGroupLabel()}</h3>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Bar 
                                data={inventarioPorCategoria} 
                                options={{ 
                                    maintainAspectRatio: false,
                                    indexAxis: 'y',
                                    plugins: { legend: { display: false } },
                                    scales: { x: { display: false, grid: { display: false } }, y: { grid: { display: false }, ticks: { font: { size: 10 } } } }
                                }} 
                            />
                        </div>
                    </div>

                    {/* Bottom Center: Stock Optimo Grid */}
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '14px', color: '#4A5568', margin: '0 0 15px 0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', background: '#004797', borderRadius: '50%' }}></div> Stock Óptimo
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: 1 }}>
                            <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ background: '#004797', color: 'white', fontSize: '11px', padding: '5px' }}>Inv. Disponible</div>
                                <div style={{ padding: '10px', fontSize: '16px', fontWeight: 'bold' }}>{Number(opt_disp).toLocaleString('es-PE')}</div>
                            </div>
                            <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ background: '#0082B8', color: 'white', fontSize: '11px', padding: '5px' }}>Inv. Mínimo</div>
                                <div style={{ padding: '10px', fontSize: '16px', fontWeight: 'bold' }}>{Number(opt_min).toLocaleString('es-PE')}</div>
                            </div>
                            <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ background: '#66D2FF', color: '#003A66', fontSize: '11px', padding: '5px' }}>Inv. Seguridad</div>
                                <div style={{ padding: '10px', fontSize: '16px', fontWeight: 'bold' }}>{Number(opt_seg).toLocaleString('es-PE')}</div>
                            </div>
                            <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ background: '#B3E9FF', color: '#003A66', fontSize: '11px', padding: '5px' }}>Por Reponer</div>
                                <div style={{ padding: '10px', fontSize: '16px', fontWeight: 'bold' }}>{Number(opt_rep).toLocaleString('es-PE')}</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
