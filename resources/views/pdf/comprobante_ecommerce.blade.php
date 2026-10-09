<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; color: #1a1a1a; font-size: 11px; }
        .page { width: 100%; max-width: 210mm; margin: 0 auto; background: white; padding: 30px 40px; }

        /* Header */
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e0e0e0; padding-bottom: 20px; margin-bottom: 25px; }
        .logo-section { display: flex; align-items: center; gap: 15px; }
        .logo-section img { height: 50px; }
        .company-info { color: #555; font-size: 9px; line-height: 1.6; }
        .company-name { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 3px; }

        /* Comprobante badge */
        .comprobante-badge { text-align: right; }
        .comprobante-tipo { background: #333; color: white; padding: 8px 20px; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border-radius: 4px; display: inline-block; margin-bottom: 8px; }
        .comprobante-serie { font-size: 12px; color: #333; font-weight: 600; }
        .comprobante-fecha { font-size: 10px; color: #666; margin-top: 4px; }

        /* Info rows */
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
        .info-box { background: #fafafa; border: 1px solid #eee; border-radius: 6px; padding: 15px; }
        .info-box-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; font-weight: 700; margin-bottom: 8px; }
        .info-box-value { font-size: 11px; color: #333; line-height: 1.6; }
        .info-box-value strong { color: #1a1a1a; }

        /* Table */
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        .items-table thead th { background: #333; color: white; padding: 10px 12px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        .items-table thead th:last-child, .items-table thead th:nth-child(3), .items-table thead th:nth-child(4) { text-align: right; }
        .items-table tbody td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 10px; color: #444; }
        .items-table tbody td:last-child, .items-table tbody td:nth-child(3), .items-table tbody td:nth-child(4) { text-align: right; font-weight: 500; }
        .items-table tbody tr:nth-child(even) { background: #fafafa; }
        .items-table tbody tr:hover { background: #f0f0f0; }

        /* Totals */
        .totals-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
        .qr-section { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .qr-section img { width: 100px; height: 100px; }
        .qr-label { font-size: 8px; color: #999; text-align: center; }
        .totals-box { width: 280px; }
        .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 10px; color: #555; }
        .total-row.grand { border-top: 2px solid #333; padding-top: 10px; margin-top: 5px; font-size: 14px; font-weight: 700; color: #1a1a1a; }
        .total-label { }
        .total-value { font-weight: 600; }

        /* Importe en letras */
        .letras { background: #fafafa; border: 1px solid #eee; border-radius: 4px; padding: 10px 15px; font-size: 9px; color: #555; font-style: italic; margin-bottom: 25px; }

        /* Footer */
        .footer { border-top: 2px solid #e0e0e0; padding-top: 15px; text-align: center; }
        .footer-text { font-size: 9px; color: #999; line-height: 1.6; }
        .footer-thanks { font-size: 12px; font-weight: 600; color: #333; margin-bottom: 8px; }
    </style>
</head>
<body>
    <div class="page">
        <!-- Header -->
        <div class="header">
            <div class="logo-section">
                @if($logoBase64)
                    <img src="{{ $logoBase64 }}" alt="Novape">
                @endif
                <div>
                    <div class="company-name">{{ $empresa['razon_social'] }}</div>
                    <div class="company-info">
                        RUC: {{ $empresa['ruc'] }}<br>
                        {{ $empresa['direccion'] }}<br>
                        {{ $empresa['telefono'] }} | {{ $empresa['email'] }}
                    </div>
                </div>
            </div>
            <div class="comprobante-badge">
                <div class="comprobante-tipo">{{ $tipo_comprobante }}</div>
                <div class="comprobante-serie">N° {{ $pedido->codigo }}</div>
                <div class="comprobante-fecha">Fecha: {{ $pedido->created_at->format('d/m/Y H:i') }}</div>
            </div>
        </div>

        <!-- Info Grid -->
        <div class="info-grid">
            <div class="info-box">
                <div class="info-box-title">Datos del Cliente</div>
                <div class="info-box-value">
                    <strong>{{ $nombreCliente }}</strong><br>
                    Documento: {{ $docCliente }}<br>
                    @if($pedido->usuario)
                        Email: {{ $pedido->usuario->email }}
                    @endif
                </div>
            </div>
            <div class="info-box">
                <div class="info-box-title">Datos del Envío</div>
                <div class="info-box-value">
                    @php
                        $dir = is_array($pedido->direccion_envio_snapshot) ? $pedido->direccion_envio_snapshot : json_decode($pedido->direccion_envio_snapshot ?? '{}', true);
                    @endphp
                    @if(!empty($dir))
                        {{ $dir['direccion'] ?? '' }}<br>
                        {{ $dir['distrito'] ?? '' }}, {{ $dir['provincia'] ?? '' }}<br>
                        {{ $dir['departamento'] ?? '' }}
                    @else
                        Recojo en tienda
                    @endif
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 10%;">Cant.</th>
                    <th style="width: 50%;">Descripción</th>
                    <th style="width: 20%;">P. Unit.</th>
                    <th style="width: 20%;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $item)
                <tr>
                    <td>{{ $item->cantidad }}</td>
                    <td>
                        @if($item->producto_nombre)
                            {{ $item->producto_nombre }}
                        @elseif($item->variante && $item->variante->producto)
                            {{ $item->variante->producto->nombre }}
                            @if($item->variante->talla || $item->variante->color)
                                <span style="color: #999;"> — {{ $item->variante->talla }} {{ $item->variante->color }}</span>
                            @endif
                        @else
                            Producto
                        @endif
                    </td>
                    <td>S/ {{ number_format($item->precio_unitario, 2) }}</td>
                    <td>S/ {{ number_format($item->precio_unitario * $item->cantidad, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals + QR -->
        <div class="totals-section">
            <div class="qr-section">
                <img src="{{ $qrBase64 }}" alt="QR Code">
                <div class="qr-label">Escanea para verificar<br>este comprobante</div>
            </div>
            <div class="totals-box">
                <div class="total-row">
                    <span class="total-label">Op. Gravadas</span>
                    <span class="total-value">S/ {{ number_format($operacionesGravadas, 2) }}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">IGV (18%)</span>
                    <span class="total-value">S/ {{ number_format($igvCalculado, 2) }}</span>
                </div>
                @if($pedido->costo_envio > 0)
                <div class="total-row">
                    <span class="total-label">Envío</span>
                    <span class="total-value">S/ {{ number_format($pedido->costo_envio, 2) }}</span>
                </div>
                @endif
                @if($pedido->descuento > 0)
                <div class="total-row">
                    <span class="total-label">Descuento</span>
                    <span class="total-value" style="color: #e11d48;">-S/ {{ number_format($pedido->descuento, 2) }}</span>
                </div>
                @endif
                <div class="total-row grand">
                    <span class="total-label">TOTAL</span>
                    <span class="total-value">S/ {{ number_format($total, 2) }}</span>
                </div>
            </div>
        </div>

        <!-- Importe en letras -->
        <div class="letras">{{ $importeEnLetras }}</div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-thanks">¡Gracias por tu compra en NOVAPE!</div>
            <div class="footer-text">
                Registro interno de venta. La emisión electrónica debe confirmarse con el proveedor de facturación.<br>
                {{ $empresa['direccion'] }} | {{ $empresa['telefono'] }} | {{ $empresa['email'] }}<br>
                {{ $empresa['horario'] }}
            </div>
        </div>
    </div>
</body>
</html>
