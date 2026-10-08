<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Marketing;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBannerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        if ($this->has('activo') && ! $this->has('titulo')) {
            return ['activo' => 'required|boolean'];
        }

        return [
            'titulo' => 'required|string|max:255',
            'subtitulo' => 'nullable|string|max:255',
            'enlace_url' => 'nullable|string|max:500',
            'posicion' => 'sometimes|string|in:hero,lateral,promocional_1,promocional_2,promocional_3',
            'activo' => 'sometimes|boolean',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
        ];
    }
}
