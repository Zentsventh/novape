<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Settings;

use Illuminate\Foundation\Http\FormRequest;

class SyncRolePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'rol_id' => 'required|exists:rol,id',
            'permisos' => 'array',
            'permisos.*' => 'exists:permiso,id'
        ];
    }
}
