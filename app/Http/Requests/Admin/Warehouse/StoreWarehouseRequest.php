<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Warehouse;

use Illuminate\Foundation\Http\FormRequest;

class StoreWarehouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('admin')->check();
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:255',
            'direccion' => 'nullable|string|max:255',
            'activo' => 'boolean'
        ];
    }
}
