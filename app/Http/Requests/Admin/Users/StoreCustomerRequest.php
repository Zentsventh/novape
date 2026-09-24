<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Users;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('admin')->check();
    }

    public function rules(): array
    {
        return [
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'email' => 'required|email|unique:usuario,email',
            'password' => 'required|string|min:6',
            'dni' => 'nullable|string|max:20|unique:usuario,dni',
            'tipo_documento' => 'nullable|string|max:10',
            'telefono' => 'nullable|string|max:30',
            'telefono_secundario' => 'nullable|string|max:30',
        ];
    }

    public function messages(): array
    {
        return [
            'dni.unique' => 'Este DNI ya está registrado en el sistema.',
            'email.unique' => 'Este correo electrónico ya está registrado.'
        ];
    }
}
