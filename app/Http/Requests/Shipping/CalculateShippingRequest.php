<?php

declare(strict_types=1);

namespace App\Http\Requests\Shipping;

use Illuminate\Foundation\Http\FormRequest;

class CalculateShippingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'address.departamento' => 'required|string',
            'address.provincia' => 'required|string',
            'address.distrito' => 'required|string',
            'address.codigo_postal' => ['nullable', 'regex:/^[0-9]{5}$/'],
            'address.direccion' => 'nullable|string|max:255',
            'address.nombres' => 'nullable|string|max:100',
            'address.apellidos' => 'nullable|string|max:100',
            'address.celular' => 'nullable|string|max:20',
        ];
    }
}
