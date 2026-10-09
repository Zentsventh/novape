<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Users;

use Illuminate\Foundation\Http\FormRequest;

class StoreStaffRequest extends FormRequest
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
            'email' => 'required|email|max:100|unique:usuario,email',
            'password' => 'required|string|min:6',
            'roles' => 'required|array|min:1',
            'roles.*' => 'exists:rol,id',
            'dni' => 'nullable|string|max:20|unique:usuario,dni',
            'telefono' => 'nullable|string|max:20',
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
