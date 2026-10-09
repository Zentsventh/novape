<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Ticket POS</title>
    <style>
        @page {
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            color: #000;
            margin: 0;
            padding: 10px 5px; /* Slight padding to prevent cutting text at edges */
            width: 70mm; /* Leave a little margin inside the 80mm */
            margin: 0 auto;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        
        .logo {
            text-align: center;
            margin-bottom: 5px;
        }
        .logo img {
            max-width: 60mm; /* fit inside ticket */
            height: auto;
        }
        
        .company-name {
            font-size: 14px;
            font-weight: bold;
            margin: 5px 0;
        }
        
        .company-details {
            font-size: 10px;
            line-height: 1.2;
            margin-bottom: 10px;
        }
        
        .title {
            font-size: 12px;
            font-weight: bold;
            margin: 10px 0 5px 0;
        }
        
        .divider {
            border-top: 1px dashed #000;
            margin: 5px 0;
        }
        
        .info-table {
            width: 100%;
            font-size: 10px;
            line-height: 1.3;
        }
        .info-table td {
            vertical-align: top;
        }
        
        .items-table {
            width: 100%;
            font-size: 10px;
            border-collapse: collapse;
            margin: 10px 0;
        }
        .items-table th {
            border-bottom: 1px dashed #000;
            border-top: 1px dashed #000;
            padding: 3px 0;
            text-align: left;
        }
        .items-table td {
            padding: 3px 0;
            vertical-align: top;
        }
        
        .totals-table {
            width: 100%;
            font-size: 10px;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 2px 0;
        }
        .totals-table .total-row {
            font-weight: bold;
            font-size: 12px;
        }
        
        .letras {
            font-size: 10px;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .qr-code {
            text-align: center;
            margin: 15px 0;
        }
        .qr-code img {
            width: 35mm;
            height: 35mm;
        }
        
        .footer {
            font-size: 9px;
            text-align: center;
            line-height: 1.3;
            margin-top: 10px;
        }
    </style>
</head>
<body>

    <div class="logo">
        @if($logoBase64)
            <img src="{{ $logoBase64 }}" alt="Logo">
        @else
            <div class="company-name">{{ $empresa['razon_social'] }}</div>
        @endif
    </div>

    <div class="text-center company-details">
        <div class="bold">{{ $empresa['razon_social'] }}</div>
        {{ $empresa['direccion'] }}<br>
        Correo electrónico: {{ $empresa['email'] }}<br>
        Teléfono: {{ $empresa['telefono'] }}<br>
        R.U.C. N° {{ $empresa['ruc'] }}
    </div>

    <div class="text-center title">
        @if($venta->tipo_comprobante === 'factura')
            REGISTRO INTERNO — FACTURA
        @elseif($venta->tipo_comprobante === 'boleta')
            REGISTRO INTERNO — BOLETA
        @else
            TICKET DE VENTA
        @endif
        <br>
        {{ $venta->codigo_ticket }}
    </div>

    <div class="divider"></div>

    <div class="text-left" style="font-size:10px; margin-bottom: 5px;">
        {{ \Carbon\Carbon::parse($venta->created_at)->format('d/m/Y H:i:s') }}
    </div>

    <div class="divider"></div>

    <table class="info-table">
        <tr>
            <td width="30%" class="bold">Cliente:</td>
            <td width="70%">{{ $nombreCliente }}</td>
        </tr>
        <tr>
            <td class="bold">Doc:</td>
            <td>{{ $docCliente }}</td>
        </tr>
        <tr>
            <td class="bold">Dirección:</td>
            <td>{{ $venta->cliente_direccion ?? '---' }}</td>
        </tr>
        <tr>
            <td class="bold">Cajero:</td>
            <td>{{ $venta->cajero_nombre ?? '---' }}</td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th width="12%">Cant.</th>
                <th width="48%">DESCRIPCIÓN</th>
                <th width="20%" class="text-right">P.Unit</th>
                <th width="20%" class="text-right">TOTAL</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $item)
            <tr>
                <td>{{ number_format($item->cantidad, 2) }}</td>
                <td>{{ \Illuminate\Support\Str::limit($item->producto_nombre, 25) }}</td>
                <td class="text-right">{{ number_format($item->precio_unitario, 2) }}</td>
                <td class="text-right">{{ number_format($item->subtotal, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-table" style="width: 100%; border-collapse: collapse; margin-top: 5px;">
        <tr>
            
            <td style="text-align: left; width: 45%;">SUB TOTAL</td>
            <td style="text-align: right; width: 55%; white-space: nowrap;">S/&nbsp;{{ number_format($operacionesGravadas, 2) }}</td>
        </tr>
        <tr>
            
            <td style="text-align: left; width: 45%;">I.G.V ({{ $igvPorcentaje }}%)</td>
            <td style="text-align: right; width: 55%; white-space: nowrap;">S/&nbsp;{{ number_format($igvCalculado, 2) }}</td>
        </tr>
        <tr class="total-row">
            
            <td style="text-align: left; width: 45%;">TOTAL</td>
            <td style="text-align: right; width: 55%; white-space: nowrap;">S/&nbsp;{{ number_format($total, 2) }}</td>
        </tr>
    </table>

    <div class="letras">
        IMPORTE EN LETRAS <br> {{ $importeEnLetras }}
    </div>

    <div class="qr-code">
        <img src="{{ $qrBase64 }}" alt="QR">
    </div>

    <div class="text-center" style="font-size: 10px; font-weight: bold; margin-bottom: 5px;">
        ¡Gracias por su preferencia!
    </div>

    <div class="footer">
        Registro interno de venta.<br>
        La emisión electrónica debe confirmarse con el proveedor de facturación.<br>
        Consulte este registro mediante el código QR.
    </div>

</body>
</html>
