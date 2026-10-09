<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket {{ $venta->codigo_ticket }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Courier New', Courier, monospace; /* Ideal para ticketeras */
        }
        body {
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
            padding: 20px;
        }
        .ticket {
            background-color: white;
            width: 80mm; /* Ancho estándar de ticketera */
            padding: 5mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .bold { font-weight: bold; }
        .mb-1 { margin-bottom: 5px; }
        .mb-2 { margin-bottom: 10px; }
        .mb-3 { margin-bottom: 15px; }
        .mt-2 { margin-top: 10px; }
        
        .logo {
            max-width: 150px;
            max-height: 60px;
            margin-bottom: 10px;
            filter: grayscale(100%);
        }
        .divider {
            border-top: 1px dashed #000;
            margin: 10px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            font-size: 12px;
            padding: 2px 0;
            vertical-align: top;
        }
        .item-name {
            display: block;
            width: 100%;
        }
        .info-text {
            font-size: 12px;
            line-height: 1.4;
        }
        .total-section {
            font-size: 14px;
        }
        .grand-total {
            font-size: 18px;
            font-weight: bold;
        }
        
        @media print {
            body { background: none; padding: 0; }
            .ticket { box-shadow: none; width: 80mm; padding: 0; margin: 0; }
        }
    </style>
</head>
<body onload="window.print()">
    <div class="ticket">
        <div class="text-center mb-2">
            @if($logoUrl)
                <img src="{{ $logoUrl }}" alt="Logo" class="logo">
            @else
                <h1 style="font-size: 18px;">{{ $nombreTienda }}</h1>
            @endif
            <p class="info-text bold">{{ strtoupper($venta->tipo_comprobante) }} DE VENTA</p>
            <p class="info-text">{{ $venta->codigo_ticket }}</p>
            <p class="info-text">{{ date('d/m/Y H:i', strtotime($venta->created_at)) }}</p>
        </div>

        <div class="divider"></div>

        <div class="info-text mb-2">
            <p><span class="bold">Cajero:</span> {{ $venta->cajero_nombre ?: 'Admin' }}</p>
            @if($venta->cliente_nombre)
            <p><span class="bold">Cliente:</span> {{ $venta->cliente_nombre }}</p>
            @if($venta->cliente_doc)
            <p><span class="bold">Doc:</span> {{ $venta->cliente_doc }}</p>
            @endif
            @else
            <p><span class="bold">Cliente:</span> Público General</p>
            @endif
        </div>

        <div class="divider"></div>

        <table>
            <thead>
                <tr>
                    <th class="text-left" style="width: 15%">CANT</th>
                    <th class="text-left" style="width: 55%">DESCRIPCIÓN</th>
                    <th class="text-right" style="width: 30%">IMPORTE</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $item)
                <tr>
                    <td class="text-left">{{ $item->cantidad }}</td>
                    <td class="text-left">
                        <span class="item-name">{{ substr($item->producto_nombre, 0, 25) }}</span>
                    </td>
                    <td class="text-right">S/ {{ number_format($item->subtotal, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="divider"></div>

        <table class="total-section">
            <tr>
                <td class="text-right bold" style="width: 60%">SUBTOTAL:</td>
                <td class="text-right">S/ {{ number_format($venta->subtotal, 2) }}</td>
            </tr>
            @if($venta->igv > 0)
            <tr>
                <td class="text-right bold">IGV (18%):</td>
                <td class="text-right">S/ {{ number_format($venta->igv, 2) }}</td>
            </tr>
            @endif
            <tr>
                <td class="text-right bold grand-total mt-2">TOTAL:</td>
                <td class="text-right bold grand-total mt-2">S/ {{ number_format($venta->total, 2) }}</td>
            </tr>
        </table>

        <div class="divider"></div>

        <div class="text-center info-text">
            <p>¡Gracias por su compra!</p>
            <p>Vuelva pronto a {{ $nombreTienda }}</p>
        </div>
        
        <br>
        <br>
    </div>
</body>
</html>
