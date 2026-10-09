<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, string|array>
     */
    public function rules(): array
    {
        return [
            'acepta_terminos' => 'required|accepted',
            'acepta_promociones' => 'nullable|boolean',
            'acepta_programa' => 'nullable|boolean',
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'tipo_documento' => 'required|string|in:DNI,CE,PASAPORTE',
            'dni' => 'required|string|max:20|unique:usuario,dni',
            'email' => 'required|email|max:100|unique:usuario,email',
            'telefono' => 'nullable|string|max:15',
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=(?:.*[A-Z]){2})(?=(?:.*[a-z]){2})(?=(?:.*[0-9]){2})(?=(?:.*[^a-zA-Z0-9\s]){2})(?!.*\s).+$/',
                'confirmed'
            ]
        ];
    }
}
