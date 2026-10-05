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
            'address.codigo_postal' => 'nullable|string',
        ];
    }
}
