<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Warehouse;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('admin')->check();
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:150',
            'ruc' => 'nullable|string|max:20',
            'direccion' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
            'contacto' => 'nullable|string|max:150',
            'activo' => 'boolean',
        ];
    }
}
