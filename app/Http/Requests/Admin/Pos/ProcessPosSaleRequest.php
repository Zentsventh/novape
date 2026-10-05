<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Pos;

use Illuminate\Foundation\Http\FormRequest;

class ProcessPosSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check(); // Podrías añadir validación de roles aquí
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'operation_key' => 'required|uuid',
            'items' => 'required|array|min:1',
            'items.*.variante_id' => 'required|integer|distinct|exists:variante,id',
            'items.*.cantidad' => 'required|integer|min:1',
            'items.*.precio_unitario' => 'required|numeric|min:0',
            'items.*.producto_nombre' => 'required|string',
            'metodo_pago_id' => 'required|exists:metodos_pago,id',
            'tipo_comprobante' => 'in:ticket,boleta,factura',
            'cliente' => 'nullable|array',
            'descuento' => 'nullable|numeric|min:0',
            'pagos' => 'nullable|array|min:1',
            'pagos.*.metodo_pago_id' => 'required|integer|exists:metodos_pago,id',
            'pagos.*.monto' => 'required|numeric|min:0',
            'cliente.tipo_documento' => 'nullable|in:DNI,RUC,CE',
            'cliente.numero_documento' => 'nullable|string|max:20',
            'cliente.nombre_razon_social' => 'nullable|string|max:255',
            'cliente.direccion' => 'nullable|string|max:500',
        ];
    }
}
