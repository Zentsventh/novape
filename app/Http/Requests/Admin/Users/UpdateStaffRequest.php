<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Users;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('admin')->check();
    }

    public function rules(): array
    {
        $id = $this->route('trabajadore') ?? $this->route('id');
        return [
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'email' => 'required|email|max:100|unique:usuario,email,' . $id,
            'roles' => 'sometimes|required|array|min:1',
            'roles.*' => 'integer|distinct|exists:rol,id',
            'dni' => 'nullable|string|max:20|unique:usuario,dni,' . $id,
            'telefono' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
        ];
    }

    public function messages(): array
    {
        return [
            'dni.unique' => 'Este DNI ya está registrado en el sistema.',
            'email.unique' => 'Este correo electrónico ya está registrado.',
            'password.min' => 'La contraseña debe tener al menos 6 caracteres.'
        ];
    }
}
