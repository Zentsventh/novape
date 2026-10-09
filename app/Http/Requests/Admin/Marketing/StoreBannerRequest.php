<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Marketing;

use Illuminate\Foundation\Http\FormRequest;

class StoreBannerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'titulo' => 'required|string|max:255',
            'subtitulo' => 'nullable|string|max:255',
            'imagen' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
            'enlace_url' => 'nullable|string|max:500',
            'posicion' => 'required|string|in:hero,lateral,promocional_1,promocional_2,promocional_3',
            'fecha_inicio' => 'nullable|date|after_or_equal:today',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
        ];
    }
}
