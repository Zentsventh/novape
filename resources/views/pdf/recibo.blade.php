<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Recibo de Compra {{ $pedido->codigo }}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .header h1 { font-size: 24px; color: #007BFF; margin: 0; }
        .details { margin-bottom: 20px; width: 100%; border-collapse: collapse; }
        .details td { padding: 5px; vertical-align: top; }
        .details .label { font-weight: bold; width: 120px; }
        table.items { width: 100%; border-collapse: collapse; margin-top: 10px; }
        table.items th, table.items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        table.items th { background-color: #f8f9fa; font-weight: bold; }
        .totals { margin-top: 20px; width: 100%; border-collapse: collapse; }
        .totals td { padding: 5px; text-align: right; }
        .totals .total-row { font-weight: bold; font-size: 14px; background-color: #f8f9fa; }
        .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #777; }
    </style>
</head>
<body>
    <div class="header">
        <h1>NOVAPE</h1>
        <p>Recibo de Compra On-line</p>
    </div>

    <table class="details">
        <tr>
            <td class="label">Pedido:</td>
            <td>{{ $pedido->codigo }}</td>
            <td class="label">Fecha:</td>
            <td>{{ $pedido->created_at->format('d/m/Y H:i') }}</td>
        </tr>
        <tr>
            <td class="label">Comprobante:</td>
            <td>{{ $pedido->tipo_comprobante }}</td>
            <td class="label">Documento:</td>
            <td>{{ $pedido->documento_cliente }}</td>
        </tr>
        <tr>
            <td class="label">Cliente / Razón Social:</td>
            <td colspan="3">{{ $pedido->nombre_facturacion }}</td>
        </tr>
        @if($pedido->direccion_facturacion)
        <tr>
            <td class="label">Dirección Fiscal:</td>
            <td colspan="3">{{ $pedido->direccion_facturacion }}</td>
        </tr>
        @endif
    </table>

    <table class="items">
        <thead>
            <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio Unit.</th>
                <th>Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($pedido->items as $item)
            <tr>
                <td>{{ $item->variante && $item->variante->producto ? $item->variante->producto->nombre : 'Producto' }}</td>
                <td>{{ $item->cantidad }}</td>
                <td>S/ {{ number_format($item->precio_unitario, 2) }}</td>
                <td>S/ {{ number_format($item->cantidad * $item->precio_unitario, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td width="80%">Subtotal:</td>
            <td>S/ {{ number_format($pedido->subtotal, 2) }}</td>
        </tr>
        @if($pedido->descuento > 0)
        <tr>
            <td>Descuento:</td>
            <td>- S/ {{ number_format($pedido->descuento, 2) }}</td>
        </tr>
        @endif
        <tr>
            <td>Envío:</td>
            <td>S/ {{ number_format($pedido->costo_envio, 2) }}</td>
        </tr>
        <tr class="total-row">
            <td>TOTAL PAGADO:</td>
            <td>S/ {{ number_format($pedido->total, 2) }}</td>
        </tr>
    </table>

    <div class="footer">
        Este documento es un comprobante de pago emitido electrónicamente. <br>
        Gracias por su compra en NOVAPE.
    </div>
</body>
</html>
