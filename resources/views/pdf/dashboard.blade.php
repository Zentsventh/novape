<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte Gerencial Dashboard</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #000000;
            background-color: #ffffff;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000000;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header img {
            max-height: 60px;
        }
        .header-content h1 {
            margin: 0;
            font-size: 20px;
            color: #000000;
            text-transform: uppercase;
        }
        .header-content p {
            margin: 5px 0 0 0;
            color: #333333;
            font-size: 12px;
        }
        
        .section-title {
            font-size: 14px;
            color: #000000;
            border-bottom: 1px solid #000000;
            padding-bottom: 8px;
            margin-bottom: 15px;
            margin-top: 35px;
            text-transform: uppercase;
            font-weight: bold;
        }

        /* Resumen Financiero - Blanco y Negro */
        .summary-grid {
            display: table;
            width: 100%;
            margin-bottom: 30px;
            border-spacing: 10px;
        }
        .summary-row {
            display: table-row;
        }
        .summary-card {
            display: table-cell;
            background: #ffffff;
            padding: 10px;
            border: 1px solid #000000;
            width: 23%;
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 8px 0;
            font-size: 10px;
            color: #000000;
            text-transform: uppercase;
        }
        .summary-card .value {
            font-size: 16px;
            font-weight: bold;
            color: #000000;
            margin: 0;
        }
        
        /* Tablas - Estilo minimalista monocromo */
        table {
            width: 100%;
            border-collapse: collapse;
            background: #ffffff;
            border: 1px solid #000000;
            margin-bottom: 20px;
            page-break-inside: auto;
        }
        tr {
            page-break-inside: avoid;
            page-break-after: auto;
        }
        th, td {
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid #cccccc;
        }
        th {
            background-color: #f2f2f2;
            color: #000000;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
        }
        td {
            font-size: 10px;
            color: #000000;
        }
        /* Estado en blanco y negro */
        .status-badge {
            padding: 2px 4px;
            border: 1px solid #000000;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            background: #ffffff;
            color: #000000;
        }
        
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #000000;
            border-top: 1px solid #000000;
            padding-top: 15px;
        }
    </style>
</head>
<body>

    <div class="header">
        <div class="header-content">
            <h1>Reporte Gerencial Dashboard</h1>
            <p>Periodo filtrado: {{ $startDate }} al {{ $endDate }}</p>
        </div>
        <div>
            @if(isset($logoBase64) && $logoBase64)
                <img src="{{ $logoBase64 }}" alt="Logo">
            @endif
        </div>
    </div>

    <div class="section-title">Resumen Financiero</div>
    <div class="summary-grid">
        <div class="summary-row">
            <div class="summary-card">
                <h3>Ventas E-commerce</h3>
                <p class="value">S/ {{ number_format($ventasWeb, 2) }}</p>
            </div>
            <div class="summary-card">
                <h3>Ventas POS</h3>
                <p class="value">S/ {{ number_format($ventasPos, 2) }}</p>
            </div>
            <div class="summary-card">
                <h3>Costos y Gastos</h3>
                <p class="value">S/ {{ number_format($costosTotal, 2) }}</p>
            </div>
            <div class="summary-card">
                <h3>Balance comercial</h3>
                <p class="value">S/ {{ number_format($gananciaNeta, 2) }}</p>
            </div>
        </div>
    </div>

    <!-- Módulo 2: Top Productos -->
    <div class="section-title">Productos Más Vendidos (Top 6)</div>
    <table>
        <thead>
            <tr>
                <th>Producto / Variante</th>
                <th style="text-align: right;">Cantidad Vendida</th>
            </tr>
        </thead>
        <tbody>
            @foreach($topProductosVendidos as $top)
            <tr>
                <td><strong>{{ $top['nombre'] }}</strong></td>
                <td style="text-align: right;">{{ $top['cantidad'] }} unid.</td>
            </tr>
            @endforeach
            @if(count($topProductosVendidos) === 0)
            <tr>
                <td colspan="2" style="text-align: center; color: #555;">No hay ventas registradas en este periodo.</td>
            </tr>
            @endif
        </tbody>
    </table>

    <!-- Módulo 3: Stock Crítico -->
    @if(isset($stockBajo) && count($stockBajo) > 0)
    <div class="section-title">Alerta de Stock Crítico (<= 5)</div>
    <table>
        <thead>
            <tr>
                <th>Producto / Variante</th>
                <th style="text-align: right;">Stock Actual</th>
            </tr>
        </thead>
        <tbody>
            @foreach($stockBajo as $bajo)
            <tr>
                <td><strong>{{ $bajo['nombre'] }}</strong></td>
                <td style="text-align: right;">{{ $bajo['stock'] }} unid.</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <!-- Módulo 4: Pedidos -->
    <div class="section-title">Últimos Pedidos E-commerce ({{ $pedidosCount }} Totales en periodo)</div>
    <table>
        <thead>
            <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th style="text-align: right;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($pedidos as $p)
            <tr>
                <td><strong>{{ $p['codigo'] }}</strong></td>
                <td>{{ $p['usuario_nombre'] }}</td>
                <td>{{ \Carbon\Carbon::parse($p['created_at'])->format('d/m/Y H:i') }}</td>
                <td>
                    <span class="status-badge">{{ $p['estado'] }}</span>
                </td>
                <td style="text-align: right;">S/ {{ number_format($p['total'], 2) }}</td>
            </tr>
            @endforeach
            @if(count($pedidos) === 0)
            <tr>
                <td colspan="5" style="text-align: center; color: #555;">No hay pedidos en este periodo.</td>
            </tr>
            @endif
        </tbody>
    </table>

    <div class="footer">
        Generado el {{ date('d/m/Y H:i:s') }} - Documento Interno de Toma de Decisiones
    </div>

</body>
</html>
