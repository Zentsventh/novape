<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Cotización #{{ $deal->id }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; color: #333; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { margin: 0; color: #1f2937; }
        .details { margin-bottom: 30px; }
        .details table { width: 100%; border: none; }
        .details td { padding: 5px 0; }
        .products-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .products-table th, .products-table td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
        .products-table th { background-color: #f9fafb; font-weight: bold; }
        .total-row { font-weight: bold; font-size: 16px; text-align: right; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>

    <div class="header">
        <h1>COTIZACIÓN COMERCIAL</h1>
        <p>Ref: {{ $deal->titulo }}</p>
    </div>

    <div class="details">
        <table>
            <tr>
                <td><strong>Fecha:</strong> {{ date('d/m/Y') }}</td>
                <td><strong>Válido hasta:</strong> {{ $deal->fecha_cierre_esperada ? \Carbon\Carbon::parse($deal->fecha_cierre_esperada)->format('d/m/Y') : '15 días' }}</td>
            </tr>
            <tr>
                <td><strong>Cliente:</strong> {{ $deal->cliente ? $deal->cliente->nombres . ' ' . $deal->cliente->apellidos : 'A quien corresponda' }}</td>
                <td><strong>Atención:</strong> Equipo de Ventas Novape</td>
            </tr>
        </table>
    </div>

    <table class="products-table">
        <thead>
            <tr>
                <th>Item / Producto</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($deal->products as $item)
            <tr>
                <td>{{ $item->producto->nombre }}</td>
                <td>{{ $item->cantidad }}</td>
                <td>S/ {{ number_format($item->precio_unitario, 2) }}</td>
                <td>S/ {{ number_format($item->subtotal, 2) }}</td>
            </tr>
            @endforeach
            @if($deal->products->count() === 0)
            <tr>
                <td colspan="4" style="text-align: center; color: #9ca3af;">No hay productos agregados a esta cotización.</td>
            </tr>
            @endif
        </tbody>
    </table>

    <div class="total-row">
        Total Cotizado: S/ {{ number_format($deal->valor, 2) }}
    </div>

    <div class="footer">
        Este documento es una cotización y no tiene valor contable o tributario.<br>
        Gracias por su preferencia - Novape.
    </div>

</body>
</html>
