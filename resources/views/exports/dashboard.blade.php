<table>
    <thead>
        <tr>
            <th colspan="4" style="text-align: center; font-size: 16px; font-weight: bold;">Reporte de Dashboard CRM</th>
        </tr>
        <tr>
            <th colspan="4" style="text-align: center; color: #666;">
                Periodo: {{ $startDate }} - {{ $endDate }}
            </th>
        </tr>
        <tr><th colspan="4"></th></tr>
        
        <tr>
            <th colspan="4" style="background-color: #f3f4f6; font-weight: bold;">Resumen Financiero</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Ingresos Totales (S/)</td>
            <td colspan="3">{{ number_format($ventasTotal, 2) }}</td>
        </tr>
        <tr>
            <td>Costos Totales (S/)</td>
            <td colspan="3">{{ number_format($costosTotal, 2) }}</td>
        </tr>
        <tr>
            <td>Balance comercial (S/)</td>
            <td colspan="3">{{ number_format($gananciaNeta, 2) }}</td>
        </tr>
        <tr>
            <td>Total Pedidos Generados</td>
            <td colspan="3">{{ $pedidosCount }}</td>
        </tr>
        
        <tr><td colspan="4"></td></tr>
        
        <tr>
            <th colspan="4" style="background-color: #f3f4f6; font-weight: bold;">Top 5 Productos Vendidos</th>
        </tr>
        <tr style="background-color: #e5e7eb;">
            <th>Nº</th>
            <th>Producto</th>
            <th>Unidades Vendidas</th>
            <th>Ingresos Generados (S/)</th>
        </tr>
        @foreach($topProductosVendidos as $index => $producto)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>{{ $producto['nombre'] }}</td>
            <td>{{ $producto['cantidad'] }}</td>
            <td>{{ number_format($producto['ingresos'], 2) }}</td>
        </tr>
        @endforeach

        <tr><td colspan="4"></td></tr>

        <tr>
            <th colspan="4" style="background-color: #f3f4f6; font-weight: bold;">Últimos Pedidos</th>
        </tr>
        <tr style="background-color: #e5e7eb;">
            <th>Código</th>
            <th>Cliente</th>
            <th>Monto (S/)</th>
            <th>Estado</th>
        </tr>
        @foreach($pedidos as $pedido)
        <tr>
            <td>{{ $pedido['codigo'] }}</td>
            <td>{{ $pedido['usuario_nombre'] }}</td>
            <td>{{ number_format($pedido['total'], 2) }}</td>
            <td>{{ ucfirst($pedido['estado']) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
