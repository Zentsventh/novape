<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Compra;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'proveedor_id' => 'required|exists:proveedor,id',
            'items' => 'required|array|min:1',
            'items.*.producto_id' => 'required|integer|exists:producto,id',
            'items.*.variante_id' => 'required|integer|distinct|exists:variante,id',
            'items.*.cantidad' => 'required|integer|min:1',
            'items.*.costo_unitario' => 'required|numeric|min:0',
            'notas' => 'nullable|string',
        ];
    }
}
