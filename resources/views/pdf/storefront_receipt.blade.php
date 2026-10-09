<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Comprobante {{ $pedido->codigo }}</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            color: #000;
            font-size: 11px;
            margin: 0;
            padding: 20px;
        }
        .header-table {
            width: 100%;
            margin-bottom: 15px;
            border-collapse: collapse;
        }
        .company-info {
            width: 55%;
            vertical-align: top;
        }
        .company-info img {
            max-width: 220px;
            max-height: 80px;
            margin-bottom: 15px;
        }
        .company-name {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .company-details {
            font-size: 10px;
            line-height: 1.4;
        }
        .invoice-box {
            width: 45%;
            vertical-align: top;
            padding-left: 20px;
        }
        .invoice-details {
            border: 1px solid #999;
            border-radius: 8px;
            background-color: #EAEAEA;
            text-align: center;
            padding: 15px 10px;
        }
        .invoice-details h2 {
            margin: 8px 0;
            font-size: 15px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .invoice-details p {
            margin: 0;
            font-size: 15px;
            font-weight: bold;
        }
        .client-info-box {
            border: 1px solid #999;
            border-radius: 8px;
            padding: 8px 12px;
            margin-bottom: 15px;
        }
        .client-info-table {
            width: 100%;
            font-size: 10px;
            border-collapse: collapse;
        }
        .client-info-table td {
            padding: 3px 0;
            vertical-align: top;
        }
        .client-label {
            width: 110px;
            font-weight: bold;
        }
        .items-box {
            border: 1px solid #999;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 15px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
        }
        .items-table th {
            background-color: #EAEAEA;
            color: #000;
            padding: 6px 8px;
            text-align: left;
            font-size: 10px;
            border-bottom: 1px solid #999;
        }
        .items-table td {
            padding: 6px 8px;
            font-size: 10px;
            vertical-align: top;
        }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        
        .totals-table {
            width: 100%;
            border-collapse: collapse;
            border-top: 1px solid #999;
        }
        .totals-table td {
            padding: 4px 8px;
            font-size: 10px;
        }
        .totals-label {
            font-weight: bold;
            text-align: right;
        }
        .totals-currency {
            text-align: center;
            width: 20px;
        }
        .totals-value {
            text-align: right;
            width: 60px;
        }
        .layout-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .layout-table td {
            vertical-align: top;
        }
        .letras-box {
            border: 1px solid #999;
            border-radius: 8px;
            padding: 8px 12px;
            height: 90px;
        }
        .letras-title {
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
        }
        .qr-cell {
            width: 110px;
            text-align: right;
            padding-left: 10px;
        }
        .qr-cell img {
            width: 105px;
            height: 105px;
            border: 1px solid #ccc;
            padding: 2px;
            border-radius: 4px;
        }
        .observaciones-box {
            border: 1px solid #999;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 10px;
            min-height: 25px;
        }
        .footer-text {
            text-align: center;
            font-size: 10px;
            margin-top: 15px;
            color: #333;
        }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td class="company-info">
                @if($logo)
                    <img src="{{ $logo }}" alt="Logo">
                @endif
                <div class="company-name">{{ $empresa['razon_social'] }}</div>
                <div class="company-details">
                    {{ $empresa['direccion'] }}<br>
                    ATENCIÓN AL CLIENTE<br>
                    Correo electrónico: {{ $empresa['email'] }}<br>
                    Teléfono: {{ $empresa['telefono'] }}
                </div>
            </td>
            <td class="invoice-box">
                <div class="invoice-details">
                    <p>R.U.C. N° {{ $empresa['ruc'] }}</p>
                    <h2>
                        @if($receipt->tipo === 'factura')
                            FACTURA ELECTRÓNICA
                        @elseif($receipt->tipo === 'boleta')
                            BOLETA DE VENTA ELECTRÓNICA
                        @else
                            TICKET DE VENTA
                        @endif
                    </h2>
                    <p>{{ $receipt->serie && $receipt->numero ? $receipt->serie.'-'.$receipt->numero : $receipt->codigo_ticket }}</p>
                </div>
            </td>
        </tr>
    </table>

    <div class="client-info-box">
        <table class="client-info-table">
            <tr>
                <td class="client-label">Fecha emisión</td>
                <td>: {{ $receipt->created_at->format('d/m/Y') }}</td>
            </tr>
            <tr>
                <td class="client-label">Señor(es)</td>
                <td>: {{ $snapshot['nombre_cliente'] }}</td>
            </tr>
            <tr>
                <td class="client-label">{{ $receipt->cliente_tipo_documento }}</td>
                <td>: {{ $snapshot['documento_cliente'] }}</td>
            </tr>
            <tr>
                <td class="client-label">Dirección</td>
                <td>: {{ $snapshot['direccion_cliente'] ?: ($pedido->direccion_envio_snapshot['direccion'] ?? 'Retiro en tienda') }}</td>
            </tr>
        </table>
    </div>

    <div class="items-box">
        <table class="items-table">
            <thead>
                <tr>
                    <th width="8%" class="text-center">Cant.</th>
                    <th width="12%" class="text-center">Unidad</th>
                    <th width="15%">Código</th>
                    <th width="35%">Descripción</th>
                    <th width="15%" class="text-right">P.U.</th>
                    <th width="15%" class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $item)
                <tr>
                    <td class="text-center">{{ $item['cantidad'] }}</td>
                    <td class="text-center">UNIDAD</td>
                    <td>{{ $item['sku'] ?: '---' }}</td>
                    <td>{{ $item['producto_nombre'] }}</td>
                    <td class="text-right">{{ number_format($item['precio_unitario'], 2) }}</td>
                    <td class="text-right">{{ number_format($item['cantidad'] * $item['precio_unitario'], 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        
        <table class="totals-table">
            <tr>
                <td colspan="4"></td>
                <td class="totals-label">SUB TOTAL</td>
                <td class="totals-currency">S/</td>
                <td class="totals-value">{{ number_format($receipt->operaciones_gravadas, 2) }}</td>
            </tr>
            <tr>
                <td colspan="4"></td>
                <td class="totals-label">I.G.V ({{ $snapshot['igv_porcentaje'] ?? 18 }}%)</td>
                <td class="totals-currency">S/</td>
                <td class="totals-value">{{ number_format($receipt->igv, 2) }}</td>
            </tr>
            <tr>
                <td colspan="4"></td>
                <td class="totals-label">TOTAL</td>
                <td class="totals-currency">S/</td>
                <td class="totals-value">{{ number_format($receipt->total, 2) }}</td>
            </tr>
        </table>
    </div>

    <table class="layout-table">
        <tr>
            <td style="padding-right: 10px;">
                <div class="letras-box">
                    <span class="letras-title">IMPORTE EN LETRAS:</span>
                    <br><br>
                    SON: {{ mb_strtoupper($letras, 'UTF-8') }}
                </div>
            </td>
            <td class="qr-cell">
                <img src="{{ $qr }}" alt="QR Code">
            </td>
        </tr>
    </table>

    <div class="observaciones-box">
        <strong>OBSERVACIONES:</strong> {{ $receipt->estado_sunat === 'aceptado' ? 'Comprobante electrónico emitido.' : 'Pendiente de emisión electrónica.' }} Pedido origen: {{ $pedido->codigo }}. Pago confirmado por Niubiz, Ref: {{ $payment?->purchase_number ?: $pedido->codigo }}.
    </div>

    <div class="footer-text">
        Representación impresa de la @if($receipt->tipo === 'factura') Factura electrónica @elseif($receipt->tipo === 'boleta') Boleta de venta electrónica @else Nota de Venta @endif. Consulte su documento en <strong>https://novape.me/comprobantes</strong>
    </div>

</body>
</html>
