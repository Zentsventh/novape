<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Warehouse;

use Illuminate\Foundation\Http\FormRequest;

class WarehouseTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('admin')->check();
    }

    public function rules(): array
    {
        return [
            'almacen_origen_id' => 'required|exists:almacenes,id',
            'almacen_destino_id' => 'required|exists:almacenes,id|different:almacen_origen_id',
            'variante_id' => 'required|exists:variante,id',
            'cantidad' => 'required|integer|min:1',
            'referencia' => 'nullable|string|max:200',
            'operation_key' => 'required|uuid',
        ];
    }
}
