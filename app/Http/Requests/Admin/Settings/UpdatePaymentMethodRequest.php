<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:255',
            'detalles' => 'nullable|string',
            'tipo' => 'nullable|in:digital,fisico,transferencia',
            'comision_porcentaje' => 'nullable|numeric|min:0',
            'activo' => 'boolean',
        ];
    }
}
