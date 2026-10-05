<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Comprobante</title>
    <style>
        /* Reset and Base */
        * { box-sizing: border-box; }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #000;
            margin: 0;
            padding: 40px;
        }

        /* Header Section */
        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
        }

        .company-info {
            width: 50%;
        }

        .company-info img {
            max-width: 180px;
            margin-bottom: 20px;
        }

        .company-info h2 {
            font-size: 14px;
            font-weight: bold;
            margin: 0 0 8px 0;
            text-transform: uppercase;
        }

        .company-info p {
            margin: 0 0 3px 0;
            font-size: 10px;
            color: #333;
        }

        .invoice-box {
            width: 40%;
            border: 1.5px solid #000;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            background-color: #f3f4f6; /* Light grey */
            -webkit-print-color-adjust: exact;
        }

        .invoice-box p {
            margin: 5px 0;
            font-size: 14px;
            font-weight: bold;
        }

        .invoice-box h1 {
            margin: 10px 0;
            font-size: 16px;
            text-transform: uppercase;
        }

        /* Client Info Section */
        .client-info {
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 30px;
        }

        .client-table {
            width: 100%;
        }

        .client-table td {
            padding: 4px 0;
            vertical-align: top;
        }

        .client-table .label {
            font-weight: bold;
            width: 120px;
        }

        /* Items Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .items-table th {
            background-color: #e5e7eb;
            -webkit-print-color-adjust: exact;
            border: 1px solid #ccc;
            padding: 10px;
            text-align: left;
            font-weight: bold;
        }
        
        .items-table th.text-right { text-align: right; }
        .items-table th.text-center { text-align: center; }

        .items-table td {
            border: 1px solid #ccc;
            padding: 10px;
        }

        .items-table td.text-right { text-align: right; }
        .items-table td.text-center { text-align: center; }

        /* Totals Section */
        .totals-section {
            width: 40%;
            float: right;
            margin-bottom: 30px;
        }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }

        .totals-table td {
            padding: 5px;
            text-align: right;
        }

        .totals-table .label {
            font-weight: bold;
        }

        /* Footer Info */
        .footer-info {
            clear: both;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .footer-left {
            width: 70%;
        }

        .footer-left p {
            margin: 0 0 10px 0;
        }

        .qr-code {
            width: 80px;
            height: 80px;
        }

        .observaciones {
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 10px 15px;
            margin-bottom: 30px;
        }

        .footer-text {
            text-align: center;
            font-size: 9px;
            color: #666;
            margin-top: 40px;
        }
    </style>
</head>
<body>

    <!-- Header -->
    <div class="header-section">
        <div class="company-info">
            @if(isset($logoBase64) && $logoBase64)
                <img src="{{ $logoBase64 }}" alt="Logo">
            @else
                <h1 style="font-size: 28px; margin: 0 0 15px 0;">NOVA PE</h1>
            @endif
            <h2>{{ $empresa['razon_social'] }}</h2>
            <p>{{ $empresa['direccion'] }}</p>
            <p>Lima - Perú</p>
            <p>Correo electrónico: {{ $empresa['email'] }}</p>
            <p>Teléfono: {{ $empresa['telefono'] }}</p>
        </div>
        
        <div class="invoice-box">
            <p>R.U.C. N° {{ $empresa['ruc'] }}</p>
            <h1>REGISTRO INTERNO — {{ strtoupper($pedido->tipo_comprobante ?? 'VENTA') }}</h1>
            <p>{{ $pedido->codigo }}</p>
        </div>
    </div>

    <!-- Client Info -->
    <div class="client-info">
        <table class="client-table">
            <tr>
                <td class="label">Fecha emisión</td>
                <td>: {{ $pedido->created_at ? $pedido->created_at->format('d/m/Y') : date('d/m/Y') }}</td>
                <td class="label" style="text-align: right; padding-right: 15px;">Método Pago</td>
                <td>: Tarjeta (Pasarela web)</td>
            </tr>
            <tr>
                <td class="label">Señor(es)</td>
                <td colspan="3">: {{ strtoupper($pedido->nombre_facturacion ?? trim(($pedido->usuario?->nombres ?? '') . ' ' . ($pedido->usuario?->apellidos ?? '')) ?: 'Cliente') }}</td>
            </tr>
            <tr>
                <td class="label">{{ strtoupper($pedido->tipo_comprobante ?? 'RUC/DNI') }}</td>
                <td colspan="3">: {{ $pedido->documento_cliente ?? ($pedido->usuario->dni ?? '---') }}</td>
            </tr>
            <tr>
                <td class="label">Dirección</td>
                <td colspan="3">: {{ strtoupper($pedido->direccion_facturacion ?? ($pedido->direccion_envio ?? '---')) }}</td>
            </tr>
        </table>
    </div>

    <!-- Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th class="text-center" style="width: 10%;">Cant.</th>
                <th class="text-center" style="width: 15%;">Unidad</th>
                <th class="text-center" style="width: 20%;">Código</th>
                <th style="width: 35%;">Descripción</th>
                <th class="text-right" style="width: 10%;">P.U.</th>
                <th class="text-right" style="width: 10%;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($pedido->items as $item)
            <tr>
                <td class="text-center">{{ number_format($item->cantidad, 2) }}</td>
                <td class="text-center">UNIDAD</td>
                <td class="text-center">{{ $item->sku ?? $item->variante?->sku ?? 'STD' }}</td>
                <td>{{ $item->producto_nombre ?? $item->variante?->producto?->nombre ?? 'Producto' }}</td>
                <td class="text-right">{{ number_format($item->precio_unitario, 2) }}</td>
                <td class="text-right">{{ number_format($item->subtotal, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section">
        <table class="totals-table">
            <tr>
                <td class="label">SUB TOTAL</td>
                <td style="width: 30px;">S/</td>
                <td>{{ number_format(($pedido->total - $pedido->costo_envio) / (1 + $igvPorcentaje / 100), 2) }}</td>
            </tr>
            <tr>
                <td class="label">I.G.V</td>
                <td>S/</td>
                <td>{{ number_format((($pedido->total - $pedido->costo_envio) / (1 + $igvPorcentaje / 100)) * ($igvPorcentaje / 100), 2) }}</td>
            </tr>
            @if($pedido->costo_envio > 0)
            <tr>
                <td class="label">ENVÍO</td>
                <td>S/</td>
                <td>{{ number_format($pedido->costo_envio, 2) }}</td>
            </tr>
            @endif
            <tr>
                <td class="label">TOTAL</td>
                <td>S/</td>
                <td>{{ number_format($pedido->total, 2) }}</td>
            </tr>
        </table>
    </div>

    <!-- Footer Info -->
    <div class="footer-info">
        <div class="footer-left">
            <p><strong>IMPORTE EN LETRAS:</strong> {{ $letras ?? '---' }} SOLES</p>
            <p style="margin-top: 15px;">Hash del comprobante: {{ md5($pedido->id . $pedido->codigo_pedido . time()) }}</p>
        </div>
        <div>
            @if(isset($qrBase64) && $qrBase64)
                <img src="{{ $qrBase64 }}" class="qr-code" alt="QR Code">
            @else
                <div style="width: 80px; height: 80px; border: 1px solid #ccc; display:flex; align-items:center; justify-content:center;">QR</div>
            @endif
        </div>
    </div>

    <!-- Observaciones -->
    <div class="observaciones">
        <strong>OBSERVACIONES:</strong> Pago realizado mediante plataforma online.
    </div>

    <div class="footer-text">
        Registro interno de venta. La emisión electrónica debe confirmarse con el proveedor de facturación.
    </div>

</body>
</html>
