<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Marketing;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $id = $this->route('cupone') ?? $this->route('id');

        return [
            'codigo' => 'required|string|unique:cupones,codigo,'.$id,
            'tipo' => 'required|in:porcentaje,fijo',
            'valor' => 'required|numeric|min:0'.($this->input('tipo') === 'porcentaje' ? '|max:100' : ''),
            'monto_minimo' => 'nullable|numeric|min:0',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'limite_usos' => 'nullable|integer|min:1',
            'activo' => 'boolean',
            'unico_por_cliente' => 'boolean',
            'combinable_points' => 'sometimes|boolean',
        ];
    }
}
