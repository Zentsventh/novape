<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Roles;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('admin')->check();
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:50|unique:rol,nombre',
            'descripcion' => 'required|string|max:255',
            'permisos' => 'nullable|array',
            'permisos.*' => 'exists:permiso,id'
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.unique' => 'Ya existe un rol con este nombre.'
        ];
    }
}
