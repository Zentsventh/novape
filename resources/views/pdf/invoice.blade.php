<!DOCTYPE html>
<html lang="es">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Comprobante</title>
    <style>
        /* Tipografía nítida y base */
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            color: #111;
            margin: 0;
            padding: 30px 40px;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
        }

        /* Utilidades para PDF */
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; }
        
        .box {
            border: 1px solid #004797;
            border-radius: 6px;
            padding: 10px 15px;
            margin-bottom: 15px;
        }

        /* HEADER */
        .header-table { margin-bottom: 25px; }
        .header-table td { vertical-align: middle; }
        .logo-cell { width: 55%; padding-right: 20px; }
        .ruc-cell { width: 45%; }

        .logo-img { max-width: 220px; margin-bottom: 10px; }
        .empresa-nombre { font-size: 14px; font-weight: bold; margin-bottom: 5px; color: #004797; }
        .empresa-datos { font-size: 11px; line-height: 1.4; color: #111; }

        .ruc-box {
            border: 2px solid #004797;
            border-radius: 8px;
            text-align: center;
            padding: 0;
            overflow: hidden;
        }
        .ruc-box p.ruc-top {
            font-size: 16px;
            font-weight: bold;
            margin: 12px 0;
            color: #111;
        }
        .ruc-box .ruc-middle {
            background-color: #004797;
            color: #ffffff;
            font-size: 15px;
            font-weight: bold;
            padding: 8px 0;
            margin: 0;
            text-transform: uppercase;
        }
        .ruc-box p.ruc-bottom {
            font-size: 16px;
            font-weight: bold;
            margin: 12px 0;
            color: #111;
        }

        /* CLIENTE */
        .client-box {
            padding: 12px 15px;
        }
        .client-table td {
            padding: 3px 0;
            font-size: 11px;
        }
        .client-label { width: 100px; font-weight: bold; color: #004797; }
        .client-value { width: 300px; }
        .client-label-right { width: 120px; font-weight: bold; text-align: right; padding-right: 10px; color: #004797; }

        /* ITEMS */
        .items-table { margin-bottom: 15px; border: 1px solid #004797; border-radius: 6px; overflow: hidden; }
        .items-table th {
            background-color: #004797;
            color: #ffffff;
            padding: 8px 10px;
            font-weight: bold;
            border-bottom: 1px solid #004797;
            text-align: left;
            font-size: 11px;
        }
        .items-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #eee;
            font-size: 11px;
        }
        .text-center { text-align: center !important; }
        .text-right { text-align: right !important; }

        /* TOTALES */
        .totals-container {
            width: 100%;
        }
        .totals-table {
            width: 40%;
            float: right;
            margin-bottom: 20px;
        }
        .totals-table td {
            padding: 4px 8px;
            font-size: 12px;
        }
        .totals-label { font-weight: bold; text-align: right; color: #004797; }
        .totals-currency { width: 20px; text-align: center; }
        .totals-value { text-align: right; width: 80px; }

        .clearfix::after { content: ""; display: table; clear: both; }

        /* HASH Y QR */
        .footer-box {
            margin-top: 10px;
            padding: 15px;
        }
        .hash-table { width: 100%; }
        .hash-text { width: 80%; vertical-align: top; }
        .hash-qr { width: 20%; text-align: right; vertical-align: top; }
        
        .qr-img { width: 90px; height: 90px; }
        
        .importe-letras { font-weight: bold; font-size: 11px; margin-bottom: 25px; }

        /* OBSERVACIONES */
        .obs-box { padding: 10px 15px; margin-bottom: 20px; border: 1px solid #ccc; }

        /* FOOTER FINAL */
        .footer-legal {
            text-align: center;
            font-size: 10px;
            color: #666;
            margin-top: 20px;
        }
    </style>
</head>
<body>

    <!-- CABECERA -->
    <table class="header-table">
        <tr>
            <td class="logo-cell" style="vertical-align: top;">
                @if(isset($logoBase64) && $logoBase64)
                    <img src="{{ $logoBase64 }}" class="logo-img" alt="Logo">
                @else
                    <h1 style="font-size: 32px; margin: 0 0 10px 0; letter-spacing: 2px; color: #004797;">NOVAPE</h1>
                @endif
                <div class="empresa-nombre">{{ strtoupper($empresa['razon_social'] ?? 'NOVAPE S.A.C.') }}</div>
                <div class="empresa-datos">
                    {!! nl2br(e($empresa['direccion'] ?? 'Av. José Carlos Mariátegui, Lote 60 Zona A, Lima - Perú')) !!}<br>
                    Correo electrónico: {{ $empresa['email'] ?? 'atencionalcliente@novape.pe' }}<br>
                    Teléfono: {{ $empresa['telefono'] ?? '+51 986 784 384' }}
                </div>
            </td>
            <td class="ruc-cell" style="vertical-align: top;">
                <div class="ruc-box">
                    <p class="ruc-top">R.U.C. N° {{ $empresa['ruc'] ?? '20123456789' }}</p>
                    <div class="ruc-middle">{{ strtoupper($pedido->tipo_comprobante ?? 'FACTURA') === 'BOLETA' ? 'BOLETA DE VENTA ELECTRÓNICA' : 'FACTURA ELECTRÓNICA' }}</div>
                    <p class="ruc-bottom">{{ $pedido->comprobante_serie ?? ($pedido->tipo_comprobante == 'Factura' ? 'F001' : 'B001') }}-{{ str_pad($pedido->comprobante_correlativo ?? $pedido->id, 8, '0', STR_PAD_LEFT) }}</p>
                </div>
            </td>
        </tr>
    </table>

    <!-- CLIENTE -->
    <div class="box client-box">
        <table class="client-table">
            <tr>
                <td class="client-label">Fecha emisión</td>
                <td class="client-value">: {{ $pedido->created_at ? $pedido->created_at->format('d/m/Y') : date('d/m/Y') }}</td>
                <td class="client-label-right">Forma de pago</td>
                <td>: CONTADO</td>
            </tr>
            <tr>
                <td class="client-label">Señor(es)</td>
                <td colspan="3">: {{ strtoupper($pedido->nombre_facturacion ?? trim(($pedido->usuario?->nombres ?? '') . ' ' . ($pedido->usuario?->apellidos ?? '')) ?: 'Cliente') }}</td>
            </tr>
            <tr>
                <td class="client-label">{{ strtoupper($pedido->tipo_comprobante ?? 'FACTURA') === 'BOLETA' ? 'DNI/CE' : 'RUC' }}</td>
                <td class="client-value">: {{ $pedido->documento_cliente ?? ($pedido->usuario->dni ?? '---') }}</td>
                <td class="client-label-right">Moneda</td>
                <td>: SOLES (PEN)</td>
            </tr>
            <tr>
                <td class="client-label">Dirección</td>
                <td colspan="3">: {{ strtoupper($pedido->direccion_facturacion ?? ($pedido->direccion_envio ?? '---')) }}</td>
            </tr>
        </table>
    </div>

    <!-- ITEMS -->
    <table class="items-table">
        <thead>
            <tr>
                <th class="text-center" style="width: 8%;">Cant.</th>
                <th style="width: 12%;">Unidad</th>
                <th style="width: 18%;">Código</th>
                <th style="width: 42%;">Descripción</th>
                <th class="text-right" style="width: 10%;">P.U.</th>
                <th class="text-right" style="width: 10%;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($pedido->items as $item)
            <tr>
                <td class="text-center">{{ number_format($item->cantidad, 2) }}</td>
                <td>UNIDAD</td>
                <td>{{ $item->sku ?? $item->variante?->sku ?? 'STD' }}</td>
                <td>{{ $item->producto_nombre ?? $item->variante?->producto?->nombre ?? 'Producto' }}</td>
                <td class="text-right">{{ number_format($item->precio_unitario, 2) }}</td>
                <td class="text-right">{{ number_format($item->subtotal, 2) }}</td>
            </tr>
            @endforeach
            @if($pedido->costo_envio > 0)
            <tr>
                <td class="text-center">1.00</td>
                <td>UNIDAD</td>
                <td>ENVIO-01</td>
                <td>Costo de envío</td>
                <td class="text-right">{{ number_format($pedido->costo_envio, 2) }}</td>
                <td class="text-right">{{ number_format($pedido->costo_envio, 2) }}</td>
            </tr>
            @endif
        </tbody>
    </table>

    <!-- TOTALES -->
    <div class="totals-container clearfix">
        <table class="totals-table">
            <tr>
                <td class="totals-label">SUB TOTAL</td>
                <td class="totals-currency">S/</td>
                <td class="totals-value">{{ number_format(($pedido->total) / (1 + $igvPorcentaje / 100), 2) }}</td>
            </tr>
            <tr>
                <td class="totals-label">I.G.V</td>
                <td class="totals-currency">S/</td>
                <td class="totals-value">{{ number_format(($pedido->total) - ($pedido->total / (1 + $igvPorcentaje / 100)), 2) }}</td>
            </tr>
            <tr>
                <td class="totals-label">TOTAL</td>
                <td class="totals-currency">S/</td>
                <td class="totals-value">{{ number_format($pedido->total, 2) }}</td>
            </tr>
        </table>
    </div>

    <!-- HASH Y QR -->
    <div class="box footer-box">
        <table class="hash-table">
            <tr>
                <td class="hash-text">
                    <div class="importe-letras">IMPORTE EN LETRAS: {{ strtoupper($letras ?? '---') }}</div>
                    <div style="margin-top: 30px;">Hash del comprobante: {{ hash('sha256', $pedido->id . $pedido->codigo_pedido . time()) }}</div>
                </td>
                <td class="hash-qr">
                    @if(isset($qrBase64) && $qrBase64)
                        <img src="{{ $qrBase64 }}" class="qr-img" alt="QR Code">
                    @else
                        <div style="width: 90px; height: 90px; border: 1px solid #ccc; display:inline-block;"></div>
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <!-- OBSERVACIONES -->
    <div class="box obs-box">
        <strong>OBSERVACIONES:</strong> Pago realizado mediante plataforma online.
    </div>

    <div class="footer-legal">
        Representación impresa de la {{ strtoupper($pedido->tipo_comprobante ?? 'FACTURA') }} electrónica. Consulte su documento en <strong>https://novape.pe</strong>
    </div>

</body>
</html>
