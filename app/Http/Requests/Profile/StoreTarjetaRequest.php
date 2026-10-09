<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class StoreTarjetaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'numero_tarjeta' => ['required', 'string', 'size:16'],
            'fecha_vencimiento' => ['required', 'string'],
            'cvv' => ['required', 'string'],
            'nombre_titular' => ['required', 'string']
        ];
    }
}
